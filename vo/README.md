# سند · Sanad — سجل أوامر التغيير · النسخة القطرية

Variation-order register and contractual-notice tracker, built for the way projects
actually run in Qatar. Same architecture as Bosla: static files plus an optional
Cloudflare Worker, deployed the same way, at the same (nil) running cost.

**Open `index.html` to try it — no install, no account.** Deployment: `SETUP.md`.

---

## Why this, and why Qatar

Contractors don't lose variation money because they can't price the work. They lose it
for three reasons, and all three are sharper in Qatar than in the FIDIC textbook:

**1. The notice was never served.** Ashghal's General Conditions put the contractor's
claim at Cl. 19.1 with a 28-day window written as forfeiture. FIDIC 2017 adds a second
condition precedent almost nobody tracks — Sub-Cl. 20.2.4, a fully detailed claim within
84 days, on top of the 28-day notice at 20.2.1. Sanad runs both clocks.

**2. The instruction was verbal.** Article 709 of the Qatari Civil Code is the one that
costs money: on a lump-sum contract the contractor **cannot claim an increase** for changes
to the design unless the employer caused them or authorised them. A verbal instruction with
nothing written behind it is, in law, close to unrecoverable. Sanad flags every verbal
instruction as a high risk the moment it is logged, and clears the flag only when something
written from the employer's side appears in the evidence trail.

**3. The 20% ceiling was blown without anyone noticing.** Law No. 24 of 2015 Regulating
Tenders and Auctions, Art. 81: a government contract may be varied by up to 20% of its value
without a fresh tender. Past that, the entity needs the tender committee — and work already
executed above the line can sit unpaid for a very long time. Sanad meters cumulative
variations against the contract sum for government and semi-government employers, and starts
warning at 15% because approvals take months.

## What it does

**Notice-deadline board.** Every logged variation starts its clock on the day it was
instructed, using the notice period of the contract form you picked. Un-noticed variations
are listed most-urgent-first — red past the deadline, amber inside 7 days. Serving the notice
stops the clock and drops the item off the board. Where the form has a second deadline, that
one is tracked too.

**Risk feed.** The dashboard leads with what is about to go wrong, worst first, each item
carrying the authority behind it (article, law, clause) so you can check rather than take our
word — and each with the one action that fixes it.

**Evidence trail with attachments.** Each variation carries a dated log, and you can attach
the actual PDF or photo. Files go to IndexedDB, not localStorage, so site photos don't blow
the browser quota and take your register down with them. The trail becomes the chronology in
the substantiation pack.

**Qatar calendar.** Working week Sunday–Thursday, weekend Friday–Saturday, public holidays
including National Day, Sports Day and the announced Eid windows. A notice deadline falling on
a closed day is flagged with the last working day you can actually deliver it. Dates show in
Hijri alongside Gregorian in Arabic.

**Documents.** Notice of variation, variation submission, substantiation pack — on your
letterhead, naming the form of contract, printable, copyable, downloadable. Generating an
English notice for a government employer warns you about Law No. 7 of 2019, under which
government bodies correspond in Arabic and Qatari court proceedings are in Arabic.

**Contract profiles.** Ashghal/PWA, Qatar Rail, QatarEnergy/Kahramaa, Qatar Foundation,
FIDIC 1999, FIDIC 2017, or bespoke. Picking one fills in its notice periods and clause
numbers, and shows where those numbers came from. **All of them are editable**, because the
Particular Conditions in a real Qatari contract almost always move them.

Bilingual Arabic/English with proper RTL, light and dark, mobile-first, QAR by default.
Everything on-device — no account, no server, so it can be opened on a laptop in a site
office without a data-processing conversation first.

## What it deliberately does not do

- **No pricing engine, no BOQ, no rates.** That lives in the estimator's spreadsheet and is
  not moving.
- **No AI-written letters.** The model reads pasted instructions; the letters come from fixed
  templates. A notice has to say the same thing every time, and an invented clause number in
  a notice served on Ashghal is a liability. The extractor is told to leave a field blank
  rather than guess, and is specifically told never to round a verbal instruction up to a
  written one — that distinction is the whole of Art. 709.
