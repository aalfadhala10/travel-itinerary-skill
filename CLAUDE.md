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
- **Israel is excluded** — from destinations, and from the demo's airport table.
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
