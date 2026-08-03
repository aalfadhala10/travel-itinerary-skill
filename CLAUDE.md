# بوصلة · Bosla

A trilingual (EN / AR-RTL / ES) mobile-first travel planner. No build step, no framework,
no account — everything is saved on the traveller's own device.

## Two separate things live here

**The app** — what people actually use, at `/travel-itinerary-skill/`:

| file                 | what it is                                            |
| -------------------- | ----------------------------------------------------- |
| `index.html`         | the whole app, one file                               |
| `sw.js`              | service worker; only ever caches the app's own files  |
| `ai/worker.js`       | Cloudflare Worker — paste by hand, not deployed here  |
| `analytics/Code.gs`  | Apps Script — paste by hand, not deployed here        |

**The demo** — everything in `demo/`, and nothing else. A separate page at
`/travel-itinerary-skill/demo/globe.html` for trying ideas before they go anywhere near the
app. The app does not reference it and the two share no code.

Work in one or the other. If a request could mean either, ask first — a rule that is cosmetic
in the demo may change real plans in the app.

## How `index.html` is laid out

One file, no bundler, ~534 functions in one scope. There are no imports to follow, so the shape
below is the map. Sections run in this order and are marked with `// ---` banners:

| region                  | what lives there                                                     |
| ----------------------- | -------------------------------------------------------------------- |
| `CONFIG`                | affiliate markers, endpoint URLs, paywall switches — public by nature |
| `I18N`                  | every string, three languages, some as functions (so **not** JSON)    |
| data tables             | `DEST`, `CO`, `POI_CO`, `HOTELS_X`, `CUR` — 771 cities, ~45% of file  |
| AI + chat               | worker calls, the trip assistant, city-building on demand             |
| planning engine         | `plan()` / `planRoute()` → day building, ordering, budget             |
| render                  | itinerary pages, pager, maps, weather, prayer, packing               |
| screens                 | record, community, favourites, builder, account                       |
| storage + boot          | ~41 localStorage keys, service-worker registration, deep links        |

Two invariants worth knowing before editing:

- **The five city tables are positional siblings.** A city must exist in all of `DEST`, `CO`,
  `POI_CO`, `HOTELS_X` and `CUR` or plans break in ways no test name will explain. `qa.cjs`
  asserts the counts match; add cities with a generator that writes all five, never by hand.
- **`DEST` and `I18N` are not pure JSON.** `DEST` calls the `S()` helper for `summer`, `I18N`
  holds functions. The other big tables are `JSON.parse('…')` because V8 parses that ~2x faster
  than an object literal — if you add a table, keep that shape.

## The Worker's KV namespaces

`ai/worker.js` keeps everything in one KV binding (`CITIES`), separated only by key prefix. This
contract is load-bearing — `isCityKey()` decides what an admin dump may return by asking whether
the key contains `":"`:

| key                      | holds                                             |
| ------------------------ | ------------------------------------------------- |
| `<cityname>`             | a generated city — **the only keys with no colon** |
| `sess:<token>`           | a session; the key name *is* the token            |
| `u:` / `uemail:`         | account records and the email→id lookup           |
| `acode:` / `astate:`     | live sign-in codes, OAuth state                   |
| `sync:<uid>`             | a signed-in traveller's trips                     |
| `pub:` / `pubidx`        | a published trip (carries its delete key) / the feed |
| `publike:` `pubrep:` `pubsig:` `pubrl:` `rl:` | dedupe and rate-limit counters, keyed by hashed IP |

**Never widen a listing to keys containing a colon.** Cities are safe to hand out; nothing else is.

### The one thing that will not scale

`pubidx` is a **single KV key holding the whole community feed**, rewritten by `pubTouch()` on
every publish, like, comment, photo and report — nine call sites. Cloudflare KV allows roughly
**one write per second per key**, and read-modify-write on a shared key loses concurrent updates.
At a few hundred active publishers this is fine; at scale likes alone will exceed the write limit
and silently drop. Fixing it means moving the feed off a single key — per-trip counters with a
periodically-rebuilt index, or a Durable Object / D1 for atomic increments. Do that before
promoting the community layer, not after.

## Both themes, every time

The page follows the phone's light/dark setting and also has its own toggle, so a change that
looks right in one and wrong in the other is not finished. Screenshot both before saying so.

The demo suites take a `THEME` environment variable for exactly this:

```
cd demo && python3 -m http.server 8899 &          # the globe fetches world-50m.json over HTTP
THEME=dark  node demo-test.cjs                    # and again with THEME=light
```

Things that have bitten before: a glow that carries a line on a dark ocean washes it out on a
pale one; teal-on-cream is much weaker than teal-on-navy; `--land` must never be the same tone
as the card behind it or the continents vanish.

## House rules

- **As simple as possible.** No dependency gets added without a reason that survives being said
  out loud.
- **No emojis** anywhere in the interface, except country flags.
- **Israel appears nowhere** — no destinations, no airport rows, no place or building names
  containing it, in the app AND the demo. On the demo map its land is drawn as Palestine.
  **Palestine is always included as a country** (it counts in the travel record, with its flag).
  The only permitted mentions are in dev tooling that enforces this rule (tests and build
  comments).
- Arabic is **Khaleeji**, not Modern Standard.
- **Never scrape or republish** copyrighted text, photos or reviews. Link out instead.
  The one sanctioned photo path: the Worker's `cityphoto` pipeline — Wikipedia's lead image for
  the exact city, accepted only when Commons says the licence is open (PD/CC0/CC BY/CC BY-SA),
  cached in KV with author + licence + source, and always displayed with its attribution chip.
- The Anthropic API key lives **only** as an encrypted Cloudflare secret (`env.ANTHROPIC_API_KEY`).
  It must never appear in the app, the repo, or a screenshot.
- The welcome screen promises *"Saved on this device only — no account, no email."* Nothing may
  be sent anywhere that would make that untrue.
- Keep AI cost down: cache in KV, prefer the cheaper model where the task allows it.

## Community (traveller-shared trips)

The app has a community layer — publish a trip, browse others', like, comment, add photos, "use
this plan" — served by the same Worker (`pub_*` actions, stored in the CITIES KV, no new
bindings). It exists WITHOUT breaking the privacy promise: nothing is sent until the traveller
presses Publish, and the modal says plainly that publishing is public. No accounts; a first name
is whatever they typed. Contributions earn points (`bosla_pts`); every 50 points auto-grants one
trip credit — the same credits the paywall sells, so points become the discount ladder.

Moderation is self-serve: worker strips `<>`, caps every size and per-address daily count, and
three reports hide a trip. Photos are canvas-compressed client-side to ≤~160KB JPEG before upload.

## Deploying

GitHub Pages serves `main`. Develop on the feature branch, then merge:

```
git checkout main && git merge <branch> && git push origin main && git checkout <branch>
```

iOS Safari hides the path in its URL bar, so always hand over the **full** link with a fresh
`?v=<commit>` on it — otherwise a cached copy gets tested instead of the new one.
