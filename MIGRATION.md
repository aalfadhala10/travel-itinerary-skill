# Moving Bosla from GitHub Pages to Cloudflare Pages

Plan only. Nothing here has been done.

The move is worth making — it fixes the stale-build problem at its source and unlocks the security
headers GitHub Pages cannot send. But it changes the origin, and **an origin change is not free**:
read §1 before anything else.

---

## 1. The one that actually matters: existing testers lose everything

`localStorage` is scoped to an origin. Everything Bosla keeps about a traveller — **40 keys**:
saved trips, the travel record, packing ticks, notes, points, credits, the sign-in token, and the
delete keys for trips they have published — lives on `aalfadhala10.github.io`.

Serve the app from `bosla.pages.dev` and every one of those people opens an empty app. Their trips
are not deleted; they are simply on an origin the new app cannot read. Worst case: a guest who
published a trip loses the key that lets them delete it, permanently, because that key is in
`bosla_pub_mine` on the old origin.

There is no clever fix. Pick one deliberately:

- **(a) Move now, tell people.** Fine while testers are a handful of friends you can message. Do it
  before the closed beta, not during.
- **(b) Keep GitHub Pages alive** as a redirect to the new origin, and accept that returning users
  arrive empty-handed. Same outcome, less confusion about which URL is real.
- **(c) Build an export/import** before moving — a "carry my trips over" link that packs
  localStorage into a URL fragment the new origin unpacks. Real work, but the only option that
  actually preserves anything. The share-link machinery (`tripPayload()`) is most of it already.

Signed-in travellers are unaffected — their data is in KV under `sync:<uid>` and follows them.

---

## 2. What is being moved

| | |
| --- | --- |
| today | GitHub Pages, `main` branch, repo root, `.nojekyll`, no `CNAME` |
| URL | `https://aalfadhala10.github.io/travel-itinerary-skill/` — a **sub-path** |
| after | `https://<project>.pages.dev/` — the **root** |
| build | none. 69 files, 13MB, `index.html` is 3.0MB (Pages allows 25MB/file, 20,000 files) |
| routing | none needed. One HTML file; state lives in the hash and query (`#trip`, `?t=`, `#pub=`) |
| env vars | none. `CONFIG` is inline; there is no build to inject anything into |

**Internal links are all relative** (`privacy.html`, `terms.html`, `manifest.webmanifest`,
`favicon.svg`, `apple-touch-icon.png`) — they survive the sub-path → root move untouched. Only five
hardcoded absolute URLs need changing (§6).

---

## 3. Cloudflare Pages settings

Connect the GitHub repo, then:

| setting | value |
| --- | --- |
| Production branch | `main` |
| Framework preset | **None** |
| Build command | *(leave empty)* |
| Build output directory | `/` |
| Root directory | `/` |
| Node version | not applicable |

**Do NOT add a SPA fallback** (`/* /index.html 200`). Bosla has no client-side router;
`privacy.html`, `terms.html` and `demo/globe.html` are real files and must stay real.

### `_headers` — the point of the whole exercise

A new file at the repo root. This is what GitHub Pages could never do, and it closes the two
security items still open from the audit:

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Content-Security-Policy: frame-ancestors 'none'

/sw.js
  Cache-Control: no-cache
```

Keep the `<meta>` CSP in `index.html` as well — it is not redundant, it is the one that survives if
a header is ever misconfigured. Once `frame-ancestors` is a real header you *may* drop the
framebuster script, but there is no reason to.

### What Cloudflare does about the staleness problem

Pages serves HTML with `Cache-Control: public, max-age=0, must-revalidate` and immutable caching
only for fingerprinted assets. Combined with the service worker's existing `cache: 'no-cache'`,
**a plain reload gets the new build.** No `?v=`, no purge, no waiting ten minutes.

Keep bumping the drawer stamp and the `sw.js` `CACHE` anyway — they are how you tell over the phone
which build somebody is on, and `preflight.cjs` enforces them.

---

## 4. Service worker

Compatible, with one thing to watch.

The scope moves from `/travel-itinerary-skill/` to `/`. `register('sw.js')` is relative, so scope
follows automatically and `'./'`-relative cache keys still resolve. Nothing in `sw.js` hardcodes the
old path.

**Watch this:** `isDoc` is `url.pathname.endsWith('/') || url.pathname.endsWith('index.html')`, and
whatever matches gets written into the cache **under `./index.html`**. At root scope, *any*
directory URL matches — so if `/demo/` ever gains an `index.html`, navigating to it would overwrite
the cached app with the demo page. This is the same class of bug the comment in `sw.js` says was
already fixed once for `mode === 'navigate'`. It is latent today (there is no `demo/index.html`) and
the move does not create it, but root scope makes it easier to trip. Tighten `isDoc` to match only
the scope root when convenient — not part of this migration.

Existing service workers on `github.io` keep running against `github.io`. They are a separate
origin's problem and will simply stop being used.

---

## 5. Worker API — three things break if you skip them

**5a. CORS.** `ALLOWED_ORIGINS` in `ai/worker.js` is an exact-match list:

```js
const ALLOWED_ORIGINS = [
  "https://aalfadhala10.github.io",
  "http://localhost",
  "http://127.0.0.1",
];
```

Add `https://<project>.pages.dev`. Keep the GitHub entry until you have retired that URL.

