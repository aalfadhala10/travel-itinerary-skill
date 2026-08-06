#!/usr/bin/env node
// The 3a theme layer:  NODE_PATH=/opt/node22/lib/node_modules node tests/design3a.cjs
//
// Two things this guards. The first is that the layer is OPTIONAL: with the flag off
// the classic app has to render exactly as it always did, because the whole point of
// shipping the redesign this way is that it can be switched off.
//
// The second is specificity. The layer is ~250 rules living at the end of a 1300-line
// stylesheet, and the ids in `#d3 button {…}` outrank every `.d3-*` component class
// below it — which silently costs you the tan on "See all", the ink on the welcome
// CTA, and every heading margin. Nothing throws, the screens still render, and the
// colours are just quietly wrong. So the design's own numbers are asserted here off
// computed style rather than trusted to eyeballing a screenshot.
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const FILE = 'file://' + path.join(ROOT, 'index.html');

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

  // Self-hosted, because the CSP has no font-src and Google Fonts is refused.
  // If this fails the layer silently falls back to Georgia and stops being 3a.
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

  // ── every screen, both languages ────────────────────────────────────────
  const show = async scr => {
    await p.evaluate(s => {
      const r = document.getElementById('d3');
      r.setAttribute('data-scr', s);
      r.querySelectorAll('.d3-scr').forEach(n =>
        n.classList.toggle('on', n.getAttribute('data-scr') === s));
    }, scr);
    await p.waitForTimeout(150);
  };
  for (const lang of ['en', 'ar']) {
    if (lang === 'ar') {
      await show('welcome');
      await p.locator('#d3Lang').click();
      await p.waitForTimeout(250);
      ok(await p.locator('#d3').getAttribute('dir') === 'rtl', 'ar: the layer flips to RTL');
    }
    for (const s of ['welcome', 'home', 'trip', 'discover']) {
      await show(s);
      const box = await p.locator(`#d3 .d3-scr[data-scr="${s}"]`).boundingBox();
      ok(box && box.width > 300, `${lang}/${s}: screen has layout`);
    }
  }

  // ── the interactions the design calls out ───────────────────────────────
  await show('welcome');
  await p.locator('#d3Lang').click();                        // back to English
  await p.waitForTimeout(250);

  await show('trip');
  const day1 = p.locator('#d3 .d3-day').first();
  ok(await day1.getAttribute('aria-expanded') === 'true', 'trip: day 1 starts open');
  await day1.locator('.d3-dayhd').click();
  await p.waitForTimeout(220);
  ok(await day1.getAttribute('aria-expanded') === 'false', 'trip: day 1 collapses on tap');
  ok(!(await p.locator('#d3 .d3-stops').first().isVisible()), 'trip: stops hide when collapsed');

  await show('discover');
  const all = await p.locator('#d3 .d3-gem').count();
  await p.locator('#d3 .d3-chip', { hasText: 'Food' }).click();
  await p.waitForTimeout(220);
  const food = await p.locator('#d3 .d3-gem').count();
  ok(all === 7 && food === 2, `discover: chips filter the list (${all} -> ${food})`);

  await p.locator('#d3 .d3-tab[data-tab="home"]').click();
  await p.waitForTimeout(220);
  ok(await p.locator('#d3 .d3-scr[data-scr="home"]').isVisible(), 'tabs: Home navigates');
  ok(await p.locator('#d3 .d3-tab[data-tab="home"]').evaluate(n => n.classList.contains('on')),
     'tabs: the active tab is marked');

  ok(errs.length === 0, `no page errors (${errs[0] || 'clean'})`);
  await b.close();
  console.log(fail ? `\n${fail} check(s) failed` : '\nall 3a checks passed');
  process.exit(fail ? 1 : 0);
})();
