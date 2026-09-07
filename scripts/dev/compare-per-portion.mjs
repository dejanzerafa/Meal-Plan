import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
const ids = process.argv[2].split(",");
async function load(file){
  let html = readFileSync(file,"utf8");
  for (const f of ["react.min.js","react-dom.min.js","supabase.min.js"]) html = html.replace('<script src="/vendor/'+f+'"></script>', ()=>"<script>"+readFileSync("vendor/"+f,"utf8")+"</script>");
  html = html.replace('<script src="/consent.js" defer></script>',"");
  const dom = new JSDOM(html,{runScripts:"dangerously",url:"https://soulgainz.app/",beforeParse(w){
    w.fetch=async()=>({ok:true,status:200,json:async()=>[],text:async()=>"[]"});
    const _r={waiting:null,installing:null,addEventListener(){},removeEventListener(){},update(){},unregister:async()=>true};
    Object.defineProperty(w.navigator,"serviceWorker",{value:{register:async()=>_r,ready:Promise.resolve(_r),getRegistrations:async()=>[_r],addEventListener(){},removeEventListener(){},controller:null},configurable:true});
    w.caches={open:async()=>({match:async()=>undefined,put:async()=>{},addAll:async()=>{}}),keys:async()=>[],delete:async()=>true,match:async()=>undefined};
    w.matchMedia=q=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
    w.scrollTo=()=>{}; w.console.warn=()=>{}; w.console.error=()=>{};
  }});
  await new Promise(r=>setTimeout(r,2000));
  return dom.window.eval(`(function(){const ids=${JSON.stringify(ids)};const all=[...RECIPES,...PENDING_RECIPES];const o={};
    for(const id of ids){const r=all.find(x=>x.id===id); if(!r){o[id]="MISSING";continue;}
      o[id]=[1,4,7,10].map(p=>{const m=computePerPortion(r,1,p);return m.kcal+"/"+m.protein+"/"+m.carbs+"/"+m.fat;}).join(" | ");}
    return o;})()`);
}
const a = await load("/tmp/index.before.html");
const b = await load("index.html");
let diff=0;
for(const id of ids){ if(a[id]!==b[id]){diff++;console.log("DIFF",id,"\n  before",a[id],"\n  after ",b[id]);} }
console.log(diff?`${diff} differ`:"identical at every portion count");
process.exit(0);
