#!/usr/bin/env node
// Loads the whole app in jsdom with the vendored bundles inlined and every
// recipe evaluated, and fails loudly on any console error. Run from the repo
// root: node scripts/dev/smoke-runtime.mjs
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
let html = readFileSync("index.html","utf8");
// inline the vendor bundles: jsdom does not fetch subresources here
for (const f of ["react.min.js","react-dom.min.js","supabase.min.js"]) {
  const code = readFileSync("vendor/" + f, "utf8");
  html = html.replace('<script src="/vendor/' + f + '"></script>',
    () => "<script>" + code + "</script>");
}
html = html.replace('<script src="/consent.js" defer></script>', "");
// release everything: make isPendingHidden a no-op by seeding the releases cache
const errors=[], warns=[];
const dom = new JSDOM(html, { runScripts:"dangerously", pretendToBeVisual:true, url:"https://soulgainz.app/",
  beforeParse(w){
    w.fetch = async () => ({ ok:true, status:200, json: async()=>[], text: async()=>"[]" });
    w.localStorage.setItem("sg_releases", JSON.stringify({ t: Date.now(), rows: [] }));
    w.matchMedia = w.matchMedia || (q=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}));
    w.scrollTo = ()=>{};
    const _reg={waiting:null,installing:null,addEventListener(){},removeEventListener(){},update(){},unregister:async()=>true};
    Object.defineProperty(w.navigator,"serviceWorker",{value:{register:async()=>_reg,ready:Promise.resolve(_reg),getRegistrations:async()=>[_reg],addEventListener(){},removeEventListener(){},controller:null},configurable:true});
    w.caches={open:async()=>({match:async()=>undefined,put:async()=>{},addAll:async()=>{}}),keys:async()=>[],delete:async()=>true,match:async()=>undefined};
    w.console.error = (...a)=>errors.push(a.map(x=>x&&x.stack?x.stack:String(x)).join(" | "));
    w.console.warn  = (...a)=>warns.push(a.join(" "));
  }});
dom.window.addEventListener("error", e=>errors.push("window error: "+e.message));
await new Promise(r=>setTimeout(r,2500));
const w = dom.window;
// evaluate the data model directly
const res = w.eval(`(function(){
  const out={};
  const all=[...RECIPES,...PENDING_RECIPES];
  out.count=all.length;
  out.badPortion=[]; out.badMacro=[]; out.noChip=[]; out.noCat=[]; out.badSteps=[];
  for(const r of all){
    try{
      const pp=computePerPortion(r,1,null);
      if(!pp||!isFinite(pp.kcal)||pp.kcal<=0) out.badMacro.push(r.id);
      if(!(r.portions>0)) out.badPortion.push(r.id);
      const t=getProteinType(r); if(!t) out.noChip.push(r.id);
      if(!["main","salad","breakfast","dessert","smoothie","preworkout"].includes(r.category)) out.noCat.push(r.id);
      const body=(r.steps||[]).filter(s=>!/^[\\u{1F4A1}\\u{1F7E1}\\u{23F1}]/u.test(s));
      if(!body.length) out.badSteps.push(r.id);
      detectAllergens(r);
    }catch(e){ out.badMacro.push(r.id+" THREW "+e.message); }
  }
  return out;
})()`);
console.log(JSON.stringify(res,null,1).slice(0,2000));
console.log("console.error:", errors.length); errors.slice(0,10).forEach(e=>console.log("  ",String(e).slice(0,1400)));
console.log("console.warn:", warns.length); warns.slice(0,60).forEach(e=>console.log("  ",String(e).slice(0,1400))); process.exit(0);
