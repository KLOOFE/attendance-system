"use strict";
/* تسجيل الحضور على السيرفر: الوقت من السيرفر، ومطابقة الوجه من السيرفر، وسجل عمليات */

const { statusOf, absencesOf, deprivation } = require("./deprivation");
const { isDescriptor, matchFace, acceptMatch } = require("./face");
const { dayKey, clock } = require("./time");

class AppError extends Error {
    constructor(code, message) { super(message); this.code = code; }
}

/* ctx = { db, serverTs, date? } — req = { teacherUid, sectionId, method: "face"|"qr", uid?, descriptor? } */
async function markAttendanceCore(ctx, req) {
    const { db } = ctx;
    const { teacherUid, sectionId, method } = req;
    if (!/^[-\w]{1,128}$/.test(sectionId || "")) return { status: "invalid" };

    const secSnap = await db.ref(`sections/${sectionId}`).get();
    if (!secSnap.exists()) throw new AppError("not-found", "الشعبة غير موجودة");
    const sec = secSnap.val();
    if (sec.teacher !== teacherUid) throw new AppError("permission-denied", "هذه الشعبة ليست لك");

    const members = sec.members || {};
    let target;

    if (method === "face") {
        /* المتصفح يرسل "بصمة" الوجه فقط، والسيرفر هو اللي يحدد مين الطالب */
        if (!isDescriptor(req.descriptor)) return { status: "invalid" };
        const uids = Object.keys(members);
        const snaps = await Promise.all(uids.map(u => db.ref(`faces/${u}`).get()));
        const gallery = uids
            .map((u, i) => ({ uid: u, d: (snaps[i].val() || {}).d }))
            .filter(g => Array.isArray(g.d) && g.d.length === 128);
        const m = matchFace(req.descriptor, gallery);
        if (!acceptMatch(m)) return { status: "nomatch" };
        target = m.uid;
    } else if (method === "qr") {
        target = req.uid;
        if (!/^[A-Za-z0-9_-]{6,128}$/.test(target || "")) return { status: "invalid" };
    } else {
        return { status: "invalid" };
    }

    const stSnap = await db.ref(`students/${target}`).get();
    if (!stSnap.exists()) return { status: "nostudent" };
    const student = { name: stSnap.val().name || "" };
    if (!members[target]) return { status: "notmember", uid: target, student };

    const date = ctx.date || new Date();
    const day = dayKey(date), time = clock(date);
    const label = `${sec.course} · شعبة ${sec.section}`;
    const record = { status: "present", time, date: day, method, note: "", sec: label, at: ctx.serverTs };
    let previous = null;

    const res = await db.ref(`attendance/${target}/${sectionId}/${day}`).transaction(cur => {
        if (cur && statusOf(cur) === "present") return undefined;   /* مسجّل حاضر مسبقًا */
        previous = cur;
        return record;
    });

    if (!res.committed) {
        const old = res.snapshot.val() || {};
        return { status: "dup", uid: target, student, time: old.time || "" };
    }

    const status = previous ? "updated" : "ok";
    await db.ref("audit").push({ at: ctx.serverTs, by: teacherUid, action: "mark", method, sid: sectionId, uid: target, name: student.name, result: status });

    const recs = (await db.ref(`attendance/${target}/${sectionId}`).get()).val();
    const dep = deprivation(absencesOf(recs), sec.limit || 0, (sec.override || {})[target]);
    return {
        status, uid: target, student, time, from: previous ? statusOf(previous) : null,
        dep: { deprived: dep.deprived, warn: dep.warn, left: dep.left }
    };
}

module.exports = { markAttendanceCore, AppError };