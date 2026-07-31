// Injects data/poi-extra.json into index.html between the XPOI markers, refusing anything that
// looks wrong before it writes a single byte.
//
// The checks exist because a made-up place and a made-up coordinate cost the same to type and are
// both worse than an empty slot: one sends somebody to a shop that closed, the other put "Elmwood
// Avenue · 9105 km" on a day in Buffalo. Nothing goes in that cannot be defended.
//
//   node tools/add-poi.cjs            check and inject
//   node tools/add-poi.cjs --dry      check only, write nothing
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const DATA = path.join(ROOT, 'data', 'poi-extra.json');
const TAGS = ['Culture', 'Food', 'Nature', 'Adventure', 'Shopping', 'Relax'];
const NEAR_KM = 120;          // a sight belongs to its city; a day trip out is 80km at the most

function km(a, b) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.pow(Math.sin((b[0] - a[0]) * r / 2), 2) +
    Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.pow(Math.sin((b[1] - a[1]) * r / 2), 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

const html = fs.readFileSync(HTML, 'utf8');
const extra = JSON.parse(fs.readFileSync(DATA, 'utf8'));

// The city centres and the existing place names, exported from the running app by
// tools/dump-cities.cjs — regexing them out of 2.4MB of HTML gets it wrong in ways that are hard
// to notice, and a wrong centre would wave through a coordinate on another continent.
const IDX = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'city-index.json'), 'utf8'));
const CO = {}, existing = {};
Object.keys(IDX).forEach(k => { if (IDX[k].co) CO[k] = IDX[k].co; existing[k] = IDX[k].poi; });

const errs = [], warns = [];
let cities = 0, places = 0;
const tagCount = {};

Object.keys(extra).forEach(k => {
  const list = extra[k];
  if (!IDX[k]) { errs.push(k + ': no such city key'); return; }
  if (!Array.isArray(list) || !list.length) { errs.push(k + ': empty'); return; }
  const centre = CO[k];
  if (!centre) warns.push(k + ': no city centre known, distance not checked');
  const seen = {}, already = new Set(existing[k] || []);
  list.forEach(p => {
    const where = k + ' / ' + (p.n || '(unnamed)');
    if (!p.n || typeof p.n !== 'string') return errs.push(where + ': no name');
    if (seen[p.n]) return errs.push(where + ': listed twice in this batch');
    seen[p.n] = 1;
    if (already.has(p.n)) warns.push(where + ': already in the app, will be skipped at load');
    if (!Array.isArray(p.t) || !p.t.length) return errs.push(where + ': no tags');
    p.t.forEach(t => {
      if (TAGS.indexOf(t) < 0) errs.push(where + ': unknown tag "' + t + '"');
      tagCount[t] = (tagCount[t] || 0) + 1;
    });
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number')
      return errs.push(where + ': coordinates must be numbers');
    if (p.lat === 0 && p.lng === 0) return errs.push(where + ': 0,0 is not a place');
    if (p.lat < -90 || p.lat > 90 || p.lng < -180 || p.lng > 180)
      return errs.push(where + ': coordinates out of range');
    if (centre) {
      const d = km(centre, [p.lat, p.lng]);
      if (d > NEAR_KM) errs.push(where + ': ' + Math.round(d) + 'km from the city centre');
    }
    places++;
  });
  cities++;
});

console.log('cities in this batch : ' + cities);
console.log('places to add        : ' + places);
console.log('tags                 : ' + Object.entries(tagCount)
  .sort((a, b) => b[1] - a[1]).map(([t, n]) => t + ' ' + n).join(', '));
warns.slice(0, 12).forEach(w => console.log('  warn: ' + w));
if (warns.length > 12) console.log('  ...and ' + (warns.length - 12) + ' more warnings');
if (errs.length) {
  console.log('\nREFUSED — ' + errs.length + ' problem(s):');
  errs.slice(0, 25).forEach(e => console.log('  ' + e));
  process.exit(1);
}
if (process.argv.indexOf('--dry') >= 0) { console.log('\ndry run, nothing written'); process.exit(0); }

const start = html.indexOf('/*XPOI_START*/'), end = html.indexOf('/*XPOI_END*/');
if (start < 0 || end < 0) { console.error('markers missing from index.html'); process.exit(1); }
const out = html.slice(0, start) + '/*XPOI_START*/\n  var POI_MORE=' +
  JSON.stringify(extra) + ';\n  ' + html.slice(end);
fs.writeFileSync(HTML, out);
console.log('\ninjected into index.html (' + (out.length / 1048576).toFixed(2) + ' MB)');
