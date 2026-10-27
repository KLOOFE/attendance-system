/* ===== إعدادات عامة ===== */
const APP_NAME = "نظام الحضور";
const APP_LOGO = "";   /* ضع رابط صورة الشعار هنا (مثل "logo.png") أو اتركه فارغًا لعرض علامة ✓ */

const firebaseConfig = {
    apiKey: "AIzaSyDvK4w_MOsxz64o0p2cPo1Y6EfxBgI0azs",
    authDomain: "fainla-db.firebaseapp.com",
    databaseURL: "https://fainla-db-default-rtdb.firebaseio.com",
    projectId: "fainla-db",
    storageBucket: "fainla-db.appspot.com",
    messagingSenderId: "791431411095",
    appId: "1:791431411095:web:ff10885007d1a16a4ac0d2",
    measurementId: "G-98GPKH8J5X"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = typeof firebase.auth === "function" ? firebase.auth() : null;

/* ===== حالات الحضور =====
   السجلات القديمة بدون حقل status تُعتبر "حاضر" */
const STATUS = {
    present: { label: "حاضر", icon: "✓", cls: "ok" },
    absent: { label: "غائب", icon: "✗", cls: "bad" },
    excused: { label: "غياب بعذر", icon: "✎", cls: "warn" }
};
const statusOf = rec => (rec && STATUS[rec.status] ? rec.status : "present");

/* ==========================================================
   اللغة: عربي / English
   الصفحات مكتوبة بالعربي، وفي وضع English يترجم هذا الجزء كل نص
   يظهر في الصفحة (حتى النصوص التي تُبنى لاحقًا) ويقلب الاتجاه.
   لإضافة أو تعديل ترجمة: عدّل القاموس EN أدناه (عربي: "إنجليزي").
   ========================================================== */
const EN = {
    /* عام */
    "نظام الحضور": "Attendance System",
    "تسجيل الخروج": "Sign out",
    "تبديل الوضع الداكن/الفاتح": "Toggle dark/light mode",
    "لوحة المعلم": "Teacher Dashboard",
    "مسح الحضور بالكاميرا": "Scan Attendance by Camera",
    "مسح الحضور": "Scan Attendance",
    "تراجع": "Undo",
    "تأكيد": "Confirm",
    "إلغاء": "Cancel",
    "اختياري": "optional",

    /* حالات الحضور */
    "حاضر": "Present",
    "غائب": "Absent",
    "غياب بعذر": "Excused absence",
    "بعذر": "Excused",
    "بدون سجل": "No record",
    "الكل": "All",

    /* أخطاء تسجيل الدخول */
    "صيغة البريد الإلكتروني غير صحيحة": "Invalid email format",
    "هذا البريد مسجل مسبقًا، تأكد من كلمة المرور": "This email is already registered, check your password",
    "كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل": "Weak password, use at least 6 characters",
    "كلمة المرور غير صحيحة": "Incorrect password",
    "لا يوجد حساب بهذا البريد": "No account with this email",
    "البريد أو كلمة المرور غير صحيحة": "Incorrect email or password",
    "تعذر الاتصال بالإنترنت": "Could not connect to the internet",
    "محاولات كثيرة، حاول لاحقًا": "Too many attempts, try again later",
    "تسجيل الدخول بالبريد غير مفعّل في فاير بيز": "Email sign-in is not enabled in Firebase",
    "حدث خطأ غير متوقع": "An unexpected error occurred",

    /* دخول وتسجيل */
    "دخول المعلم": "Teacher Login",
    "دخول الطلاب": "Student Login",
    "تسجيل دخول الطالب": "Student Login",
    "تسجيل الدخول": "Sign In",
    "أهلاً بك": "Welcome",
    "سجّل دخولك للوصول إلى بياناتك ورمز الحضور": "Sign in to access your details and attendance code",
    "سجّل دخولك لإدارة الطلاب والحضور": "Sign in to manage students and attendance",
    "هذا الحساب ليس حساب معلم. سجّل الدخول بحساب معلم": "This is not a teacher account. Sign in with a teacher account",
    "اكتب البريد وكلمة المرور": "Enter your email and password",
    "البريد الإلكتروني": "Email",
    "البريد الجامعي": "University email",
    "البريد": "Email",
    "كلمة المرور": "Password",
    "ليس لديك حساب؟": "Don't have an account?",
    "إنشاء حساب جديد": "Create a new account",
    "خطأ في حفظ البيانات": "Error saving data",
    "إنشاء حساب طالب": "Create Student Account",
    "سجّل بياناتك لتحصل على رمز QR الخاص بك": "Enter your details to get your QR code",
    "الاسم الكامل": "Full name",
    "أحرف على الأقل": "characters minimum",
    "إنشاء الحساب": "Create account",
    "لديك حساب؟": "Already have an account?",
    "عبّ جميع الحقول": "Fill in all fields",
    "تم تسجيل الدخول لكن قواعد قاعدة البيانات (Rules) منعت قراءة teachers. راجع القواعد": "Signed in, but the database Rules blocked reading teachers. Check the Rules",
    "الحساب صحيح لكنه غير مضاف كمعلم": "The account is valid but is not added as a teacher",
    "أضف في": "Add in",
    "الصق الـ UID": "paste the UID",
    "نسخ الـ UID": "Copy UID",
    "عدد الأحرف:": "Character count:",
    "تم نسخ الـ UID، الصقه في خانة Name": "UID copied, paste it in the Name field",
    "تم تحديد الـ UID، اضغط Ctrl+C": "UID selected, press Ctrl+C",

    /* لوحة المعلم */
    "إدارة الطلاب وتسجيل الحضور": "Manage students and record attendance",
    "اختر اليوم": "Choose day",
    "ابحث بالاسم أو البريد": "Search by name or email",
    "تصدير": "Export",
    "الحاضرون آخر 7 أيام": "Present in the last 7 days",
    "جارٍ تحميل قائمة الطلاب": "Loading student list",
    "بدون اسم": "No name",
    "تعذر تحميل الطلاب": "Could not load students",
    "اليوم المحدد:": "Selected day:",
    "إجمالي الطلاب": "Total students",
    "لا توجد نتائج مطابقة": "No matching results",
    "لا يوجد طلاب مسجلون بعد": "No students registered yet",
    "حذف السجل": "Delete record",
    "نسبة الحضور": "Attendance rate",
    "إدارة الحضور": "Manage Attendance",
    "البيانات": "Details",
    "حذف سجل هذا اليوم": "Delete this day's record",
    "حذف سجل": "Delete the record of",
    "ليوم": "for",
    "حذف": "Delete",
    "تم حذف السجل": "Record deleted",
    "تعذر الحفظ، تأكد من الصلاحيات والاتصال": "Could not save. Check permissions and connection",
    "الطالب": "Student",
    "الاسم": "Name",
    "الحالة": "Status",
    "الوقت": "Time",
    "ملاحظة": "Note",

    /* الأيام (أعمدة الرسم البياني) */
    "الأحد": "Sun", "الاثنين": "Mon", "الإثنين": "Mon", "الثلاثاء": "Tue",
    "الأربعاء": "Wed", "الخميس": "Thu", "الجمعة": "Fri", "السبت": "Sat",

    /* الكاميرا */
    "وجّه رمز QR الخاص بالطالب نحو الكاميرا وسيظهر اسمه بشكل كبير بعد تسجيل حضوره": "Point the student's QR code at the camera and their name will appear in large text once attendance is recorded",
    "اضغط «تشغيل الكاميرا» للبدء": "Press \"Start camera\" to begin",
    "تشغيل الكاميرا": "Start camera",
    "ملء الشاشة": "Full screen",
    "اختيار الكاميرا": "Choose camera",
    "حضور اليوم": "Today's attendance",
    "لا يوجد سجل بعد": "No records yet",
    "الكاميرا تحتاج رابط آمن (https) أو localhost": "The camera needs a secure link (https) or localhost",
    "تعذر تحميل مكتبة قراءة الـ QR. تأكد من الاتصال بالإنترنت ثم حدّث الصفحة": "Could not load the QR reading library. Check your internet connection, then refresh the page",
    "إيقاف الكاميرا": "Stop camera",
    "تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم أعد المحاولة": "Camera permission was denied. Allow access in the browser settings, then try again",
    "لا يمكن تشغيل الكاميرا:": "Cannot start the camera:",
    "تم إيقاف الكاميرا": "Camera stopped",
    "كاميرا": "Camera",
    "تم تسجيل الحضور": "Attendance recorded",
    "تم تحديث حالته إلى حاضر (كانت:": "Status updated to Present (was:",
    "مسجّل مسبقًا اليوم": "Already recorded today",
    "رمز غير معروف": "Unknown code",
    "المحتوى:": "Content:",
    "حدث خطأ": "An error occurred",
    "تعذر الاتصال بقاعدة البيانات أو لا تملك الصلاحية": "Could not reach the database, or you lack permission",
    "طالب": "Student",

    /* رمز QR */
    "رمز QR للطالب": "Student QR code",
    "اسم الطالب": "Student name",
    "طباعة": "Print",
    "تحميل الرمز": "Download code",
    "تحميل": "Download",
    "جارٍ تحميل البيانات": "Loading data",
    "العودة للوحة المعلم": "Back to teacher dashboard",
    "لم يتم تحديد الطالب": "No student specified",
    "الطالب غير موجود في قاعدة البيانات": "Student not found in the database",
    "تعذر تحميل البيانات": "Could not load data",
    "توليد": "Generate",

    /* إدارة حضور الطالب */
    "إدارة حضور الطالب": "Manage Student Attendance",
    "حدّد حاضر أو غائب أو غياب بعذر لأي يوم، أو احذف السجل": "Mark present, absent or excused absence for any day, or delete the record",
    "جارٍ التحميل": "Loading",
    "التاريخ": "Date",
    "ملاحظة / سبب العذر (اختياري)": "Note / reason for excuse (optional)",
    "مثال: مراجعة مستشفى، ظرف عائلي": "e.g. hospital visit, family matter",
    "سجل الطالب": "Student record",
    "الحالة الحالية لهذا اليوم:": "Current status for this day:",
    "لا يوجد سجل لهذا اليوم": "No record for this day",
    "تعديل": "Edit",
    "تعذر الحذف": "Could not delete",

    /* صفحة الطالب */
    "بيانات الطالب": "Student Details",
    "تأكد من الرابط أو سجّل الدخول من جديد": "Check the link or sign in again",
    "الذهاب لتسجيل الدخول": "Go to sign in",
    "رمز الحضور (QR)": "Attendance code (QR)",
    "أظهر هذا الرمز أمام الكاميرا لتسجيل حضورك": "Show this code to the camera to record your attendance",
    "المعرّف": "ID",
    "سجل الحضور": "Attendance record",
    "لا يوجد حضور مسجل بعد": "No attendance recorded yet",
    "تعذر تحميل السجل": "Could not load the record",

    /* التحضير بالوجه */
    "تسجيل الوجوه": "Face Enrollment",
    "تسجيل وجوه الطلاب": "Student Face Enrollment",
    "سجّل بصمة وجه الطالب مرة واحدة ثم يُسجَّل حضوره تلقائيًا بالكاميرا": "Enroll each student's face once, then attendance is recorded automatically by the camera",
    "لم يُحدد طالب بعد — اختر طالبًا من القائمة": "No student selected yet — pick one from the list",
    "الطالب المحدد:": "Selected student:",
    "أؤكد موافقة الطالب على حفظ بصمة وجهه الرقمية (أرقام فقط، لا تُحفظ صورة)": "I confirm the student agreed to store their digital face print (numbers only, no photo is saved)",
    "ابدأ التسجيل": "Start enrollment",
    "اضغط «تشغيل الكاميرا» ثم «ابدأ التسجيل»": "Press \"Start camera\" then \"Start enrollment\"",
    "حرّك رأسك قليلًا بين كل التقاطة": "Move your head slightly between captures",
    "تم التقاط": "Captured",
    "من": "of",
    "ما ظهر وجه واضح، قرّب من الكاميرا وحسّن الإضاءة": "No clear face found. Move closer and improve the lighting",
    "يوجد أكثر من وجه أمام الكاميرا": "More than one face in front of the camera",
    "تعذر التقاط العينات، أعد المحاولة": "Could not capture the samples, try again",
    "العينات غير متناسقة، أعد المحاولة بإضاءة أفضل": "Samples are inconsistent, try again with better lighting",
    "تم حفظ وجه": "Face saved for",
    "هذا الوجه قريب جدًا من وجه": "This face is very close to the face of",
    "هل تريد المتابعة؟": "Do you want to continue?",
    "حذف وجه": "Delete the face of",
    "تم حذف الوجه": "Face deleted",
    "حذف الوجه": "Delete face",
    "الطلاب": "Students",
    "اختر طالبًا أولًا": "Pick a student first",
    "أكّد موافقة الطالب أولًا": "Confirm the student's consent first",
    "شغّل الكاميرا أولًا": "Start the camera first",
    "وجه مسجّل": "Face enrolled",
    "غير مسجّل": "Not enrolled",
    "تحديد": "Select",
    "الطلاب المسجّلون:": "Enrolled students:",
    "اكتب للبحث عن باقي الطلاب": "Type to search for other students",
    "جارٍ تحميل نموذج التعرف على الوجه (أول مرة قد تأخذ وقتًا)": "Loading the face recognition model (the first time may take a while)",
    "تعذر تحميل مكتبة التعرف على الوجه. تأكد من الاتصال بالإنترنت ثم حدّث الصفحة": "Could not load the face recognition library. Check your internet connection and refresh the page",
    "قف أمام الكاميرا وسيتعرّف النظام على وجهك ويظهر اسمك بشكل كبير بعد تسجيل حضورك": "Stand in front of the camera. The system will recognize your face and show your name in large text once attendance is recorded",
    "بالوجه": "By face",
    "بالـ QR": "By QR",
    "وجوه مسجّلة": "enrolled faces",
    "لا توجد وجوه مسجّلة بعد. سجّلها من صفحة «تسجيل الوجوه»": "No faces enrolled yet. Enroll them from the \"Face Enrollment\" page",
    "وجه غير معروف": "Unknown face",
    "جارٍ البحث عن وجه...": "Looking for a face...",
    "الطالب غير موجود": "Student not found",

    /* ألفاظ مفردة تأتي مركّبة مع أسماء/أرقام */
    "الكاميرا": "the camera",
    "؟": "?",
    "،": ","
};

const LANG = (() => { try { return localStorage.getItem("lang") === "en" ? "en" : "ar"; } catch (e) { return "ar"; } })();
const AR_RE = /[؀-ۿ]/;
const EN_KEYS = Object.keys(EN).sort((a, b) => b.length - a.length);   /* الأطول أولًا */

/* يترجم نصًا (في وضع العربي يرجعه كما هو) — يمكن استعماله من أي صفحة: tr("نص") */
function tr(s) {
    s = String(s ?? "");
    if (LANG !== "en" || !AR_RE.test(s)) return s;
    for (const k of EN_KEYS) if (s.includes(k)) s = s.split(k).join(EN[k]);
    return s.replace(/←/g, "→");
}

function setLang(l) {
    try { localStorage.setItem("lang", l); } catch (e) { /* اختياري */ }
    location.reload();
}

const I18N_ATTRS = ["placeholder", "title", "aria-label"];

function trAttrs(el) {
    if (!el.getAttribute) return;
    I18N_ATTRS.forEach(a => {
        if (!el.hasAttribute(a)) return;
        const v = el.getAttribute(a), nv = tr(v);
        if (nv !== v) el.setAttribute(a, nv);
    });
}

function trText(n) {
    const p = n.parentNode;
    if (!p || p.nodeName === "SCRIPT" || p.nodeName === "STYLE" || !AR_RE.test(n.nodeValue)) return;
    const v = tr(n.nodeValue);
    if (v !== n.nodeValue) n.nodeValue = v;
}

function trTree(root) {
    if (root.nodeType === 3) { trText(root); return; }
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(trText);
    trAttrs(root);
    root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(trAttrs);
}

function startI18n() {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    document.title = tr(document.title);
    trTree(document.body);

    /* أي نص يُضاف أو يتغير لاحقًا (رسائل، إشعارات، قوائم) يترجم تلقائيًا */
    new MutationObserver(muts => {
        for (const m of muts) {
            if (m.type === "childList") m.addedNodes.forEach(trTree);
            else if (m.type === "characterData") trText(m.target);
            else if (m.type === "attributes") trAttrs(m.target);
        }
    }).observe(document.documentElement, {
        childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS
    });
}

/* ===== أدوات مساعدة ===== */
const $ = (sel, root = document) => root.querySelector(sel);

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function initial(name) {
    return (String(name || "؟").trim()[0] || "؟").toUpperCase();
}

/* تاريخ بالتوقيت المحلي (YYYY-MM-DD) */
function dateKey(d) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}
const todayKey = () => dateKey(new Date());

