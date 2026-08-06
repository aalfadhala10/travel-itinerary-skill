#!/usr/bin/env node
// The 3a shell against the real app:
//   NODE_PATH=/opt/node22/lib/node_modules node tests/design3a-wired.cjs
//
// design3a.cjs proves the ELEVEN SCREENS render. This proves the shell is wired to
// the app underneath: plan() runs, a real itinerary comes out, the real screens open,
// and the whole thing wears the 3a palette.
//
// Does the new design actually drive the real app? Not "does it render" —
// does plan() run, does a real itinerary come out, do the real screens open.
const { chromium } = require('playwright');
const path = require('path');
const F = 'file://' + path.join(path.resolve(__dirname, '..'), 'index.html') + '?design=3a';
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS — ' : 'FAIL — ') + m); if (!c) fail++; };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
  await p.route(/workers\.dev|er-api|open-meteo|aladhan|wikipedia|script\.google/,
    r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await p.goto(F);
  await p.waitForTimeout(1400);

  // the engine is on the page and reachable
  ok(await p.evaluate(() => typeof window.plan === 'function'), 'engine: plan() is reachable from the layer');
  ok(await p.evaluate(() => typeof window.openMyTrips === 'function'), 'engine: openMyTrips() is reachable');
  ok(await p.evaluate(() => typeof window.openRecView === 'function'), 'engine: openRecView() is reachable');
  ok(await p.evaluate(() => typeof window.DEST === 'object' && Object.keys(window.DEST).length > 700),
     'engine: the 771-city table is loaded');

  // welcome -> home -> plan
  await p.locator('#d3 .d3-welcome .d3-cta').click();
  await p.waitForTimeout(300);
  await p.locator('#d3 .d3-search').first().click();
  await p.waitForTimeout(300);
  ok(await p.locator('#d3 .d3-scr[data-scr="plan"]').isVisible(), 'flow: home search opens the plan form');
  ok((await p.locator('#d3City').textContent()).trim().length > 0, 'flow: the form carries a city');

  // the real planner
  await p.locator('#d3Build').click();
  await p.waitForTimeout(2500);
  ok(await p.evaluate(() => document.documentElement.getAttribute('data-real') === '1'),
     'plan: the shell hands over to the real app');
  const out = await p.evaluate(() => {
    const o = document.getElementById('out');
    return { shown: o.classList.contains('show'), days: o.querySelectorAll('.day').length,
             chars: (o.innerText || '').trim().length };
  });
  ok(out.shown, 'plan: #out is showing');
  ok(out.days >= 2, `plan: a real itinerary was built (${out.days} day blocks)`);
  ok(out.chars > 400, `plan: with real content (${out.chars} chars)`);

  // and it is wearing the 3a palette, not the classic navy
  const skin = await p.evaluate(() => {
    const a = document.getElementById('app');
    const cs = getComputedStyle(a);
    return { paper: cs.getPropertyValue('--paper').trim(), bg: cs.backgroundColor };
  });
  ok(skin.paper === '#14110f', `skin: the real app uses the 3a ground (${skin.paper})`);

  // the tab bar still floats over the real screen and still works
  ok(await p.locator('#d3 .d3-tabs').isVisible(), 'nav: the 3a tab bar survives the handover');
  await p.locator('#d3 .d3-tab[data-tab="record"]').click();
  await p.waitForTimeout(900);
  ok(await p.evaluate(() => document.body.className.indexOf('recmode') > -1
       || document.getElementById('recscr').className.indexOf('is-hidden') === -1),
     'nav: Record opens the real travel record');
  await p.locator('#d3 .d3-tab[data-tab="home"]').click();
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.documentElement.getAttribute('data-real') === '0'),
     'nav: Home returns to the 3a shell');
  ok(await p.locator('#d3 .d3-scr[data-scr="home"]').isVisible(), 'nav: and the designed home is back');

  ok(errs.length === 0, `no page errors (${errs[0] || 'clean'})`);
  await p.screenshot({ path: path.join(require('os').tmpdir(), 'bosla-wired.png') });
  await b.close();
  console.log(fail ? `\n${fail} failed` : '\nthe design is driving the real app');
  process.exit(fail ? 1 : 0);
})();
