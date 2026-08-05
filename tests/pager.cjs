// "you know how you change the pages by pressing below... It's not clear for the users."
// The Back/Next pair sits at the FOOT of a day — a screen and a half below where you read.
// Arrows now live in the sticky strip, with a "day 3 of 7" line, and pages slide.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const FILE = 'file:///home/user/travel-itinerary-skill/index.html';

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [], res = [];
  const pass = (n, c) => res.push((c ? 'PASS' : 'FAIL') + ' — ' + n);
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await ctx.route(/workers\.dev|open\.er-api\.com/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

  const open = async (lang) => {
    await page.goto(FILE); await page.waitForTimeout(800);
    try { await page.click('.welbtn', { timeout: 900 }); } catch (e) {}
    try { await page.click('#introClose', { timeout: 600 }); } catch (e) {}
    await page.evaluate(l => applyLang(l), lang || 'en'); await page.waitForTimeout(150);
  };
  const plan = async (city, n) => {
    await page.evaluate(([c, d]) => {
      document.getElementById('dest').value = c; document.getElementById('dest2').value = '';
      document.getElementById('days').value = String(d);
      document.getElementById('planBtn').click();
    }, [city, n]);
    await page.waitForTimeout(1400);
  };
  const at = () => page.evaluate(() => {
    const out = document.getElementById('out');
    const pages = [...out.querySelectorAll(':scope > .pg')];
    return { i: pages.findIndex(p => p.classList.contains('on')),
      count: (out.querySelector('.pgcount') || {}).textContent || '',
      prev: out.querySelector('.pgarrow.prev').disabled,
      next: out.querySelector('.pgarrow.next').disabled };
  });

  await open();
  await plan('Cairo', 7);

  // 1. the arrows are ON SCREEN wherever you are in the day — that was the whole problem
  const inView = () => page.evaluate(() => {
    const a = [...document.querySelectorAll('#out .pgarrow')].map(x => x.getBoundingClientRect());
    return { ok: a.length === 2 && a.every(r => r.top >= 0 && r.bottom <= innerHeight && r.width > 0),
      size: a.map(r => Math.round(Math.min(r.width, r.height))), top: Math.round(a[0].top) };
  });
  const topOfDay = await inView();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(400);
  const bottomOfDay = await inView();
  pass('the arrows are on screen at the top of a day and still there at the bottom (y=' +
    topOfDay.top + ' → ' + bottomOfDay.top + ')', topOfDay.ok && bottomOfDay.ok);
  pass('and they are thumb-sized (' + topOfDay.size.join('×, ') + 'px)', topOfDay.size.every(s => s >= 34));
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);

  // 2. they turn the page
  // The plan opens on the trip itself now — what it is, how long, what it costs — with the info
  // page next and the days after that. So page 2 is day 1, not page 1.
  const start = await at();
  pass('it opens on day one and says so (' + start.count + ')', start.i === 0 && /Day 1 of 7/.test(start.count));
  await page.click('#out .pgarrow.next'); await page.waitForTimeout(400);
  const info = await at();
  pass('the right arrow goes to day two next (' + info.count + ')', info.i === 1 && /Day 2 of 7/.test(info.count));
  await page.click('#out .pgarrow.next'); await page.waitForTimeout(400);
  const one = await at();
  pass('and then day three (' + one.count + ')', one.i === 2 && /Day 3 of 7/.test(one.count));
  await page.click('#out .pgarrow.prev'); await page.waitForTimeout(400);
  await page.click('#out .pgarrow.prev'); await page.waitForTimeout(400);
  const over = await at();
  pass('and the left arrow walks back to day one (' + over.count + ')', over.i === 0 && /Day 1 of 7/.test(over.count));

  // 3. the ends are closed off, so nothing dead-ends silently
  pass('the left arrow is closed off on the first page', over.prev === true && over.next === false);
  const end = await page.evaluate(() => {
    const n = document.querySelectorAll('#out > .pg').length; pgGo(n - 1, true);
    return { prev: document.querySelector('#out .pgarrow.prev').disabled,
      next: document.querySelector('#out .pgarrow.next').disabled,
      count: document.querySelector('#out .pgcount').textContent };
  });
  pass('and the right arrow on the last (' + end.count + ')', end.next === true && end.prev === false);

  // 4. the counter is the point — on a long trip the highlighted chip scrolls out of sight
  const longTrip = await page.evaluate(() => {
    pgGo(4, true);   // day 5 — far enough in that its chip has scrolled out of sight
    const tabs = document.querySelector('#out .pgtabs'), cnt = document.querySelector('#out .pgcount');
    return { scrolls: tabs.scrollWidth > tabs.clientWidth + 4,
      count: cnt.textContent, countVisible: cnt.getBoundingClientRect().width > 0,
      font: parseFloat(getComputedStyle(cnt).fontSize) };
  });
  pass('on a 7-day trip the chip strip already scrolls (' + longTrip.scrolls + ')', longTrip.scrolls);
  // the days lead now, so page index and day number line up again — but the counter still reads
  // the page rather than counting its position, which is what keeps Info/Book/Budget correct.
  pass('and the counter says which DAY you are on regardless (' + longTrip.count + ')',
    /Day 5 of 7/.test(longTrip.count) && longTrip.countVisible);
  pass('at a size you can read (' + longTrip.font + 'px)', longTrip.font >= 14);

  // 5. the slide: short, direction-aware, and gone under reduced motion
  const slide = await page.evaluate(() => {
    pgGo(1, true);
    pgGo(2);
    const fwd = document.querySelector('#out .pg.on').className;
    const dur = getComputedStyle(document.querySelector('#out .pg.on')).animationDuration;
    pgGo(1);
    const back = document.querySelector('#out .pg.on').className;
    return { fwd: /slidefwd/.test(fwd), back: /slideback/.test(back), dur };
  });
  pass('going forward slides forward, going back slides back', slide.fwd && slide.back);
  pass('and it is short enough to tap through (' + slide.dur + ')', parseFloat(slide.dur) <= 0.25);
  const noMotion = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('#out .pg.on'));
    return s.animationName;
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { pgGo(1, true); pgGo(2); });
  const reduced = await page.evaluate(() => getComputedStyle(document.querySelector('#out .pg.on')).animationName);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  pass('anyone who asked for less motion gets none (' + noMotion + ' → ' + reduced + ')', reduced === 'none');

  // 6. a background update must not re-slide under you
  await page.evaluate(() => pgGo(3, true));
  await page.evaluate(() => rerenderKeep()); await page.waitForTimeout(900);
  const kept = await page.evaluate(() => ({
    i: [...document.querySelectorAll('#out > .pg')].findIndex(p => p.classList.contains('on')),
    anim: getComputedStyle(document.querySelector('#out .pg.on')).animationName,
    count: document.querySelector('#out .pgcount').textContent }));
  pass('a background update leaves the page still, on the day you were reading (' + kept.i + ', ' + kept.count + ')',
    kept.i === 3 && kept.anim === 'none');

  // 7. the old footer buttons still work — nothing was taken away
  await page.click('#out .pg.on .pgbtn.next'); await page.waitForTimeout(400);
  pass('the Back/Next pair at the foot still turns the page', (await at()).i === 4);

  // 8. Arabic: the arrows point the way Arabic reads
  await open('ar');
  await plan('Cairo', 5);
  // The plan opens on الرحلة now, so step onto a day before asking what the day counter says.
  await page.evaluate(() => pgGo(pgIndexOfDay(1), true, true));
  const ar = await page.evaluate(() => {
    const prev = document.querySelector('#out .pgarrow.prev'), next = document.querySelector('#out .pgarrow.next');
    // the drawn path is the truth: read where the chevron's tip sits inside its own box
    const tip = (b) => { const d = b.querySelector('svg path').getAttribute('d');
      return /M15 5l-7 7 7 7/.test(d) ? 'left' : 'right'; };
    return { prevArrow: tip(prev), nextArrow: tip(next), prevSays: prev.getAttribute('data-arrow'),
      glyphs: prev.textContent.trim() + next.textContent.trim(),
      prevRight: prev.getBoundingClientRect().left > next.getBoundingClientRect().left,
      count: document.querySelector('#out .pgcount').textContent.trim(),
      label: prev.getAttribute('aria-label') };
  });
  pass('in Arabic "back" sits on the right and points right (' + ar.prevArrow + '/' + ar.nextArrow + ')',
    ar.prevRight && ar.prevArrow === 'right' && ar.nextArrow === 'left');
  // ‹ and › are Bidi_Mirrored: written as text the browser flips them and back points forward
  pass('the arrows are drawn, not typed, so nothing can flip them', ar.glyphs === '');
  pass('and the counter is Arabic (' + ar.count + ')', /اليوم ١|اليوم 1/.test(ar.count) && /من 5|من ٥/.test(ar.count));
  pass('the arrows say what they do for a screen reader (' + ar.label + ')', ar.label === 'السابق');
  await page.click('#out .pgarrow.next'); await page.waitForTimeout(400);
  const ar2 = await page.evaluate(() => document.querySelector('#out .pgcount').textContent.trim());
  pass('and the Arabic "next" arrow still moves forward (' + ar2 + ')', /اليوم 2|اليوم ٢/.test(ar2));

  // 9. Spanish
  await open('es');
  await plan('Cairo', 4);
  await page.evaluate(() => pgGo(pgIndexOfDay(1), true, true));
  const es = await page.evaluate(() => document.querySelector('#out .pgcount').textContent.trim());
  pass('Spanish counts in Spanish (' + es + ')', /Día 1 de 4/.test(es));

  console.log('\n=== THE PAGER YOU CAN FIND ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 5).forEach(e => console.log('  ' + e));
  await b.close();
})();
