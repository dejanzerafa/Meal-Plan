import { readFileSync } from "node:fs";
const parse = f => { const src = readFileSync(f,"utf8");
  const slice=(s,o,c)=>{const i=src.indexOf(s);const a=src.indexOf(o,i);const b=src.indexOf(c,a);return src.slice(a,b+c.length)};
  const R=eval(slice("const RECIPES =","[","\n];").replace(/\n];$/,"\n]"));
  const P=eval(slice("const PENDING_RECIPES","[","\n];").replace(/\n];$/,"\n]"));
  return Object.fromEntries([...R,...P].map(r=>[r.id,r])); };
const A = parse("/tmp/index.before.html"), B = parse("index.html");
const plans = Object.fromEntries(JSON.parse(readFileSync("recipe-intake/fix-plan-2026-09-07.json","utf8")).map(p=>[p.id,p]));
const shares = new Set("m43 m46 hol3 m62 hol8 m19 m88 m89 m90 m91 m92 m94 m95 m96 m98 m99 m100 m101 v10 v11".split(" "));
const idsA=Object.keys(A), idsB=Object.keys(B);
console.log("recipe count", idsA.length, "→", idsB.length);
console.log("ids added/removed:", idsB.filter(i=>!A[i]).concat(idsA.filter(i=>!B[i])).join(",")||"none");
let unexpected=[], expected=0;
for (const id of idsA) {
  const a=A[id], b=B[id]; if(!b) continue;
  const fields=["name","subtitle","category","badge","carb","portions"];
  const changed=[];
  for (const f of fields) if (JSON.stringify(a[f])!==JSON.stringify(b[f])) changed.push(f);
  if (JSON.stringify(a.steps)!==JSON.stringify(b.steps)) changed.push("steps");
  if (JSON.stringify(a.perPortion)!==JSON.stringify(b.perPortion)) changed.push("perPortion");
  if (JSON.stringify(a.allergens)!==JSON.stringify(b.allergens)) changed.push("allergens");
  const ai=(a.batchItems||[]).map(i=>`${i.key}|${i.qty}|${i.unit}|${i.label}`).join("~");
  const bi=(b.batchItems||[]).map(i=>`${i.key}|${i.qty}|${i.unit}|${i.label}`).join("~");
  if (ai!==bi) changed.push("items");
  const ash=(a.batchItems||[]).map(i=>i.share??"-").join(","), bsh=(b.batchItems||[]).map(i=>i.share??"-").join(",");
  if (ash!==bsh) changed.push("shares");
  if(!changed.length) continue;
  const p=plans[id];
  const allowed = changed.every(c =>
      (c==="steps"&&p&&p.steps) || (c==="subtitle"&&p&&p.subtitle) || (c==="name"&&p&&p.name) ||
      (c==="perPortion"&&p&&p.perPortion) || (c==="allergens"&&p&&p.allergens) ||
      (c==="items"&&p&&p.items.length) || (c==="shares"&&((p&&p.items.some(i=>i.share!=null))||shares.has(id))));
  if (allowed) expected++; else unexpected.push(id+": "+changed.join("+")+(p?"":" (NOT IN PLAN)"));
}
console.log("changed as planned:", expected);
console.log("unexpected changes:", unexpected.length); unexpected.slice(0,20).forEach(u=>console.log("  ",u));
// every recipe still parses and keeps its ingredient rows
const lost = idsB.filter(i=>!(B[i].batchItems||[]).length || !(B[i].steps||[]).length);
console.log("recipes with no items or no steps:", lost.join(",")||"none");
