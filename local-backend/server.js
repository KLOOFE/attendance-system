"use strict";
/* ============================================================
   السيرفر المحلي لنظام الحضور (بديل Cloud Functions، مجاني)
   تشغيل:  npm install  ثم  npm start
   يعمل على  http://localhost:3000
   ============================================================ */

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const { createHandlers, HTTP_STATUS } = require("./handlers");
const { makeSender } = require("./lib/mail");
const { startWatchers } = require("./watchers");

/* ---------- مفتاح الخدمة ---------- */
function findKey() {
    if (process.env.SERVICE_ACCOUNT_PATH) return path.resolve(__dirname, process.env.SERVICE_ACCOUNT_PATH);
    for (const dir of [__dirname, path.join(__dirname, "..")]) {
        const f = fs.readdirSync(dir).find(n => /^serviceAccount.*\.json$/i.test(n) || /-firebase-adminsdk-.*\.json$/i.test(n));
        if (f) return path.join(dir, f);
    }
    return null;
}

const keyPath = findKey();
if (!keyPath || !fs.existsSync(keyPath)) {
    console.error("❌ ما لقيت مفتاح الخدمة. حمّله من Firebase ← Project settings ← Service accounts ← Generate new private key،");
    console.error("   وضعه في مجلد local-backend باسم serviceAccountKey.json (أو حدد المسار في SERVICE_ACCOUNT_PATH داخل .env)");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf8"))),
    databaseURL: process.env.DATABASE_URL || "https://fainla-db-default-rtdb.firebaseio.com"
});

const db = admin.database();
const send = makeSender(process.env.SMTP_URL, process.env.MAIL_FROM || "نظام الحضور <no-reply@example.com>");
const appUrl = process.env.APP_URL || "";

const h = createHandlers({ db, auth: admin.auth(), serverTs: admin.database.ServerValue.TIMESTAMP, send, appUrl });

/* ---------- Express ---------- */
const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

/* التحقق من هوية المستخدم (Firebase ID token) */
async function authenticate(req, res, next) {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
    if (!m) return res.status(401).json({ error: { code: "unauthenticated", message: "سجّل الدخول أولًا" } });
    try {
        req.uid = (await admin.auth().verifyIdToken(m[1])).uid;
        next();
    } catch (e) {
        res.status(401).json({ error: { code: "unauthenticated", message: "انتهت الجلسة، سجّل الدخول من جديد" } });
    }
}

const route = fn => async (req, res) => {
    try {
        res.json({ data: await fn(req.uid, req.body && req.body.data) });
    } catch (e) {
        const code = e && e.code && HTTP_STATUS[e.code] ? e.code : "internal";
        if (code === "internal") console.error(e);
        res.status(HTTP_STATUS[code] || 500).json({ error: { code, message: code === "internal" ? "خطأ في السيرفر" : e.message } });
    }
};

app.get("/api/health", (req, res) => res.json({ ok: true, mail: !!send }));
app.post("/api/importUsers", authenticate, route(h.importUsers));
app.post("/api/markAttendance", authenticate, route(h.markAttendance));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log("✅ السيرفر شغّال: http://localhost:" + port);
    startWatchers(db, () => ({ db, now: () => Date.now(), send, appUrl })).catch(e => console.error("watchers:", e));
});