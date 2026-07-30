// The four new things, driven the way a thumb would drive them.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const URL = 'http://127.0.0.1:8899/demo/globe.html';
// Everything here used to run in the dark only. It runs in both now, because a change that
// looks right on one page and wrong on the other is not finished.
const THEME = process.env.THEME || 'dark';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2,
    colorScheme: THEME, timezoneId: 'Asia/Qatar' });
  const p = await ctx.newPage();
  const errs = [], res = [];
  const pass = (n, c) => res.push((c ? 'PASS' : 'FAIL') + ' — ' + n);
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  await p.goto(URL);
  await p.waitForTimeout(1000);
  await p.evaluate(t => { document.documentElement.setAttribute('data-theme', t); syncTheme(); }, THEME);

  // 1 — the origin comes from the phone's clock
  const home = await p.inputValue('#fromIn');
  pass('the origin is guessed from the timezone (' + home + ')', home === 'Doha');
  await p.screenshot({ path: 'd1-open-' + THEME + '.png' });

  // 2 — typing any city
  await p.click('#toIn'); await p.type('#toIn', 'toky', { delay: 40 });
  await p.waitForTimeout(250);
  const menu = await p.$$eval('#toMenu .acr', bs => bs.map(x => x.textContent.trim()));
  pass('typing three letters offers real cities (' + menu.slice(0, 3).join(' / ') + ')', menu.length > 0);
  await p.screenshot({ path: 'd2-type-' + THEME + '.png' });
  await p.click('#toMenu .acr');
  await p.waitForTimeout(400);
  let stops = await p.$$eval('.stop .nm', xs => xs.map(x => x.firstChild.textContent.trim()));
  pass('picking one adds it as a stop (' + stops.join(', ') + ')', stops.length === 1);

  // 3 — more stops, and the hop between them named honestly
  await p.click('#toIn'); await p.type('#toIn', 'Kyoto', { delay: 30 });
  await p.waitForTimeout(250); await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  await p.click('#toIn'); await p.type('#toIn', 'Osaka', { delay: 30 });
  await p.waitForTimeout(250); await p.keyboard.press('Enter');
  await p.waitForTimeout(6500);                      // let the whole flight play out
  stops = await p.$$eval('.stop .nm', xs => xs.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  const hops = await p.$$eval('.hop', xs => xs.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  pass('three stops in order (' + stops.length + ')', stops.length === 3);
  // hops[0] is now the flight in — the journey starts at the airport, not at the first stop.
  pass('the way in is a row of its own (' + (hops[0] || '') + ')',
    /by air to Tokyo/.test(hops[0] || ''));
  pass('Tokyo→Kyoto goes by train, not by plane (' + (hops[1] || '') + ')', /by train/.test(hops[1] || ''));
  pass('and every hop says where, how far and how long (' + hops.length + ' hops)',
    hops.length === 3 && hops.every(h => /to \S/.test(h) && /km/.test(h) && /~[\d.]+h/.test(h)));
  // The plane lands and the trip has to STAY on screen — the idle spin used to carry it off.
  const framed = await p.evaluate(() => {
    const seen = STOPS.map(c => proj(c.lng, c.lat)).filter(Boolean);
    const w = cv.clientWidth;
    return { on: seen.length, inside: seen.filter(q => q[0] > 0 && q[0] < w && q[1] > 0 && q[1] < w).length, spin };
  });
  pass('all three stops sit on the canvas after it lands (' + framed.inside + '/' + framed.on +
    ', idle spin ' + (framed.spin ? 'on' : 'off') + ')', framed.inside === 3 && !framed.spin);
  await p.screenshot({ path: 'd3-trip-' + THEME + '.png' });

  // 4 — nights, day ranges, tapping a stop
  const before = stops[0];
  await p.click('.stop[data-go="0"] .nb[data-n="0|1"]');
  await p.click('.stop[data-go="0"] .nb[data-n="0|1"]');
  await p.waitForTimeout(300);
  const after = await p.$$eval('.stop .nm', xs => xs.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  pass('nights adjust and the day ranges follow (' + after[0] + ' | ' + after[1] + ')',
    /days 1–5/.test(after[0]) && /days 6–8/.test(after[1]) && before !== after[0]);
  const z0 = await p.evaluate(() => view.zoom);
  await p.click('.stop[data-go="2"]');
  await p.waitForTimeout(1200);
  const z1 = await p.evaluate(() => ({ z: view.zoom, lon: view.lon }));
  pass('tapping a stop flies the globe to it (zoom ' + z0.toFixed(1) + ' → ' + z1.z.toFixed(1) + ')',
    z1.z >= 14 && Math.abs(z1.lon - 135.5) < 3);
  await p.screenshot({ path: 'd4-zoom-' + THEME + '.png' });

  // changing where you fly from re-flies the trip from there
  await p.fill('#fromIn', ''); await p.type('#fromIn', 'London', { delay: 30 });
  await p.waitForTimeout(250); await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  const cap = await p.textContent('#cap');
  pass('changing the origin re-anchors the trip (' + cap.replace(/\s+/g, ' ').slice(0, 70) + ')',
    /from London/.test(cap));

  // remove one, clear the lot
  await p.click('.rm[data-rm="1"]'); await p.waitForTimeout(400);
  const left = await p.$$eval('.stop', xs => xs.length);
  pass('a stop can be removed (' + left + ' left)', left === 2);
  await p.click('#tReset'); await p.waitForTimeout(400);
  pass('clearing puts the planet back to turning on its own', await p.evaluate(() => spin));
  const empty = await p.$eval('#trip', x => x.textContent.trim());
  pass('and the trip cleared (' + empty.slice(0, 40) + '…)', /No stops yet/.test(empty));

  // light mode still shows continents
  await p.click('.segb[data-t="light"]'); await p.waitForTimeout(300);
  await p.click('.qb'); await p.waitForTimeout(5000);
  await p.screenshot({ path: 'd5-light-' + THEME + '.png' });
  const lit = await p.evaluate(() => document.documentElement.getAttribute('data-theme'));
  pass('the ' + (THEME === 'dark' ? 'light theme is reachable on a dark phone' :
    'light theme holds on a light phone'), lit === 'light');

  // zoom in far enough that the fine coastlines are wanted
  await p.evaluate(() => { setZoom(9); });
  await p.waitForTimeout(2500);
  const fine = await p.textContent('#detail');
  pass('zooming in pulls the finer coastlines (' + fine + ')', /loaded/.test(fine));

  console.log('\n=== GLOBE DEMO ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 6).forEach(e => console.log('  ' + e));
  await b.close();
})();
