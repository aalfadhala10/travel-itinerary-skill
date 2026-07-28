/* ================================================================
   Sanad · سند — Qatar contract engine
   ----------------------------------------------------------------
   Everything Qatar-specific lives here: the standard forms and their
   notice periods, the Qatari Civil Code checks, the public-procurement
   variation cap, the calendar (Fri–Sat weekend, Hijri, holidays), and
   the risk rules that read a variation and say what is about to go wrong.

   Every legal reference below is a DEFAULT, carrying its source. Contracts
   in Qatar are almost always the standard form plus Particular Conditions
   that move these numbers, so every one of them is editable per project
   and the UI says so. This file is a checklist, not counsel.
   ================================================================ */

/* ---------------------------------------------------------------
   1. Standard forms used in Qatar
   ---------------------------------------------------------------
   noticeDays  — days from becoming aware to serve the initial notice
   detailDays  — days to submit the fully detailed / substantiated claim
                 (0 = the form sets no separate second deadline)
   Both are counted from the date of instruction, which is the date the
   contractor is normally "aware" for a variation.                       */
const CONTRACT_FORMS = {
  ashghal: {
    id: "ashghal",
    en: "Ashghal / PWA — General Conditions",
    ar: "أشغال / هيئة الأشغال العامة — الشروط العامة",
    noticeDays: 28, detailDays: 0,
    clauses: { variation: "10", claim: "19.1", eot: "9.3" },
    forum: "courts",
    employerDefault: "government",
    srcEn: "Ashghal GCC Cl. 19.1 (Contractor's Claims) — 28 days, expressed as forfeiture. Cl. 9.3 delays to completion.",
    srcAr: "الشروط العامة لأشغال، البند ١٩‑١ (مطالبات المقاول) — ٢٨ يومًا بصيغة سقوط الحق. البند ٩‑٣ التأخر في الإنجاز.",
  },
  qrail: {
    id: "qrail",
    en: "Qatar Rail — amended FIDIC",
    ar: "سكك الحديد القطرية — فيديك معدّل",
    noticeDays: 28, detailDays: 42,
    clauses: { variation: "13.3", claim: "20.1", eot: "8.4" },
    forum: "arbitration",
    employerDefault: "government",
    srcEn: "Heavily amended FIDIC. Defaults shown are the FIDIC 1999 positions — check the Particular Conditions, they are usually moved.",
    srcAr: "فيديك معدّل بشكل كبير. القيم المعروضة هي مواضع فيديك ١٩٩٩ — راجع الشروط الخاصة، فهي عادةً تُعدّلها.",
  },
  qenergy: {
    id: "qenergy",
    en: "QatarEnergy / Kahramaa — EPC conditions",
    ar: "قطر للطاقة / كهرماء — شروط EPC",
    noticeDays: 28, detailDays: 42,
    clauses: { variation: "13", claim: "20.1", eot: "8.4" },
    forum: "arbitration",
    employerDefault: "government",
    srcEn: "Bespoke EPC/PC conditions. Verify every period against your contract — these are indicative only.",
    srcAr: "شروط EPC/PC خاصة. تحقق من كل مدة مقابل عقدك — هذي إرشادية فقط.",
  },
  qf: {
    id: "qf",
    en: "Qatar Foundation — amended FIDIC",
    ar: "مؤسسة قطر — فيديك معدّل",
    noticeDays: 28, detailDays: 42,
    clauses: { variation: "13.3", claim: "20.1", eot: "8.4" },
    forum: "arbitration",
    employerDefault: "semi",
    srcEn: "Amended FIDIC. Defaults shown are the FIDIC 1999 positions — check the Particular Conditions.",
    srcAr: "فيديك معدّل. القيم المعروضة هي مواضع فيديك ١٩٩٩ — راجع الشروط الخاصة.",
  },
  fidic99: {
    id: "fidic99",
    en: "FIDIC Red Book 1999",
    ar: "فيديك — الكتاب الأحمر ١٩٩٩",
    noticeDays: 28, detailDays: 42,
    clauses: { variation: "13.3", claim: "20.1", eot: "8.4" },
    forum: "arbitration",
    employerDefault: "private",
    srcEn: "Sub-Cl. 20.1: notice within 28 days of becoming aware, fully detailed claim within 42 days. Cl. 13.1/13.3 variations.",
    srcAr: "البند ٢٠‑١: إشعار خلال ٢٨ يومًا من العلم، ومطالبة تفصيلية خلال ٤٢ يومًا. البند ١٣‑١/١٣‑٣ التغييرات.",
  },
  fidic17: {
    id: "fidic17",
    en: "FIDIC Red Book 2017",
    ar: "فيديك — الكتاب الأحمر ٢٠١٧",
    noticeDays: 28, detailDays: 84,
    clauses: { variation: "13.3.1", claim: "20.2.1", eot: "8.5" },
    forum: "arbitration",
    employerDefault: "private",
    srcEn: "Sub-Cl. 20.2.1: Notice of Claim within 28 days. Sub-Cl. 20.2.4: fully detailed Claim within 84 days — now itself a condition precedent. Cl. 13.3.1 Variation by Instruction.",
    srcAr: "البند ٢٠‑٢‑١: إشعار المطالبة خلال ٢٨ يومًا. البند ٢٠‑٢‑٤: المطالبة التفصيلية خلال ٨٤ يومًا — وصارت هي نفسها شرطًا واقفًا. البند ١٣‑٣‑١ التغيير بالتعليمات.",
  },
  bespoke: {
    id: "bespoke",
    en: "Bespoke / other — set your own",
    ar: "عقد خاص / غير ذلك — حدّد بنفسك",
    noticeDays: 28, detailDays: 0,
    clauses: { variation: "", claim: "", eot: "" },
    forum: "courts",
    employerDefault: "private",
    srcEn: "Nothing is assumed. Read your contract and enter the periods and clause numbers yourself.",
    srcAr: "ما فيه أي افتراض. اقرأ عقدك وأدخل المدد وأرقام البنود بنفسك.",
  },
};

