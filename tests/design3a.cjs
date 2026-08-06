#!/usr/bin/env node
// The 3a theme layer:  NODE_PATH=/opt/node22/lib/node_modules node tests/design3a.cjs
//
// Three things this guards. The first is that the layer is OPTIONAL: with the flag off
// the classic app has to render exactly as it always did, because the whole point of
// shipping the redesign this way is that it can be switched off.
//
// The second is specificity. The layer is ~350 rules living at the end of a 1300-line
// stylesheet, and the ids in `#d3 button {…}` outrank every `.d3-*` component class
// below it — which silently costs you the tan on "See all", the ink on the welcome
// CTA, and every heading margin. Nothing throws, the screens still render, and the
// colours are just quietly wrong. So the design's own numbers are asserted here off
// computed style rather than trusted to eyeballing a screenshot.
//
// The third is that all eleven screens actually render in both languages — a screen
// whose render function throws leaves an empty <section> that looks like a styling
// bug rather than a dead function.
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FILE = 'file://' + path.join(ROOT, 'index.html');

const SCREENS = ['welcome', 'home', 'plan', 'chat', 'trip', 'discover',
                 'published', 'record', 'saved', 'me', 'paywall'];

let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS — ' : 'FAIL — ') + m); if (!c) fail++; };

(async () => {
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { console.log('SKIP — playwright unavailable'); return; }

  const b = await chromium.launch({ executablePath: EXE });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
  await p.route(/workers\.dev|er-api|open-meteo|aladhan|wikipedia|script\.google/,
    r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

  // ── the flag is off ─────────────────────────────────────────────────────
  await p.goto(FILE + '?design=classic');
  await p.waitForTimeout(1200);
  ok(await p.locator('#app').isVisible(), 'classic: #app still renders with the flag off');
  ok(!(await p.locator('#d3').isVisible()), 'classic: the 3a layer stays out of the way');
  ok(await p.locator('#dest').count() === 1, 'classic: the plan form is intact');

  // ── the flag is on ──────────────────────────────────────────────────────
  await p.goto(FILE + '?design=3a');
  await p.waitForTimeout(900);
  ok(await p.locator('#d3').isVisible(), '3a: the layer renders');
  ok(!(await p.locator('#app').isVisible()), '3a: the classic wrap is hidden');
  ok(!(await p.locator('nav.tabbar').isVisible()), '3a: the classic tab bar is hidden');
  ok(await p.locator('#d3 .d3-scr').count() === SCREENS.length,
     `3a: all ${SCREENS.length} screens are present`);

  // Self-hosted, because the CSP has no font-src and Google Fonts is refused.
  ok(await p.evaluate(() => document.fonts.check("400 42px 'Playfair Display'")),
     '3a: Playfair loaded from fonts/ (no network, CSP-clean)');

  const css = (sel, prop) => p.locator(sel).first().evaluate(
    (n, pr) => getComputedStyle(n)[pr], prop);
  const TAN = 'rgb(232, 207, 169)';                         // #E8CFA9
  ok(await css('#d3', 'backgroundColor') === 'rgb(20, 17, 15)', 'tokens: ground is #14110F');
  ok(await css('#d3 .d3-cta', 'backgroundColor') === TAN, 'tokens: welcome CTA is tan');
  ok(await css('#d3 .d3-cta', 'color') === 'rgb(34, 28, 21)', 'tokens: CTA text is the dark ink');
  ok(await css('#d3 .d3-all', 'color') === TAN, 'tokens: "See all" is tan');
  ok(await css('#d3 .d3-time', 'color') === TAN, 'tokens: stop times are tan');
  ok(await css('#d3 .d3-add', 'color') === TAN, 'tokens: "+ Add to day" is tan');
  ok(await css('#d3 .d3-wsub', 'marginBottom') === '26px', 'metrics: welcome sub keeps its 26px');
  ok(await css('#d3 .d3-head .d3-h1', 'marginBottom') === '8px', 'metrics: home title keeps its 8px');

  // A <button>'s content model is phrasing content, so every block inside one has
  // to be a <span> — and a span is inline, where height/margin silently do nothing.
  // That collapsed the chat card's photo header and erased the credits meter, with
  // no error anywhere. Assert the boxes are real.
  ok(await css('#d3 .d3-chatcard .shot', 'height') === '96px', 'boxes: chat card keeps its 96px photo');
  ok(await css('#d3 .d3-meter', 'height') === '6px', 'boxes: the credits meter has height');
  ok(await css('#d3 .d3-who .n', 'display') === 'block', 'boxes: account name is on its own line');
  ok(await css('#d3 .d3-chatcard .open', 'display') === 'block', 'boxes: "Open itinerary" is a bar');

  // ── every screen, both languages ────────────────────────────────────────
  const show = async scr => {
    await p.evaluate(s => {
      const r = document.getElementById('d3');
      r.setAttribute('data-scr', s);
      r.querySelectorAll('.d3-scr').forEach(n =>
        n.classList.toggle('on', n.getAttribute('data-scr') === s));
    }, scr);
    await p.waitForTimeout(120);
  };
  for (const lang of ['en', 'ar']) {
    if (lang === 'ar') {
      await show('welcome');
      await p.locator('#d3Lang').click();
      await p.waitForTimeout(300);
      ok(await p.locator('#d3').getAttribute('dir') === 'rtl', 'ar: the layer flips to RTL');
    }
    for (const s of SCREENS) {
      await show(s);
      const sel = `#d3 .d3-scr[data-scr="${s}"]`;
      const box = await p.locator(sel).boundingBox();
      // a screen whose renderer threw is present but empty — check it has real text
      const chars = await p.locator(sel).evaluate(n => (n.innerText || '').trim().length);
      ok(box && box.width > 300 && chars > 20,
         `${lang}/${s}: renders with content (${chars} chars)`);
    }
  }

  // ── the interactions the design specifies ───────────────────────────────
  await show('welcome');
  await p.locator('#d3Lang').click();                        // back to English
  await p.waitForTimeout(300);

  await show('trip');
  ok(await p.locator('#d3 .d3-day').count() === 4, 'trip: four days');
  ok(await p.locator('#d3 .d3-stop').count() === 17, 'trip: seventeen stops');
  const days = p.locator('#d3 .d3-day');
  ok(await days.nth(0).getAttribute('aria-expanded') === 'true', 'trip: day 1 starts open');
  await days.nth(2).locator('.d3-dayhd').click();
  await p.waitForTimeout(250);
  ok(await days.nth(2).getAttribute('aria-expanded') === 'true'
     && await days.nth(0).getAttribute('aria-expanded') === 'false',
     'trip: opening day 3 closes day 1 — one open at a time');
  await days.nth(2).locator('.d3-dayhd').click();
  await p.waitForTimeout(250);
  ok(await days.nth(2).getAttribute('aria-expanded') === 'false', 'trip: tapping the open day shuts it');

  await show('discover');
  // scope to the feed: .d3-item is shared with the Saved list, and every screen
  // is in the DOM at once, so an unscoped count spans both
  const all = await p.locator('#d3Feed .d3-item').count();
  await p.locator('#d3 .d3-chip', { hasText: 'Europe' }).click();
  await p.waitForTimeout(250);
  ok(all === 4 && await p.locator('#d3Feed .d3-item').count() === 1,
     `discover: region chips filter the feed (${all} -> 1)`);
  await p.locator('#d3 .d3-chip', { hasText: 'All' }).click();
  await p.waitForTimeout(200);

  await show('plan');
  const seg = p.locator('#d3Lengths .d3-seg');
  ok(await seg.nth(1).evaluate(n => n.classList.contains('on')), 'plan: "4 days" starts selected');
  await seg.nth(2).click();
  await p.waitForTimeout(200);
  ok(await seg.nth(2).evaluate(n => n.classList.contains('on'))
     && !(await seg.nth(1).evaluate(n => n.classList.contains('on'))),
     'plan: length is single-select');
  const int0 = p.locator('#d3Interests .d3-int').first();
  const before = await int0.evaluate(n => n.classList.contains('on'));
  await int0.click();
  await p.waitForTimeout(200);
  ok(await int0.evaluate(n => n.classList.contains('on')) !== before,
     'plan: interests toggle independently');

  await show('saved');
  const savedFirst = await p.locator('#d3SavedList .d3-item').count();
  await p.locator('#d3SavedTabs .d3-segtab').nth(1).click();
  await p.waitForTimeout(220);
  ok(savedFirst === 5 && await p.locator('#d3SavedList .d3-item').count() === 3,
     `saved: the Places/Trips tabs swap the list (${savedFirst} -> 3)`);

  await show('paywall');
  const plans = p.locator('#d3Plans .d3-plan');
  await plans.nth(1).click();
  await p.waitForTimeout(200);
  ok(await plans.nth(1).evaluate(n => n.classList.contains('on')), 'paywall: plan selection moves');

  // drawer
  await show('home');
  await p.locator('#d3 .d3-burger').click();
  await p.waitForTimeout(320);
  ok(await p.locator('#d3').getAttribute('data-drawer') === 'open', 'drawer: opens from the burger');
  ok(await p.locator('#d3 .d3-ditem').count() === 7, 'drawer: seven items');
  await p.locator('#d3 .d3-ditem').nth(3).click();           // Travel record
  await p.waitForTimeout(320);
  ok(await p.locator('#d3 .d3-scr[data-scr="record"]').isVisible()
     && await p.locator('#d3').getAttribute('data-drawer') === 'shut',
     'drawer: an item navigates and closes it');

  // tab bar
  await p.locator('#d3 .d3-tab[data-tab="home"]').click();
  await p.waitForTimeout(220);
  ok(await p.locator('#d3 .d3-scr[data-scr="home"]').isVisible(), 'tabs: Home navigates');
  ok(await p.locator('#d3 .d3-tab[data-tab="home"]').evaluate(n => n.classList.contains('on')),
     'tabs: the active tab is marked');
  // The design's TABBED list is home/trip/discover/record/me — the other six are
  // full-bleed screens with no tab bar, so it must be absent on those.
  for (const s of ['plan', 'chat', 'published', 'saved', 'paywall', 'welcome']) {
    await show(s);
    ok(!(await p.locator('#d3 .d3-tabs').isVisible()), `${s}: no tab bar, as designed`);
  }
  for (const s of ['home', 'trip', 'discover', 'record', 'me']) {
    await show(s);
    ok(await p.locator('#d3 .d3-tabs').isVisible(), `${s}: has the tab bar`);
  }
  // a screen that isn't itself a tab still lights its parent tab
  await p.evaluate(() => document.querySelector('#d3 .d3-tab[data-tab="discover"]').click());
  await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelector('#d3 .d3-pick').click());
  await p.waitForTimeout(250);
  ok(await p.locator('#d3 .d3-scr[data-scr="published"]').isVisible(),
     'discover: the featured card opens the published trip');
  ok(await p.locator('#d3 .d3-tab[data-tab="discover"]').evaluate(n => n.classList.contains('on')),
     'tabs: published keeps Discover lit, though it has no bar of its own');

  ok(errs.length === 0, `no page errors (${errs[0] || 'clean'})`);
  await b.close();
  console.log(fail ? `\n${fail} check(s) failed` : '\nall 3a checks passed');
  process.exit(fail ? 1 : 0);
})();
