#!/usr/bin/env node
// One language across both layers. The shell and the real app each hold their own
// idea of it; if they drift you get an English screen with an Arabic Ask pill.
const { chromium } = require('playwright');
let fail=0; const ok=(c,m)=>{console.log((c?'PASS — ':'FAIL — ')+m); if(!c)fail++;};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  await p.route(/workers\.dev|er-api|open-meteo|aladhan|wikipedia|script\.google/,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await p.goto('file://'+require('path').join(require('path').resolve(__dirname,'..'),'index.html')+'?design=3a');
  await p.waitForTimeout(1400);
  const en=await p.locator('.chatfab').innerText();
  ok(!/[؀-ۿ]/.test(en), `shell in English -> Ask pill in English ("${en.trim()}")`);
  await p.locator('#d3Lang').click(); await p.waitForTimeout(500);
  const ar=await p.locator('.chatfab').innerText();
  ok(/[؀-ۿ]/.test(ar), `shell in Arabic -> Ask pill in Arabic ("${ar.trim()}")`);
  await b.close(); console.log(fail?`\n${fail} failed`:'\nboth layers share one language');
  process.exit(fail?1:0);
})();
