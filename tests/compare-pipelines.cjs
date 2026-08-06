#!/usr/bin/env node
// A/B the old (invention) pipeline against the new (Places discovery) one, on real output.
//
// This cannot run from the dev container — the egress proxy blocks the Worker and Google, and the
// keys live only in Cloudflare. Run it somewhere with plain internet.
//
//   1. In Cloudflare, set  DEBUG_PIPELINE = "1"        (enables ?fresh, which bypasses the cache)
//   2. With the CURRENT worker deployed:   node tests/compare-pipelines.cjs --tag old
//   3. Paste the new worker, then:         node tests/compare-pipelines.cjs --tag new
//   4. Compare:                            node tests/compare-pipelines.cjs --compare
//
// Every number below is measured. Nothing here is a judgement call, because a judgement call from
// the thing being judged is worth nothing.

const fs = require('fs'), path = require('path');
const API = process.env.BOSLA_API || 'https://bosla-api.ahmed-alfadala.workers.dev';
const CITIES = ['Cardiff','Bristol','Kyoto','Osaka','Bergen','Muscat','Ljubljana','Salzburg','Porto','Nara'];
const OUT = path.join(__dirname, '..', '.compare');

const arg = (f) => { const i = process.argv.indexOf(f); return i > 0 ? (process.argv[i+1] || true) : null; };

async function post(body) {
  const r = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

const km = (a,b,c,d) => { const R=6371,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r;
  const h=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h))); };
const norm = (s) => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');

// ---- the six things, measured -----------------------------------------------------------------
function measure(city, verify) {
  const poi = city.poi || [], food = city.food || [];
  const rated = (names) => names.map(n => verify.rated[n]).filter(Boolean);

  // QUALITY: what Google says about the places each pipeline chose
  const pr = rated(poi.map(p=>p.n)), fr = rated(food.map(f=>f.n));
  const avg = (xs,k) => xs.length ? +(xs.reduce((a,x)=>a+x[k],0)/xs.length).toFixed(2) : 0;
  const strong = (xs) => xs.filter(x => x.r >= 4.3 && x.n >= 200).length;

  // THE DECIDING METRIC: names Google has never heard of. Invention shows up here and nowhere else.
  const unknown = verify.unknown.length;
  const closed  = verify.closed.length;

  // VARIETY: distinct tag combinations across the day's stops
  const tagSets = new Set(poi.map(p => (p.t||[]).slice().sort().join('+')));

  // DUPLICATES: same name twice, or two stops on top of each other
  let dupes = 0; const seen = new Set();
  for (const p of poi) { const k = norm(p.n); if (seen.has(k)) dupes++; seen.add(k); }
  for (let i=0;i<poi.length;i++) for (let j=i+1;j<poi.length;j++)
    if (km(poi[i].lat,poi[i].lng,poi[j].lat,poi[j].lng) < 0.12) dupes++;

  // TRAVEL FLOW: how far the day actually walks, and how scattered the set is
  let hops = [];
  for (let i=1;i<poi.length;i++) hops.push(km(poi[i-1].lat,poi[i-1].lng,poi[i].lat,poi[i].lng));
  const total = hops.reduce((a,b)=>a+b,0);
  const cx = poi.reduce((a,p)=>a+p.lat,0)/(poi.length||1);
  const cy = poi.reduce((a,p)=>a+p.lng,0)/(poi.length||1);
  const spread = poi.length ? +(poi.reduce((a,p)=>a+km(p.lat,p.lng,cx,cy),0)/poi.length).toFixed(2) : 0;
  const absurd = hops.filter(h => h > 60).length;   // a "hop" that is really a day trip

  return {
    src: city.src || 'unknown',
    poi: poi.length, food: food.length,
    poiRating: avg(pr,'r'), poiReviews: Math.round(avg(pr,'n')), poiStrong: strong(pr),
    foodRating: avg(fr,'r'), foodReviews: Math.round(avg(fr,'n')), foodStrong: strong(fr),
    unverifiable: unknown, closed,
    variety: tagSets.size, duplicates: dupes,
    pathKm: +total.toFixed(1), spreadKm: spread, absurdHops: absurd,
    hasWhy: poi.filter(p=>p.w).length + food.filter(f=>f.w).length,
  };
}

