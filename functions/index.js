"use strict";
/* ============================================================
   الباك اند: Firebase Cloud Functions
   1) importUsers      استيراد الطلاب/الدكاترة (للمشرف فقط)
   2) markAttendance   تسجيل الحضور من السيرفر (المعلم فقط)
   3) onAttendanceWrite / onLimitChange / onOverrideChange
                       إنذار الحرمان بالإيميل تلقائيًا
   ============================================================ */

const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onValueWritten } = require("firebase-functions/v2/database");
const { defineSecret, defineString } = require("firebase-functions/params");

const { normalizeRows, provisionUsers } = require("./lib/users");
const { inviteMail, makeSender } = require("./lib/mail");
const { evaluateStudent, evaluateSection } = require("./lib/notify");
const { markAttendanceCore, AppError } = require("./lib/attendance");

admin.initializeApp();

/* قاعدة البيانات الافتراضية في us-central1، فنخلي الدوال في نفس المنطقة */
const REGION = "us-central1";
setGlobalOptions({ region: REGION, maxInstances: 10 });

/* إعدادات (تتغير من functions/.env) وأسرار (firebase functions:secrets:set SMTP_URL) */
const SMTP_URL = defineSecret("SMTP_URL");
const MAIL_FROM = defineString("MAIL_FROM", { default: "نظام الحضور <no-reply@example.com>" });
const APP_URL = defineString("APP_URL", { default: "" });

const db = () => admin.database();
const ts = () => admin.database.ServerValue.TIMESTAMP;
const sender = () => makeSender(SMTP_URL.value(), MAIL_FROM.value());

/* ---------- حماية ---------- */
async function assertRole(req, node) {
    if (!req.auth || !req.auth.uid) throw new HttpsError("unauthenticated", "سجّل الدخول أولًا");
    const ok = (await db().ref(`${node}/${req.auth.uid}`).get()).exists();
    if (!ok) throw new HttpsError("permission-denied", "ليس لديك الصلاحية");
    return req.auth.uid;
}

const toHttps = e => (e instanceof AppError || (e && e.code === "invalid-argument") ? new HttpsError(e.code, e.message) : e);

/* ============================================================
   1) استيراد المستخدمين (المشرف فقط: admins/{uid} = true)
   data = { role: "student"|"teacher", rows: [{name,email}], sectionId?, sendInvites? }
   ============================================================ */
exports.importUsers = onCall({ secrets: [SMTP_URL] }, async req => {
    const adminUid = await assertRole(req, "admins");
    const { role, rows, sectionId, sendInvites } = req.data || {};
    if (role !== "student" && role !== "teacher") throw new HttpsError("invalid-argument", "نوع المستخدمين غير صحيح");

    let parsed;
    try { parsed = normalizeRows(rows); } catch (e) { throw toHttps(e); }

    let sid = null;
    if (sectionId) {
        if (role !== "student") throw new HttpsError("invalid-argument", "الشعبة للطلاب فقط");
        if (!(await db().ref(`sections/${sectionId}`).get()).exists()) throw new HttpsError("not-found", "الشعبة غير موجودة");
        sid = sectionId;
    }

    const result = await provisionUsers({ auth: admin.auth(), db: db() }, role, parsed.valid, { sectionId: sid, appUrl: APP_URL.value() });

    /* دعوات بالإيميل للحسابات الجديدة (اختياري) */
    let invited = 0;
    const send = sendInvites ? sender() : null;
    if (send) {
        for (const u of result.newUsers) {
            try { await send(u.email, inviteMail({ name: u.name, role, link: u.link, appUrl: APP_URL.value() })); invited++; } catch (e) { /* نكمل */ }
        }
    }

    await db().ref("audit").push({ at: ts(), by: adminUid, action: "import", role, created: result.created, existing: result.existing, failed: parsed.errors.length + result.failed.length });

    return {
        total: Array.isArray(rows) ? rows.length : 0,
        created: result.created,
        existing: result.existing,
        added: result.added,
        invited,
        mailConfigured: !!sender(),
        failed: parsed.errors.concat(result.failed),
        links: result.newUsers.map(({ name, email, link }) => ({ name, email, link }))
    };
});

/* ============================================================
   2) تسجيل الحضور (المعلم صاحب الشعبة فقط)
   data = { sectionId, method: "face"|"qr", uid?, descriptor? }
   ============================================================ */
exports.markAttendance = onCall(async req => {
    const teacherUid = await assertRole(req, "teachers");
    const d = req.data || {};
    try {
        return await markAttendanceCore({ db: db(), serverTs: ts() }, {
            teacherUid, sectionId: d.sectionId, method: d.method, uid: d.uid, descriptor: d.descriptor
        });
    } catch (e) {
        throw toHttps(e);
    }
});

/* ============================================================
   3) إنذار الحرمان بالإيميل
   ============================================================ */
const notifyCtx = () => ({ db: db(), now: () => Date.now(), send: sender(), appUrl: APP_URL.value() });

/* أي تغيير في سجل حضور طالب */
exports.onAttendanceWrite = onValueWritten({ ref: "/attendance/{uid}/{sid}/{day}", secrets: [SMTP_URL] }, async event => {
    await evaluateStudent(notifyCtx(), event.params.uid, event.params.sid);
});

/* تغيير حد الحرمان للشعبة: نعيد تقييم كل طلابها */
exports.onLimitChange = onValueWritten({ ref: "/sections/{sid}/limit", secrets: [SMTP_URL] }, async event => {
    await evaluateSection(notifyCtx(), event.params.sid);
});

/* حرمان أو رفع حرمان يدوي لطالب */
exports.onOverrideChange = onValueWritten({ ref: "/sections/{sid}/override/{uid}", secrets: [SMTP_URL] }, async event => {
    await evaluateStudent(notifyCtx(), event.params.uid, event.params.sid);
});