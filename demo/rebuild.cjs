// Rebuild the two demo pages from one source. The heavy data (world geometry, cities,
// airports) is read back out of the existing built globe.html, so this needs no geo/ folder:
//   node rebuild.cjs
// writes globe.html (the trip planner) and record.html (the travel record / passport).
const fs = require('fs');
const path = require('path');
const here = (f) => path.join(__dirname, f);

const built = fs.readFileSync(here('globe.html'), 'utf8');
const src = fs.readFileSync(here('globe.src.html'), 'utf8');

function grab(name) {
  const m = built.match(new RegExp('^var ' + name + '=.*?;$', 'm'));
  if (!m) throw new Error(name + ' not found in the current globe.html');
  return m[0];
}

let page = src;
for (const name of ['WORLD', 'CITIES', 'AIRPORTS', 'TRIPS'])
  page = page.replace('/*__' + name + '__*/', grab(name));

for (const [mode, file] of [['trip', 'globe.html'], ['rec', 'record.html']]) {
  const out = page.replace("var PAGEMODE='__MODE__';", "var PAGEMODE='" + mode + "';");
  fs.writeFileSync(here(file), out);
  console.log(file, fs.statSync(here(file)).size, 'bytes');
}
