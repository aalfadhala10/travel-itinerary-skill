// The ranking stage is the only part of the discovery pipeline that is pure: no network, no model,
// no clock. That is deliberate — it means the thing that decides itinerary quality can actually be
// asserted on, which nothing else in the planner can.
const fs = require('fs');
let ok = 0, bad = 0;
const pass = (m, c) => { console.log((c ? 'PASS' : 'FAIL') + ' — ' + m); c ? ok++ : bad++; };

// pull the pure functions out of the worker without importing Cloudflare's runtime
const src = fs.readFileSync(require('path').join(__dirname, '..', 'ai', 'worker.js'), 'utf8');
const grab = (name, kind = 'function') => {
  const i = src.indexOf((kind === 'function' ? 'function ' : 'const ') + name);
  if (i < 0) throw new Error('not found: ' + name);
  let j = src.indexOf(kind === 'function' ? '{' : '[', i), d = 0, k = j;
  const open = src[j], close = open === '{' ? '}' : ']';
  for (; k < src.length; k++) {
    if (src[k] === open) d++;
    else if (src[k] === close) { d--; if (!d) break; }
  }
  return src.slice(i, k + 1) + (kind === 'const' ? ';' : '');
};
const ctx = {};
new Function('exports', [
  grab('PLACE_CATS', 'const'), grab('SIGNALS', 'const'),
  'const BAYES_PRIOR = 50;',
  grab('kmBetween'), grab('normName'), grab('cleanPool'), grab('rankPool'),
  grab('diversify'), grab('shortlist'), grab('cityUsable'),
  'Object.assign(exports,{cleanPool,rankPool,diversify,shortlist,cityUsable,kmBetween});',
].join('\n'))(ctx);

// distinct names AND positions by default: cleanPool dedupes same-name-same-spot, so a helper
// that stamped every fixture identically would collapse the whole pool into one row
let seq = 0;
const P = (o) => Object.assign({ id: 'x' + (++seq), n: 'Place ' + seq,
  lat: 25.2 + seq * 0.004, lng: 55.3 + seq * 0.004,
  r: 4.5, v: 500, s: 'OPERATIONAL', ty: ['tourist_attraction'], ad: 'Downtown',
  cat: 'landmark', kind: 'poi', tag: 'Culture' }, o);
const centre = { lat: 25.2, lng: 55.3 };

console.log('\n=== RANKING ===\n');

// 1. the thing that started all this
const few = P({ id: 'few', n: 'Tiny', r: 5.0, v: 9 });
const many = P({ id: 'many', n: 'Solid', r: 4.3, v: 900 });
const rk = ctx.rankPool([few, many], centre);
pass('a 4.3 from 900 outranks a 5.0 from 9 (' + rk.map(x => x.id).join(' > ') + ')',
  rk[0].id === 'many');

// 2. hard drops
const dropped = ctx.cleanPool([
  P({ id: 'shut', s: 'CLOSED_PERMANENTLY' }),
  P({ id: 'temp', s: 'CLOSED_TEMPORARILY' }),
  P({ id: 'thin', v: 3 }),
  P({ id: 'good' }),
]);
pass('closed, temporarily closed and barely-reviewed places are dropped (' +
  dropped.map(d => d.id).join(',') + ')', dropped.length === 1 && dropped[0].id === 'good');

// 3. duplicates
const dupes = ctx.cleanPool([
  P({ id: 'a', n: 'Burj Khalifa', lat: 25.1972, lng: 55.2744 }),
  P({ id: 'b', n: 'burj  khalifa!', lat: 25.1973, lng: 55.2745 }),
  P({ id: 'c', n: 'Burj Al Arab', lat: 25.1412, lng: 55.1853 }),
]);
pass('the same place under two spellings is one place (' + dupes.length + ' kept)', dupes.length === 2);

// 4. distance matters
const near = P({ id: 'near', lat: 25.2, lng: 55.3 });
const far = P({ id: 'far', lat: 25.9, lng: 55.9 });
const byDist = ctx.rankPool([far, near], centre);
pass('with everything else equal, nearer wins (' + byDist[0].id + ')', byDist[0].id === 'near');

// 5. type fit
const wrong = P({ id: 'wrong', cat: 'museum', ty: ['shopping_mall'] });
const right = P({ id: 'right', cat: 'museum', ty: ['museum'] });
const byFit = ctx.rankPool([wrong, right], centre);
pass('a mall returned for "museums" loses to a museum (' + byFit[0].id + ')', byFit[0].id === 'right');

// 6. diversity — the anti-nine-mosques rule
const sameType = Array.from({ length: 6 }, (_, i) =>
  P({ id: 'm' + i, ty: ['museum'], r: 4.9 - i * 0.01, v: 800 }));
const mixed = sameType.concat([
  P({ id: 'park', ty: ['park'], r: 4.4, v: 700 }),
  P({ id: 'market', ty: ['market'], r: 4.4, v: 700 }),
]);
const div = ctx.diversify(ctx.rankPool(mixed, centre), 4).map(x => x.ty[0]);
pass('four picks are not four museums (' + div.join(',') + ')', new Set(div).size >= 2);

// 7. a city that only has museums still fills up
const onlyMuseums = ctx.diversify(ctx.rankPool(sameType, centre), 4);
pass('but a city that only has museums still fills its slots (' + onlyMuseums.length + ')',
  onlyMuseums.length === 4);

// 8. the shortlist splits poi from food and never mixes them
const sl = ctx.shortlist(mixed.concat([
  P({ id: 'f1', kind: 'food', cat: 'food', ty: ['restaurant'] }),
  P({ id: 'f2', kind: 'food', cat: 'food', ty: ['cafe'] }),
]), centre);
pass('poi and food are shortlisted separately (' + sl.poi.length + ' poi, ' + sl.food.length + ' food)',
  sl.poi.length === 8 && sl.food.length === 2 && sl.poi.every(p => p.kind === 'poi'));

console.log('\n=== THE CACHE GATE ===\n');
const okCity = { valid: true, city: 'X', poi: Array.from({length:5},(_,i)=>({n:'p'+i,lat:1,lng:2})),
  food: [{n:'a'},{n:'b'},{n:'c'}] };
pass('a full city is cacheable', ctx.cityUsable(okCity) === true);
pass('a thin city is not', ctx.cityUsable(Object.assign({}, okCity, { poi: [{n:'p',lat:1,lng:2}] })) === false);
pass('nor is one whose coordinates are 0,0',
  ctx.cityUsable(Object.assign({}, okCity, { poi: okCity.poi.map(p=>({n:p.n,lat:0,lng:0})) })) === false);
pass('nor one the model marked invalid', ctx.cityUsable(Object.assign({}, okCity, { valid: false })) === false);

console.log('\nERRORS: ' + bad);
process.exit(bad ? 1 : 0);