function nowTime() {
    return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function showMsg(el, text, type = "ok") {
    el.textContent = text;
    el.className = "msg show " + type;
}

function hideMsg(el) {
    el.className = "msg";
    el.textContent = "";
}

function setLoading(btn, on) {
    btn.disabled = on;
    btn.classList.toggle("loading", on);
}

function beep(ok = true) {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = ok ? 880 : 280;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, ok ? 160 : 320);
    } catch (e) { /* الصوت اختياري */ }
}

function authError(err) {
    const map = {
        "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة",
        "auth/email-already-in-use": "هذا البريد مسجل مسبقًا، تأكد من كلمة المرور",
        "auth/weak-password": "كلمة المرور ضعيفة، استخدم 6 أحرف على الأقل",
        "auth/wrong-password": "كلمة المرور غير صحيحة",
        "auth/user-not-found": "لا يوجد حساب بهذا البريد",
        "auth/invalid-login-credentials": "البريد أو كلمة المرور غير صحيحة",
        "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحة",
        "auth/network-request-failed": "تعذر الاتصال بالإنترنت",
        "auth/too-many-requests": "محاولات كثيرة، حاول لاحقًا"
    };
    if (err && map[err.code]) return map[err.code];

    /* بعض نسخ فاير بيز ترجع الخطأ كنص JSON داخل message */
    const m = String((err && err.message) || "");
    if (/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND|INVALID_CREDENTIAL/i.test(m)) return "البريد أو كلمة المرور غير صحيحة";
    if (/TOO_MANY_ATTEMPTS/i.test(m)) return "محاولات كثيرة، حاول لاحقًا";
    if (/OPERATION_NOT_ALLOWED/i.test(m)) return "تسجيل الدخول بالبريد غير مفعّل في فاير بيز";

    return m || "حدث خطأ غير متوقع";
}

