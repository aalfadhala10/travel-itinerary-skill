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

- [ ] **Auto-add missing cities.** When a user asks for a city/country we don't
  have, it's already logged as a `miss`. Goal: automatically generate that city
  (blurb EN/AR/ES, POIs + coords, hotels, food, cost, currency), QA it, deploy,
  and notify Ahmed — no approval needed. See "How auto-add would work" below.

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

## How auto-add would work (design note)

The generate → validate → deploy half is fully doable by Claude (proven with the
3 Alpine towns): generate the city object, run the QA harness + alignment check,
inject additively, commit & push to both branches, notify Ahmed with what changed.

The trigger + data-read half has one real constraint in this environment: the
sandbox network blocks Google's servers, and connectors may be absent in
scheduled/headless runs — so an unattended job can't reliably read the Google
Sheet on its own. Practical options:

1. **Semi-auto (reliable today):** Ahmed pastes the "Missing places" list (or
   just says "add them"); Claude auto-generates, QAs, deploys them all, and
   reports — zero data work for Ahmed.
2. **Scheduled reminder Routine:** a weekly nudge to surface the miss list, then
   option 1 runs.
3. **Fully autonomous:** feasible only if the miss list is readable from a
   sandbox-reachable place (e.g. mirrored to the GitHub repo, which IS reachable)
   or the Drive connector proves available in scheduled runs. Worth a spike.
