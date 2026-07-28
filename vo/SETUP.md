# سند · Sanad — setup

Two parts, and **only the first one is required**:

- **A. Run the app** — 1 minute. No account, no server, no key. It works offline.
- **B. Turn on the AI reader** — ~15 minutes, optional. Lets you paste an instruction email
  and have the form filled in for you.

Everything the app stores lives in the browser's `localStorage` on that one device. There
is no backend, no login, and nothing leaves the machine — which is exactly why you can put
it in front of a contractor without a procurement conversation first.

---

## Part A — Run it (1 min)

**Locally:** open `vo/index.html` in a browser. That's the whole install. Keep
`qatar.js` next to it — that file holds the contract forms, the Civil Code checks, the
20% ceiling and the Qatar calendar, and the app will not run without it.

**On the web (GitHub Pages, same as Bosla):** the file is already in the repo. Once this
branch is merged to `main`, it's live at:

```
https://aalfadhala10.github.io/travel-itinerary-skill/vo/
```

**First thing to do:** open it, go to **البيانات / Data → حمّل المشروع النموذجي / Load the
example project**. That fills the app with a worked project — four variations, one of them
already 6 days past its notice deadline — so you can see what it does without typing
anything. Use this when you show it to someone.

To start your own: **+ مشروع / + Project**, then get three fields right — the rest is
cosmetic:

1. **نموذج العقد / Form of contract.** Picking Ashghal, Qatar Rail, QatarEnergy, Qatar
   Foundation, FIDIC 1999 or FIDIC 2017 fills in that form's notice periods and clause
   numbers and shows you where they came from. **Then check them against your Particular
   Conditions** — on a real Qatari contract they have usually been moved, and every deadline
   in the app is counted from these numbers.
2. **صفة المالك / Employer type.** Government or semi-government turns on the 20% procurement
   ceiling meter (Law 24/2015 Art. 81) and the Arabic-correspondence warning (Law 7/2019).
3. **قيمة العقد / Contract value.** Without it the ceiling meter cannot work.

Optional but worth filling in: the **letterhead** (address, phone, CR number) appears on every
generated document, and the **completion date** drives the decennial-liability window.

---

## Part B — Turn on the AI reader (optional, ~15 min)

Without this, the "paste the instruction" box still works — it falls back to a built-in
offline reader that pulls out dates, amounts, clause numbers and the source. It's dumb but
honest, and it tells you it was the offline one. With the Worker, a model reads the document
properly, including Arabic.

The Worker exists for one reason: a static web page cannot hold a secret. The Anthropic key
lives in the Worker, and the page only ever talks to the Worker.

**Cost:** roughly 1–2¢ per document read. Set a spend cap and you cannot be surprised.

### 1. Anthropic key (5 min)

1. <https://console.anthropic.com> → sign in.
2. **Settings → Billing** → add $5.
3. **Settings → Limits** → set a monthly spend limit (e.g. $10). Do this before anything else.
4. **Settings → API Keys → Create Key**, name it `sanad`. Copy it now — it's shown once.

> The key goes in exactly one place: the Worker secret in step 2.5. Never in the HTML, never in a chat.

### 2. Deploy the Worker (10 min)

1. <https://dash.cloudflare.com> → free account (no card needed for Workers).
2. **Workers & Pages → Create → Start with Hello World → Deploy**. Name it `sanad-ai`.
3. **Edit code** → select everything in the editor and delete it.
4. Paste the entire contents of **`vo/worker.js`** → **Deploy**.
5. **Settings → Variables and Secrets → Add → Type: Secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: your `sk-ant-...` key
   - **Deploy** again.
6. Copy the Worker URL — `https://sanad-ai.<your-subdomain>.workers.dev`.

### 3. Point the app at it

In `vo/index.html`, near the top of the `<script>` block:

```js
const CONFIG = {
  aiEndpoint: "",   // ← put your Worker URL here
};
```

becomes

```js
const CONFIG = {
  aiEndpoint: "https://sanad-ai.<your-subdomain>.workers.dev",
};
```

Save, reload, paste an instruction email into the box, press **اقرأه وعبّي النموذج / Read it
and fill the form**. If it says "offline reader", the URL isn't set or the Worker isn't
reachable.

### 4. If you serve the app from somewhere else

`vo/worker.js` only accepts requests from the origins listed at the top:

```js
const ALLOWED_ORIGINS = [
  "https://aalfadhala10.github.io",
  "http://localhost",
  "http://127.0.0.1",
];
```

Add your domain there and redeploy, or the browser will block the call.

---

## What the AI is and isn't allowed to do

This matters more here than in a travel app, so it's enforced in the code rather than left
to a prompt:

- **The model only ever reads.** It extracts what a human already wrote — date, who
  instructed it, clause cited, amount stated.
- **The model never writes the letters.** The notice, the submission and the substantiation
  pack are built from fixed templates in the app. A contractual notice has to say the same
  thing every time, and a hallucinated clause number in a notice is worse than no notice.
- **It is told not to guess.** No clause unless the document cites one; no amount unless the
  document states one; no date unless the document carries one. Blank beats invented — a
  fabricated fact in a claim file is a liability, not a convenience.
- **It must never round a verbal instruction up to a written one.** If the document records
  something said on site, the source stays "verbal" even when the record itself is an email.
  That single distinction decides whether Article 709 leaves you recoverable or not, so it is
  the one thing the prompt is most explicit about.
- **Dates are read day-first** (03/04/2026 is 3 April), and a Hijri-only date is returned
  blank rather than converted.
- **It rates its own confidence**, and says "low" when the text may not describe a variation
  at all.

The app labels every extraction as a draft and asks you to check each field before saving.
Leave that label alone.

---

## Backups

There is no server, so **the backup is your responsibility**. Data tab → **تحميل نسخة
احتياطية / Download backup (JSON)**. Do it before changing phone, clearing the browser, or
demoing to someone.

**The backup holds the register, not the attachments.** Attached PDFs and photos live in the
browser's IndexedDB on that device — that's what keeps a few site photos from blowing the
storage quota and taking the whole register with them, but it also means they don't travel in
the JSON. Keep the original files where you normally keep them.

**Export register (CSV)** gives you the register in a form Excel opens — reference, dates,
both deadlines, status, evidence and attachment counts, and the open risks per line. That is
usually the first thing a commercial manager asks for.

---

## Keeping it current

Two things in `qatar.js` go stale on a schedule:

- **`QA_ANNOUNCED_HOLIDAYS`** — Eid dates are set each year by the Amiri Diwan. The file only
  lists the years it actually knows; an unknown year simply produces no feast warnings rather
  than a wrong one. Add next year's windows when they're announced.
- **The contract-form defaults** — if Ashghal reissues its General Conditions, or you work
  under a form that isn't listed, add it to `CONTRACT_FORMS` with its own periods, clause
  numbers and a `srcEn`/`srcAr` line saying where those came from. Every entry carries its
  source for exactly this reason.
