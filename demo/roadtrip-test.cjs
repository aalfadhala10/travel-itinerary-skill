// "But maybe someone wants to drive as a roadtrip?" — the rule says what is usual, not what you want.
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

  const state = () => p.evaluate(() => ({
    legs: LEGS.map(L => L.mode + '→' + (L.b.code || L.b.n)),
    hops: [...document.querySelectorAll('.hop')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
    swaps: [...document.querySelectorAll('.swap')].map(x => x.textContent.trim()),
  }));
  const plan = async names => {
    await p.evaluate(() => clearTrip()); await p.waitForTimeout(150);
    for (const n of names) await p.evaluate(nm => addStop(findCity(nm)), n);
    await p.waitForTimeout(400); return state();
  };

  // the default is still the usual way
  let s = await plan(['Garmisch-Partenkirchen', 'Salzburg', 'Vienna']);
  pass('by default the Alps go by train (' + s.legs.join(', ') + ')',
    s.legs[1] === 'rail→Garmisch-Partenkirchen' && s.legs[2] === 'rail→Salzburg');
  pass('and every drivable leg offers the drive (' + s.swaps.join(', ') + ')',
    s.swaps.length === 3 && s.swaps.every(t => t === 'drive it'));

  // one leg at a time
  await p.click('.swap'); await p.waitForTimeout(250);
  s = await state();
  pass('tapping one leg drives just that leg (' + s.legs.join(', ') + ')',
    s.legs[1] === 'road→Garmisch-Partenkirchen' && s.legs[2] === 'rail→Salzburg');
  // swaps[] only counts legs that HAVE a choice, so the driven leg is swaps[0], not swaps[1].
  pass('and it offers the train back (' + s.swaps[0] + ')', s.swaps[0] === 'by train');
  pass('the hours change with the mode (' + s.hops[1] + ')', /by road to Garmisch/.test(s.hops[1]));
  await p.screenshot({ path: 'rt-leg-' + THEME + '.png' });

  // the whole trip
  await p.click('#tRoad'); await p.waitForTimeout(300);
  s = await state();
  pass('Road trip drives every drivable leg (' + s.legs.join(', ') + ')',
    s.legs.filter(l => l.indexOf('rail') === 0).length === 0 &&
    s.legs.filter(l => l.indexOf('road') === 0).length === 3);
  pass('the flight in is still a flight (' + s.legs[0] + ')', /^air→MUC/.test(s.legs[0]));
  await p.screenshot({ path: 'rt-all-' + THEME + '.png' });

  await p.click('#tRoad'); await p.waitForTimeout(300);
  s = await state();
  pass('turning it off returns to the usual way (' + s.legs.join(', ') + ')',
    s.legs[1] === 'rail→Garmisch-Partenkirchen');

  // where driving is not possible, it is not offered
  s = await plan(['Zermatt']);
  pass('Zermatt is never offered the drive — the road stops at Täsch (' +
    (s.swaps.length ? s.swaps.join(',') : 'no swap offered') + ')', s.swaps.length === 0);
  await p.evaluate(() => { ROADTRIP = true; renderTrip(); }); await p.waitForTimeout(200);
  s = await state();
  pass('and Road trip does not force it either (' + s.legs.join(', ') + ')',
    s.legs[1] === 'rail→Zermatt');
  await p.evaluate(() => { ROADTRIP = false; renderTrip(); });

  // islands are left alone rather than offered a road that may not exist
  s = await plan(['Athens', 'Santorini']);
  pass('no drive is offered across the Aegean (' + s.legs.join(', ') + '; ' +
    s.swaps.length + ' swaps)', s.swaps.length === 0 && s.legs[1] === 'sea→Santorini');
  // Sampling the line for water was replaced by asking which landmass each place is on — the line
  // from Athens to Thessaloniki is 80% sea and the drive is entirely on land, so the line never
  // was the question.
  const land = await p.evaluate(() => ({
    aegean: sameLand(findCity('Athens'), findCity('Santorini')),
    greece: sameLand(findCity('Athens'), findCity('Thessaloniki')),
    japan: sameLand(findCity('Tokyo'), findCity('Kyoto')),
    alps: sameLand(findCity('Munich'), findCity('Garmisch-Partenkirchen')),
    chunnel: sameLand(findCity('London'), findCity('Paris')),
    irish: sameLand(findCity('London'), findCity('Dublin')),
  }));
  pass('the landmass answers it, not the line (' + JSON.stringify(land) + ')',
    !land.aegean && !land.irish && land.greece && land.japan && land.alps && land.chunnel);

  // a country with no rail never offers the train
  s = await plan(['Maasai Mara']);
  pass('Kenya has no rail so no train is offered (' + s.legs.join(', ') + '; ' +
    s.swaps.length + ' swaps)', s.legs[1] === 'road→Maasai Mara' && s.swaps.length === 0);

  // clearing resets the preference
  await p.evaluate(() => { ROADTRIP = true; clearTrip(); }); await p.waitForTimeout(200);
  pass('clearing the trip resets Road trip', await p.evaluate(() =>
    !ROADTRIP && !document.getElementById('tRoad').classList.contains('on')));

  console.log('\n=== TRAIN OR CAR ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 5).forEach(e => console.log('  ' + e));
  await b.close();
})();
