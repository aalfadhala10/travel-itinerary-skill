// Natural Earth 110m via world-atlas (public domain data, ISC redistribution).
// TopoJSON -> a compact ring list: integer tenths of a degree, which is far more precision than a
// globe 320px across can show, and it drops the file by two thirds.
const fs = require('fs');
const topo = JSON.parse(fs.readFileSync('package/countries-50m.json', 'utf8'));
const o = topo.objects.countries, tr = topo.transform;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(d => { x += d[0]; y += d[1];
  return [x * tr.scale[0] + tr.translate[0], y * tr.scale[1] + tr.translate[1]]; }); });
const ring = (idx) => { const out = [];
  idx.forEach(i => { const rev = i < 0, a = arcs[rev ? ~i : i], p = rev ? a.slice().reverse() : a;
    p.forEach((pt, k) => { if (k === 0 && out.length) return; out.push(pt); }); });
  return out; };
const P = 20;                       // tenths of a degree
const enc = (r) => { let px = 0, py = 0; const o2 = [];
  r.forEach(p => { const x = Math.round(p[0] * P), y = Math.round(p[1] * P);
    if (o2.length && x === px && y === py) return; o2.push(x - px, y - py); px = x; py = y; });
  return o2; };
const out = { p: P, c: [] };
o.geometries.forEach(g => {
  const name = (g.properties && g.properties.name) || '';
  const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  const rings = [];
  polys.forEach(poly => poly.forEach((r, i) => { if (i > 0) return;   // outer ring only: no lakes
    const pts = ring(r); if (pts.length > 3) rings.push(enc(pts)); }));
  if (rings.length) out.c.push({ n: name, r: rings });
});
fs.writeFileSync('world-50m.json', JSON.stringify(out));
const names = out.c.map(c => c.n);
console.log('countries:', out.c.length, 'bytes:', fs.statSync('world-50m.json').size);
console.log('sample:', ['Kenya','Japan','Spain','Thailand','Turkey','Qatar','Egypt','Georgia']
  .map(n => n + '=' + (names.includes(n) ? 'ok' : 'MISSING')).join(' '));
