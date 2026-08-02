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