/* ===== الوضع الداكن / الفاتح ===== */
function getTheme() {
    try { return localStorage.getItem("theme") || "light"; } catch (e) { return "light"; }
}

function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    const b = $("#themeBtn");
    if (b) b.textContent = t === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
    const t = getTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", t); } catch (e) { /* اختياري */ }
    applyTheme(t);
}

applyTheme(getTheme());

/* ===== الشريط العلوي (يُبنى من هنا لكل الصفحات) ===== */
const TEACHER_LINKS = [
    { key: "students", href: "teacher.html", text: "لوحة المعلم" },
    { key: "scan", href: "attendance_camera.html", text: "مسح الحضور" },
    { key: "face", href: "face_enroll.html", text: "تسجيل الوجوه" }
];
const TEACHER_BAR = { home: "teacher.html", logout: "تسجيل الخروج", logoutTo: "teacher_login.html" };

function renderTopbar(links = [], active = "", opts = {}) {
    const el = $("#topbar");
    if (!el) return;
    const logo = APP_LOGO ? `<img src="${escapeHtml(APP_LOGO)}" alt="">` : "✓";
    el.innerHTML = `
        <a class="brand" href="${opts.home || "login.html"}"><span class="logo">${logo}</span> ${escapeHtml(APP_NAME)}</a>
        <nav class="nav">
            ${links.map(l => `<a href="${l.href}" class="${l.key === active ? "active" : ""}">${l.text}</a>`).join("")}
            ${opts.logout ? `<a href="#" id="logoutBtn">${opts.logout}</a>` : ""}
            <button class="lang-btn" id="langBtn" title="Language" type="button">${LANG === "en" ? "عربي" : "EN"}</button>
            <button class="icon-btn" id="themeBtn" title="تبديل الوضع الداكن/الفاتح" type="button"></button>
        </nav>`;

    $("#themeBtn").addEventListener("click", toggleTheme);
    $("#langBtn").addEventListener("click", () => setLang(LANG === "en" ? "ar" : "en"));
    applyTheme(getTheme());

    const lo = $("#logoutBtn");
    if (lo) lo.addEventListener("click", e => {
        e.preventDefault();
        auth.signOut().then(() => { location.href = opts.logoutTo || "login.html"; });
    });
}

