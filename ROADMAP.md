# Bosla · بوصلة — Roadmap & To-Do

Living to-do list. (Mirrored into the Google Drive "Bosla App" Playbook when the
Drive connector is connected.)

## In progress / decided

- [ ] **AI voice/description understanding (optional upgrade).** Keep the free
  local rule-based parser as the default; add an optional "understand anything"
  path for the voice/description box that sends the text to Claude and gets back
  a clean structured trip (handles any phrasing, mixed AR/EN, vague places like
  "the Amalfi coast"). Needs: an Anthropic API key + a free Cloudflare Worker to
  hold the key (can't expose it in the static page). Small per-request cost,
  online-only. Claude to write the Worker + wiring; Ahmed to create the key +
  Cloudflare account.

- [ ] **Real-time auto-generate missing cities (the big one).** Batch-adding
  later is pointless — the user who searched has already left. The goal is
  IN-SESSION: the instant a search/description hits a city we don't have, build
  it on the spot (Claude via a Cloudflare Worker), inject it into the running
  page, and render that user's trip in ~2-4s. Separately persist the generated
  city so Ahmed can verify it and bake it in permanently for everyone. Needs the
  same Worker + Anthropic key as the AI parser. See design note below.

## Backlog

- [ ] Redeploy the analytics Apps Script (New version) so the "Missing places"
  dashboard section appears. (Raw miss data already flows to the Events tab.)
- [ ] City batches (rich data, no country left thin): A Alps/ski · B Europe
  scenic/secondary · C beach & island resorts · D nature/adventure bases ·
  E Gulf/MENA secondary · F Asia secondary. Then long-tail from real `miss` data.
- [ ] Handy-apps Batch 2 (Europe + popular Asia/Americas) — awaiting go-ahead.
- [ ] Affiliate wiring once IDs are in hand (Booking.com, GetYourGuide/Klook).
- [ ] Feedback + analytics: confirmed live; keep an eye on first real rows.

## Done (recent)

- [x] Privacy-friendly analytics + in-app feedback → Google Sheet (live).
- [x] `miss` tracking: log places asked for but not in our data.
- [x] Description parser fixes: multi-city order, night-summing, misspellings,
  country-word flood.
- [x] Added Garmisch-Partenkirchen, Kaprun, Zell am See.
- [x] Fixed clipped Adults/Kids stepper numbers.

## How real-time auto-generate would work (design note)

Flow when a user searches a city we don't have:
1. App detects the miss (already built) → shows "Building <city> for you…".
2. App POSTs the name to a Cloudflare Worker (holds the Anthropic key as a secret).
3. Worker calls Claude → returns a validated city object (blurb EN/AR/ES, POIs +
   coords, hotels, food, cost, currency) in our exact schema.
4. App injects it into the in-memory DEST/CO/POI_CO/HOTELS_X and renders the
   trip immediately — that same user is served, no "come back later".
5. Worker also stores the generated city (KV or a GitHub commit) so Claude can
   verify it and bake it permanently into index.html for all users.

Requirements: a free Cloudflare account + an Anthropic API key (Ahmed). Claude
writes the Worker + wiring. Small per-request cost.

Guardrails against the risks of unreviewed generation:
- Structural validation (coords in range, all required fields, tags from the
  allowed set) before the city is shown; reject + fall back if malformed.
- Only generate for plausible place names; cache by name; rate-limit per session
  to control cost and block spam/abuse of the API.
- Flag AI-generated cities for Ahmed's quick review before they're made permanent
  (they still serve the live user instantly in the meantime).
