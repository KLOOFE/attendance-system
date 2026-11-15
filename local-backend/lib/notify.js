"use strict";
/* إنذار الحرمان: يرسل إيميل مرة واحدة عند كل ارتفاع في المستوى (عادي → على وشك → محروم) */

const { absencesOf, deprivation, levelOf } = require("./deprivation");
const { deprivationMail } = require("./mail");

/* ctx = { db, now: () => ms, send: (to, mail) => Promise | null, appUrl } */
async function evaluateStudent(ctx, uid, sid) {
    const { db } = ctx;
    if (!ctx.send) return { skipped: "mail-off" };

    const [secSnap, recSnap] = await Promise.all([
        db.ref(`sections/${sid}`).get(),
        db.ref(`attendance/${uid}/${sid}`).get()
    ]);
    if (!secSnap.exists()) return { skipped: "no-section" };

    const sec = secSnap.val();
    if (!(sec.members || {})[uid]) return { skipped: "not-member" };

    const absences = absencesOf(recSnap.val());
    const dep = deprivation(absences, sec.limit || 0, (sec.override || {})[uid]);
    const level = levelOf(dep);

    /* نحجز الإرسال بـ transaction عشان ما يتكرر الإيميل لو تشغّلت الدالة مرتين */
    const nref = db.ref(`notifications/${uid}/${sid}`);
    let prev = null, mustSend = false;
    await nref.transaction(cur => {
        prev = cur;
        mustSend = false;
        const p = cur ? cur.level || 0 : 0;
        if (level > p) { mustSend = true; return { level, absences, at: ctx.now() }; }
        if (level < p) return { level, absences, at: ctx.now() };   /* انخفض المستوى (تعديل غياب): نسجّله بدون إيميل */
        return undefined;                                            /* نفس المستوى: لا شيء */
    });
    if (!mustSend) return { skipped: "no-change", level };

    const stSnap = await db.ref(`students/${uid}`).get();
    const st = stSnap.val() || {};
    if (!st.email) { await restore(nref, prev); return { skipped: "no-email", level }; }

    try {
        await ctx.send(st.email, deprivationMail({
            name: st.name || "", course: sec.course, section: sec.section,
            absences, limit: sec.limit, level, appUrl: ctx.appUrl
        }));
    } catch (e) {
        await restore(nref, prev);          /* فشل الإرسال: نرجّع الحالة عشان تنعاد المحاولة لاحقًا */
        throw e;
    }
    return { sent: true, level, to: st.email };
}

const restore = (ref, prev) => (prev ? ref.set(prev) : ref.remove());

/* كل طلاب الشعبة (مثلًا بعد تغيير الحد) على دفعات صغيرة */
async function evaluateSection(ctx, sid) {
    const snap = await ctx.db.ref(`sections/${sid}/members`).get();
    const uids = Object.keys(snap.val() || {});
    const out = [];
    for (let i = 0; i < uids.length; i += 10) {
        const part = await Promise.all(uids.slice(i, i + 10).map(u =>
            evaluateStudent(ctx, u, sid).catch(e => ({ error: String(e && e.message || e) }))));
        out.push(...part);
    }
    return out;
}

module.exports = { evaluateStudent, evaluateSection };