/* ===== إشعار منبثق (مع زر تراجع اختياري) ===== */
function toast(text, opt = {}) {
    let wrap = $("#toasts");
    if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = "toasts";
        wrap.className = "toasts";
        document.body.appendChild(wrap);
    }
    const t = document.createElement("div");
    t.className = "toast " + (opt.type || "ok");
    const span = document.createElement("span");
    span.textContent = text;
    t.appendChild(span);

    if (opt.undo) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = "تراجع";
        b.onclick = () => { Promise.resolve(opt.undo()).catch(() => {}); t.remove(); };
        t.appendChild(b);
    }
    wrap.appendChild(t);
    setTimeout(() => t.remove(), opt.ms || 5000);
}

/* ===== نافذة تأكيد (ترجع true/false) ===== */
function confirmBox(text, okText = "تأكيد") {
    return new Promise(resolve => {
        const m = document.createElement("div");
        m.className = "modal";
        m.innerHTML = `<div class="modal-card"><p></p>
            <div class="modal-actions">
                <button class="btn danger" data-y type="button"></button>
                <button class="btn ghost" data-n type="button">إلغاء</button>
            </div></div>`;
        m.querySelector("p").textContent = text;
        m.querySelector("[data-y]").textContent = okText;
        const done = v => { m.remove(); resolve(v); };
        m.querySelector("[data-y]").onclick = () => done(true);
        m.querySelector("[data-n]").onclick = () => done(false);
        m.addEventListener("click", e => { if (e.target === m) done(false); });
        document.body.appendChild(m);
    });
}

