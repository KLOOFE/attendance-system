"use strict";
/* الوقت والتاريخ يُحسبان على السيرفر (وليس من جهاز المعلم) بتوقيت السعودية */

const TZ = "Asia/Riyadh";

/* YYYY-MM-DD */
const dayKey = (d = new Date(), tz = TZ) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/* 08:15 AM (نفس شكل الواجهة) */
const clock = (d = new Date(), tz = TZ) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz });

module.exports = { TZ, dayKey, clock };