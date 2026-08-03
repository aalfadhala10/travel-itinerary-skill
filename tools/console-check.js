(async () => {
  const R = [], ok = (p, n, d) => R.push([p ? 'PASS' : 'FAIL', n, d || '']);
  const line = '─'.repeat(64);

  // ---- 1. served correctly ------------------------------------------------
  ok(location.protocol === 'https:', 'served over HTTPS', location.origin);
  const files = ['privacy.html', 'terms.html', 'demo/globe.html', 'manifest.webmanifest',
                 'favicon.svg', 'icon-192.png', 'icon-512.png', 'og-image.png'];
  for (const f of files) {
    let s = 0; try { s = (await fetch('./' + f, { method: 'HEAD' })).status; } catch (e) {}
    ok(s === 200, 'loads: ' + f, s);
  }

  // ---- 2. the security headers _headers is meant to add -------------------
  let h = {};
  try { h = Object.fromEntries((await fetch(location.href, { cache: 'no-store' })).headers.entries()); } catch (e) {}
  ok(/max-age=\d+/.test(h['strict-transport-security'] || ''), 'HSTS header', h['strict-transport-security']);
  ok((h['x-frame-options'] || '').toUpperCase() === 'DENY', 'X-Frame-Options', h['x-frame-options']);
  ok((h['x-content-type-options'] || '') === 'nosniff', 'nosniff', h['x-content-type-options']);
  ok(/strict-origin/.test(h['referrer-policy'] || ''), 'Referrer-Policy', h['referrer-policy']);
  ok(/frame-ancestors/.test(h['content-security-policy'] || ''), 'CSP frame-ancestors header', h['content-security-policy']);

  // ---- 3. the whole point: no more stale builds ---------------------------
  ok(/must-revalidate|no-cache|max-age=0/.test(h['cache-control'] || ''),
     'HTML is revalidated, not cached for 10 min', h['cache-control']);

  // ---- 4. PWA --------------------------------------------------------------
  const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
  ok(!!(reg && reg.active), 'service worker active', reg && reg.active && reg.active.state);
  ok(!!navigator.serviceWorker.controller, 'service worker controls this page');
  ok(reg ? new URL(reg.scope).pathname === '/' : false, 'scope is the origin root', reg && reg.scope);
  const keys = await caches.keys();
  const urls = (await Promise.all(keys.map(k => caches.open(k).then(c => c.keys()))))
    .flat().map(r => new URL(r.url).pathname);
  ok(keys.length === 1, 'exactly one cache (old ones cleaned up)', keys.join(','));
  ok(urls.some(u => u === '/' || u === '/index.html'), 'app shell cached', urls.length + ' entries');
  ok(!urls.some(u => /workers\.dev|script\.google/.test(u)), 'no API response cached');

  // ---- 5. URLs -------------------------------------------------------------
  const meta = n => (document.querySelector(`meta[property="${n}"],meta[name="${n}"]`) || {}).content || '';
  ok(meta('og:url').startsWith(location.origin), 'og:url matches this origin', meta('og:url'));
  ok(meta('og:image').startsWith(location.origin), 'og:image matches this origin', meta('og:image'));
  ok(typeof appHome === 'function' && appHome() === location.origin + '/',
     'appHome() resolves to this origin', typeof appHome === 'function' ? appHome() : 'missing');
  ok(!document.documentElement.innerHTML.includes('aalfadhala10.github.io'),
     'no github.io URL left in the app');

  // ---- 6. the Worker — EXPECTED TO FAIL until Phase 3 ----------------------
  let api = 'unreachable';
  try {
    const r = await fetch('https://shy-fire-8a78.ahmed-alfadala.workers.dev', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' }) });
    api = r.status + ' ' + JSON.stringify(await r.json()).slice(0, 60);
  } catch (e) { api = 'blocked: ' + e.message; }

  // ---- report --------------------------------------------------------------
  const bad = R.filter(r => r[0] === 'FAIL');
  console.log('\n' + line + '\n  BOSLA — Cloudflare Pages preview check\n  ' + location.href + '\n' + line);
  R.forEach(r => console.log(`  ${r[0]}  ${r[1]}${r[2] ? '   → ' + r[2] : ''}`));
  console.log(line);
  console.log(`  ${R.length - bad.length} passed, ${bad.length} failed`);
  console.log(line);
  console.log('  Worker reply: ' + api);
  console.log('  ^ EXPECTED to be refused until Phase 3 — the Worker has not been');
  console.log('    re-pasted, so it does not know this origin yet. Chat, community');
  console.log('    and building a new city will not work. Planning a known city will.');
  console.log(line);
  return { passed: R.length - bad.length, failed: bad.length, failures: bad.map(b => b[1]), api };
})();