/* ===== حماية صفحات المعلم =====
   المعلم = حساب Firebase Auth موجود uid الخاص به في العقدة teachers/{uid} */
async function isTeacher(uid) {
    try {
        return (await db.ref("teachers/" + uid).once("value")).exists();
    } catch (e) {
        return false;
    }
}

function requireTeacher() {
    return new Promise(resolve => {
        auth.onAuthStateChanged(async user => {
            if (!user) { location.href = "teacher_login.html"; return; }
            if (await isTeacher(user.uid)) {
                document.body.classList.remove("locked");
                resolve(user);
            } else {
                location.href = "teacher_login.html?denied=1";
            }
        });
    });
}

/* ===== عمليات الحضور ===== */

/* تسجيل حضور (QR أو وجه): يرجع status = ok | updated | dup | nostudent | invalid
   updated = كان غائب/بعذر وتحوّل إلى حاضر */
async function markAttendance(uid, method = "manual") {
    if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid || "")) return { status: "invalid" };

    const sSnap = await db.ref("students/" + uid).once("value");
    if (!sSnap.exists()) return { status: "nostudent" };
    const student = sSnap.val();

    const day = todayKey();
    const record = { status: "present", time: nowTime(), date: day, method: method, note: "" };
    let previous = null;

    const res = await db.ref(`attendance/${uid}/${day}`).transaction(cur => {
        if (cur && statusOf(cur) === "present") return;   /* مسجل حاضر مسبقًا: لا نكتب */
        previous = cur;
        return record;
    });

    if (res.committed) {
        return { status: previous ? "updated" : "ok", student, time: record.time, from: previous ? statusOf(previous) : null };
    }
    const old = res.snapshot.val() || {};
    return { status: "dup", student, time: old.time || "" };
}

