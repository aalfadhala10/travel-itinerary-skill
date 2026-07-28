# سند · Sanad — variation order register & notice tracker

A working first version of the variation-order product. Same architecture as Bosla: one
static HTML file plus an optional Cloudflare Worker for the AI, deployed the same way, at
roughly the same cost (nothing).

**Setup and deployment: `SETUP.md`. Open `index.html` to try it — no install.**

---

## What it does

Contractors don't lose variation money because they can't price the work. They lose it
because the paperwork wasn't served in time and the evidence wasn't kept. So the product is
built around those two things, not around pricing.

**1. The notice-deadline board.** Most contracts give you a fixed window to notify a
variation after it's instructed — commonly 28 days on FIDIC-based forms. Miss it and the
claim is weakened or barred regardless of merit. Every variation you log starts that clock.
The dashboard shows what's still un-noticed, sorted most urgent first, colour-coded: red
past the deadline, amber inside 7 days. Serving notice stops the clock and the item drops
off the board.

**2. The evidence trail.** Each variation carries a dated log — the site instruction, the
RFI response, the photos, the email confirming it. That list is the chronology in the
substantiation pack, so the pack assembles itself from records you kept at the time instead
of a week of archaeology when the dispute lands.

Around those: a register with search and status filters, a dashboard of claimed vs approved
vs pending value and total time impact, and three generated documents — **notice of
variation**, **variation submission**, **substantiation pack** — each printable, copyable,
and downloadable.

Bilingual Arabic/English with proper RTL, light and dark, mobile-first. Data lives in the
browser only; JSON backup and CSV export are in the Data tab.

---

## What's deliberately not in it

- **No pricing engine, no BOQ, no rates.** Contractors already have that in Excel and they
  are not going to move it. Competing there means competing with the estimator's own
  spreadsheet — a fight with no upside.
- **No accounts, no server, no cloud.** Partly cost, mostly sales: a contractor can look at
  it on your laptop in a site office without anyone approving a data-processing agreement.
  It becomes a constraint the moment two people need the same register — that's the point at
  which you'd know it's worth building a backend.
- **No AI-written letters.** The model reads pasted documents; the letters come from fixed
  templates. A contractual notice must say the same thing every time, and an invented clause
  reference in a notice is a liability. This is a deliberate limit, not a missing feature.

---

## Before building anything else — go and validate it

The build was the easy part and it's now done. The open question is whether contractors feel
this pain enough to pay, and no amount of further coding answers that.

**Don't ask "would you use this?"** Everyone says yes and nobody pays. Ask three or four
people you know in the industry one question:

> "آخر نزاع صار عندك على أمر تغيير — كم أخذ منك وقت عشان تجمّع الأدلة وتثبت موقفك؟"
>
> *"The last variation dispute you had — how long did it take you to assemble the evidence
> and prove your position?"*

Then shut up and listen. What you're sorting for:

| What you hear | What it means |
|---|---|
| "A week. We lost money because we couldn't find the correspondence." | Real pain. Show them the app — load the example project first. |
| "We missed the notice period once and ate the cost." | The strongest possible signal. This is the whole product. |
| "It's fine, we have a system." | Ask what the system is. If it's Excel, there may still be something here. If it's a real EDMS, move on. |
| "Interesting, send it to me." | Polite no. Note it and go to the next person. |

The measure that matters is not "they liked it" — it's whether anyone asks for it a **second
time**, unprompted, for a **live** project. Until that happens, don't add features.

## If it validates, the next things to build

Roughly in order of how often they'd come up, not how fun they are:

- [ ] **File attachments on evidence entries.** Right now the trail is text plus dates. The
      real artefacts are PDFs and photos. This is the first thing anyone will ask for.
- [ ] **Multi-user / shared register.** The moment a second person needs the same project,
      device-only storage stops working. Needs a backend — deliberately deferred until
      somebody actually asks.
- [ ] **Cumulative claim view.** Contractors think in totals against the contract sum, not
      in individual VOs. A running "approved vs claimed vs contract value" line.
- [ ] **Configurable contract profiles.** Notice period is one number today. Different forms
      have different windows for variations vs claims vs EOT.
- [ ] **Company letterhead on generated documents.** Currently the contractor's name only.
      Trivial to add, and it's what makes the output feel usable rather than a demo.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app. Inline CSS/JS, no build step, no dependencies. |
| `worker.js` | Cloudflare Worker holding the Anthropic key. Optional — app degrades to a local reader without it. |
| `SETUP.md` | How to run it and how to deploy the Worker. |
