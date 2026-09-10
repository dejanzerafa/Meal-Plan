import { readRecipes, editRecipe, writeFile } from "/sessions/clever-ecstatic-sagan/mnt/SoulGainz/scripts/lib/recipe-file.mjs";
const f = readRecipes();
let src = f.src; const rep = [];
const set = (id, fields) => {
  src = editRecipe(src, id, blk => {
    let o = blk;
    for (const [k, v] of Object.entries(fields)) {
      const re = new RegExp(`\\b${k}:\\s*"[^"]*"`);
      if (!re.test(o)) throw new Error(`${id}: ${k} not found`);
      o = o.replace(re, `${k}: ${JSON.stringify(v)}`);
    }
    return o;
  });
  rep.push(`${id} — ${Object.entries(fields).map(([k, v]) => `${k}→${v}`).join(", ")}`);
};
set("ds12", { badge: "⚡ Quick" });
set("ds13", { badge: "🥗 No-Cook", subtitle: "No-cook · 5 min" });
set("bf75", { badge: "🥗 No-Cook", subtitle: "No-cook · 10 min" });
set("m44", { subtitle: "95/5 lean ground beef · broccoli · brown rice · soy-ginger sauce · ~30 min" });
set("m49", { subtitle: "King prawns · brown rice · avocado · mango · lime-chilli dressing · ~20 min + chill" });
set("m50", { subtitle: "Chicken breast · brown rice · sweet potato · BBQ spice rub · broth · ~3 h 20 min + chill" });
set("m47", { subtitle: "Chicken breast · brown rice · edamame · broccoli · teriyaki glaze · ~30 min" });
set("v2",  { subtitle: "Firm tofu · edamame · broccoli · teriyaki sauce · brown rice · ~25 min + overnight" });
writeFile(src);
rep.forEach(l => console.log("  " + l));
console.log(`${rep.length} more applied`);
