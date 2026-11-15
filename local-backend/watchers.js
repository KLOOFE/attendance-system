"use strict";
/* بديل المشغّلات (Triggers): السيرفر يراقب قاعدة البيانات ويرسل إنذار الحرمان بالإيميل.
   يبدأ المراقبة من لحظة التشغيل فقط (ما يرسل شي عن تغييرات قديمة). */

const { evaluateStudent, evaluateSection } = require("./lib/notify");

/* ctxFn = () => ({ db, now, send, appUrl }) */
async function startWatchers(db, ctxFn, log = console) {
    if (!ctxFn().send) { log.log("ℹ️  الإيميل غير مفعّل (SMTP_URL فارغ): مراقبة الإنذارات متوقفة"); return () => {}; }

    const safe = (label, p) => p.catch(e => log.error("watcher " + label + ":", e && e.message || e));

    const attRef = db.ref("attendance"), secRef = db.ref("sections");
    const seenAtt = new Set(), seenSec = new Set();

    /* نعرف الموجود الآن عشان ما نعتبره "جديد" */
    const [a, s] = await Promise.all([attRef.get(), secRef.get()]);
    a.forEach(c => { seenAtt.add(c.key); });
    s.forEach(c => { seenSec.add(c.key); });

    const onStudent = snap => {
        const uid = snap.key, v = snap.val() || {};
        /* سجلات قديمة بدون شعبة (مفاتيحها تواريخ) نتجاهلها */
        Object.keys(v).filter(k => !/^\d{4}-\d{2}-\d{2}$/.test(k)).forEach(sid => safe("student", evaluateStudent(ctxFn(), uid, sid)));
    };
    const onSection = snap => safe("section", evaluateSection(ctxFn(), snap.key));

    const handlers = [
        [attRef, "child_changed", onStudent],
        [attRef, "child_added", snap => { if (!seenAtt.has(snap.key)) { seenAtt.add(snap.key); onStudent(snap); } }],
        [secRef, "child_changed", onSection],
        [secRef, "child_added", snap => { if (!seenSec.has(snap.key)) { seenSec.add(snap.key); onSection(snap); } }]
    ];
    handlers.forEach(([ref, ev, fn]) => ref.on(ev, fn));
    log.log("✅ مراقبة إنذارات الحرمان تعمل");
    return () => handlers.forEach(([ref, ev, fn]) => ref.off(ev, fn));
}

module.exports = { startWatchers };