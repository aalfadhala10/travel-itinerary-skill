// The city keys, centres and existing place names, read out of the running app rather than
// scraped from 2.4MB of HTML with a regex. add-poi.cjs checks new places against this.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext()).newPage();
  // Read the COMMITTED index.html, not the working one. Once a batch is injected the working file
  // already contains it, and then every place in that batch reports itself as "already in the app"
  // — which buries the warning that actually matters: a genuine clash with the original data.
  const base = path.join(require('os').tmpdir(), 'bosla-base.html');
  require('child_process').execSync('git show HEAD:index.html > ' + JSON.stringify(base),
    { cwd: path.join(__dirname, '..'), shell: '/bin/bash' });
  await p.goto('file://' + base);
  await p.waitForTimeout(1800);
  const out = await p.evaluate(() => {
    const o = {};
    Object.keys(DEST).forEach(k => {
      o[k] = { city: DEST[k].city, country: DEST[k].country, co: CO[k] || null,
        poi: DEST[k].poi.map(x => x.n) };
    });
    return o;
  });
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'city-index.json'), JSON.stringify(out));
  console.log(Object.keys(out).length + ' cities dumped');
  await b.close();
})();
