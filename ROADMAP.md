# Bosla · بوصلة — Roadmap & To-Do

Living to-do list / playbook. (Mirror into the Google Drive "Bosla App"
Playbook when the Drive connector is enabled for the chat.)

Real-user feedback lives in **`FEEDBACK.md`** (Friend 1, 2, 3 … — what they
said, what changed, what's still open). Anything left open there is also listed
below.

Last updated: 2026-08-01.

## The track — where this is going

The Gulf is the **beachhead, not the ceiling**. The destination, on a ~5-year
horizon, is worldwide: *the world's travel memory and guide* — plan on it, book
from it, carry your record on it. Endgame: valuable enough that a travel company
comes asking. Every feature decision gets checked against this track.

**Phase 0 — standing today.** Trilingual planner (EN / Khaleeji AR / ES), 738
cities in 206 countries, community trips, favourites, the travel record,
in-app price comparison, offline PWA. Everything on-device, guest-only, no
scraped content, licensed photos only. Gulf-first strengths (prayer, halal,
Khaleeji Arabic) are the wedge into an underserved market — they stay, as
strengths, wherever the app goes.

**Phase 1 — beta → paid launch (months).** A working money funnel and a visible
numbers board: weekly return rate, trips planned, record shares, booking
clicks. Credits move server-side (the blocker for real payments), payments
connect, Travelpayouts token brings live prices, community gets seeded, and the
shareable record card is the growth engine (WhatsApp / TikTok / Instagram).

**Phase 2 — accounts, the Bosla way (6–18 months).** Guest mode is forever:
planning a trip will NEVER require an account — that welcome-screen promise
stays true. An account is what you *opt into* for the best features:
- **Sync** — record, favourites, and trips on every device, safe if the phone dies.
- **Identity** — publish trips under a profile, edit from anywhere, likes and
  comments that belong to someone, a points/credits wallet that survives phone loss.
- **Passwordless only** — Sign in with Apple / Google or email magic link; no
  passwords stored, ever. The privacy promise evolves honestly: "on this device
  only" for guests, "backed up to your account" only after you choose it.
- Same rails: Cloudflare Workers + KV/D1. No new vendors without a reason that
  survives being said out loud.

**Phase 3 — worldwide (2–5 years).** More languages added the way Arabic was
done (properly, not machine-dumped): FR, TR, ID, UR/HI, DE. City coverage keeps
thickening through the add-poi pipeline. The record becomes the social spine —
profiles, countries-in-common, tips from people who actually went. Regional
booking partnerships replace one-size affiliates where numbers justify it.

**What an acquirer buys (kept true from day one):** a niche audience that
returns weekly and shares organically; a booking funnel with real conversion
numbers; clean IP (no scraped content, licensed photos, one owner, all in this
repo); a privacy story users trust.

**The one metric per phase:** P1 weekly return rate · P2 accounts created per
active guest · P3 non-Gulf share of weekly actives.

## How the app is wired (quick reference)

- **App**: one static file, `index.html` (~2.3 MB, inline CSS/JS), deployed via
  GitHub Pages from `main`. Develop on `claude/app-creation-y2v2ob`, then merge to
  `main` to go live. Working source copy lives in the scratchpad as `rihla.html` —
  every edit is applied to BOTH.
- **Analytics + feedback**: Google Apps Script web app (`analytics/Code.gs`) →
  writes to a Google Sheet (Events + Feedback tabs). Same `/exec` URL is wired into
  both `CONFIG.analyticsEndpoint` and `CONFIG.feedbackEndpoint`. Opening the `/exec`
  URL shows a live dashboard. Cookieless.
- **AI (real-time)**: Cloudflare Worker (`ai/worker.js`) holds the Anthropic key as
  a secret; `CONFIG.aiEndpoint` points at it. Two actions: `city` (Sonnet — build a
  missing city live) and `parse` (Haiku — understand a free-text/voice description).
  Built cities are cached in a KV namespace (`CITIES`) so each place is generated
  once, ever, then served free/instant. **Confirmed working.**

## In progress / next up

- [ ] **Salmaninho lists → per-country JSON files (refactor).** Move his embedded
  place lists out of `index.html` into `data/salman/<country>.json`, lazy-loaded
  only when a user plans that country (and cached offline by the service worker).
  Keeps the HTML lean and makes "add a country" = drop in one small file. Decided,
  not yet built.
- [ ] **Salmaninho — remaining countries.** Only Turkey (112) + Netherlands (84)
  are extracted/embedded so far. The other 31 need scraping from his Google Maps
  lists (virtualised scroll) — needs a session with working browser/maps access, or
  the user exports them. After the JSON refactor, each is just a new file.

## Backlog
- [ ] **Verified ticket-price ledger (Ahmed asked; hard, long-haul).** Today the budget is a
  per-city day-rate split by fixed shares (42 stay / 24 food / 16×pace activities / 8×pace
  local transport / 10 misc) — adding a specific attraction does NOT look up its entry fee.
  The honest upgrade: a hand-verified `data/fees.json` (place → entry fee, currency, source
  URL, checked-on date), starting with the ~100 most-planned landmarks from real usage data,
  layered on top of the estimate: slots show the real fee, the budget grows a "confirmed
  tickets" row, and the activities share shrinks by what's now known. Rules: no scraping, no
  AI-invented prices — a fee ships only with a source and a date, and goes stale after 12
  months. Add a validator like tools/add-poi.cjs. Accepted difficulty: prices change, vary by
  age/resident status, and need periodic rechecking — that's why it's a ledger with dates,
  not a promise of live accuracy. Related: measure estimate realism against live hotel prices
  once TP_TOKEN is set (stay is 42% of the estimate — comparing it to real quotes gives the
  first honest accuracy number).
- [ ] **Arrival/departure airport in the MANUAL planner too.** The bot now works out
  which airport you fly into (e.g. Garmisch → land in Munich, ~1.5h drive) and asks
  whether you want a night there. The form-based planner still can't, because we
  have no airport/gateway data per city. Plan: derive a `gateway` per destination —
  nearest big city in our own data by coordinates, or AI-generated once and cached —
  then show an arrival line on day 1 and a "get back to the airport" note on the
  last day.


- [ ] **AI voice upgrade (true AR+EN mixing).** Browser speech can't mix languages;
  current voice is reliable single-language (EN/AR/ES). True code-switching needs AI
  transcription (e.g. Whisper) via the Worker (~½¢/voice note, needs an OpenAI key).
  Only if the free single-language version proves not enough.
- [ ] **City batches** (rich data, no country left thin): A Alps/ski · B Europe
  scenic/secondary · C beach & island resorts · D nature/adventure bases ·
  E Gulf/MENA secondary · F Asia secondary. Prioritise from real `miss` data +
  the new "missing places" dashboard table.
- [ ] **Record entered names to a Sheet (maybe, future).** Technically easy —
  reuse the analytics endpoint, route `type:'name'` to a "Names" tab (name, time,
  country, lang, session; guests record nothing). BUT the welcome screen currently
  promises "Saved on this device only — no account or email", so this MUST NOT ship
  without first rewording that note to be honest (e.g. "we keep your first name to
  greet you and improve بوصلة"). Deferred — kept device-only for now by choice.
- [ ] **Better handling of vibe/advice-style prompts (from a real friend's input).**
  Input: "extreme adventure, don't know which country suits a Philippine passport —
  bungee, scuba, wakeboard, adrenaline." Problems to solve:
  - **No Adventure/Adrenaline vibe** — the tag set is Culture/Food/Nature/Shopping/
    Relax, so "adrenaline" collapses to "Nature". Add an Adventure vibe (bungee,
    diving, watersports, etc.) and surface those activities in the plan.
  - **Answers a question with a rigid itinerary** — when the user is *asking*
    ("which country suits my passport?") the app should *recommend* fitting
    destinations, not force one fixed trip. Consider a short "here's what fits"
    suggestion step before/instead of the itinerary.
- [ ] **Visa-friendly-for-my-passport feature.** Let a user pick their passport and
  filter/recommend only visa-free or visa-on-arrival destinations. (AI parser now
  honors passport hints in free-text; this would bring it to the manual planner too.)
- [ ] **Handy-apps Batch 2** (Europe + popular Asia/Americas) — awaiting go-ahead.
- [ ] **Affiliate wiring** once IDs are in hand (Booking.com, GetYourGuide/Klook).
- [ ] **Mirror this roadmap to the Google Drive "Bosla App" Playbook** (needs the
  Drive connector enabled in-chat).
- [ ] Keep an eye on first real analytics/feedback rows and the country breakdown.

## Done (recent)

- [x] **A place can't be both a sight and a meal on the same day.** Reported: Madrid
  day 1 had "Mercado de San Miguel" as LUNCH and again as the AFTERNOON activity. The
  food market is in both the `poi` and `food` lists, and `emitDays` kept two separate
  "already used" maps (`usedA`, `usedF`), so each could pick it independently. Now one
  shared record covers sights and meals alike.
- [x] **No far day trip on the day you arrive.** Same screenshot had "Toledo Day Trip"
  on day 1. `geoOrderPool` seeds one outlier at the head of every day including the
  first; now it starts from day 2, and `take()` also refuses outliers outright on a
  city's first day, so it holds even when a meal consumes a pool entry and shifts the
  ordering.
- [x] **Removed the drive pit-stop note** ("Halfway: pull over for a coffee and a
  leg-stretch") — generic filler rather than a real place. The transfer line keeps the
  mode, distance, duration, cost and the Maps route link.

- [x] **A cut-off reply no longer looks like the bot ignored you.** Reported: after
  "سويسرا" + "10 أيام" the chat showed the starter menu with no reply at all. Root
  cause: `max_tokens: 700` on the chat call, which the grown schema (`nights`,
  `extras`) plus token-heavy Arabic could overrun — the JSON is cut mid-object, parses
  to nothing, and the app rendered chips under silence. Raised to 1200; the app now
  retries once silently, treats an empty reply as a failure and SAYS so, and offers
  "↻ Try again" (which resends the last message without duplicating their bubble)
  instead of dumping the generic starter menu over an in-progress conversation. The
  starters still show on the very first message, where they're a real offer. Worker
  errors are console.warn'd so a recurring cause is diagnosable.

- [x] **The chat can't dead-end any more.** Real case: destination, days and the car
  plan were all settled, the bot answered "تمام" and stopped — `ready=false` with an
  empty `chips` array left the reply sitting there with nothing to tap and no trip.
  Three holes closed: (a) not-ready with no chips now falls back to the starters;
  (b) ready with an empty `cities` list now says it didn't catch the destination
  instead of silently swapping chips; (c) resolving cities we don't have runs Sonnet
  live and can take 10–30s, so the chat now shows "Building X → Y… one moment" and
  clears it when the plan lands (or explains if it can't). Worker prompt also forbids
  acknowledgement-only turns: every reply either asks with chips or builds.

- [x] **Opening the app starts fresh again.** Every visit re-ran the last saved trip
  (`applyState` called `plan()`/`planRoute()` straight from `rihla_v1`), so the app
  never looked like it started over. Now a visit restores the FORM only and lands on
  the planner; the last trip is offered in one dismissable line ("Your last trip:
  Phuket → Krabi · 6 days — Open it"). A shared `#trip=` link still opens straight
  into the itinerary, which is the whole point of sharing.

- [x] **Richer / non-local food (Friend 3's open complaint — closed).** A city shipped
  with ~5 local restaurants; naming breakfast, lunch and dinner drained that fast, and
  someone who didn't want the local cuisine had no way out. New Worker action `food`
  generates a varied list per city — local, Italian, grill, seafood, vegetarian, cafe,
  family, street food, one more international kitchen — and caches it in the same KV as
  cities, so it's generated at most ONCE ever, then free and instant. The app asks only
  when the stay actually needs it (roughly 2 places per night), caches it in
  localStorage for 90 days, and never asks twice for the same city. There's also a
  "Show me more options" button in the food swap for anyone who just doesn't like the
  picks, with the Google Maps search still there behind it.

- [x] **Edit the trip by chatting — the bot no longer disappears.** Building a trip
  used to wipe the conversation, so changing anything meant starting over. Now the
  plan renders, the bot asks "happy with this, or want to change something?" and the
  same conversation carries on. Every message sends a one-line summary of the trip
  that's on screen (`[Current plan - cities: … ; total days: … ]`) appended to the
  user's turn — deliberately NOT in the system prompt, which stays byte-identical so
  it keeps being cached. The bot returns the whole updated trip; edits keep the seed
  and the user's own swaps so a day-count change doesn't reshuffle everything.
  It can also add a small stop to a specific day (`extras: [{day, name}]` → a
  removable line on that day), give an exact nights-per-city split (`nights: [8, 4]`),
  and for a single place it points at the swap arrows instead of rebuilding.
  "It's final" closes the chat with no API call.

- [x] **Breakfast, lunch and dinner in every day** — the plan used to name only
  dinner. Lunch is now a second real restaurant, picked near wherever the morning
  ends (swappable like dinner); breakfast is one honest line that opens a
  "breakfast near <your area>" map search, since breakfast is nearly always where
  you slept and we'd rather not burn a curated restaurant on it.

- [x] **Bigger, readable plan text** — place names 15 → 16.5px, time column 10 →
  12px, collapsed-day summary 13 → 14.5px, same layout. The "Day 1 · Rome" line was
  the smallest thing on the page (11px, uppercase, letter-spaced); it's now 15.5px
  bold in normal case.

- [x] **The bot tells you what the app can already do.** When someone asks the chat
  for something that's a feature of the finished plan (photos, picking a different
  hotel or restaurant, more nights in one city), it now says so in one sentence
  instead of refusing — and names the one most relevant feature when it confirms the
  plan is ready.

- [x] **Chat box grows with what you write** — the one-line input hid everything
  past the first few words; it's now a textarea that expands up to a third of the
  screen. Enter sends, Shift+Enter is a new line.

- [x] **Arabic quality in the bot** — Arabic conversations now run on the bigger
  model (Sonnet) instead of Haiku, which was producing broken grammar and
  half-translated words; English/Spanish stay on Haiku. Prompt rule tightened too.

- [x] **Place photos on hover** — hovering a place name shows a Wikipedia thumbnail
  in a small popover. Free (no key), fetched only on hover (never on render), cached
  30 days in localStorage, silent when there's no match. On touch devices (no hover)
  a small photo button next to each place opens the same image inline instead — the
  place name still opens Google Maps on tap, unchanged.

- [x] **Country tracking by timezone** — anonymous, no permission, no precise
  location. Sends `tz` with each event; dashboard shows "Where visitors are"
  (visitors per country). Cookieless-friendly.
- [x] **Voice "Mix" removed** — browser speech can't mix languages reliably; mic
  now cycles EN / عربي / ES, each on its own engine.
- [x] **Salmaninho lists embedded** (Turkey + Netherlands) — his real saved spots
  render inline (first 8 + "more" expander), his red styling, credited.
- [x] **Real-time AI city generation live** + **KV caching confirmed** (build once,
  cached forever).
- [x] **AI description parsing** (Haiku) with local rule-based fallback.
- [x] **Cleaner PDF/print** output + destination-name filename.
- [x] Privacy-friendly analytics + in-app feedback → Google Sheet (live).
- [x] `miss` tracking + "Missing places" dashboard section.
- [x] Description parser fixes: multi-city order, night-summing, misspellings,
  country-word flood.
- [x] Added Garmisch-Partenkirchen, Kaprun, Zell am See.
- [x] Fixed clipped Adults/Kids stepper numbers.

## How real-time auto-generate works (design note)

When a user searches a city we don't have:
1. App detects the miss → shows "Building <city>…".
2. App POSTs the name to the Cloudflare Worker (holds the Anthropic key).
3. Worker calls Claude (Sonnet) → validated city object (blurb EN/AR/ES, POIs +
   coords, hotels, food, cost, currency) in our exact schema.
4. App injects it into the in-memory DEST/CO/POI_CO/HOTELS_X and renders the trip
   immediately — that same user is served, no "come back later".
5. Worker caches the city in KV so it's generated at most once, ever.

Guardrails: structural validation before showing; only plausible place names;
cache by name; flag AI cities for review before baking permanently into the app.

## Accounts — what Ahmed must set up (Phase 2, built 2026-08-02)

The code is in and degrades to nothing when the keys are absent: with no secrets set, the
account sheet says sign-in is not configured and guests are unaffected. To switch it on:

**Google (free)**
1. console.cloud.google.com → new project → APIs & Services → OAuth consent screen
   (External, app name "بوصلة · Bosla", your email, publish it).
2. Credentials → Create credentials → OAuth client ID → Web application.
3. Authorised redirect URI — exactly: `https://<your-worker>.workers.dev/auth/google/cb`
4. Copy the client ID and secret. In Cloudflare → your Worker → Settings → Variables:
   - `GOOGLE_CLIENT_ID` (secret)
   - `GOOGLE_CLIENT_SECRET` (secret)
   - `APP_URL` = `https://aalfadhala10.github.io/travel-itinerary-skill/`
   - `WORKER_URL` = `https://<your-worker>.workers.dev` (only if the worker sits behind a
     custom domain; otherwise it works this out itself)

**Email codes (free tier)**
1. resend.com → sign up → verify a domain you own, or use their test sender to start.
2. Cloudflare Worker variables:
   - `RESEND_KEY` (secret)
   - `MAIL_FROM` = e.g. `Bosla <hello@yourdomain.com>`

**Apple** — deliberately not built: it needs the $99/year Apple Developer account. It becomes
mandatory only if Bosla ships on the iOS App Store while offering Google sign-in.

**Storage** — users, sessions and synced data live in the KV namespace already bound (`u:`,
`uemail:`, `sess:`, `astate:`, `acode:`, `sync:`). D1 is the upgrade when this outgrows a
key-value store; today it would only add setup.

**Still to do before charging money**: move trip credits to the account record (`sync:<uid>` is
the wrong place — credits must live where the phone cannot edit them), then connect payments.

## Security posture after accounts (2026-08-02)

Done in this pass:

- **Sign-in codes** come from `crypto.getRandomValues` with rejection sampling, not
  `Math.random()`. The old generator was predictable: enough codes requested to your own address
  recovers the PRNG state, which then predicts the code emailed to somebody else.
- **`esc()` escapes quotes.** It only handled `< > &`, while roughly half its call sites write
  into an attribute — where a lone `"` starts a new attribute and `onerror=` needs no tag at all.
- **Stored XSS in the community feed, closed.** A published trip's thumbnail was written raw into
  `img src="…"` and only prefix-checked server-side, so
  `data:image/jpeg;base64,AAA" onerror=…` executed on every phone that opened the feed — and
  would have taken the session token. Image data-urls are now validated as a whole (base64
  charset, nothing else) on the client *and* in the worker, for the thumbnail and the full photo.
- **Policy and terms** rewritten to match what the app does; the in-app promises follow sign-in
  state.
- **`GET /auth/check`** on the worker reports setup state without echoing a secret.

Known and deliberately not done yet, roughly in the order they'll matter:

1. ~~Sign out everywhere~~ — done 2026-08-02: sessions carry the generation they were minted
   under, `auth_logout_all` bumps the user's `gen`, and every session dies at its next use.
   Needs the worker re-paste to go live.
2. **A Content-Security-Policy header.** GitHub Pages can't set headers, and the `<meta>` form
   can't carry `frame-ancestors`. The app is inline-script-heavy, so a real CSP means either
   moving the JS out or hashing it. Worth doing before any paid launch — it turns the next
   escaping mistake into a blocked request rather than a stolen session.
3. ~~Rate-limit `sync_put` per user~~ — done 2026-08-02: 400 writes per account per day,
   429 beyond. Same worker re-paste.
4. **Trip credits still live on the phone** (unchanged from before): they must move to the
   account record before real payments connect.
5. **The token lives in `localStorage`**, readable by any script on the page. An httpOnly cookie
   would be stronger but needs a same-origin path between Pages and the worker (a custom domain
   for both), which is a bigger change than it looks.

The test that guards all of this is `xss.cjs` in the scratchpad: it publishes hostile titles,
names, comments, captions and thumbnails and asserts nothing executes, no `on*` attribute is
created, and the session token stays put. It scored 20/20 after these fixes and 10 failures
against the commit before them.

## City expansion log (session 2026-08-02, autonomous loop)

Hand-curated, verified batches — real coords/attractions/hotels only, all five tables in sync,
each city audited (bounding box, cost tiers, hotels, currency) and plan-rendered in EN/AR/ES.

- **Iceland (10)**: Keflavík, Selfoss, Höfn, Húsavík, Egilsstaðir, Ísafjörður, Vestmannaeyjar,
  Stykkishólmur, Mývatn, Borgarnes. — 738 → 748 cities.
- **Norway/Switzerland/Croatia/Greece/Japan/Portugal (12)**: Ålesund, Flåm, Svolvær, Grindelwald,
  Lauterbrunnen, Zadar, Hvar, Plitvice, Milos, Hakone, Takayama, Albufeira. — 748 → 760.
- **Japan/Spain/Morocco/Italy/Austria/Portugal/Mexico (11)**: Kamakura, Ronda, Córdoba, Toledo,
  Segovia, Essaouira, Positano, Siena, Hallstatt, Nazaré, Guanajuato. — 760 → 771.

  Lesson from this batch: the pre-flight "is it already there?" check must fold ø/å/æ the same
  way the app's keys do. Tromsø was already present but a naive NFD fold read it as missing;
  the generator silently overwrote it (760 → 771, not 772). Caught by the +1 count mismatch,
  restored, and dropped from the batch. `checkmissing.cjs` now folds ø→o etc. before comparing.

Method preserved in scratchpad gen_iceland.cjs / gen_batch2.cjs / gen_batch3.cjs and the batch
verifiers (iceland.cjs, batch2.cjs, batch3render.cjs). Verified-present so far (skip): Nara,
Hiroshima, Granada, San Sebastián, Chefchaouen, Göreme, Pamukkale, Amalfi, Verona, Salzburg,
Sintra, Mérida, Oaxaca, Galle, Zanzibar, Hoi An, Luang Prabang, Bruges, Ghent, Bergen, Antigua
Guatemala, Tromsø. Next candidates: more Turkey/Balkans, Peru (Cusco?), Sri Lanka, India hill
stations — only what's verifiable. Cities are near saturation; prefer real bug/a11y work next.

## Accessibility pass (session 2026-08-03, autonomous loop)

An audit (`a11yaudit.cjs` / `a11yall.cjs` in scratchpad) walked every screen looking for
interactive elements with no accessible name, unlabelled inputs, and canvases with no text
alternative. Real gaps found and fixed (commit 5b8f995):

- **`<html>` never followed the language.** `applyLang` set `dir` only on `#app`, so the root
  stayed `lang="en"` in Arabic and Spanish — a screen reader announced the whole page with an
  English voice, and root direction was wrong. Now `applyLang` sets `lang` **and** `dir` on
  `document.documentElement`. Safe because every RTL rule is scoped to `#app[dir="rtl"]`, so the
  root attribute changes nothing visually (verified: matrix + navaudit still green).
- **Record globe/flat switch** (`#recFlatT`, a `role="switch"`) had no accessible name → added a
  localized `aria-label` (c.flat).
- **Record canvas** (`#recCv`) was an unlabelled `<canvas>` → now `role="img"` with a label that
  updates to the live country count ("My travel record — 12 countries", localized).
- **Publish modal** title/name inputs relied on a placeholder alone (vanishes on typing) → added
  `aria-label` alongside.

Non-issues confirmed (left alone): `#topo` background canvas is already `aria-hidden`; the
feedback-nudge dismiss button reads empty only while its container is `opacity:0; aria-hidden`
and gains text the moment it's shown.

Verifier: `a11yverify.cjs` (8/8). Next a11y candidates if the loop revisits: focus-visible rings
audit, tab-order through the plan pager, and an axe-core-style contrast sweep on secondary text.

### Contrast sweep (commit follows)

`contrast2.cjs` measures every visible text node's colour against its real (ancestor-resolved)
background in both themes, skipping anything over a gradient/image so it only reports genuine
solid-on-solid failures. Two clear, non-brand failures found and fixed:

- **Light `--muted` was `#6c7080` → 3.84:1 on `--paper`**, just under WCAG AA 4.5, and it carries
  ~20 secondary-text spots (`.wsub`, `.reclbl`, `.pgtab`, `.drawitem`, `.goalask`, `.of`, …).
  Darkened to `#5f6373` (4.65:1 on paper, 5.6:1 on card). Neutral grey, not the brand accent —
  negligible visual change. Dark `--muted` untouched (already passes on navy).
- **Auth-sheet Privacy/Terms links were unstyled** → default browser blue `#0000ee`, 1.9:1 on the
  dark navy sheet. Given `color:var(--ink)` + underline (the drawer copies already used `--muted`).

### Keyboard focus rings (commit follows)

`focusaudit.cjs` tabs through the app and checks each interactive control for a visible focus
indicator. The app had no global outline reset (good) but relied on the browser's default focus
ring — inconsistent and weak on custom-coloured buttons, and a few controls (`.stychip`,
`.areachip`, `.bookbtn`) showed none. Added one global rule:

```
a:focus-visible,button:focus-visible,[role="button"]:focus-visible,[role="switch"]:focus-visible,
[tabindex]:focus-visible,summary:focus-visible{outline:2px solid var(--teal);outline-offset:2px}
```

`:focus-visible` fires only on keyboard/AT navigation, so the mouse/touch experience is unchanged
(verified: a mouse click on the plan button produces no ring in either theme). `--teal` is
high-contrast in both themes — navy `#173a5c` on cream (9.1:1) and bright blue `#6db1f7` on navy
(6.3–8:1), both well past the 3:1 focus-indicator bar. Ring appearance eyeballed in both themes
(scratchpad ring-dark.png / ring-light.png). Note: the headless Chromium here can't exercise
`:focus-visible` *styling* (it reports `matches(':focus-visible')` true but doesn't paint the
ring), so this rule is verified by construction + screenshot, not by the tab-through audit.

### Escape closes modals (commit follows)

There was no global Escape handler — none of the dialogs/sheets closed on Esc (only the autocomplete
dropdown and inline editors did). Added one document-level `keydown` that closes the top-most open
overlay in priority order: photo lightbox → photo sheet → chat panel → publish modal → compare sheet
→ auth sheet → drawer → how-it-works. Focus safety: if focus sat inside the closed overlay it's
blurred so it never lands on a hidden node; closing the drawer returns focus to the menu button.
The **welcome** gate is deliberately excluded — dismissing it is a real guest-vs-sign-in choice, not
an accidental keystroke. Verifier `esctest.cjs` 7/7 (each overlay closes; welcome stays open; no
errors). Only added behaviour — no existing handler touched.

### Reduced motion (commit follows)

The app already honoured `prefers-reduced-motion` for a handful of animations (compass settle,
itinerary rise/fadeUp, budget flash, page slides, fab hint) but missed the rest — the intro card,
mic-recording pulse, loading skeletons, heart-pop, and **every `transition:`** (drawer/sheet slides,
welcome fade, hovers). Added one global block:

```
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;
                       transition-duration:.001ms!important;scroll-behavior:auto!important}
}
```

Near-instant instead of removed, so end states are preserved (screens still open/close, just without
sliding/pulsing/spinning). Safe because no JS depends on transition/animation-end events (grep clean).
Verifier `rmtest.cjs` 10/10 in both themes: media query seen, durations ~0 on the movers, plan still
renders, drawer opens and Esc-closes, no errors; screenshots rm-dark/light.png look correct.

### Background scroll-lock behind overlays (commit follows)

Ahmed reported: with a popup/tab open (the drawer), scrolling inside it dragged the page behind it.
Only the chat panel locked the background (`body.chatlock{overflow:hidden}`); the drawer, welcome,
publish, auth, compare and lightbox did not. Added one rule that freezes the page whenever any of
them is open:

```
body:has(.drawer.show),body:has(.welcome.show),body:has(.cmpsheet.show),body.lbopen{overflow:hidden}
```

(`.welcome` covers welcome + publish; `.cmpsheet` covers compare + auth; chat already handled.) Plus
`overscroll-behavior:contain` on the scrollable `.drawerpanel` and `.cmppanel` so momentum never
chains to the body. `.intro` is inline content, not an overlay, so it's excluded. `:has()` is already
used elsewhere in the app, so support is fine. Verifier `scrolllock.cjs` 11/11 (each overlay freezes
the body on open and restores scroll on close, both themes); matrix 90/90, qa 0, esctest 7/7.

### Accessibility audit — round 2 (session 2026-08-03)

Fresh a11y sweep on top of round 1 (lang/dir, labelled record/pub controls, contrast, focus rings,
Esc-close, reduced-motion). Two real gaps found & fixed:
- **Toast was `aria-hidden="true"`** — every status message (Saved, errors, Undo, "Trip deleted") was
  invisible to screen readers. Now `role="status" aria-live="polite"`, so all status/undo/error
  messages are announced.
- **✕ delete buttons** — the note/favourite ones were labelled literally "✕" (read as "multiplication
  sign") and the My-trips delete had no label at all. All three now carry a localized "Remove"/"إزالة"
  /"Quitar" aria-label.

Non-issues confirmed: empty-state icons and the search icon are `aria-hidden`; empty-state CTAs and
the Undo button have text labels; the feedback-nudge dismiss reads empty only while its container is
`aria-hidden`/opacity-0 (gains text when shown). Verifier `a11y2.cjs` 6/6 + `a11yverify.cjs` 8/8;
qa 0, dataaudit 771, undotest 10/10, emptytest 15/15, savefail 4/4, authload 5/5.

### Error-state audit (session 2026-08-03)

Swept every async error path. Handling is comprehensive: global offline bar wired to online/offline
events; every fetch has a catch; network/API failures toast "offline" and re-enable their button;
prayer-times failure swaps to a Google-search fallback link (no stuck "Loading…"); the AI chat
distinguishes rate-limit (429 → "busy, wait Ns") from a lost reply (→ "that didn't come through, tap
Try again — everything's still here") with retry chips and a 28s timeout; community fetch failure
shows the cloud-off empty box + Retry; weather/FX/cityphoto degrade silently (progressive
enhancement); invalid input is caught (no city → toast, past date → auto-corrected, days clamped).

One real defect found & fixed: **`saveTrip()` toasted "Saved to My trips" even when the localStorage
write threw** (storage full) — a silent false-success. `saveTripsArr` now returns a boolean, `saveTrip`
propagates it, and the Save action toasts a truthful "Couldn't save — storage may be full" (EN/AR/ES)
instead of a false success. Verifier `savefail.cjs` 4/4 (normal save persists + says so; a throwing
storage shows the failure, never "Saved"). No global window.onerror added on purpose — it risks
masking bugs and firing on benign errors; every expected path is already handled. qa 0, dataaudit 771.

### Loading-state audit (session 2026-08-03)

Inspected every async action. Already well-covered: community feed shows skeletons (yesterday's feed
paints first), publish/photo/sync buttons disable + show a busy label and re-enable on error, the AI
chat shows typing dots with a 28s timeout, prayer times have a "Loading…" line, pager arrows disable
at the ends, FX/weather/cityphoto fill in progressively, plan generation is instant (local data).
The `#promptBox` AI-description path is dead code (not in the live DOM) — ignored.

One real gap: the **auth buttons** (email "Send code", "Verify", Google) fired their network call with
no disable — rapid taps sent duplicate codes/requests and gave no feedback. Fixed: each now guards
`if(t.disabled)return`, disables + shows "…" during the call, and restores on success/error (Google
stays disabled through its redirect, restores only on failure). Verifier `authload.cjs` 5/5 — a
triple-tap fires exactly ONE request, button shows loading, re-enables after. qa 0, dataaudit 771,
emptytest 15/15.

### Empty-state audit + consistent empty states (session 2026-08-03)

Audited every screen that can have no content. Before: friendly text existed in a few places but no
icons, CTAs mostly missing, My-trips had NO empty state (section just hid; nav toasted), and search
hid silently. Built one reusable component — `emptyBox(icon,title,sub,cta)` + `.emptybox` CSS (icon,
bold line, sub, gold CTA) with four stroke icons (bag/globe/cloud-off/search). Applied:
- **No trips (My trips)**: was hidden entirely → now the drawer's "My trips" reveals a bag-icon empty
  box with "Plan a trip" CTA that jumps home and focuses the destination field. (Still hidden on the
  home feed when empty, so first-run home isn't cluttered.)
- **No saved places**: bookmark icon + existing line + "Plan a trip" CTA (add-a-place form still there).
- **No community posts**: globe icon + line + "Plan a trip" CTA.
- **Offline / server error (feed)**: cloud-off icon + line + **"Try again"** CTA (re-opens the feed).
- **No search results**: was a silent hide → now shows the AI-build offer when AI is on (a real CTA),
  or a magnifier "no match — check spelling / try a nearby city" fallback row when AI is off.
- No-notifications: N/A (app has no notifications surface). No-itinerary: the plan form is that state.

New strings EN/AR-Khaleeji/ES: planCta, retry, noTripsSub, noMatch. Verifier `emptytest.cjs` 15/15
(each state shows icon+title+CTA in both languages; My-trips CTA focuses the field; offline shows
Retry; search shows AI-offer on / no-match fallback off). matrix 90/90, qa 0, dataaudit 771,
undotest 10/10, esctest 7/7. Screenshots eb-community-dark/light.png.

### Destructive-action audit + Undo toasts (session 2026-08-03)

Swept every destructive action (delete/remove/clear/reset/start-over/discard/sign-out/logout) and
asked per action: data loss? confirm? undoable? Result — the four heavyweight/irreversible ones
already confirm (account delete, community-trip removal, AI-build delete, record "Start over"). Three
LOCAL, frequent, reversible deletes had NO guard at all: **delete saved trip (My trips)**, **remove
favourite place**, **delete a trip note** — each one ✕-tap = silent data loss.

Rather than nag with confirms on frequent actions, added a reusable **Undo toast** (`undoToast(msg,
undoFn)`): the delete runs, then a 6-second toast offers "Undo" that restores the exact item. Wired
to all three. There was NO undo anywhere in the app before this. Sign-out/remove-name lose nothing
recoverable (local trips persist; name retypeable) so left as-is.

Strings added (EN/AR-Khaleeji/ES): undo, delTrip, delPlace, delNote. Verifiers: `undotest.cjs` 10/10
(trip + favourite delete→undo restores, both languages) and `notesundo.cjs` 4/4 (note delete→undo
restores the exact line). qa 0, dataaudit 771, esctest 7/7, haptictest 11/11.

### Haptics — DONE (Ahmed asked for it, Android-only)

Added a `haptic(ms)` helper (feature-detected `navigator.vibrate`; silent no-op on iOS Safari, which
has no Web Vibration API) and fired it at exactly the six moments Ahmed specified — never on ordinary
taps: trip created (planBtn, only when a plan actually renders), trip saved, favourite ADDED (not on
remove), delete confirmed (all four confirm sites: my-trip/AI-build, account, community, record-clear),
day changed via swipe (only when the page index actually changes), and share (trip share, WhatsApp,
share-this-day). Verifier `haptictest.cjs` 11/11 — stubs `navigator.vibrate`, confirms each event
buzzes and that empty-destination plan, tapping a place name, favourite-remove, and opening the drawer
do NOT. The swipe buzz is verified at source level (the gesture can't be driven by synthetic/CDP touch
headless; it's a shipped feature needing a real finger). qa 0, dataaudit 771, esctest 7/7.

### Premium-feel audit (session 2026-08-03)

Checked the app against a 9-point "premium touches" list. Result: 6/9 already solid —
smooth transitions (52), swipe between day pages, full form auto-save (`saveState`), ~30 remembered
preferences, friendly microcopy ("Welcome, X" / "Signed in as…"), smooth scrolling + overscroll
containment. Gaps and what was done:

- **Destructive confirm** — delete-trip and remove-from-community already confirm, but the record
  **"Start over"** button wiped every visited country with NO confirmation (data loss). Fixed:
  added `clearSure` (EN/AR-Khaleeji/ES) and guarded the handler. Verifier `clearconfirm.cjs` 3/3
  (dismiss keeps the record, accept clears it).
- **Stale microcopy** — the About text said "735 destinations"; now 771 (EN/AR/ES).
- **Haptics** (`navigator.vibrate`) — absent. NOTE: the Web Vibration API does not fire on iOS
  Safari at all, so it would only add feedback on Android; left for Ahmed to decide.
- **Pull-to-refresh** — absent, and deliberately: browser PTR is globally disabled to protect an
  in-progress form. The community feed already reloads on open. Left for Ahmed to decide.

### Gold-text contrast — DONE (Ahmed approved, commit follows)

Ahmed reviewed the before/after screenshots and approved. Added a dedicated `--amber-ink` token and
pointed every `color:var(--amber)` (60 occurrences) at it; fills/borders/underlines keep `--amber`.
- light `--amber-ink:#7f5c10` — 4.76:1 on cream (was `#ac7f22` at 2.82:1, below AA)
- dark `--amber-ink:#ddb45f` — identical to dark `--amber`, so dark-theme gold text is unchanged
  (it already passed on navy)

So gold *text* on light backgrounds now meets AA while every gold *fill* (plan button, active pills,
compass, record toggle) stays pixel-identical, and dark theme is untouched. Verified: contrast2.cjs
shows zero remaining `#ac7f22`-on-cream failures (only the known active-pill false positives remain);
matrix 90/90; qa 0; dataaudit 771.