const EMPLOYER_TYPES = {
  government: { en: "Government entity", ar: "جهة حكومية" },
  semi:       { en: "Semi-government / state-owned", ar: "شبه حكومية / مملوكة للدولة" },
  private:    { en: "Private", ar: "قطاع خاص" },
};

/* ---------------------------------------------------------------
   2. Public procurement — the 20% variation ceiling
   ---------------------------------------------------------------
   Law No. 24 of 2015 Regulating Tenders and Auditions, Art. 81: a government
   contract may be varied by up to 20% of the contract value without a fresh
   tender. Beyond that needs the tender committee. Contractors get caught by
   this: the work is instructed, executed, and then cannot be paid because the
   entity has no authority left to pay it.                                    */
const PROCUREMENT_CAP = 0.20;
const CAP_WARN_AT     = 0.15;   // start warning early — approvals take months

/* ---------------------------------------------------------------
   3. Qatari Civil Code — Law No. 22 of 2004
   --------------------------------------------------------------- */
const QATAR_LAW = {
  art709: {
    en: "Civil Code Art. 709 — on a lump-sum contract the contractor cannot claim an increase for changes to the design unless the employer caused them or authorised them. Written authorisation is what makes the claim recoverable.",
    ar: "القانون المدني م. ٧٠٩ — في العقد المقطوع لا يستحق المقاول زيادة عن تعديل التصميم إلا إذا كان المالك هو السبب أو أذن به. الإذن الخطي هو ما يجعل المطالبة قابلة للاسترداد.",
  },
  art418: {
    en: "Civil Code Art. 418 — prescription may not be waived before the right arises, and the parties may not agree a period different from the one set by law.",
    ar: "القانون المدني م. ٤١٨ — لا يجوز التنازل عن التقادم قبل ثبوت الحق، ولا الاتفاق على مدة تخالف ما حدده القانون.",
  },
  art172: {
    en: "Civil Code Art. 172 — contracts must be performed in good faith. A time bar invoked by an employer who knew of the work and let it proceed is open to challenge on this ground.",
    ar: "القانون المدني م. ١٧٢ — يجب تنفيذ العقد بحسن نية. التمسك بسقوط الحق من مالك كان يعلم بالأعمال وتركها تُنفَّذ قابل للطعن على هذا الأساس.",
  },
  limitation: {
    en: "General limitation is 15 years for civil claims and 10 for commercial ones — far longer than any contractual notice period.",
    ar: "التقادم العام ١٥ سنة في المطالبات المدنية و١٠ في التجارية — أطول بكثير من أي مهلة إشعار تعاقدية.",
  },
  decennial: {
    en: "Civil Code Arts. 711–715 — contractor and engineer are jointly liable for ten years for defects threatening stability or safety; it cannot be excluded. Art. 714 gives three years from collapse or discovery to bring the action, so exposure can run to thirteen years.",
    ar: "القانون المدني م. ٧١١–٧١٥ — المقاول والمهندس مسؤولان بالتضامن عشر سنوات عن العيوب المهددة للسلامة أو المتانة، ولا يجوز استبعادها. والمادة ٧١٤ تعطي ثلاث سنوات من التهدم أو الاكتشاف لرفع الدعوى، فتصل المدة إلى ثلاث عشرة سنة.",
  },
  arabic: {
    en: "Law No. 7 of 2019 on the Protection of the Arabic Language — government bodies use Arabic in their contracts and correspondence, and Qatari court proceedings are in Arabic. Serve notices on a government employer in Arabic, or in both languages.",
    ar: "قانون رقم ٧ لسنة ٢٠١٩ بحماية اللغة العربية — الجهات الحكومية تستخدم العربية في عقودها ومراسلاتها، وإجراءات المحاكم القطرية بالعربية. أرسل الإشعارات للمالك الحكومي بالعربية أو باللغتين.",
  },
};

