"use strict";
/* استيراد الطلاب والدكاترة: إنشاء حسابات في Firebase Auth + تسجيلهم في القاعدة */

const crypto = require("crypto");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS = 500;

/* rows = [{ name, email }] من الواجهة → { valid, errors:[{ row, reason }] } (row = رقم السطر في الملف، يبدأ من 2 بعد العناوين) */
function normalizeRows(rows) {
    if (!Array.isArray(rows)) return { valid: [], errors: [{ row: 0, reason: "لا توجد بيانات" }] };
    if (rows.length > MAX_ROWS) {
        const e = new Error("الحد الأقصى " + MAX_ROWS + " صف في كل عملية استيراد");
        e.code = "invalid-argument";
        throw e;
    }
    const valid = [], errors = [], seen = new Set();
    rows.forEach((r, i) => {
        const row = i + 2;
        const name = String((r && r.name) ?? "").trim().replace(/\s+/g, " ");
        const email = String((r && r.email) ?? "").trim().toLowerCase();
        if (!EMAIL_RE.test(email) || email.length > 254) { errors.push({ row, email, reason: "البريد غير صحيح" }); return; }
        if (name.length < 2 || name.length > 100) { errors.push({ row, email, reason: "الاسم قصير أو فارغ" }); return; }
        if (seen.has(email)) { errors.push({ row, email, reason: "مكرر في الملف" }); return; }
        seen.add(email);
        valid.push({ name, email, row });
    });
    return { valid, errors };
}

const randomPassword = () => crypto.randomBytes(18).toString("base64url");

async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return out;
}

/* ctx = { auth, db } — role: "student" | "teacher" — rows: ناتج normalizeRows().valid
   opts = { sectionId?, appUrl? } */
async function provisionUsers(ctx, role, rows, opts = {}) {
    const { auth, db } = ctx;
    const res = { created: 0, existing: 0, added: 0, failed: [], newUsers: [] };
    const memberUpdates = {};

    await mapLimit(rows, 10, async row => {
        try {
            let user, created = false;
            try {
                user = await auth.getUserByEmail(row.email);
            } catch (e) {
                if (!e || e.code !== "auth/user-not-found") throw e;
                user = await auth.createUser({ email: row.email, displayName: row.name, password: randomPassword() });
                created = true;
            }

            if (role === "teacher") {
                await db.ref(`teachers/${user.uid}`).set(true);
            } else {
                const ref = db.ref(`students/${user.uid}`);
                if (!(await ref.get()).exists()) await ref.set({ name: row.name, email: row.email, uid: user.uid });
                if (opts.sectionId) memberUpdates[`sections/${opts.sectionId}/members/${user.uid}`] = true;
            }

            if (created) {
                res.created++;
                let link = "";
                try { link = await auth.generatePasswordResetLink(row.email, opts.appUrl ? { url: opts.appUrl } : undefined); } catch (e) { /* الرابط اختياري */ }
                res.newUsers.push({ uid: user.uid, name: row.name, email: row.email, link });
            } else {
                res.existing++;
            }
        } catch (e) {
            res.failed.push({ row: row.row, email: row.email, reason: "تعذر إنشاء الحساب" });
        }
    });

    if (Object.keys(memberUpdates).length) {
        await db.ref().update(memberUpdates);
        res.added = Object.keys(memberUpdates).length;
    }
    res.failed.sort((a, b) => a.row - b.row);
    return res;
}

module.exports = { normalizeRows, provisionUsers, randomPassword, mapLimit, EMAIL_RE, MAX_ROWS };