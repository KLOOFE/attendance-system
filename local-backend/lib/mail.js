"use strict";
/* نصوص الإيميلات (عربي) + إرسالها عبر SMTP */

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const arAbsences = n => (n === 1 ? "غياب واحد فقط" : n === 2 ? "غيابان" : n + " غيابات");

function wrap(title, paragraphs, button) {
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e8e1f5;border-radius:14px;overflow:hidden">
  <div style="background:#5b1fa8;color:#fff;padding:16px 20px;font-size:18px;font-weight:bold">${esc(title)}</div>
  <div style="padding:20px;color:#1f1635;line-height:1.9;font-size:15px">
    ${paragraphs.map(p => `<p style="margin:0 0 12px">${esc(p)}</p>`).join("\n    ")}
    ${button ? `<p style="margin:18px 0 0"><a href="${esc(button.url)}" style="background:#5b1fa8;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;display:inline-block">${esc(button.text)}</a></p>` : ""}
  </div>
</div>`;
    const text = [title, "", ...paragraphs, ...(button ? ["", button.text + ": " + button.url] : [])].join("\n");
    return { html, text };
}

/* level: 1 = على وشك الحرمان، 2 = محروم */
function deprivationMail({ name, course, section, absences, limit, level, appUrl }) {
    const label = `${course} · شعبة ${section}`;
    const hello = `عزيزي الطالب ${name}،`;
    const button = appUrl ? { text: "عرض حالتي", url: appUrl.replace(/\/+$/, "") + "/login.html" } : null;

    if (level >= 2) {
        const title = "تم حرمانك من المقرر";
        return Object.assign({ subject: `⛔ ${title}: ${course}` }, wrap(title, [
            hello,
            `بلغ عدد غياباتك في مقرر ${label} ${absences} من أصل ${limit} المسموح بها، وبذلك تم حرمانك من المقرر.`,
            "للاستفسار أو تقديم عذر راجع معلم المقرر."
        ], button));
    }
    const left = Math.max(limit - absences, 0);
    const title = "تنبيه قبل الحرمان";
    return Object.assign({ subject: `⚠️ ${title}: ${course}` }, wrap(title, [
        hello,
        `عدد غياباتك في مقرر ${label} هو ${absences} من أصل ${limit}، وبقي لك ${arAbsences(left)} قبل الحرمان من المقرر.`,
        "احرص على الحضور في المحاضرات القادمة، وإذا عندك عذر راجع معلم المقرر."
    ], button));
}

/* دعوة لحساب جديد: الرابط يخلّيه يحدد كلمة المرور */
function inviteMail({ name, role, link, appUrl }) {
    const title = "دعوة للدخول إلى نظام الحضور";
    const who = role === "teacher" ? "معلم" : "طالب";
    return Object.assign({ subject: title }, wrap(title, [
        `مرحبًا ${name}،`,
        `تم إنشاء حساب ${who} لك في نظام الحضور. اضغط الزر لتحديد كلمة المرور ثم سجّل الدخول.`,
        ...(appUrl ? ["رابط النظام: " + appUrl] : [])
    ], link ? { text: "تحديد كلمة المرور", url: link } : null));
}

/* SMTP_URL مثل: smtps://user:password@smtp.gmail.com (القيمة none أو الفراغ = الإيميل غير مفعّل) */
function makeSender(smtpUrl, from) {
    const url = String(smtpUrl || "").trim();
    if (!url || url.toLowerCase() === "none") return null;
    const transport = require("nodemailer").createTransport(url);
    return (to, mail) => transport.sendMail({ from, to, subject: mail.subject, text: mail.text, html: mail.html });
}

module.exports = { deprivationMail, inviteMail, makeSender, arAbsences };