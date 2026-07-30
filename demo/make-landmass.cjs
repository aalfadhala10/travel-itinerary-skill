// Which cities you can reach from which others without getting on a boat.
//
// Sampling the straight line for water does not answer this. Athens to Thessaloniki is 80% water
// as the crow flies — the line goes over the Aegean — and is a perfectly ordinary drive up the
// coast. The question is not "does the line cross water", it is "are these two on the same piece
// of land", and that is a connectivity problem, not a geometry one.
//
// So: rasterise every coastline to a 0.1° grid, flood-fill the land, and label each of the 738
// cities with the landmass it sits on. Same label, there is a road. Different label, there is a
// boat — or a bridge, and those are few enough to name.
const fs = require('fs');

const STEP = 0.1;
const W = Math.round(360 / STEP), H = Math.round(180 / STEP);
const grid = new Uint8Array(W * H);

const src = JSON.parse(fs.readFileSync('scratchpad/geo/world-50m.json', 'utf8'));
const P = src.p;
const rings = [];
src.c.forEach(c => c.r.forEach(a => {
  let x = 0, y = 0; const o = [];
  for (let i = 0; i < a.length; i += 2) { x += a[i]; y += a[i + 1]; o.push([x / P, y / P]); }
  rings.push(o);
}));

// Scanline fill: for each row of the grid, find where the ring's edges cross it and fill between
// the crossings in pairs. Holes get filled in as land too, which is the right kind of wrong here —
// a lake does not disconnect the shore around it.
const col = x => Math.floor((x + 180) / STEP);
const row = y => Math.floor((90 - y) / STEP);
rings.forEach(r => {
  let mny = 90, mxy = -90;
  r.forEach(q => { if (q[1] < mny) mny = q[1]; if (q[1] > mxy) mxy = q[1]; });
  for (let ry = Math.max(0, row(mxy)); ry <= Math.min(H - 1, row(mny)); ry++) {
    const y = 90 - (ry + 0.5) * STEP, xs = [];
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const yi = r[i][1], yj = r[j][1];
      if ((yi > y) !== (yj > y)) xs.push(r[j][0] + (y - yj) / (yi - yj) * (r[i][0] - r[j][0]));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.max(0, col(xs[k])), c1 = Math.min(W - 1, col(xs[k + 1]));
      for (let cx = c0; cx <= c1; cx++) grid[ry * W + cx] = 1;
    }
  }
});

// Flood fill, 8-connected so a diagonal isthmus still counts as joined, wrapping at the
// antimeridian because Chukotka does not stop being land at 180°.
const comp = new Int32Array(W * H).fill(-1);
let n = 0; const size = [];
const stack = new Int32Array(W * H);
for (let i = 0; i < W * H; i++) {
  if (!grid[i] || comp[i] >= 0) continue;
  let sp = 0, count = 0; stack[sp++] = i; comp[i] = n;
  while (sp) {
    const p = stack[--sp]; count++;
    const py = (p / W) | 0, px = p % W;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const ny = py + dy; if (ny < 0 || ny >= H) continue;
      const nx = (px + dx + W) % W;
      const q = ny * W + nx;
      if (grid[q] && comp[q] < 0) { comp[q] = n; stack[sp++] = q; }
    }
  }
  size.push(count); n++;
}

// A 0.1° cell is about 11km across, so a strait narrower than that welds its two shores together.
// Two of them matter here: Sicily reads as part of Italy across the 3km at Messina, where there is
// no bridge and never has been, and Corfu reads as part of the mainland across the 2km channel to
// Albania. Boxes rather than names, so an airport inside one is caught the same way a city is.
const SEVER = [
  { n: 'Sicily', lat: [36.60, 38.32], lon: [12.35, 15.62] },
  { n: 'Corfu',  lat: [39.30, 39.85], lon: [19.55, 20.15] },
];
// And the reverse: two landmasses the water separates but engineering does not. Named by a city on
// each side, so the list stays readable and the ids can move underneath it.
const LINK = [
  ['London', 'Paris'],        // the Channel Tunnel
  ['Manama', 'Dammam'],       // the King Fahd Causeway
  ['Tokyo', 'Sapporo'],       // the Seikan Tunnel
];

const J = JSON.parse(fs.readFileSync('scratchpad/cities.json', 'utf8'));
const cities = J.cities;
let ownIsland = 0;
function severed(lat, lng) {
  for (const s of SEVER)
    if (lat >= s.lat[0] && lat <= s.lat[1] && lng >= s.lon[0] && lng <= s.lon[1]) return s;
  return null;
}
const SEVID = {};
SEVER.forEach((s, i) => { SEVID[s.n] = 1000000 + i; });
// A city may land on a sea cell — a coastal town against a coastline drawn to 0.1°, or a small
// island the raster missed. Look outward a little; anything still not found is its own island,
// which for our purposes is exactly right: you take a boat to it.
function labelOf(lat, lng) {
  const s = severed(lat, lng);
  if (s) return SEVID[s.n];
  const cy = row(lat), cx = col(lng);
  for (let r = 0; r <= 4; r++) {
    let best = -1, bd = 1e9;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const ny = cy + dy; if (ny < 0 || ny >= H) continue;
      const q = ny * W + ((cx + dx + W) % W);
      if (comp[q] >= 0) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = comp[q]; } }
    }
    if (best >= 0) return best;
  }
  ownIsland++;
  return -1 - ownIsland;                       // a unique negative: connected to nothing
}
const label = cities.map(c => labelOf(c[3], c[4]));

// The airports need the same treatment, or a gateway on the wrong island quietly becomes a drive.
const AP = JSON.parse(fs.readFileSync('scratchpad/airports.json', 'utf8'));
AP.forEach(a => { a[5] = labelOf(a[3], a[4]); });
fs.writeFileSync('scratchpad/airports.json', JSON.stringify(AP));

const byName = {}; cities.forEach((c, i) => { byName[c[0]] = label[i]; });
J.links = LINK.map(([a, b]) => {
  if (byName[a] === undefined || byName[b] === undefined)
    throw new Error('fixed link names a city that is not in the list: ' + a + ' / ' + b);
  if (byName[a] === byName[b]) return null;    // the raster already joined them; nothing to say
  return [byName[a], byName[b]];
}).filter(Boolean);
console.log('fixed links: ' + J.links.length + ' of ' + LINK.length + ' needed (' +
  LINK.map(([a, b]) => a + '/' + b).join(', ') + ')');

// Name each landmass after the biggest thing on it, so the fixed-link list below is readable
// instead of being a set of magic numbers that shift whenever the geometry does.
const byComp = {};
label.forEach((L, i) => { (byComp[L] = byComp[L] || []).push(cities[i][0]); });
const named = Object.keys(byComp).map(k => ({ id: +k, cells: +k >= 0 ? size[+k] : 0,
  cities: byComp[k] })).sort((a, b) => b.cities.length - a.cities.length);
console.log(named.length + ' landmasses hold the 738 cities (' + ownIsland + ' too small to raster)\n');
named.forEach(g => console.log(('  ' + g.cities.length + ' cities').padEnd(14) +
  (g.cells + ' cells').padEnd(12) + g.cities.slice(0, 6).join(', ') +
  (g.cities.length > 6 ? ' …' : '')));

J.land = label;
fs.writeFileSync('scratchpad/cities.json', JSON.stringify(J));
console.log('\ncities.json now carries a landmass per city');
