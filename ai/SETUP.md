# Bosla AI — real-time city generation + voice understanding

This turns on two things:
- **Auto-add missing cities**: when someone searches a place we don't have, the app builds it live (~2-4s) and shows their trip — then it's cached for everyone.
- **Smarter voice/description**: understands any phrasing, mixed Arabic/English, vague places.

Both are powered by Claude through a tiny **Cloudflare Worker** (free). The Worker holds
your Anthropic API key secretly — the website never sees it, which is the whole reason
we need it (a static site can't hold a secret safely).

**What it costs:** ~$0 for cities you already have; under ~2¢ the first time a brand-new
city is built (then free forever); ~0.2¢ per AI-parsed description. Put a spend cap on the
key and you can't be surprised.

You'll do this once. It takes about 15 minutes.

---

## Part A — Get an Anthropic API key (5 min)

1. Go to <https://console.anthropic.com> and sign in (same as Claude, or make an account).
2. Add a little credit: **Settings → Billing** → add $5–10. (Plenty — see cost note above.)
3. Set a safety cap: **Settings → Limits** → set a **monthly spend limit** (e.g. $10). This
   is your guarantee against any surprise bill.
4. **Settings → API Keys → Create Key**. Name it `bosla`. **Copy it now** (starts with
   `sk-ant-...`) — you won't see it again. Keep it somewhere private for a minute.

> Never paste this key into the website, a chat, or the Worker code. It goes in **one** place: the Worker's secret (Part B step 5).

---

## Part B — Deploy the Cloudflare Worker (10 min)

1. Go to <https://dash.cloudflare.com> and create a free account (no credit card needed for Workers).
2. Left sidebar: **Workers & Pages → Create → Start with Hello World → Deploy**.
   (This makes an empty worker so you can edit it.)
3. Name it `bosla-ai` if asked. After it deploys, click **Edit code** (or **Continue to project → Edit code**).
4. In the code editor, **delete everything** and **paste the entire contents of `ai/worker.js`**
   from this repo. Click **Deploy** (top right).
5. Add your key as a secret:
   - Go to the worker's **Settings → Variables and Secrets** (older UI: **Settings → Variables → Add variable**).
   - Add one: **Name** = `ANTHROPIC_API_KEY`, **Value** = your `sk-ant-...` key,
     and mark it **Secret** / **Encrypt**. Save/Deploy.
6. Copy the Worker's URL — it looks like:
   `https://bosla-ai.YOUR-SUBDOMAIN.workers.dev`

---

## Part C — Send Claude the URL

Paste that `workers.dev` URL back to me. I'll drop it into `CONFIG.aiEndpoint`, wire the
app (search-a-missing-city → build it live; voice/description → AI parse), and we'll test
it together by searching a city that doesn't exist yet.

---

## Quick self-test (optional, before Part C)

Open your Worker URL — a plain GET shows `POST only`, which means it's alive. To really
test, open the **live app** in a browser, press F12 for the console, paste this (swap in
your URL), and run it:

```js
fetch("https://bosla-ai.YOUR-SUBDOMAIN.workers.dev", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "city", name: "Hallstatt" })
}).then(r => r.json()).then(console.log);
```

If you see a city object with real POIs (Hallstatt Skywalk, the lake…), it works. If you
see an error about the key, re-check Part B step 5.

---

## Turning it off / changing the cap

- Off: clear `CONFIG.aiEndpoint` in the app (ask me) — the app falls back to its built-in
  local parser and simply says "we don't have that city yet."
- Cap: change the monthly limit any time in the Anthropic console (Part A step 3).
- Rotate the key: create a new one, update the Worker secret, delete the old key.
