// "you cant fly directly here you need to find a close by airport then drive"
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

  await p.goto(URL); await p.waitForTimeout(900);
  await p.evaluate(t => { document.documentElement.setAttribute('data-theme', t); syncTheme(); }, THEME);

  const plan = async (names, wait) => {
    await p.evaluate(() => { clearTrip(); });
    await p.waitForTimeout(200);
    for (const n of names) await p.evaluate(nm => addStop(findCity(nm)), n);
    await p.waitForTimeout(wait || 500);
    return p.evaluate(() => ({
      legs: LEGS.map(L => ({ mode: L.mode, to: L.b.n, code: L.b.code || null,
        km: Math.round(km([L.a.lat, L.a.lng], [L.b.lat, L.b.lng])) })),
      hops: [...document.querySelectorAll('.hop')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
      cap: document.getElementById('cap').textContent.replace(/\s+/g, ' ').trim(),
    }));
  };

  // 1 — the screenshot. Garmisch has no runway, and the airport people use is Munich, not the
  // regional strip at Innsbruck 78km closer on the other side of the border.
  const g = await plan(['Garmisch-Partenkirchen']);
  pass('Garmisch is no longer flown to directly (' + g.legs.map(l => l.mode + '→' + l.to).join(', ') + ')',
    g.legs.length === 2 && g.legs[0].mode === 'air' && g.legs[0].code === 'MUC' &&
    g.legs[1].mode !== 'air');
  // Germany has rail and 109km justifies it, so this leg is the train — the same rule that keeps
  // Geneva to Zermatt a train, which matters because you cannot drive into Zermatt at all.
  pass('and the schedule spells out the last stretch (' + (g.hops[1] || '') + ')',
    /by (train|road) to Garmisch-Partenkirchen · 109 km/.test(g.hops[1] || ''));
  pass('and it says so above the schedule too (' + g.cap.slice(-70) + ')',
    /No airport at Garmisch-Partenkirchen — you land at .*Munich \(MUC\)/.test(g.cap));

  // 2 — the original complaint. A game reserve is not an airport.
  const m = await plan(['Maasai Mara']);
  pass('Maasai Mara lands at Nairobi and drives (' + m.legs.map(l => l.mode + '→' + l.to).join(', ') + ')',
    m.legs.length === 2 && m.legs[0].code === 'NBO' && m.legs[1].mode === 'road' && m.legs[1].km > 150);

  // 3 — a rail country: from the airport you take the train, not a taxi
  const z = await plan(['Zermatt']);
  pass('Zermatt lands at Geneva and takes the train (' + z.legs.map(l => l.mode + '→' + l.to).join(', ') + ')',
    z.legs[0].code === 'GVA' && z.legs[1].mode === 'rail');

  // 4 — a city that DOES have an airport keeps flying straight in
  const t = await plan(['Tokyo', 'Kyoto']);
  pass('Tokyo still flies straight in, no invented transfer (' + t.legs.map(l => l.mode + '→' + l.to).join(', ') + ')',
    t.legs.length === 2 && t.legs[0].mode === 'air' && t.legs[0].to === 'Tokyo' && t.legs[1].mode === 'rail');

  // 5 — leaving a place with no airport means going back to one
  const back = await plan(['Garmisch-Partenkirchen', 'Phuket']);
  pass('flying out of Garmisch drives back to the airport first (' +
    back.legs.map(l => l.mode + '→' + (l.code || l.to)).join(', ') + ')',
    back.legs.length === 4 && back.legs[3].mode === 'air' && back.legs[3].to === 'Phuket' &&
    back.legs[2].mode !== 'air' && back.legs[2].code === 'MUC');

  // 5b — but a border IS crossed when your own country has nothing nearer: Zermatt is Swiss and
  // flies via Geneva, while Andorra, Monaco and San Marino have no airport at all.
  const border = await p.evaluate(() => ['Zermatt','Andorra la Vella','San Marino','Vaduz'].map(n => {
    const c = findCity(n), g = gatewayFor(c);
    return n + ' -> ' + (g ? g.code + ' (' + g.country + ')' : 'direct');
  }));
  pass('a border is still crossed where it has to be (' + border.join(', ') + ')',
    /GVA \(Switzerland\)/.test(border[0]) && /\(France\)|\(Spain\)/.test(border[1]) &&
    /\(Italy\)/.test(border[2]) && /\(Switzerland\)/.test(border[3]));

  // 6 — Israel stays off the map, and the West Bank routes through Amman
  const pal = await p.evaluate(() => {
    const il = AIRPORTS.filter(a => a[2] === 'Israel').length;
    const g = gatewayFor(findCity('Bethlehem'));
    return { il, gw: g && g.n, country: g && g.country };
  });
  pass('no Israeli airport is in the table and Bethlehem routes via ' + pal.gw + ', ' + pal.country,
    pal.il === 0 && pal.country === 'Jordan');

  // 7 — nothing invented the other way: no city is left with an absurd drive
  const worst = await p.evaluate(() => {
    let w = null;
    CITY.forEach(c => { const g = gatewayFor(c); if (!g) return;
      const d = km([c.lat, c.lng], [g.lat, g.lng]);
      if (!w || d > w.d) w = { n: c.n, ap: g.code, d: Math.round(d) }; });
    return w;
  });
  pass('the longest transfer anywhere is genuinely remote (' + worst.n + ' → ' + worst.ap + ', ' +
    worst.d + ' km)', worst.d < 900);

  // it still flies, on screen, without throwing
  await p.evaluate(() => { clearTrip(); addStop(findCity('Garmisch-Partenkirchen')); });
  await p.waitForTimeout(6000);
  await p.screenshot({ path: 'gw-garmisch-' + THEME + '.png' });
  await p.evaluate(() => { clearTrip(); addStop(findCity('Maasai Mara')); });
  await p.waitForTimeout(6500);
  await p.screenshot({ path: 'gw-mara-' + THEME + '.png' });
  await p.evaluate(() => { clearTrip(); addStop(findCity('Garmisch-Partenkirchen')); });
  await p.waitForTimeout(6500);
  const framed = await p.evaluate(() => {
    const w = cv.clientWidth, pts = [STOPS[0], LEGS[0].b].map(c => proj(c.lng, c.lat));
    return pts.filter(q => q && q[0] > 0 && q[0] < w && q[1] > 0 && q[1] < w).length;
  });
  pass('both the airport and the village are on screen when it lands (' + framed + '/2)', framed === 2);

  console.log('\n=== YOU CANNOT FLY THERE ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 5).forEach(e => console.log('  ' + e));
  await b.close();
})();