- **No legal advice.** Every period and clause number is a default with its source shown, to
  be verified against the actual contract. The app says this on the Data tab and on every
  generated document.

## The legal basis, and where each number comes from

| Rule in the app | Authority |
|---|---|
| Verbal instruction = high risk until confirmed in writing | Civil Code (Law 22/2004) Art. 709 |
| A closed notice window is serious but not automatically fatal | Civil Code Arts. 418 (prescription cannot be shortened by agreement) and 172 (good faith) |
| 20% variation ceiling on government contracts | Law 24/2015 Regulating Tenders and Auctions, Art. 81 |
| Arabic for correspondence with government employers | Law 7/2019 on the Protection of the Arabic Language |
| Ten-year exposure from completion, plus three years to sue | Civil Code Arts. 711–715, and Art. 714 for the three years |
| Ashghal: 28-day notice, Cl. 19.1; delays Cl. 9.3 | Ashghal General Conditions of Contract |
| FIDIC 1999: 28-day notice + 42-day detailed claim, Sub-Cl. 20.1 | FIDIC Red Book 1999 |
| FIDIC 2017: 28-day notice (20.2.1) + 84-day detailed claim (20.2.4) | FIDIC Red Book 2017 |
| Sun–Thu week, Fri–Sat weekend, holiday calendar | Qatari practice; holidays per Amiri Diwan announcements |

All of it lives in `qatar.js`, one file, each rule next to its source — so when a law changes
or the Eid dates are announced for next year, there is exactly one place to edit.

---

## Before building anything else — go and validate it

The build is done. Whether contractors in Doha will pay for it is not something more code
answers.

**Don't ask "would you use this?"** Everyone says yes and nobody pays. Ask three or four
people you know — a commercial manager, a planner, a claims consultant — one question:

> "آخر نزاع صار عندك على أمر تغيير — كم أخذ منك وقت عشان تجمّع الأدلة وتثبت موقفك؟"
>
> *"The last variation dispute you had — how long did it take you to assemble the evidence
> and prove your position?"*

Then listen. What you're sorting for:

| What you hear | What it means |
|---|---|
| "A week. We lost money because we couldn't find the correspondence." | Real pain. Load the example project and show them. |
| "We had a verbal instruction and the employer denied it." | This is Art. 709 and it is the sharpest edge of the product. Show them VO-003 in the demo. |
| "We got caught above the 20% and it sat unpaid." | Show them the ceiling meter. |
| "It's fine, we have a system." | Ask what it is. Excel means there may still be something here; a real EDMS means move on. |
| "Interesting, send it to me." | Polite no. Next person. |

The measure is not "they liked it". It is whether anyone asks for it a **second time**,
unprompted, for a **live** project. Until that happens, don't add features.

## If it validates, the next things to build

In order of how often they'd come up, not how fun they are:

- [ ] **Shared register / multi-user.** The moment a second person on the same project needs
      it, device-only storage stops working. Needs a backend — deliberately deferred until
      someone asks.
- [ ] **Correspondence log beyond variations.** Notices under other clauses (EOT, delay
      events, early warnings) run on the same clock and the same evidence discipline.
- [ ] **Claim value roll-up against the contract sum over time**, not just the current total —
      what the commercial manager actually reports upward each month.
- [ ] **Arabic/English side-by-side documents** in one PDF, which is how many Qatari
      contractors actually issue.
- [ ] **Hijri-dated correspondence** where the employer works to the Hijri calendar.
- [ ] **Refresh the announced holiday windows** each year in `qatar.js` — Eid dates are set by
      the Amiri Diwan and the file only claims the years it actually knows.

## Files

| File | What it is |
|---|---|
| `index.html` | The app — layout, register, documents, i18n. |
| `qatar.js` | The Qatar engine — contract forms, Civil Code checks, procurement ceiling, calendar, risk rules. Each rule sits next to its source. |
| `worker.js` | Cloudflare Worker holding the Anthropic key. Optional — the app degrades to a local reader without it. |
| `SETUP.md` | How to run it, and how to deploy the Worker. |
