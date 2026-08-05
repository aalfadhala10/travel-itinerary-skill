// "خل اول مايسوي تخطيط الرحله تكون البدايه من الرحله مب من اول يوم
//  و صفحه المعلومات يمكن لازم تكون بعد فالبدايه بعدها الجدول"
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
  await ctx.route(/workers\.dev|open\.er-api\.com/, r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

  const plan = async (lang, city, days) => {
    await page.goto(FILE); await page.waitForTimeout(800);
    try { await page.click('.welbtn', { timeout: 900 }); } catch (e) {}
    try { await page.click('#introClose', { timeout: 600 }); } catch (e) {}
    await page.evaluate(l => { applyLang(l); try { localStorage.clear(); } catch (e) {} }, lang);
    await page.evaluate(([c, d]) => {
      document.getElementById('dest').value = c; document.getElementById('dest2').value = '';
      document.getElementById('days').value = String(d);
      document.getElementById('planBtn').click();
    }, [city, days]);
    await page.waitForTimeout(2800);
    return page.evaluate(() => ({
      tabs: [...document.querySelectorAll('.pgtab')].map(t => t.textContent.trim()),
      kinds: [...document.querySelectorAll('#out > .pg')].map(p => p.getAttribute('data-pgk')),
      onIndex: [...document.querySelectorAll('#out > .pg')].findIndex(p => p.classList.contains('on')),
      onKind: (document.querySelector('#out > .pg.on') || {}).getAttribute
        ? document.querySelector('#out > .pg.on').getAttribute('data-pgk') : null,
      count: (document.querySelector('.pgcount') || {}).textContent,
      page: PAGE,
    }));
  };

  // English, one city, a week
  let s = await plan('en', 'Dubai', 7);
  pass('a brand-new plan opens on day one (page ' + s.page +
    ', "' + s.count + '")', s.onIndex === 0 && s.onKind === 'day');
  pass('the strip reads the days, then Info/Book/Budget (' + s.tabs.join(' · ') + ')',
    s.tabs[0] === 'Day 1' && s.tabs[6] === 'Day 7' &&
    s.tabs.slice(7).join(',') === 'Info,Book,Budget');
  pass('and the pages are ordered to match (' + s.kinds.join(',') + ')',
    s.kinds.slice(0, 7).every(k => k === 'day') &&
    s.kinds.slice(7).join(',') === 'info,book,budget');

  // the counter must name the DAY, not the page it happens to sit on
  const walk = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i < 4; i++) { pgGo(i, true, true); out.push(document.querySelector('.pgcount').textContent); }
    return out;
  });
  pass('the counter follows the day, not the page number (' + walk.join(' | ') + ')',
    walk[0] === 'Day 1 of 7' && walk[1] === 'Day 2 of 7' &&
    walk[2] === 'Day 3 of 7' && walk[3] === 'Day 4 of 7');

  // "jump to day 5" has to land on day 5, not on whatever page 5 became
  const jump = await page.evaluate(() => {
    const el = document.querySelector('.dnav[data-day="5"]');
    if (el) el.click(); else pgGo(pgIndexOfDay(5), true, true);
    const on = document.querySelector('#out > .pg.on');
    return { day: on.getAttribute('data-pgday'), label: document.querySelector('.pgcount').textContent };
  });
  pass('jumping to day 5 lands on day 5 (' + jump.label + ')',
    jump.day === '5' && /Day 5 of 7/.test(jump.label));

  // Arabic reads the same way round
  s = await plan('ar', 'دبي', 5);
  pass('Arabic opens on day one too (' + s.count + ')', s.onIndex === 0 && s.onKind === 'day');
  pass('and the Arabic strip is the days, then معلومات · الحجز · الميزانية (' + s.tabs.join(' · ') + ')',
    s.tabs[0] === 'يوم 1' && s.tabs.slice(5).join(',') === 'معلومات,الحجز,الميزانية');
  await page.screenshot({ path: 'pg-ar-' + THEME + '.png' });

  // a re-render must NOT throw you back to the trip page
  await page.evaluate(() => pgGo(pgIndexOfDay(3), true, true));
  const before = await page.evaluate(() => PAGE);
  await page.evaluate(() => { if (typeof retuneDays === 'function') retuneDays(); paginate(); });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => PAGE);
  pass('a re-render keeps you where you were (page ' + before + ' → ' + after + ')', before === after);

  console.log('\n=== WHERE THE PLAN OPENS (' + THEME + ') ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 5).forEach(e => console.log('  ' + e));
  await b.close();
})();
