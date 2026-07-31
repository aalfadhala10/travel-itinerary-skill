// "9105 km ????" — Buffalo to Null Island. A model that does not know where something is
// answers 0,0, and nothing was checking.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const FILE = 'file:///home/user/travel-itinerary-skill/index.html';
const THEME = process.env.THEME || 'dark';

// Buffalo, as the worker would hand it over — with the exact fault from the screenshot.
const BUFFALO = {
  valid: true, city: 'Buffalo', country: 'United States', flag: '🇺🇸', region: 'americas',
  lat: 42.89, lng: -78.88,
  blurbEn: 'Lake Erie city', blurbAr: 'مدينة', blurbEs: 'ciudad',
  summerCond: 'warm', summerTemp: 26,
  costBudget: 90, costMid: 160, costLux: 320,
  hotelsBudget: ['Hotel Henry'], hotelsMid: ['Hyatt Place Buffalo/Downtown'], hotelsLux: ['The Westin Buffalo'],
  curSymbol: '$', curRate: 1,
  poi: [
    { n: 'Delaware Park', a: 'North Buffalo', t: ['Nature'], lat: 42.94, lng: -78.86 },
    { n: 'Albright-Knox Art Gallery', a: 'Elmwood Village', t: ['Culture'], lat: 42.93, lng: -78.87 },
    { n: 'Elmwood Avenue', a: 'Elmwood Village', t: ['Culture'], lat: 0, lng: 0 },          // the bug
    { n: 'Canalside', a: 'Downtown', t: ['Nature'], lat: null, lng: null },                  // never had one
    { n: 'Buffalo Zoo', a: 'North Buffalo', t: ['Nature'], lat: '42.9', lng: '-78.8' },      // strings
    { n: 'Niagara Falls', a: 'Niagara', t: ['Nature'], lat: 43.08, lng: -79.07 },            // a real day trip
    { n: 'Elmwood Avenue (London)', a: 'Elsewhere', t: ['Culture'], lat: 51.5, lng: -0.12 }, // right name, wrong continent
    { n: 'Larkin Square', a: 'Larkinville', t: ['Culture'], lat: 42.88, lng: -78.85 },
  ],
  food: [{ n: 'Lloyd Taco Factory', a: 'Downtown' }, { n: 'Yemen Cuisine', a: 'Downtown' },
         { n: 'Anchor Bar', a: 'Downtown' }],
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: THEME });
  const page = await ctx.newPage();
  const errs = [], res = [];
  const pass = (n, c) => res.push((c ? 'PASS' : 'FAIL') + ' — ' + n);
  page.on('pageerror', e => errs.push(e.message));

  await ctx.route(/workers\.dev|open\.er-api\.com/, r => {
    const bd = JSON.parse(r.request().postData() || '{}');
    if (bd.action === 'city') return r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ city: BUFFALO }) });
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto(FILE); await page.waitForTimeout(800);
  try { await page.click('.welbtn', { timeout: 900 }); } catch (e) {}
  try { await page.click('#introClose', { timeout: 600 }); } catch (e) {}
  await page.evaluate(() => { applyLang('en'); try { localStorage.clear(); } catch (e) {} });

  // Feed it straight through the same door the worker's answer comes in by.
  const built = await page.evaluate(async (city) => {
    const k = await aiCity('Buffalo', city);
    return { key: k, co: POI_CO[k], centre: CO[k] };
  }, BUFFALO).catch(() => null);

  if (!built || !built.key) {
    // aiCity's signature differs — drive it through the UI instead
    await page.evaluate(() => {
      document.getElementById('dest').value = 'Buffalo';
      document.getElementById('days').value = '6';
      document.getElementById('planBtn').click();
    });
    await page.waitForTimeout(4000);
  }

  const co = await page.evaluate(() => {
    const k = Object.keys(POI_CO).find(x => /buffalo/i.test(x));
    return { key: k, co: POI_CO[k] || {} };
  });
  const names = Object.keys(co.co);
  pass('the 0,0 place is refused outright (kept: ' + names.join(', ') + ')',
    !names.includes('Elmwood Avenue'));
  pass('and so is the one on the wrong continent',
    !names.includes('Elmwood Avenue (London)'));
  pass('coordinates sent as strings are refused too', !names.includes('Buffalo Zoo'));
  pass('a genuine day trip 25km out is kept (Niagara Falls)', names.includes('Niagara Falls'));
  pass('and the ordinary in-town places are all kept',
    names.includes('Delaware Park') && names.includes('Albright-Knox Art Gallery') &&
    names.includes('Larkin Square'));

  // now the thing the screenshot showed
  await page.evaluate(() => {
    document.getElementById('dest').value = 'Buffalo';
    document.getElementById('days').value = '6';
    document.getElementById('planBtn').click();
  });
  await page.waitForTimeout(4000);
  const hops = await page.evaluate(() => [...document.querySelectorAll('#out .hop')]
    .map(h => h.textContent.trim()));
  const nums = hops.map(h => parseFloat(h.replace(/[^\d.]/g, ''))).filter(n => !isNaN(n));
  const worst = nums.length ? Math.max(...nums) : 0;
  pass('no absurd distance is printed anywhere (' + hops.length + ' hops, largest ' +
    worst + ')', hops.every(h => !/9105|9,105/.test(h)) && worst < 500);

  // the display net, on its own
  const capped = await page.evaluate(() => ({
    absurd: hopLabel(9105), far: hopLabel(240), near: hopLabel(1.1), metres: hopLabel(0.3),
  }));
  pass('hopLabel refuses a number that cannot be a hop ("' + capped.absurd + '")',
    capped.absurd === '');
  pass('but still prints a real day trip and a real walk (' +
    capped.far.replace(/<[^>]*>/g, '') + ' / ' + capped.near.replace(/<[^>]*>/g, '') + ' / ' +
    capped.metres.replace(/<[^>]*>/g, '') + ')',
    /240/.test(capped.far) && /1\.1/.test(capped.near) && /300\s*m/.test(capped.metres));

  await page.screenshot({ path: 'ni-' + THEME + '.png' });
  console.log('\n=== 9105 KM (' + THEME + ') ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 5).forEach(e => console.log('  ' + e));
  await b.close();
})();