/* تحديد حالة طالب في يوم معين (من جهة المعلم) */
function setStatus(uid, day, status, note = "") {
    return db.ref(`attendance/${uid}/${day}`).set({
        status: status,
        date: day,
        time: status === "present" ? nowTime() : "",
        method: "teacher",
        note: note || ""
    });
}

function removeRecord(uid, day) {
    return db.ref(`attendance/${uid}/${day}`).remove();
}

/* للتراجع: يعيد السجل السابق أو يحذف إن لم يكن موجودًا */
function restoreRecord(uid, day, prev) {
    return prev ? db.ref(`attendance/${uid}/${day}`).set(prev) : removeRecord(uid, day);
}

/* استخراج معرف الطالب من محتوى الـ QR (نص مباشر أو رابط فيه id=) */
function extractUid(raw) {
    raw = String(raw || "").trim();
    try {
        const u = new URL(raw);
        const id = u.searchParams.get("id");
        if (id) return id;
    } catch (e) { /* ليس رابطًا */ }
    return raw;
}

/* ===== التعرف على الوجه =====
   المكتبة (face-api.js) تعمل بالكامل داخل المتصفح، والصور لا تُرسل لأي مكان.
   في Firebase نحفظ فقط "بصمة" رقمية (128 رقمًا) لكل طالب في faces/{uid}. */
