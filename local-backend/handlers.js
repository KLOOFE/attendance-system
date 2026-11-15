"use strict";
/* منطق الدوال (استيراد + تسجيل حضور) بدون اعتماد على Express أو Firebase Functions */

const { normalizeRows, provisionUsers } = require("./lib/users");
const { inviteMail } = require("./lib/mail");
const { markAttendanceCore, AppError } = require("./lib/attendance");

/* env = { db, auth, serverTs, send (أو null), appUrl } */
function createHandlers(env) {
    const { db, auth } = env;

    async function assertRole(uid, node) {
        if (!uid) throw new AppError("unauthenticated", "سجّل الدخول أولًا");
        const ok = (await db.ref(`${node}/${uid}`).get()).exists();
        if (!ok) throw new AppError("permission-denied", "ليس لديك الصلاحية");
        return uid;
    }

    /* data = { role, rows, sectionId?, sendInvites? } — للمشرف فقط */
    async function importUsers(uid, data) {
        const adminUid = await assertRole(uid, "admins");
        const { role, rows, sectionId, sendInvites } = data || {};
        if (role !== "student" && role !== "teacher") throw new AppError("invalid-argument", "نوع المستخدمين غير صحيح");

        let parsed;
        try { parsed = normalizeRows(rows); }
        catch (e) { throw new AppError(e.code === "invalid-argument" ? "invalid-argument" : "internal", e.message); }

        let sid = null;
        if (sectionId) {
            if (role !== "student") throw new AppError("invalid-argument", "الشعبة للطلاب فقط");
            if (!/^[-\w]{1,128}$/.test(String(sectionId)) || !(await db.ref(`sections/${sectionId}`).get()).exists())
                throw new AppError("not-found", "الشعبة غير موجودة");
            sid = sectionId;
        }

        const result = await provisionUsers({ auth, db }, role, parsed.valid, { sectionId: sid, appUrl: env.appUrl });

        let invited = 0;
        if (sendInvites && env.send) {
            for (const u of result.newUsers) {
                try { await env.send(u.email, inviteMail({ name: u.name, role, link: u.link, appUrl: env.appUrl })); invited++; } catch (e) { /* نكمل */ }
            }
        }

        await db.ref("audit").push({ at: env.serverTs, by: adminUid, action: "import", role, created: result.created, existing: result.existing, failed: parsed.errors.length + result.failed.length });

        return {
            total: Array.isArray(rows) ? rows.length : 0,
            created: result.created,
            existing: result.existing,
            added: result.added,
            invited,
            mailConfigured: !!env.send,
            failed: parsed.errors.concat(result.failed),
            links: result.newUsers.map(({ name, email, link }) => ({ name, email, link }))
        };
    }

    /* data = { sectionId, method, uid?, descriptor? } — للمعلم صاحب الشعبة */
    async function markAttendance(uid, data) {
        const teacherUid = await assertRole(uid, "teachers");
        const d = data || {};
        return markAttendanceCore({ db, serverTs: env.serverTs }, {
            teacherUid, sectionId: d.sectionId, method: d.method, uid: d.uid, descriptor: d.descriptor
        });
    }

    return { importUsers, markAttendance };
}

const HTTP_STATUS = { "unauthenticated": 401, "permission-denied": 403, "invalid-argument": 400, "not-found": 404 };

module.exports = { createHandlers, HTTP_STATUS };