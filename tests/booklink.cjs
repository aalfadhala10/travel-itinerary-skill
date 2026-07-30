// "the button to book the hotel ... opens a general page, not the exact hotel that he suggested"
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const FILE = 'file:///home/user/travel-itinerary-skill/index.html';
const THEME = process.env.THEME || 'dark';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: THEME });
  const page = await ctx.newPage();
  const errs = [], res = [];
  const pass = (n, c) => res.push((c ? 'PASS' : 'FAIL') + ' — ' + n);
  page.on('pageerror', e => errs.push(e.message));

  // Google spells one of these differently from our own list, and knows nothing about another.
  const GN = { 'millennium place marina': 'Millennium Place Marina Hotel Apartments' };
  let pinsOn = true;
  await ctx.route(/workers\.dev|open\.er-api\.com/, r => {
    const bd = JSON.parse(r.request().postData() || '{}');
    if (bd.action === 'places') {
      const rated = {}, pins = {};
      (bd.names || []).forEach((n, i) => {
        rated[n] = { r: 4.4, n: 900 };
        if (pinsOn) pins[n] = { id: 'P' + i, gn: GN[n.toLowerCase()] || n, lat: 25.1, lng: 55.2 };
      });
      return r.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ closed: [], rated, pins, unknown: [] }) });
    }
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  const plan = async (a, c, d, start) => {
    await page.goto(FILE); await page.waitForTimeout(800);
    try { await page.click('.welbtn', { timeout: 900 }); } catch (e) {}
    try { await page.click('#introClose', { timeout: 600 }); } catch (e) {}
    await page.evaluate(() => { applyLang('en'); try { localStorage.clear(); } catch (e) {} });
    await page.evaluate(([x, y, n, s]) => {
      document.getElementById('dest').value = x;
      document.getElementById('dest2').value = y;
      document.getElementById('days').value = String(n);
      document.getElementById('startDate').value = s;
      document.getElementById('adults').value = '2';
      document.getElementById('planBtn').click();
    }, [a, c, d, start]);
    await page.waitForTimeout(3000);
    return page.evaluate(() => [...document.querySelectorAll('#out .day')].map(day => {
      const row = day.querySelector('.hotelrow'); if (!row) return null;
      const a2 = row.querySelector('.booklink');
      const u = a2 ? new URL(a2.getAttribute('href')) : null;
      return {
        day: (day.querySelector('.dlabel') || {}).textContent || '',
        hotel: (row.querySelector('.d a') || {}).textContent,
        ss: u ? u.searchParams.get('ss') : null,
        ci: u ? u.searchParams.get('checkin') : null,
        co: u ? u.searchParams.get('checkout') : null,
      };
    }).filter(Boolean));
  };

  // Two cities, so each hotel's window must be its own stay and not the whole holiday.
  let rows = await plan('Dubai', 'Abu Dhabi', 14, '2026-09-01');
  const first = rows[0], second = rows.find(r => r.hotel !== rows[0].hotel);
  pass('the first hotel is asked for the nights you are there (' + first.ci + ' → ' + first.co + ')',
    first.ci === '2026-09-01' && first.co === '2026-09-08');
  pass('and the second starts when you actually arrive (' + second.day.trim() + ': ' +
    second.ci + ' → ' + second.co + ')', second.ci === '2026-09-08' && second.co === '2026-09-15');
  pass('neither is sent the whole fourteen nights',
    first.co !== '2026-09-15' && second.ci !== '2026-09-01');

  // A name that already carries its city must not carry it twice.
  const dupes = rows.filter(r => {
    const w = r.ss.toLowerCase().match(/abu dhabi/g);
    return w && w.length > 1;
  });
  pass('the city is not stapled onto a name that already has it (' +
    (second.ss || '') + ')', dupes.length === 0);
  pass('but it IS added when the name lacks it (' + first.ss + ')',
    /dubai/i.test(first.ss));

  // Which hotel gets picked varies with the seed, so ask the function directly rather than hope
  // the right one came up. Seed the pin store the way a real Google lookup would have.
  const q = await page.evaluate(() => {
    PINS = null;
    localStorage.setItem('bosla_pins', JSON.stringify({
      'jumeirah beach hotel': { id: 'X1', gn: 'Jumeirah Beach Hotel Dubai', lat: 25, lng: 55 },
      'hotel de paris':       { id: 'X2', gn: 'Hôtel de Paris Monte-Carlo', lat: 43, lng: 7 },
      'sakura inn':           { id: 'X3', gn: 'さくら旅館', lat: 35, lng: 139 },
    }));
    return {
      // Google's spelling wins, and the city is already in it
      google: bookQuery('Jumeirah Beach Hotel', 'Dubai'),
      // Google's spelling wins, city appended because it is not in the name
      accents: bookQuery('Hotel de Paris', 'Monaco'),
      // a name that came back in Japanese is no use to Booking — keep ours
      nonLatin: bookQuery('Sakura Inn', 'Kyoto'),
      // no pin at all
      nopin: bookQuery('Some Unlisted Guesthouse', 'Hanoi'),
      // our own name already ends with the city
      dupe: bookQuery('Southern Sun Abu Dhabi', 'Abu Dhabi'),
    };
  });
  pass('Google\'s spelling is what gets searched (' + q.google + ')',
    q.google === 'Jumeirah Beach Hotel Dubai');
  pass('and the city is appended when the name lacks it (' + q.accents + ')',
    q.accents === 'Hôtel de Paris Monte-Carlo Monaco');
  pass('a name Google returns in another script is no use to Booking (' + q.nonLatin + ')',
    q.nonLatin === 'Sakura Inn Kyoto');
  pass('no pin, our own name (' + q.nopin + ')', q.nopin === 'Some Unlisted Guesthouse Hanoi');
  pass('and the city is never doubled (' + q.dupe + ')', q.dupe === 'Southern Sun Abu Dhabi');

  // With no Google pin at all it must still work, just with our own name.
  pinsOn = false;
  rows = await plan('Kyoto', '', 4, '2026-10-05');
  pass('with no pin it falls back to our own name and still dates it right (' +
    rows[0].ss + ', ' + rows[0].ci + ' → ' + rows[0].co + ')',
    !!rows[0].ss && rows[0].ci === '2026-10-05' && rows[0].co === '2026-10-09');
  pinsOn = true;

  // The city-wide "find a hotel" search is a different thing and must stay general.
  const general = await page.evaluate(() => {
    const u = new URL(hotelSearchUrl('booking', 'Kyoto'));
    return { ss: u.searchParams.get('ss'), ci: u.searchParams.get('checkin'),
      co: u.searchParams.get('checkout') };
  });
  pass('the city-wide hotel search is still city-wide, for the whole trip (' + general.ss + ', ' +
    general.ci + ' → ' + general.co + ')',
    general.ss === 'Kyoto' && general.ci === '2026-10-05' && general.co === '2026-10-09');

  // Someone who booked their own hotel gets no Booking button at all.
  await page.evaluate(() => { setMyHotel(Object.keys(DEST).find(k => /kyoto/i.test(k)), 'My Own Ryokan'); });
  await page.waitForTimeout(1200);
  const mineRow = await page.evaluate(() => {
    const r = document.querySelector('#out .hotelrow');
    return r ? { hotel: (r.querySelector('.d a') || {}).textContent, book: !!r.querySelector('.booklink') } : null;
  });
  pass('a hotel they booked themselves gets no Booking link (' +
    (mineRow ? mineRow.hotel : 'none') + ')', !!mineRow && mineRow.book === false);

  console.log('\n=== THE BOOK BUTTON (' + THEME + ') ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 5).forEach(e => console.log('  ' + e));
  await b.close();
})();
