#!/usr/bin/env node
// Run before merging to main:  NODE_PATH=/opt/node22/lib/node_modules node tools/preflight.cjs
//
// GitHub Pages deploys whatever lands on main, with nothing in between. This is that something:
// it refuses the four mistakes that have actually happened on this project rather than every
// mistake imaginable — a page that throws on load, city tables that drifted out of alignment,
// and the two manual bumps (the drawer stamp and the service-worker cache) that are easy to
// forget and invisible until a tester swears the fix never shipped.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS — ' : 'FAIL — ') + m); if (!c) fail++; };

function onMain(file) {
  // index.html is ~3MB, well past execSync's 1MB default — without maxBuffer this throws and the
  // comparison silently turns into "nothing to compare", which is the opposite of a safety net.
  try { return execSync(`git show origin/main:${file}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { return null; }         // no origin/main yet: nothing to compare, not a failure
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

// --- the two bumps ------------------------------------------------------------
const stamp = (s) => (s && (s.match(/id="drawerVer">([^<]*)</) || [])[1]) || null;
const cache = (s) => (s && (s.match(/const CACHE = '([^']+)'/) || [])[1]) || null;

const htmlOld = onMain('index.html'), swOld = onMain('sw.js');
if (htmlOld === null) {
  console.log('SKIP — no origin/main to compare against');
} else if (htmlOld === html && swOld === sw) {
  console.log('SKIP — nothing changed since origin/main');
} else {
  if (htmlOld !== html) {
    ok(stamp(html) && stamp(html) !== stamp(htmlOld),
      `drawer stamp bumped (${stamp(htmlOld)} -> ${stamp(html)})`);
  }
  ok(cache(sw) && cache(sw) !== cache(swOld),
    `service-worker cache bumped (${cache(swOld)} -> ${cache(sw)})`);
}

// --- the policy that must never silently vanish -------------------------------
ok(/connect-src[^"]*workers\.dev/.test(html), 'CSP still names the worker in connect-src');
ok(!/ahmed\.alfadala@gmail\.com/.test(html), 'no personal address in the app source');
ok(!/ANTHROPIC_API_KEY\s*[:=]\s*["'][^"']/.test(html), 'no API key in the app source');

// --- it loads, and the city tables line up ------------------------------------
(async () => {
  let chromium;
  try { chromium = require('playwright').chromium; }
  catch (e) { console.log('SKIP — playwright unavailable, browser checks not run'); return done(); }

  const b = await chromium.launch({ executablePath: EXE });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e.message).slice(0, 120)));
  await p.route(/workers\.dev|er-api|open-meteo|aladhan|wikipedia|script\.google/,
    r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await p.goto('file://' + path.join(ROOT, 'index.html'));
  await p.waitForTimeout(1500);
  ok(errs.length === 0, `the app loads without throwing (${errs[0] || 'clean'})`);

  const n = await p.evaluate(() => ({
    dest: Object.keys(DEST).length, co: Object.keys(CO).length, poi: Object.keys(POI_CO).length,
    hot: Object.keys(HOTELS_X).length, cur: Object.keys(CUR).length
  })).catch(() => null);
  ok(n && n.dest === n.co && n.dest === n.poi && n.dest === n.hot && n.dest === n.cur,
    `the five city tables are aligned (${n ? JSON.stringify(n) : 'could not read'})`);

  // A dropped minus sign parses fine and looks like a number, so nothing catches it. 73 were wrong
  // this way — every place in Belfast, Fes and Gibraltar, all of Bali, one each in Saint-Pierre and
  // Košice. Belfast's centre sat at -5.9 while its own places sat at +5.9, in Poland.
  // Worth being precise about the damage: each city's error was internally consistent, so hop
  // distances and day grouping still looked right, and the mini map is decorative. What it did
  // break is the "restaurants near here" link on a long day out, which opens raw coordinates —
  // and anything that ever measures real position: the globe, distance to an airport, per-place
  // weather. Wrong data that happens not to show yet is still wrong data.
  // The tell is that negating one component brings the place home.
  const bad = await p.evaluate(() => {
    const km = (a, b) => { const R = 6371, t = x => x * Math.PI / 180, dLa = t(b[0] - a[0]), dLo = t(b[1] - a[1]);
      const h = Math.sin(dLa / 2) ** 2 + Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(dLo / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h)); };
    const out = [];
    for (const k of Object.keys(DEST)) {
      const cen = CO[k], co = POI_CO[k] || {};
      if (!cen) continue;
      for (const [nm, c] of Object.entries(co)) {
        if (!c || c.length < 2) continue;
        const d = km(c, cen);
        if (d < 200) continue;                       // real excursions exist; 200km is generous
        if (km([-c[0], c[1]], cen) < 200 || km([c[0], -c[1]], cen) < 200)
          out.push(`${DEST[k].city}: ${nm} is ${Math.round(d)}km away, but flips home`);
      }
    }
    return out;
  }).catch(() => ['could not read']);
  ok(bad.length === 0, `no place has a flipped coordinate (${bad.length ? bad[0] : 'clean'})`);

  await b.close();
  done();
})();

function done() {
  console.log(fail ? `\n${fail} check(s) failed — do not merge` : '\nall preflight checks passed');
  process.exit(fail ? 1 : 0);
}
