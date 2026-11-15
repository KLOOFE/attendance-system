"use strict";
/* مطابقة الوجه على السيرفر: نفس الأرقام المستخدمة في المتصفح */

const FACE_MATCH = 0.5;     /* أقل رقم = أدق */
const FACE_MARGIN = 0.06;   /* لازم أقرب وجه يكون أوضح من ثاني أقرب وجه بهذا الفارق */

const isDescriptor = d =>
    Array.isArray(d) && d.length === 128 && d.every(x => typeof x === "number" && Number.isFinite(x) && Math.abs(x) < 10);

function dist(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
    return Math.sqrt(s);
}

/* gallery = [{ uid, d:[128] }] → { uid, dist, second } أو null */
function matchFace(desc, gallery) {
    let best = null, bestD = Infinity, second = Infinity;
    for (const g of gallery) {
        const d = dist(desc, g.d);
        if (d < bestD) { second = bestD; bestD = d; best = g.uid; }
        else if (d < second) second = d;
    }
    return best ? { uid: best, dist: bestD, second } : null;
}

const acceptMatch = m => !!m && m.dist < FACE_MATCH && (m.second - m.dist) > FACE_MARGIN;

module.exports = { FACE_MATCH, FACE_MARGIN, isDescriptor, dist, matchFace, acceptMatch };