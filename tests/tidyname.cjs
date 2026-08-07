// A Google listing title is not a place name. It is a shop sign plus whatever the owner typed
// into the search box, and a seven-day Gaziantep plan showed all three failure modes at once:
// "Kelebek Restoran | Paça - Beyran - Kebap", "Davinci Coffee Shop - ... - Forum Avm", and
// "GECE KEBAPÇISI NAZIM USTA". These pin the trimming, and pin that a correct name survives it.
//
// Turkish casing is the part worth guarding: a plain toLowerCase turns the dotted I into the
// wrong letter and misspells the very place being named.
//
//   node tests/tidyname.cjs
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'ai', 'worker.js'), 'utf8');
const i = src.indexOf('const BRANCH_TAIL'), j = src.indexOf('async function searchCategory');
if (i < 0 || j < 0) { console.log('FAIL — could not locate tidyName in worker.js'); process.exit(1); }
const tidy = new Function(src.slice(i, j) + '; return tidyName;')();

let P = 0, F = 0;
const ok = (m, c) => { c ? (P++, console.log('PASS — ' + m)) : (F++, console.log('FAIL — ' + m)); };

ok('keyword salad after a pipe is dropped',
   tidy('Kelebek Restoran | Paça - Beyran - Kebap') === 'Kelebek Restoran');
ok('a mall branch suffix is dropped',
   !/Forum Avm/i.test(tidy('Davinci Coffee Shop - Yeni Nesil Kahve Dükkanı - Forum Avm')));
ok('shouting becomes a name, with Turkish letters intact',
   tidy('GECE KEBAPÇISI NAZIM USTA') === 'Gece Kebapçısı Nazım Usta');
ok('a name already written properly is left alone',
   tidy('Sakıp Usta Paça Beyran Kebap') === 'Sakıp Usta Paça Beyran Kebap');
ok('Mall as part of a real name survives',
   tidy('SankoPark Mall') === 'SankoPark Mall');
ok('an English name is not mangled',
   tidy('Zeugma Mosaics Museum') === 'Zeugma Mosaics Museum');
ok('an Arabic name is untouched', tidy('متحف زيوغما') === 'متحف زيوغما');
ok('empty in, empty out', tidy('') === '' && tidy(null) === '');
ok('runaway length is capped', tidy('x'.repeat(200)).length <= 80);
ok('collapsed whitespace', tidy('  Two   Spaces  ') === 'Two Spaces');

console.log('\n' + P + ' passed, ' + F + ' failed');
process.exit(F ? 1 : 0);
