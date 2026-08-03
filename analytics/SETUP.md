# Bosla analytics + feedback — 5-minute setup (no coding)

This turns on two things at once, both stored in your own Google Sheet:

1. **Usage stats** — cookieless, no personal data (page views, which
   destinations get planned, outbound clicks) → the **Events** tab.
2. **In-app feedback** — the star rating + message users type in the app's
   "Send feedback" form → the **Feedback** tab.

One web app handles both, and you get a live dashboard that shows the stats
**and** the latest feedback.

## Step 1 — Make the Sheet + script

1. Go to <https://sheets.google.com> and create a **blank spreadsheet**. Name it
   e.g. `Bosla Analytics`.
2. In that sheet: **Extensions → Apps Script**. A code editor opens.
3. Delete whatever's in `Code.gs`, then **paste the entire contents of
   `analytics/Code.gs`** (from this repo) in its place.
4. Near the top you'll see `var DASH_KEY = '';`. Put a long random string
   between those quotes — that's the password for your dashboard. Leave it
   empty and the dashboard stays switched off. Click the **Save** icon.

## Step 2 — Deploy it as a web app

1. Top-right: **Deploy → New deployment**.
2. Click the gear next to "Select type" → choose **Web app**.
3. Set:
   - **Description:** `Bosla analytics`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`  ← required so the app can post events
4. Click **Deploy**. Approve the permissions prompt (it's your own script).
5. Copy the **Web app URL** it gives you. It looks like:
   `https://script.google.com/macros/s/AKfyc.../exec`

## Step 3 — Send me the URL

Paste that `.../exec` URL back to me. I'll drop it into **both**
`CONFIG.analyticsEndpoint` and `CONFIG.feedbackEndpoint` and redeploy. From then
on, real visits show up in the **Events** tab and any feedback users submit shows
up in the **Feedback** tab — automatically, in your Drive.

## Updating the script later

**Do NOT use "New deployment" for an update — it mints a NEW URL, and the app is
still posting to the old one.** To publish a change to code you've already
deployed:

**Deploy → Manage deployments →** pencil icon on the existing deployment **→
Version: New version → Deploy**. Same URL, new code.

(If the `/exec` URL ever does change, tell me and I'll update `CONFIG`.)

## Viewing your stats

Open `.../exec?k=YOUR_DASH_KEY` in any browser — the key is the string you put in
`DASH_KEY` in Step 1. It shows a live dashboard: total events, unique sessions,
plans made, top destinations & countries, outbound clicks by site, and language
split. Reload to refresh. Bookmark it with the key on the end.

Without the key the URL answers "Not found" — deliberately. That URL is in the
app's page source (it has to be, that's where the app posts), so anyone who reads
the source could otherwise have opened your dashboard and read the Feedback tab,
including any contact details people typed in.

The raw rows are always in the `Events` tab of your Sheet if you want to slice
them yourself.

## Turning it off

Clear `CONFIG.analyticsEndpoint` back to `""` (empty) and redeploy — tracking
goes silent immediately, no other changes needed.