const FACE_VER = "1.7.12";
const FACE_LIB_SRC = [
    `https://cdn.jsdelivr.net/npm/@vladmandic/face-api@${FACE_VER}/dist/face-api.js`,
    `https://unpkg.com/@vladmandic/face-api@${FACE_VER}/dist/face-api.js`
];
const FACE_MODEL_URLS = [
    `https://cdn.jsdelivr.net/npm/@vladmandic/face-api@${FACE_VER}/model/`,
    `https://unpkg.com/@vladmandic/face-api@${FACE_VER}/model/`
];
const FACE_MATCH = 0.5;      /* أقل رقم = أدق (أقل أخطاء، لكن قد يرفض وجوهًا صحيحة) */
const FACE_MARGIN = 0.06;    /* لازم يكون أقرب وجه أوضح من ثاني أقرب وجه بهذا الفارق */

const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadScriptSrc(src) {
    return new Promise(resolve => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve(typeof faceapi !== "undefined");
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
    });
}

let _faceReady = null;
let FACE_BACKEND = "";   /* webgl أو cpu */

/* يختار محرك التشغيل: كرت الشاشة (WebGL) إذا متاح، وإلا المعالج العادي (cpu) */
async function pickFaceBackend() {
    const tf = faceapi.tf;
    if (!tf || !tf.setBackend) return "";
    for (const b of ["webgl", "cpu"]) {
        try {
            if (await tf.setBackend(b)) { await tf.ready(); return b; }
        } catch (e) { /* نجرب التالي */ }
    }
    return "";
}

function ensureFaceApi() {
    if (_faceReady) return _faceReady;
    _faceReady = (async () => {
        if (typeof faceapi === "undefined") {
            let ok = false;
            for (const src of FACE_LIB_SRC) { if (await loadScriptSrc(src)) { ok = true; break; } }
            if (!ok) return false;
        }
        FACE_BACKEND = await pickFaceBackend();
        for (const base of FACE_MODEL_URLS) {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(base),
                    faceapi.nets.faceLandmark68Net.loadFromUri(base),
                    faceapi.nets.faceRecognitionNet.loadFromUri(base)
                ]);
                return true;
            } catch (e) { /* نجرب المصدر التالي */ }
        }
        return false;
    })();
    _faceReady.then(ok => { if (!ok) _faceReady = null; });
    return _faceReady;
}

/* على المعالج العادي نصغّر حجم الصورة عشان يكون أسرع */
const faceOpts = () => new faceapi.TinyFaceDetectorOptions({ inputSize: FACE_BACKEND === "cpu" ? 224 : 320, scoreThreshold: 0.5 });

function faceDist(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
    return Math.sqrt(s);
}

function meanFace(list) {
    const m = new Array(list[0].length).fill(0);
    list.forEach(d => d.forEach((x, i) => { m[i] += x / list.length; }));
    return m;
}

const packFace = d => Array.from(d, x => Math.round(x * 10000) / 10000);

/* يبحث عن أقرب طالب لهذا الوجه. gallery = [{uid, d:[128 رقم]}]
   يرجع {uid, dist, second} أو null إذا ما فيه وجوه مسجلة */
function matchFace(desc, gallery) {
    let best = null, bestD = Infinity, second = Infinity;
    for (const g of gallery) {
        const d = faceDist(desc, g.d);
        if (d < bestD) { second = bestD; bestD = d; best = g.uid; }
        else if (d < second) second = d;
    }
    return best ? { uid: best, dist: bestD, second } : null;
}

/* ===== PWA: تثبيت كتطبيق (يشتغل على https أو localhost فقط) ===== */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* تشغيل الترجمة (في آخر الملف عشان كل شي يكون جاهز) */
if (LANG === "en") startI18n();