/* ---------------------------------------------------------------
   4. Qatar calendar — weekend, holidays, Hijri
   ---------------------------------------------------------------
   Working week is Sunday–Thursday; Friday and Saturday are the weekend.
   A notice that falls due on a weekend or a public holiday is a notice that
   will be served late, so the engine flags it and tells you to go early.     */
const QA_WEEKEND = [5, 6];   // JS getDay(): Fri = 5, Sat = 6

// Fixed-date holidays. Hijri feasts move each year and are announced by the
// Amiri Diwan, so approximate windows are listed per year and refreshed
// yearly; an unknown year simply produces no feast warnings rather than
// a wrong one.
const QA_FIXED_HOLIDAYS = [
  { m: 12, d: 18, en: "Qatar National Day", ar: "اليوم الوطني" },
];
const QA_ANNOUNCED_HOLIDAYS = {
  2026: [
    { from: "2026-02-10", to: "2026-02-10", en: "National Sports Day", ar: "اليوم الرياضي" },
    { from: "2026-03-17", to: "2026-03-23", en: "Eid al-Fitr (public sector)", ar: "عيد الفطر (القطاع العام)" },
    { from: "2026-05-26", to: "2026-05-30", en: "Eid al-Adha (public sector)", ar: "عيد الأضحى (القطاع العام)" },
  ],
  2027: [
    { from: "2027-02-09", to: "2027-02-09", en: "National Sports Day", ar: "اليوم الرياضي" },
  ],
};

function qaIsWeekend(d){ return QA_WEEKEND.includes(d.getDay()); }

