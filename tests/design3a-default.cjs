#!/usr/bin/env node
// The switch, both ways: a bare URL opens the redesign, ?design=classic goes back
// and sticks, ?design=3a returns. If this fails there is no way out of whichever
// one is broken.
const { chromium } = require('playwright');
const path=require('path');
const F='file://'+path.join(path.resolve(__dirname,'..'),'index.html');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS — ':'FAIL — ')+m); if(!c)fail++;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const ctx=await b.newContext({viewport:{width:390,height:844}});
  const p=await ctx.newPage();
  await p.route(/workers\.dev|er-api|open-meteo|aladhan|wikipedia|script\.google/,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await p.goto(F); await p.waitForTimeout(1200);
  ok(await p.locator('#d3').isVisible(),'a bare URL now opens the redesign');
  ok(await p.locator('.chatfab').isVisible(),'Ask Bosla is still reachable');
  await p.goto(F+'?design=classic'); await p.waitForTimeout(1200);
  ok(await p.locator('#app .hero').isVisible(),'?design=classic brings the old app back');
  await p.goto(F); await p.waitForTimeout(1200);
  ok(await p.locator('#app .hero').isVisible(),'…and the choice sticks');
  await p.goto(F+'?design=3a'); await p.waitForTimeout(1200);
  ok(await p.locator('#d3').isVisible(),'?design=3a returns to the redesign');
  await b.close(); console.log(fail?`\n${fail} failed`:'\nswitch works both ways');
  process.exit(fail?1:0);
})();
