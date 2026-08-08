// The velocity snapshot, exercised without the Workers runtime.
//
// Trending is a derivative and cannot be backfilled — which makes the shape of this key the one
// thing that must be right the first time. A wrong prefix or a short TTL is not a bug you notice
// for two months, and by then the data you needed is gone.
//
//   node tests/velocity.cjs
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ai', 'worker.js'), 'utf8');

let P = 0, F = 0;
const ok = (m, c) => { c ? (P++, console.log('PASS — ' + m)) : (F++, console.log('FAIL — ' + m)); };

// the snapshot block, lifted out of poolFor
const i = src.indexOf('if (kv && all.length) {\n    const stamp');
ok('the snapshot block is present in poolFor', i > 0);
const blk = src.slice(i, i + 700);

ok('keyed by month, not by day — a daily key would be noise and 30x the writes',
   /toISOString\(\).slice\(0, 7\)/.test(blk));
ok('prefixed vel: so isCityKey() never hands it out as a city',
   /"vel:" \+ cityKey\(city\) \+ ":" \+ stamp/.test(blk));
ok('the key carries a colon, which is what excludes it from an admin dump',
   src.includes('"vel:" + cityKey(city) + ":"'));
ok('stores id -> review count only, nothing identifying',
   /snap\[c\.id\] = c\.v/.test(blk));
ok('skips candidates with no id or no reviews rather than storing zeroes',
   /if \(c\.id && c\.v\)/.test(blk));
ok('kept 400 days — long enough to compare a year apart',
   /expirationTtl: 34560000/.test(blk));
ok('writes are wrapped, so a KV failure cannot break a city build',
   /try \{[\s\S]*kv\.put\("vel:"[\s\S]*catch \(e\) \{\}/.test(blk));
ok('costs no API call — it reads the pool already in memory',
   !/searchCategory|fetch\(/.test(blk));

// the month stamp must sort lexically, or comparing "the last two" breaks
const months = ['2026-08', '2026-09', '2026-10', '2027-01'];
ok('month stamps sort chronologically as plain strings',
   JSON.stringify([...months].sort()) === JSON.stringify(months));

console.log('\n' + P + ' passed, ' + F + ' failed');
process.exit(F ? 1 : 0);
