"use strict";
/* نفس منطق الحرمان الموجود في app.js (الواجهة)، عشان السيرفر والواجهة يطلعون بنفس النتيجة */

const STATUSES = ["present", "absent", "excused"];

/* السجلات القديمة بدون status تُعتبر "حاضر" */
const statusOf = rec => (rec && STATUSES.includes(rec.status) ? rec.status : "present");

const absencesOf = recs => Object.values(recs || {}).filter(r => statusOf(r) === "absent").length;

const WARN_AT = 2;   /* ننبّه عندما يتبقى غياب واحد أو غيابان قبل الحرمان */

function deprivation(absences, limit, override) {
    const auto = !!limit && absences >= limit;
    const deprived = override === "deprived" ? true : override === "allowed" ? false : auto;
    const left = limit ? Math.max(limit - absences, 0) : null;
    const warn = !deprived && !!limit && left > 0 && left <= WARN_AT;
    return { auto, deprived, manual: !!override, absences, left, warn };
}

/* 0 = عادي، 1 = على وشك الحرمان، 2 = محروم */
const levelOf = dep => (dep.deprived ? 2 : dep.warn ? 1 : 0);

module.exports = { statusOf, absencesOf, deprivation, levelOf, WARN_AT };