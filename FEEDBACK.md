# Bosla · بوصلة — Friend Feedback Log

Every piece of feedback a real person gives about the app, what it exposed, and
what we changed because of it. Friends are numbered in the order their feedback
arrived (Friend 1 = the first one). New feedback goes in as **Friend 4**, and so
on — existing numbers never move.

Mirror of this file lives in the Google Drive "Bosla App" folder.
Last updated: 2026-07-28.

Status key: **Done** = shipped and live · **Partly done** = interim fix shipped,
real fix still open · **Open** = on the roadmap, not built yet.

---

## Friend 1 — Baku

**What they said**
- Planned 5 days in Baku. The whole 5-day schedule was stuff you could cover in
  one day — the plan looked padded and thin.
- Azerbaijan had only one city in the app (Baku), so there was nowhere to go
  next.

**What it exposed**
- Thin cities made the app look useless to anyone who actually knows the place.
- No country should ship with a single city.

**What we changed**
- Added more real cities and POIs per country (rule since then: never a
  one-city country).
- Deeper per-day content so a 5-day plan doesn't repeat itself.
- Added `miss` tracking + a "Missing places" table on the dashboard, and later
  real-time AI city generation, so a city we don't have gets built on the spot
  and cached forever.

**Status:** Done.

---

## Friend 2 — Extreme adventure, Philippine passport

**What they said (their exact input)**
> "I want to have an extreme adventure but I don't know which country suits for
> Philippine passport. Bungee jumping, scuba diving, wake boarding, anything
> with adrenaline."

The app answered with a fixed, geographically illogical multi-city trip.

**What it exposed**
- **No Adventure vibe.** The tag set was Culture / Food / Nature / Shopping /
  Relax, so "adrenaline" collapsed into "Nature".
- **A question got answered with an itinerary.** They were *asking* which
  country fits their passport; the app forced one rigid trip instead of
  recommending options.
- **Illogical routing** — cities strung together that don't belong on one trip.

**What we changed**
- Added a real **Adventure** vibe (bungee, diving, watersports, etc.) and
  surfaced those activities in the plan.
- Route logic fixed so multi-city trips are geographically sensible.
- The AI parser now honours passport hints in free text.
- The chat bot now **recommends** instead of dictating.

**Still open**
- A proper **visa-friendly-for-my-passport** feature in the manual planner:
  pick your passport, get only visa-free / visa-on-arrival destinations.

**Status:** Partly done (visa filter still Open).

---

## Friend 3 — Thailand (Phuket + Bangkok, 12 days)

**What they said**
- Planning all of Thailand worked well, but asking for **only Phuket + Bangkok
  over 12 days** forced an even 6/6 split. They wanted **8 Phuket / 4 Bangkok**
  — the app imposed its own split.
- **Food repeats.** Suggestions were all Asian; swapping for something else just
  cycled the same Asian places instead of offering alternatives.
- **Likes:** the day-by-day scheduling layout, and the Google Maps links.
- **Wants:** photos of the suggested places when you hover the name.

**What it exposed**
- We were deciding for the user instead of letting them decide.
- Food data is shallow (~5 local-cuisine spots per city) with no international
  options.

**What we changed**
- **Free per-city day split** — a nights editor on the plan: +/- nights per
  city, any split you want, total days follow. If a split is genuinely
  unreasonable (8+ nights in one city, or a 25+ day trip) we show a *note*, not
  a block. Plus a **delete** button to drop a city from the route entirely.
- **Photos of places** — hover a place name on desktop for a Wikipedia
  thumbnail; on phones a small photo button opens the same image inline. Free,
  fetched only on hover, cached 30 days, silent when there's no match.
- **Food escape hatch** — the food swap now also links out to a Google Maps
  "restaurants in <city>" search.

**Still open**
- **Richer / non-local food data**: a few international options per city
  (Italian / grill / vegetarian / etc.), likely AI-generated and cached, so a
  long stay doesn't repeat and non-local cuisine is a real choice.

**Status:** Partly done (food depth still Open).

---

## Early reactions (before the numbered feedback)

Two friends who tried the very first version:

- "Nice, wow — try to improve."
- "Too crowded for a phone website."

**What we changed:** the whole page was rebuilt mobile-first around a minimal
form (Where to? + days + Plan) with everything else folded under "More options";
the free-text description box was later folded into the chat bot too, and the
duplicate hotel-amenities row was removed. Crowding is now the standing rule we
check every change against.

**Status:** Done, and ongoing.

---

## How to add the next one

1. Add a `## Friend N — <place or topic>` section at the end of the numbered
   list (never renumber).
2. Fill in: **What they said** (their words where possible) · **What it
   exposed** · **What we changed** · **Still open** · **Status**.
3. Anything left open also goes into `ROADMAP.md` so it doesn't get lost.
4. Update the "Last updated" date at the top.