**Preview deployments will be blocked.** Every Pages preview gets its own hostname
(`https://<hash>.<project>.pages.dev`), and `originOk()` matches exactly or on `origin + ":"`. No
preview will ever be allowed. Either accept that previews cannot reach the API, or add a narrowly
anchored suffix check for `.<project>.pages.dev` — a deliberate widening, not an accident, and one
to think about rather than paste in.

**5b. OAuth redirect.** `appUrl(env)` defaults to the old URL and is used for the Google sign-in
round trip. Set the `APP_URL` secret to the new origin, and add the new redirect URI in the Google
Cloud console. Miss either and "continue with Google" breaks.

**5c. Nothing else.** The Worker URL itself does not change, the CSP `connect-src` already names it,
and `'self'` covers the new origin.

---

## 6. Five hardcoded URLs in the app

| where | what |
| --- | --- |
| `index.html:45` | `og:url` |
| `index.html:48` | `og:image` |
| `index.html:54` | `twitter:image` |
| `index.html:4909` | the link in shared plan text |
| `index.html:7135` | the link in a shared travel record |

Wrong `og:*` means WhatsApp and X keep showing the old preview; wrong share links mean every trip
someone shares points at the old origin.

---

## 7. Migration steps, in order

1. **Decide §1** — the data question. Everything else is mechanical; this one is not.
2. Create the Pages project against the repo. Settings as §3. Deploy to `<project>.pages.dev`.
3. Test the preview thoroughly (§9) **before** touching anything else. Nothing is live yet — GitHub
   Pages is still serving real users.
4. Add `_headers`. Redeploy. Confirm the headers arrive (§9).
5. Update `ALLOWED_ORIGINS`, paste the Worker, verify with the `{action:'list'}` console check.
6. Set `APP_URL`; add the Google redirect URI.
7. Update the five URLs in §6. Deploy.
8. Run the full suite battery and `preflight.cjs` against the Pages URL.
9. Point testers at the new URL. Leave GitHub Pages up, untouched, as a fallback.
10. Only once it is genuinely stable: add the custom domain (§8), then make GitHub Pages redirect.

Do not delete the GitHub Pages deployment. It costs nothing and it is your rollback.

---

## 8. Custom domain — DNS, later

Do this **after** the Pages URL is proven, not during the move.

1. Buy the domain. Add it in Cloudflare Pages → Custom domains.
2. If the domain is on Cloudflare DNS, it adds the record itself. If it is registered elsewhere,
   either move the nameservers to Cloudflare, or add a `CNAME` for the apex/`www` pointing at
   `<project>.pages.dev` (apex needs a registrar that supports ALIAS/ANAME/CNAME-flattening).
3. Wait for the certificate. Cloudflare issues it automatically; it takes minutes, not hours.
4. **Then repeat §5a, §5b and §6 for the new domain** — `ALLOWED_ORIGINS`, `APP_URL`, the Google
   redirect URI, and the five hardcoded URLs. This is the step everyone forgets, and the failure is
   silent: the app loads and the API quietly refuses it.
5. Decide the canonical host. Serving on both the apex and `www` splits localStorage across two
   origins — the §1 problem again, self-inflicted. Redirect one to the other and never link both.

---

## 9. What to test after migrating

**Does it serve at all**
- [ ] the app loads at the Pages URL, no console errors
- [ ] `privacy.html`, `terms.html`, `demo/globe.html` all resolve
- [ ] `favicon.svg`, the icons and `manifest.webmanifest` load

**The thing this migration is for**
- [ ] deploy a stamp change, then **plain reload** — the new stamp appears with no `?v=`, no
      incognito, no cache clearing
- [ ] `curl -sI <url> | grep -i 'cache-control\|age'` — HTML must be `max-age=0, must-revalidate`
- [ ] `curl -sI <url> | grep -i 'strict-transport\|x-frame\|content-security'` — headers present

**PWA**
- [ ] Application → Service Workers: registered, scope is `/`, "activated and running"
- [ ] Application → Cache Storage: `bosla-vNN` holds the app shell and nothing else
- [ ] install to the home screen on a real iPhone **and** a real Android
- [ ] turn wifi off and open the installed app — a saved plan still works

**API**
- [ ] plan a city that does not exist in the data (forces a Worker call) — it builds
- [ ] the chat answers
- [ ] the community feed loads
- [ ] publish a trip, then delete it
- [ ] sign in with Google, then with an email code — both round trips return to the **new** origin
- [ ] `{action:'list'}` with no key still answers `403`

**Sharing**
- [ ] share a plan; the link in the text points at the new origin and opens the same trip
- [ ] paste the URL into WhatsApp — the preview image and title are right

**Regression**
- [ ] `tools/preflight.cjs` passes
- [ ] `qa.cjs`, `matrix.cjs`, `reliab.cjs`, `csptest.cjs`, `swcache.cjs` pointed at the Pages URL

---

## 10. Rollback

Tell testers the old URL again. GitHub Pages is still serving `main` and is unaffected by anything
above — the only irreversible step is DNS, which is why §8 comes last and separately.