function qaHoliday(d, lang){
  const p = (n) => String(n).padStart(2, "0");
  const iso = `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  for(const h of QA_FIXED_HOLIDAYS){
    if(d.getMonth()+1 === h.m && d.getDate() === h.d) return lang === "ar" ? h.ar : h.en;
  }
  const yr = QA_ANNOUNCED_HOLIDAYS[d.getFullYear()] || [];
  for(const h of yr){ if(iso >= h.from && iso <= h.to) return lang === "ar" ? h.ar : h.en; }
  return null;
}

// Sunday–Thursday, not a public holiday. Used to answer "when can I actually
// hand this over the counter?" rather than "what does the calendar say?".
function qaIsWorkingDay(d, lang){ return !qaIsWeekend(d) && !qaHoliday(d, lang); }

function qaLastWorkingDayOnOrBefore(d, lang){
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  for(let i = 0; i < 14; i++){
    if(qaIsWorkingDay(out, lang)) return out;
    out.setDate(out.getDate() - 1);
  }
  return out;
}

// Umm al-Qura Hijri, the calendar Qatar uses. Falls back silently if the
// runtime has no Islamic calendar data rather than showing a wrong date.
function hijri(d){
  try{
    // The ar-SA formatter already appends the era marker, so don't add a second one.
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura",
      { day: "numeric", month: "long", year: "numeric" }).format(d);
  }catch(e){ return ""; }
}

/* ---------------------------------------------------------------
   5. The risk engine
   ---------------------------------------------------------------
   Given one variation and its project, return what is wrong with it and
   why — each with the authority behind it, so the user can check rather
   than take our word.                                                       */
const RISK = {
  VERBAL_UNCONFIRMED: "verbal_unconfirmed",
  NOTICE_DUE:         "notice_due",
  NOTICE_OVERDUE:     "notice_overdue",
  DETAIL_DUE:         "detail_due",
  DETAIL_OVERDUE:     "detail_overdue",
  DEADLINE_NOT_WORKING: "deadline_not_working",
  NO_EVIDENCE:        "no_evidence",
  NO_CLAUSE:          "no_clause",
  ARABIC_REQUIRED:    "arabic_required",
};

/* Does the evidence trail contain anything written from the employer's side
   that could serve as the authorisation Art. 709 asks for? */
function hasWrittenAuthority(vo){
  const written = ["si", "email", "rfi", "drawing", "minutes"];
  return (vo.evidence || []).some((e) => written.includes(e.type));
}

function voRisks(vo, proj, lang, todayDate){
  const out = [];
  const L = (o) => (lang === "ar" ? o.ar : o.en);
  const n = voDeadlines(vo, proj, lang, todayDate);
  const served = vo.status !== "draft";

  // --- Art. 709: verbal instruction with nothing written behind it.
  if(vo.source === "verbal" && !hasWrittenAuthority(vo)){
    out.push({
      code: RISK.VERBAL_UNCONFIRMED, level: "high",
      text: lang === "ar"
        ? "تعليمات شفهية بدون أي مستند خطي من المالك أو المهندس يؤكدها."
        : "Verbal instruction with nothing written from the employer or engineer behind it.",
      why: L(QATAR_LAW.art709),
      todo: lang === "ar"
        ? "أرسل كتاب تأكيد للتعليمات الشفهية اليوم، وسجّله هنا كدليل."
        : "Send a confirmation-of-verbal-instruction letter today and log it here as evidence.",
    });
  }

  // --- notice window
  if(n && !served){
    if(n.noticeLeft < 0){
      out.push({
        code: RISK.NOTICE_OVERDUE, level: "high",
        text: lang === "ar"
          ? `انتهت مهلة الإشعار قبل ${Math.abs(n.noticeLeft)} يوم.`
          : `The notice window closed ${Math.abs(n.noticeLeft)} days ago.`,
        why: L(QATAR_LAW.art418) + " " + L(QATAR_LAW.art172),
        todo: lang === "ar"
          ? "قدّم الإشعار الآن على أي حال وسجّل سبب التأخير — الشرط الزمني في قطر ليس قاطعًا بالضرورة، لكن لا تعتمد على ذلك بدون رأي قانوني."
          : "Serve the notice now anyway and record why it was late — a time bar is not automatically fatal in Qatar, but do not rely on that without advice.",
      });
    } else if(n.noticeLeft <= 7){
      out.push({
        code: RISK.NOTICE_DUE, level: n.noticeLeft <= 3 ? "high" : "medium",
        text: lang === "ar"
          ? `باقي ${n.noticeLeft} يوم على انتهاء مهلة الإشعار.`
          : `${n.noticeLeft} days left to serve the notice.`,
        why: lang === "ar" ? proj.formSrcAr || "" : proj.formSrcEn || "",
        todo: lang === "ar" ? "ولّد الإشعار وأرسله." : "Generate the notice and serve it.",
      });
    }
  }

  // --- the second deadline everyone forgets
  if(n && n.detailDue && vo.status !== "submitted" && vo.status !== "review" &&
     vo.status !== "approved" && vo.status !== "rejected"){
    if(n.detailLeft < 0){
      out.push({
        code: RISK.DETAIL_OVERDUE, level: "high",
        text: lang === "ar"
          ? `انتهت مهلة المطالبة التفصيلية قبل ${Math.abs(n.detailLeft)} يوم.`
          : `The fully detailed claim was due ${Math.abs(n.detailLeft)} days ago.`,
        why: lang === "ar" ? proj.formSrcAr || "" : proj.formSrcEn || "",
        todo: lang === "ar" ? "قدّم المطالبة التفصيلية فورًا." : "Submit the fully detailed claim immediately.",
      });
    } else if(n.detailLeft <= 14){
      out.push({
        code: RISK.DETAIL_DUE, level: "medium",
        text: lang === "ar"
          ? `باقي ${n.detailLeft} يوم على المطالبة التفصيلية.`
          : `${n.detailLeft} days left for the fully detailed claim.`,
        why: lang === "ar" ? proj.formSrcAr || "" : proj.formSrcEn || "",
        todo: lang === "ar" ? "ابدأ بتجميع التسعير والإسناد." : "Start assembling the pricing and substantiation.",
      });
    }
  }

  // --- a deadline you cannot actually meet on the day
  if(n && !served && n.noticeDueIsClosed){
    out.push({
      code: RISK.DEADLINE_NOT_WORKING, level: "medium",
      text: lang === "ar"
        ? `موعد الإشعار يصادف ${n.noticeDueClosedReason}.`
        : `The notice deadline falls on ${n.noticeDueClosedReason}.`,
      why: lang === "ar"
        ? "أسبوع العمل في قطر من الأحد إلى الخميس، والجمعة والسبت عطلة."
        : "The Qatari working week is Sunday to Thursday; Friday and Saturday are the weekend.",
      todo: lang === "ar"
        ? `سلّمه في موعد أقصاه ${fmtD(n.noticeDeliverBy, lang)}.`
        : `Deliver it by ${fmtD(n.noticeDeliverBy, lang)} at the latest.`,
    });
  }

  // --- no evidence at all
  if(!(vo.evidence || []).length){
    out.push({
      code: RISK.NO_EVIDENCE, level: "medium",
      text: lang === "ar" ? "ما فيه أي دليل مسجّل لهذا الأمر."
                          : "No evidence recorded against this variation.",
      why: lang === "ar"
        ? "ملف الإسناد يُبنى من هذي القائمة، وسجلات ما بعد النزاع أضعف من السجلات الآنية."
        : "The substantiation pack is built from this list, and records made after the dispute carry less weight than contemporary ones.",
      todo: lang === "ar" ? "أضف التعليمات والمخطط والمراسلات." : "Add the instruction, the drawing and the correspondence.",
    });
  }

  // --- no clause cited
  if(!vo.clause){
    out.push({
      code: RISK.NO_CLAUSE, level: "low",
      text: lang === "ar" ? "ما حُدِّد بند العقد." : "No contract clause identified.",
      why: lang === "ar"
        ? "الإشعار الذي لا يذكر أساسه التعاقدي أسهل في الرد عليه."
        : "A notice that does not state its contractual basis is easier to reject.",
      todo: lang === "ar"
        ? `البند الافتراضي لهذا النموذج: ${proj.clauseVariation || "—"}`
        : `The default for this form is: ${proj.clauseVariation || "—"}`,
    });
  }

  // --- Arabic for a government employer
  if(proj.employerType === "government" && lang !== "ar"){
    out.push({
      code: RISK.ARABIC_REQUIRED, level: "low",
      text: "Employer is a government entity — correspondence should be in Arabic.",
      why: QATAR_LAW.arabic.en,
      todo: "Switch the app to العربية before generating the notice, or issue both versions.",
    });
  }

  return out;
}

/* ---------------------------------------------------------------
   6. Deadlines
   --------------------------------------------------------------- */
function voDeadlines(vo, proj, lang, todayDate){
  const inst = parseISO(vo.dateInstructed);
  if(!inst || !proj) return null;
  const today = todayDate || startOfToday();
  const nDays = Number(proj.noticeDays) || 28;
  const dDays = Number(proj.detailDays) || 0;

  const noticeDue = addDays(inst, nDays);
  const detailDue = dDays ? addDays(inst, dDays) : null;
  const noticeLeft = dayDiff(today, noticeDue);
  const detailLeft = detailDue ? dayDiff(today, detailDue) : null;

  const holidayName = qaHoliday(noticeDue, lang);
  const closed = qaIsWeekend(noticeDue) || !!holidayName;
  const deliverBy = closed ? qaLastWorkingDayOnOrBefore(noticeDue, lang) : noticeDue;

  const served = vo.status !== "draft";
  let state = "green";
  if(!served){
    if(noticeLeft < 0) state = "red";
    else if(noticeLeft <= 7) state = "amber";
  }

  return {
    noticeDue, noticeLeft, detailDue, detailLeft, served, state,
    noticeDueIsClosed: closed,
    noticeDueClosedReason: holidayName ||
      (lang === "ar" ? (noticeDue.getDay() === 5 ? "يوم جمعة" : "يوم سبت")
                     : (noticeDue.getDay() === 5 ? "a Friday" : "a Saturday")),
    noticeDeliverBy: deliverBy,
    noticeDeliverByLabel: isoOf(deliverBy),
  };
}

/* ---------------------------------------------------------------
   7. Project-level checks — the 20% ceiling and decennial exposure
   --------------------------------------------------------------- */
function projectRisks(proj, vos, lang){
  const out = [];
  if(!proj) return out;

  // Procurement ceiling. Counts everything not rejected, because an approved
  // variation and a pending one both consume the same authority.
  const sum = Number(proj.contractSum) || 0;
  if(sum > 0 && (proj.employerType === "government" || proj.employerType === "semi")){
    const varied = vos.filter(v => v.status !== "rejected")
                      .reduce((s,v) => s + (Number(v.amountApproved != null && v.amountApproved !== "" ? v.amountApproved : v.costImpact) || 0), 0);
    const pct = varied / sum;
    if(pct >= CAP_WARN_AT){
      const over = pct >= PROCUREMENT_CAP;
      out.push({
        code: "procurement_cap", level: over ? "high" : "medium",
        pct,
        text: lang === "ar"
          ? `أوامر التغيير وصلت ${(pct*100).toFixed(1)}٪ من قيمة العقد${over ? " — تجاوزت حد الـ ٢٠٪" : ""}.`
          : `Variations stand at ${(pct*100).toFixed(1)}% of the contract value${over ? " — past the 20% ceiling" : ""}.`,
        why: lang === "ar"
          ? "قانون رقم ٢٤ لسنة ٢٠١٥ بتنظيم المناقصات والمزايدات، م. ٨١ — تعديل العقد الحكومي بما لا يجاوز ٢٠٪ من قيمته، وما زاد يحتاج موافقة لجنة المناقصات."
          : "Law No. 24 of 2015 Regulating Tenders and Auctions, Art. 81 — a government contract may be varied by up to 20% of its value; beyond that needs the tender committee.",
        todo: lang === "ar"
          ? "ابدأ إجراءات الموافقة من الآن. تنفيذ أعمال فوق السقف بدون موافقة يعني أعمال منفَّذة قد لا تُدفع."
          : "Start the approval process now. Work done above the ceiling without approval is work that may not be payable.",
      });
    }
  }

  // Decennial exposure — ten years from completion, plus three to sue.
  if(proj.completionDate){
    const c = parseISO(proj.completionDate);
    if(c){
      const ten = addDays(c, 3653);
      out.push({
        code: "decennial", level: "info",
        text: lang === "ar"
          ? `الضمان العشري يمتد إلى ${fmtD(ten, lang)}.`
          : `Decennial liability runs to ${fmtD(ten, lang)}.`,
        why: lang === "ar" ? QATAR_LAW.decennial.ar : QATAR_LAW.decennial.en,
        todo: lang === "ar"
          ? "احتفظ بسجلات المشروع طوال هذي المدة — وليس حتى شهادة الإنجاز فقط."
          : "Keep the project records for that whole period — not just until the completion certificate.",
      });
    }
  }
  return out;
}

/* ---------------------------------------------------------------
   8. Small date helpers (shared with the app)
   --------------------------------------------------------------- */
const QA_MONTHS = {
  ar: ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
};
// Dates inside the risk sentences read as prose, not as machine output — a
// warning that says "2037-09-01" mid-sentence looks like a bug, not a deadline.
function fmtD(d, lang){
  if(!d) return "—";
  return `${d.getDate()} ${QA_MONTHS[lang === "ar" ? "ar" : "en"][d.getMonth()]} ${d.getFullYear()}`;
}

function startOfToday(){ const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function parseISO(s){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim());
  if(!m) return null;
  const d = new Date(+m[1], +m[2]-1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}
function isoOf(d){ const p = (n) => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function addDays(d, n){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()+n); }
function dayDiff(a, b){ return Math.round((b - a) / 86400000); }
