/* ============================================================
   backend.js — ربط الواجهة بالسيرفر المحلي (مجلد local-backend)
   يُحمَّل بعد app.js
   لإيقاف الباك اند والرجوع للكتابة المباشرة: USE_BACKEND = false
   ============================================================ */
const USE_BACKEND = true;
const BACKEND_URL = "http://localhost:3000";   /* السيرفر المحلي (مجلد local-backend) */

function backendReady() {
    return USE_BACKEND && typeof fetch === "function";
}

/* استدعاء دالة على السيرفر: callFn("importUsers", {...}) → النتيجة (data)
   الأخطاء تُرمى بنفس شكل Firebase: e.code = "functions/permission-denied" ... */
async function callFn(name, data) {
    const fail = (code, message) => { const e = new Error(message || code); e.code = "functions/" + code; return e; };
    if (!backendReady()) throw fail("unavailable", "backend-unavailable");

    const user = typeof auth !== "undefined" && auth && auth.currentUser;
    if (!user) throw fail("unauthenticated", "سجّل الدخول أولًا");
    const token = await user.getIdToken();

    let res;
    try {
        res = await fetch(BACKEND_URL + "/api/" + name, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ data: data || {} })
        });
    } catch (e) {
        throw fail("unavailable", "backend-unavailable");     /* السيرفر غير شغّال */
    }

    let body = null;
    try { body = await res.json(); } catch (e) { /* رد غير JSON */ }
    if (!res.ok) throw fail((body && body.error && body.error.code) || "internal", body && body.error && body.error.message);
    return body.data;
}

/* تسجيل الحضور من السيرفر. method: "qr" (مع uid) أو "face" (مع descriptor).
   لو السيرفر غير شغّال، نرجع للكتابة المباشرة (للـ QR فقط) */
async function markAttendanceSecure(sec, method, p = {}) {
    try {
        return await callFn("markAttendance", {
            sectionId: sec.id,
            method: method,
            uid: p.uid || undefined,
            descriptor: p.descriptor ? Array.from(p.descriptor) : undefined
        });
    } catch (e) {
        const offline = e && (e.code === "functions/unavailable" || e.message === "backend-unavailable");
        if (offline && p.uid) return markAttendance(p.uid, method, sec);
        throw e;
    }
}

/* صفحة المشرف: يجب أن يكون uid موجودًا في admins/{uid} = true */
function requireAdmin(onOk) {
    auth.onAuthStateChanged(user => {
        if (!user) { location.href = "teacher_login.html"; return; }
        db.ref("admins/" + user.uid).once("value")
            .then(s => { if (s.val() === true) onOk(user); else deny(); })
            .catch(deny);
    });
    function deny() {
        document.body.innerHTML = '<main class="center-page"><section class="card mid center"><div class="icon-badge">⛔</div><h2>هذه الصفحة للمشرف فقط</h2><p class="sub">أضف معرّفك في admins ثم أعد المحاولة</p><a class="btn" href="select_section.html">رجوع</a></section></main>';
    }
}

/* ترجمة إضافية لصفحة المشرف */
Object.assign(EN, {
    "لوحة المشرف": "Admin panel",
    "استيراد المستخدمين": "Import users",
    "طلاب": "Students",
    "دكاترة": "Teachers",
    "اختر ملف": "Choose file",
    "معاينة": "Preview",
    "بدء الاستيراد": "Start import",
    "تم إنشاؤها": "Created",
    "موجودة مسبقًا": "Already existing",
    "فشلت": "Failed",
    "تحميل روابط التفعيل": "Download activation links",
    "تحميل قالب": "Download template",
    "آخر العمليات": "Recent activity",
    "هذه الصفحة للمشرف فقط": "Admins only"
});
Object.keys(EN).forEach(k => { if (!EN_KEYS.includes(k)) EN_KEYS.push(k); });
EN_KEYS.sort((a, b) => b.length - a.length);
if (LANG === "en") trTree(document.body);