// "Put a ferry then" — legs with no land between them are a boat, not a train and not a flight.
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

  const plan = async names => {
    await p.evaluate(() => clearTrip()); await p.waitForTimeout(150);
    for (const n of names) await p.evaluate(nm => addStop(findCity(nm)), n);
    await p.waitForTimeout(400);
    return p.evaluate(() => ({
      legs: LEGS.map(L => L.mode + '→' + (L.b.code || L.b.n)),
      hops: [...document.querySelectorAll('.hop')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
      swaps: [...document.querySelectorAll('.swap')].length,
    }));
  };

  // the case that started it
  let s = await plan(['Athens', 'Santorini']);
  pass('Athens to Santorini is a ferry, not a train (' + s.legs.join(', ') + ')',
    s.legs[1] === 'sea→Santorini');
  pass('and it says how long the boat takes (' + s.hops[1] + ')',
    /by ferry to Santorini · 2\d\d km · ~[67](\.5)?h/.test(s.hops[1]));
  pass('with no train-or-car choice offered on it', s.swaps === 0);

  // the case that proves it is not just "the line crossed water"
  s = await plan(['Athens', 'Thessaloniki']);
  pass('Athens to Thessaloniki stays on land — 80% water as the crow flies (' +
    s.legs.join(', ') + ')', s.legs[1] === 'rail→Thessaloniki' && s.swaps === 1);

  // a strait the raster welded shut, and one it did not
  s = await plan(['Naples', 'Palermo']);
  pass('Naples to Palermo is a ferry — there is no bridge at Messina (' + s.legs.join(', ') + ')',
    s.legs[1] === 'sea→Palermo');
  // Bangkok to Phuket is 690km and flies for that reason alone, so ask the landmass directly:
  // the Sarasin Bridge is real and Phuket must NOT read as an island.
  const bridged = await p.evaluate(() => ({
    phuket: sameLand(findCity('Bangkok'), findCity('Phuket')),
    penang: sameLand(findCity('Kuala Lumpur'), findCity('Penang')),
    samui: sameLand(findCity('Bangkok'), findCity('Koh Samui')),
    sicily: sameLand(findCity('Rome'), findCity('Palermo')),
  }));
  pass('real bridges join, real straits do not (' + JSON.stringify(bridged) + ')',
    bridged.phuket && bridged.penang && !bridged.samui && !bridged.sicily);

  // built crossings beat the water
  s = await plan(['London', 'Paris']);
  pass('London to Paris is the tunnel, not a boat (' + s.legs.join(', ') + ')',
    s.legs[1] === 'rail→Paris');
  // Bahrain and Saudi are joined by the King Fahd Causeway, so they must not read as a ferry.
  // The leg still flies, because the app's own rule sends every cross-border non-EU hop by air
  // regardless of distance — a 55km flight, which is odd, and is not this change's business.
  const gulf = await p.evaluate(() => ({
    joined: sameLand(findCity('Manama'), findCity('Dammam')),
    mode: baseMode(findCity('Manama'), findCity('Dammam')),
  }));
  pass('the causeway stops Bahrain reading as an island (' + JSON.stringify(gulf) + ')',
    gulf.joined === true);
  s = await plan(['London', 'Dublin']);
  pass('London to Dublin has no tunnel, so it is a boat (' + s.legs.join(', ') + ')',
    s.legs[1] === 'sea→Dublin');

  // Road trip must not drive onto a ferry route
  s = await plan(['Athens', 'Santorini']);
  await p.click('#tRoad'); await p.waitForTimeout(300);
  const rt = await p.evaluate(() => LEGS.map(L => L.mode + '→' + (L.b.code || L.b.n)));
  pass('Road trip does not drive across the Aegean (' + rt.join(', ') + ')',
    rt[1] === 'sea→Santorini');
  await p.click('#tRoad'); await p.waitForTimeout(200);

  // an island whose airport is on a DIFFERENT island: the transfer is a boat too
  const paros = await p.evaluate(() => {
    const c = findCity('Paros'), g = gatewayFor(c);
    return { gw: g && g.code, mode: g && transferMode(g, c) };
  });
  pass('Paros flies to Mykonos and finishes by boat (' + paros.gw + ', ' + paros.mode + ')',
    paros.gw === 'JMK' && paros.mode === 'sea');

  // and it draws, without throwing
  s = await plan(['Athens', 'Santorini', 'Mykonos']);
  await p.waitForTimeout(7000);
  await p.screenshot({ path: 'fy-greece-' + THEME + '.png' });
  const drew = await p.evaluate(() => ({ modes: LEGS.map(L => L.mode), fly: !!fly }));
  pass('a three-island hop draws end to end (' + drew.modes.join(', ') + ')',
    drew.modes.join(',') === 'air,sea,sea' && !drew.fly);

  console.log('\n=== PUT A FERRY THEN ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 5).forEach(e => console.log('  ' + e));
  await b.close();
})();
