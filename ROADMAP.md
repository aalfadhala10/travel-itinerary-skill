# Bosla · بوصلة — Roadmap & To-Do

Living to-do list / playbook. (Mirror into the Google Drive "Bosla App"
Playbook when the Drive connector is enabled for the chat.)

Last updated: 2026-07-27.

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
- [ ] **Handy-apps Batch 2** (Europe + popular Asia/Americas) — awaiting go-ahead.
- [ ] **Affiliate wiring** once IDs are in hand (Booking.com, GetYourGuide/Klook).
- [ ] **Mirror this roadmap to the Google Drive "Bosla App" Playbook** (needs the
  Drive connector enabled in-chat).
- [ ] Keep an eye on first real analytics/feedback rows and the country breakdown.

## Done (recent)

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
