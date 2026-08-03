# Releasing Bosla

Three things ship independently and drift apart if you let them: the app (GitHub Pages, from
`main`), the Worker (Cloudflare, pasted by hand), and the analytics script (Apps Script, pasted by
hand). Two of the three have no deploy pipeline, so the discipline lives here rather than in a
tool.

## Shipping the app

```
NODE_PATH=/opt/node22/lib/node_modules node tools/preflight.cjs   # must pass
git checkout main && git merge <branch> && git push origin main && git checkout <branch>
```

`preflight.cjs` refuses the four mistakes that have actually happened here: a page that throws on
load, city tables out of alignment, and the two manual bumps below being forgotten.

**Both bumps, every time.** The drawer stamp (`id="drawerVer"`) is how you tell over a phone
call whether a tester is on the new build. The `CACHE` in `sw.js` is how their device knows to
throw away the old icons. Neither is automatic.

**Hand over the full link with a fresh `?v=<commit>`.** iOS Safari hides the path in its URL bar,
so a bare "it's live" gets a cached copy tested instead of your fix.

GitHub Pages takes ~1 minute. Its own HTTP cache holds `index.html` for a few minutes, which the
service worker already defeats with `cache: 'no-cache'` — but **`sw.js` itself is fetched through
that same cache**, so a brand-new service worker can be up to ~10 minutes late. Nothing is broken;
it just isn't instant. Don't chase it.

## Shipping the Worker

There is no pipeline. Cloudflare dashboard → paste the whole of `ai/worker.js` → **Deploy**.

- **Saving is not deploying.** This has cost us two rounds already.
- Verify from a browser console on the live app — never trust the paste:
  ```js
  fetch('https://shy-fire-8a78.ahmed-alfadala.workers.dev',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'list'})})
    .then(r=>r.json().then(d=>console.log(r.status,d)))
  ```
  `403 {error:"not allowed"}` is correct. `200 {cities:[…]}` means the old code is still live.
- **Rollback:** Cloudflare keeps previous versions — Workers → the worker → Deployments → roll
  back. That is the fastest recovery you have anywhere in this stack; it is instant and needs no
  git.
- Because the source is pasted, the repo and the live Worker *can* drift. When in doubt, paste
  again — it is idempotent.

### Secrets (Cloudflare → Settings → Variables → **Encrypt**)

| name | what happens without it |
| --- | --- |
| `ANTHROPIC_API_KEY` | no city building, no chat |
| `ADMIN_KEY` | admin routes refuse everyone — safe, and the default |
| `IP_SALT` | rate-limit keys hash with a fixed string instead of a secret one |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no "continue with Google" |
| `RESEND_KEY` / `MAIL_FROM` | no email sign-in codes |

Every one of these is optional except the first: the Worker checks and turns that feature off
rather than failing. Nothing here belongs in the repo.

## Shipping the analytics script

Sheet → **Extensions → Apps Script** → paste `analytics/Code.gs` → set `DASH_KEY` → **Save**, then
**Deploy → Manage deployments → pencil → Version: New version → Deploy**.

**Never "New deployment"** — it mints a new URL and the app keeps posting to the old one.
`DASH_KEY` is a top-level statement, so a typo there breaks `doPost` too and analytics stop
recording entirely, not just the dashboard.

## Emergency rollback

| what broke | fastest fix |
| --- | --- |
| the Worker | Cloudflare → Deployments → roll back. Seconds. |
| the app | `git revert <sha> && git push origin main`, then bump both stamps and push again. ~1 min to Pages, up to ~10 min for every device's service worker. |
| the analytics script | Apps Script → Deploy → Manage deployments → pick an earlier version. |

There is no way to reach a device that has already cached a bad build faster than its next launch.
That is the cost of the offline-first design and it is worth it — but it means **the app is the
slowest of the three to un-break**, so test it hardest.

## Beta launch checklist

**Before you invite anyone**

- [ ] `tools/preflight.cjs` passes on `main`
- [ ] Worker verified live with the console check above (`403`, not `200`)
- [ ] `ADMIN_KEY` and `IP_SALT` set as encrypted Cloudflare secrets
- [ ] `…/exec` answers "Not found."; `…/exec?k=<key>` shows the dashboard
- [ ] GitHub → Settings → Pages → **Enforce HTTPS** is ticked
- [ ] Install the PWA on a real iPhone and a real Android, then turn off wifi and open it
- [ ] `privacy.html` and `terms.html` reachable from the drawer, with a working contact address

**Know before it happens**

- [ ] Cloudflare Workers free tier: 100k requests/day. The daily LLM and Places caps
      (`DAY_LLM_CAP`, `DAY_PLACES_CAP` in `worker.js`) are the ones that bound the *bill*.
- [ ] KV holds published trips, accounts and synced records, and **has no backup**. Before any
      bulk KV operation, dump what you care about first.
- [ ] Nothing alerts you if the Worker starts failing. The app degrades quietly by design, so
      check the analytics dashboard's `replies that failed` every few days during beta.

**Custom domain, when you want one**

Not just DNS — four things move together: a `CNAME` file in the repo, the DNS record, then
`ALLOWED_ORIGINS` in `worker.js` and `connect-src` in the app's CSP. Miss either of the last two
and the app silently stops reaching its own backend.
