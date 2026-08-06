// The placeinfo action, exercised without the Workers runtime: the block is lifted out of
// worker.js and run against a stub KV and a stub model, so the caching contract, the cost
// guards and the house rules are checked on every change rather than on deploy.
// Run: node tests/placeinfo.cjs
const fs=require('fs');
const src=fs.readFileSync('/home/user/travel-itinerary-skill/ai/worker.js','utf8');
// lift the block under test out of the module, so it can run without the Workers runtime
const a=src.indexOf('const PINFO_SCHEMA'), b=src.indexOf('// --- indicative hotel prices');
if(a<0||b<0){console.log('FAIL — could not locate the block');process.exit(1)}
const block=src.slice(a,b);

let P=0,F=0; const ok=(m,c)=>{c?(P++,console.log('PASS — '+m)):(F++,console.log('FAIL — '+m))};

function run(opts){
  const store=opts.store||{}; const calls=[];
  const kv={ get:async k=>(k in store?store[k]:null),
             put:async (k,v,o)=>{store[k]={v,o};store[k]=v;store['__opt:'+k]=o||null;} };
  const env={CITIES:kv, ANTHROPIC_API_KEY:opts.key===undefined?'sk-test':opts.key};
  const g={
    reply:(body,status)=>({body,status}),
    cityKey:n=>String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,''),
    overBudget:async()=>!!opts.over,
    spend:async()=>{},
    claude:async(k,model,sys,user,schema,max)=>{calls.push({model,sys,user});return opts.reply;},
    DAY_LLM_CAP:100,
  };
  const fn=new Function(...Object.keys(g),block+'; return placeInfo;')(...Object.values(g));
  return {fn,env,store,calls};
}
(async()=>{
  // 1. a normal miss: asks the model, answers, and caches
  let t=run({reply:{info:'A walled quarter of churches older than the mosque beside them. Worth an hour if you like quiet.'}});
  let r=await t.fn({action:'placeinfo',name:'Coptic Cairo',city:'Cairo',country:'Egypt',lang:'en'},t.env,'*');
  ok('a described place comes back with its line', /walled quarter/.test(r.body.info));
  const key=Object.keys(t.store).filter(k=>!k.startsWith('__opt'))[0];
  ok('cached under a key with colons, so isCityKey() excludes it ('+key+')', key.includes(':')&&key.startsWith('pinfo:v1:en:'));
  ok('a real description is cached with no TTL', t.store['__opt:'+key]===null||t.store['__opt:'+key]===undefined);

  // 2. second call is served from KV without touching the model
  let t2=run({reply:{info:'should not be asked'},store:{['pinfo:v1:en:cairo:copticcairo']:JSON.stringify({info:'from cache'})}});
  let r2=await t2.fn({action:'placeinfo',name:'Coptic Cairo',city:'Cairo',lang:'en'},t2.env,'*');
  ok('a cached place never reaches the model', r2.body.info==='from cache'&&t2.calls.length===0);

  // 3. the model declining to guess is stored as blank, retried in a week
  let t3=run({reply:{info:''}});
  let r3=await t3.fn({action:'placeinfo',name:'Zzz Unknown Place',city:'Cairo',lang:'en'},t3.env,'*');
  const k3=Object.keys(t3.store).filter(k=>!k.startsWith('__opt'))[0];
  ok('an unknown place returns empty rather than a guess', r3.body.info==='');
  ok('and is retried in a week, not cached forever', t3.store['__opt:'+k3] && t3.store['__opt:'+k3].expirationTtl===604800);

  // 4. house rule, enforced after the model as well as in the prompt
  let t4=run({reply:{info:'A site often compared to ones in Israel, worth a visit for the architecture.'}});
  let r4=await t4.fn({action:'placeinfo',name:'Somewhere',city:'Amman',lang:'en'},t4.env,'*');
  ok('a reply mentioning Israel is blanked', r4.body.info==='');

  // 5. markup can never come back
  let t5=run({reply:{info:'<img src=x onerror=alert(1)> A market hall with a glass roof and forty stalls under it.'}});
  let r5=await t5.fn({action:'placeinfo',name:'Market',city:'Cairo',lang:'en'},t5.env,'*');
  ok('angle brackets are stripped from the reply', !/[<>]/.test(r5.body.info));

  // 6. language routing
  let t6=run({reply:{info:'ساحة قديمة وسط البلد، تستاهل ساعة إذا تحب المشي.'}});
  await t6.fn({action:'placeinfo',name:'Somewhere',city:'Cairo',lang:'ar'},t6.env,'*');
  ok('Arabic asks the stronger model and for Khaleeji', t6.calls[0].model==='claude-sonnet-5'&&/Khaleeji/.test(t6.calls[0].sys));
  let t7=run({reply:{info:'Un mercado cubierto con cuarenta puestos bajo un techo de cristal.'}});
  await t7.fn({action:'placeinfo',name:'Somewhere',city:'Madrid',lang:'es'},t7.env,'*');
  ok('other languages use the cheap model', t7.calls[0].model==='claude-haiku-4-5'&&/Spanish/.test(t7.calls[0].sys));
  ok('and each language caches separately', Object.keys(t7.store).some(k=>k.startsWith('pinfo:v1:es:')));

  // 7. cost guards
  let t8=run({reply:{info:'x'},over:true});
  let r8=await t8.fn({action:'placeinfo',name:'Somewhere',city:'Cairo',lang:'en'},t8.env,'*');
  ok('over the day budget it answers empty instead of spending', r8.body.info===''&&t8.calls.length===0);
  let t9=run({reply:{info:'x'},key:''});
  let r9=await t9.fn({action:'placeinfo',name:'Somewhere',city:'Cairo',lang:'en'},t9.env,'*');
  ok('with no API key it answers empty instead of failing', r9.body.info===''&&t9.calls.length===0);

  // 8. junk in
  let t10=run({reply:{info:'x'}});
  let r10=await t10.fn({action:'placeinfo',name:'a',city:'Cairo',lang:'en'},t10.env,'*');
  ok('a one-character name is rejected', r10.status===400);
  let t11=run({reply:{info:'A short line about a real place that is long enough to keep.'}});
  await t11.fn({action:'placeinfo',name:'X'.repeat(400),city:'Y'.repeat(400),lang:'zz'},t11.env,'*');
  ok('oversized input is clamped and an unknown language falls back to English',
     Object.keys(t11.store).some(k=>k.startsWith('pinfo:v1:en:')));

  console.log('\n'+P+' passed, '+F+' failed');
  process.exit(F?1:0);
})();
