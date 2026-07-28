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

**Locally:** open `vo/index.html` in a browser. That's the whole install.

**On the web (GitHub Pages, same as Bosla):** the file is already in the repo. Once this
branch is merged to `main`, it's live at:

```
https://aalfadhala10.github.io/travel-itinerary-skill/vo/
```

**First thing to do:** open it, go to **البيانات / Data → حمّل المشروع النموذجي / Load the
example project**. That fills the app with a worked project — four variations, one of them
already 6 days past its notice deadline — so you can see what it does without typing
anything. Use this when you show it to someone.

To start your own: **+ مشروع / + Project**, then set the **notice period** to whatever your
contract actually says. Every deadline in the app is counted from that number, so it is the
one field worth getting right. FIDIC-based contracts commonly use 28 days; it defaults there
but yours may differ.

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
- **It rates its own confidence**, and says "low" when the text may not describe a variation
  at all.

The app labels every extraction as a draft and asks you to check each field before saving.
Leave that label alone.

---

## Backups

There is no server, so **the backup is your responsibility**. Data tab → **تحميل نسخة
احتياطية / Download backup (JSON)**. Do it before changing phone, clearing the browser, or
demoing to someone. **Export register (CSV)** gives you the register in a form Excel opens,
which is also what a commercial manager will ask you for first.
