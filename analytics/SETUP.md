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
   `analytics/Code.gs`** (from this repo) in its place. Click the **Save** icon.

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

## Viewing your stats

Just open that same `.../exec` URL in any browser — it shows a live dashboard:
total events, unique sessions, plans made, top destinations & countries,
outbound clicks by site, and language split. Reload to refresh.

The raw rows are always in the `Events` tab of your Sheet if you want to slice
them yourself.

## Turning it off

Clear `CONFIG.analyticsEndpoint` back to `""` (empty) and redeploy — tracking
goes silent immediately, no other changes needed.