async function run(tag) {
  fs.mkdirSync(OUT, { recursive: true });
  const rows = {};
  for (const c of CITIES) {
    process.stdout.write('  ' + c.padEnd(12));
    try {
      const { city } = await post({ action:'city', name:c, fresh:true });
      if (!city || !city.valid) { console.log('city build failed'); continue; }
      const names = (city.poi||[]).map(p=>p.n).concat((city.food||[]).map(f=>f.n));
      const verify = await post({ action:'places', names, city: city.city });
      rows[c] = measure(city, { rated: verify.rated||{}, unknown: verify.unknown||[], closed: verify.closed||[] });
      const m = rows[c];
      console.log(`src=${m.src.padEnd(7)} poi=${m.poi} ★${m.poiRating} unverifiable=${m.unverifiable} dupes=${m.duplicates} path=${m.pathKm}km`);
    } catch (e) { console.log('ERROR ' + e.message); }
  }
  fs.writeFileSync(path.join(OUT, tag + '.json'), JSON.stringify(rows, null, 1));
  console.log('\nwrote .compare/' + tag + '.json');
}

function compare() {
  const A = JSON.parse(fs.readFileSync(path.join(OUT,'old.json'),'utf8'));
  const B = JSON.parse(fs.readFileSync(path.join(OUT,'new.json'),'utf8'));
  const KEYS = [
    ['poiRating','attraction rating','up'], ['poiStrong','strong attractions (4.3+ & 200+)','up'],
    ['foodRating','restaurant rating','up'], ['foodStrong','strong restaurants','up'],
    ['unverifiable','places Google cannot find','down'], ['closed','closed places','down'],
    ['variety','distinct kinds of stop','up'], ['duplicates','duplicate stops','down'],
    ['pathKm','day path (km)','down'], ['absurdHops','absurd hops','down'],
    ['hasWhy','stops with a reason','up'],
  ];
  const cities = Object.keys(A).filter(c => B[c]);
  console.log('\n=== ' + cities.length + ' cities, old vs new ===\n');
  console.log('metric'.padEnd(34) + 'old'.padStart(9) + 'new'.padStart(9) + '   verdict');
  console.log('-'.repeat(70));
  let better = 0, worse = 0;
  for (const [k, label, dir] of KEYS) {
    const a = cities.reduce((s,c)=>s+(A[c][k]||0),0) / cities.length;
    const b = cities.reduce((s,c)=>s+(B[c][k]||0),0) / cities.length;
    const win = dir === 'up' ? b > a + 1e-9 : b < a - 1e-9;
    const lose = dir === 'up' ? b < a - 1e-9 : b > a + 1e-9;
    if (win) better++; if (lose) worse++;
    console.log(label.padEnd(34) + a.toFixed(2).padStart(9) + b.toFixed(2).padStart(9) +
      '   ' + (win ? 'better' : lose ? 'WORSE' : 'same'));
  }
  console.log('-'.repeat(70));
  console.log(`${better} metrics better, ${worse} worse.`);
  console.log(better > worse && worse === 0
    ? '\nNew pipeline wins outright — merging is justified.'
    : better > worse
      ? '\nNew pipeline wins on balance. Read the WORSE rows before merging.'
      : '\nNew pipeline does NOT win. Do not merge on this evidence.');
  console.log('\nPer city:');
  for (const c of cities)
    console.log('  ' + c.padEnd(11) + ` unverifiable ${A[c].unverifiable}→${B[c].unverifiable}` +
      `  ★${A[c].poiRating}→${B[c].poiRating}  dupes ${A[c].duplicates}→${B[c].duplicates}` +
      `  path ${A[c].pathKm}→${B[c].pathKm}km`);
}

(async () => {
  if (arg('--compare')) return compare();
  const tag = arg('--tag');
  if (tag !== 'old' && tag !== 'new') {
    console.log('usage: --tag old | --tag new | --compare'); process.exit(1);
  }
  console.log(`\nRunning ${CITIES.length} cities against ${API} (tag: ${tag})\n`);
  await run(tag);
})();
