// Mohamed: one endless scrolling page. The plan should be tabs — trip, then a page per day.
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
  const plan = async (city, n, city2) => {
    await page.evaluate(([c, d, c2]) => {
      document.getElementById('dest').value = c;
      document.getElementById('dest2').value = c2 || '';
      if (c2) document.getElementById('city2wrap').classList.remove('is-hidden');
      document.getElementById('days').value = String(d);
      document.getElementById('planBtn').click();
    }, [city, n, city2 || '']);
    await page.waitForTimeout(1300);
  };
  const view = () => page.evaluate(() => {
    const out = document.getElementById('out');
    const pages = [...out.querySelectorAll(':scope > .pg')];
    const on = pages.findIndex(p => p.classList.contains('on'));
    return {
      pages: pages.length,
      tabs: [...out.querySelectorAll('.pgtab')].map(t => t.textContent.trim()),
      onIndex: on,
      visible: pages.filter(p => p.getBoundingClientRect().height > 0).length,
      shown: on >= 0 ? pages[on].textContent.replace(/\s+/g, ' ').trim().slice(0, 70) : '',
      days: [...out.querySelectorAll('.day')].length,
      collapsed: [...out.querySelectorAll('.day.dcol')].length,
    };
  });

  await open();
  await plan('Cairo', 4);
  const v = await view();
  // The four days, then Trip info / Budget / Flights / Stay. The days come first because the itinerary is what
  // you asked for when you tapped Plan; the summary, the shop and the cost follow it.
  pass('the plan is split into pages (' + v.pages + ' pages: ' + v.tabs.join(' ') + ')',
    v.pages === 8 && v.tabs[0] === 'Day 1' && v.tabs[3] === 'Day 4' &&
    v.tabs.slice(4).join(',') === 'Trip info,Budget,Flights,Stay');
  pass('only one page is on screen at a time (' + v.visible + ' visible)', v.visible === 1);
  pass('it opens on day 1 (' + v.shown.slice(0, 34) + ')',
    v.onIndex === 0 && /Trip|Cairo/i.test(v.shown));
  pass('every day is still there (' + v.days + ')', v.days === 4);
  pass('and a day is never collapsed — the day IS the page (' + v.collapsed + ' collapsed)', v.collapsed === 0);

  // forward from the trip: the info page, then day one
  await page.click('#out .pg.on .pgbtn.next'); await page.waitForTimeout(500);
  const inf = await view();
  pass('Next reaches the info page (' + inf.shown.slice(0, 30) + ')', inf.onIndex === 1);
  await page.click('#out .pg.on .pgbtn.next'); await page.waitForTimeout(500);
  const d1 = await view();
  pass('and then day 3 (' + d1.shown.slice(0, 34) + ')', d1.onIndex === 2 && /Day 3/.test(d1.shown));
  await page.click('#out .pg.on .pgbtn.next'); await page.waitForTimeout(500);
  const d2 = await view();
  pass('and then day 4 (' + d2.shown.slice(0, 34) + ')', d2.onIndex === 3 && /Day 4/.test(d2.shown));
  await page.click('#out .pg.on .pgbtn.prev'); await page.waitForTimeout(500);
  pass('Back returns to day 1', (await view()).onIndex === 2);

  // the next button says where you're going
  const preview = await page.evaluate(() => document.querySelector('#out .pg.on .pgbtn.next .pgwhat').textContent.trim());
  pass('the Next button names what is ahead (' + preview + ')', /Day|Trip info|Flights|Stay|Budget/.test(preview));

  // tabs jump straight there
  await page.click('#out .pgtab[data-pgt="3"]'); await page.waitForTimeout(500);
  const t4 = await view();
  pass('a tab jumps straight to that day (' + t4.shown.slice(0, 30) + ')', t4.onIndex === 3 && /Day 4/.test(t4.shown));

  // the ends are closed off — the last page is Budget now, not the last day
  const ends = await page.evaluate(() => {
    const tabs = document.querySelectorAll('#out .pgtab');
    pgGo(tabs.length - 1, true, true);
    const on = document.querySelector('#out .pg.on');
    return { next: on.querySelector('.pgbtn.next').disabled, prev: on.querySelector('.pgbtn.prev').disabled };
  });
  pass('the last page is the end, so Next is closed off', ends.next === true);
  await page.evaluate(() => {                    // Info sits after the days now
    const t = [...document.querySelectorAll('#out .pgtab')]
      .findIndex(x => /info|معلومات/i.test(x.textContent));
    pgGo(t, true, true);
  });
  await page.waitForTimeout(500);
  const info = await view();
  const infoCards = await page.evaluate(() => [...document.querySelector('#out .pg.on').children].map(c => c.className.split(' ')[0]));
  pass('the info page still gathers the trip-wide cards (' + infoCards.join(', ') + ')',
    infoCards.includes('ticket') && infoCards.includes('note'));
  // "change something?" lands where you land
  const overCards = await page.evaluate(() => [...document.querySelector('#out .pg.on').children].map(c => c.className.split(' ')[0]));
  pass('"change something?" sits with the summary, and the cost has its own page (' + overCards.join(', ') + ')',
    overCards.includes('editbar') && overCards.includes('ticket') &&
    !overCards.includes('bud') && !overCards.includes('actions'));

  // the bottom line is on every page, and opens the breakdown
  const cost = await page.evaluate(() => {
    const out = document.getElementById('out'), bar = out.querySelector('.pgcost');
    if (!bar) return null;
    const n = out.querySelectorAll(':scope > .pg').length, seen = [];
    for (let i = 0; i < n; i++) { pgGo(i, true); seen.push(bar.getBoundingClientRect().height > 0); }
    return { onEvery: seen.every(Boolean), text: bar.textContent.replace(/\s+/g, ' ').trim(), goes: bar.getAttribute('data-pgt') };
  });
  pass('the estimated total shows on every page (' + (cost ? cost.text : 'missing') + ')',
    !!cost && cost.onEvery && /\d/.test(cost.text));
  pass('and it says what tapping it does (' + (cost ? cost.text.slice(-16) : '') + ')',
    !!cost && /breakdown|التفاصيل|desglose/i.test(cost.text));
  await page.click('#out .pgcost'); await page.waitForTimeout(900);
  const opened = await page.evaluate(() => {
    const bud = document.querySelector('#out .pg.on .bud');
    const r = bud && bud.getBoundingClientRect();
    return { hasBudget: !!bud, marked: !!bud && bud.classList.contains('flash'),
      inView: !!r && r.top < innerHeight && r.bottom > 0 };
  });
  pass('tapping it lands ON the breakdown, not the top of a page', opened.hasBudget && opened.inView);
  pass('and marks it so the jump makes sense', opened.marked);

  // Save / share / print is a footer under EVERY page, not something to go hunting for
  const footEverywhere = await page.evaluate(() => {
    const out = document.getElementById('out');
    const foot = out.querySelector(':scope > .actions.pgfoot');
    if (!foot) return null;
    const n = out.querySelectorAll(':scope > .pg').length, seen = [];
    for (let i = 0; i < n; i++) { pgGo(i, true); seen.push(foot.getBoundingClientRect().height > 0); }
    return { onEveryPage: seen.every(Boolean), pages: n,
      has: [...foot.querySelectorAll('button,a')].map(b => b.textContent.trim()).slice(0, 6) };
  });
  pass('save/share/print is under every page (' + (footEverywhere && footEverywhere.pages) + ' pages: ' +
    (footEverywhere ? footEverywhere.has.join(', ') : 'missing') + ')',
    !!footEverywhere && footEverywhere.onEveryPage);
  const endBtn = await page.evaluate(() => document.querySelector('#out .pg.on .pgbtn.next').disabled);
  pass('and Next is closed off at the end', endBtn === true);

  // a background re-render must not throw you off the page you're reading
  await page.click('#out .pgtab[data-pgt="3"]'); await page.waitForTimeout(400);
  await page.evaluate(() => rerenderKeep()); await page.waitForTimeout(900);
  const kept = await view();
  pass('a background update leaves you on the page you were reading (' + kept.onIndex + ')', kept.onIndex === 3);

  // ...but a brand-new trip goes back to the front, whatever page you were on before
  await plan('Rome', 3);
  const fresh = await view();
  pass('a new trip opens on day one (' + fresh.pages + ' pages, page ' + fresh.onIndex + ')',
    fresh.onIndex === 0 && fresh.pages === 7);

  // printing must show the whole thing, not one page
  await page.emulateMedia({ media: 'print' });
  const printed = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('#out > .pg')];
    return { shown: pages.filter(p => getComputedStyle(p).display !== 'none').length, total: pages.length,
      nav: getComputedStyle(document.querySelector('.pgbar')).display };
  });
  await page.emulateMedia({ media: 'screen' });
  pass('printing shows every page, not just the open one (' + printed.shown + '/' + printed.total + ')',
    printed.shown === printed.total && printed.nav === 'none');

  // a multi-city route: the transfer card belongs to the day you travel, not its own page
  await plan('Doha', 6, 'Dubai');
  const route = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('#out > .pg')];
    return { pages: pages.length, withTransfer: pages.map((p, i) => p.querySelector('.transfer') ? i : -1).filter(i => i >= 0),
      transferHasDay: pages.filter(p => p.querySelector('.transfer')).every(p => !!p.querySelector('.day')) };
  });
  pass('a transfer rides with the day you travel (' + route.pages + ' pages, transfer on ' + route.withTransfer.join(',') + ')',
    route.transferHasDay);

  // Arabic
  await open('ar');
  await plan('Cairo', 3);
  const ar = await view();
  pass('Arabic gets Arabic tabs, in the new order (' + ar.tabs.join(' ') + ')',
    ar.tabs[0] === 'يوم 1' && ar.tabs.slice(3).join(',') === 'معلومات الرحلة,الميزانية,الطيران,الإقامة');

  console.log('\n=== PLAN AS PAGES ===');
  res.forEach(r => console.log(r));
  console.log('ERRORS: ' + errs.length); errs.slice(0, 5).forEach(e => console.log('  ' + e));
  await b.close();
})();
