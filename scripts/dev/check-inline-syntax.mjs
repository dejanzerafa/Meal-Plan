import { readFileSync } from "node:fs";
import * as acorn from "acorn";
const html = readFileSync("index.html", "utf8");
const RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
let m, n = 0, bad = 0;
while ((m = RE.exec(html))) {
  if (/\bsrc\s*=/i.test(m[1] || "")) continue;
  const code = m[2] || ""; if (!code.trim()) continue;
  const line = html.slice(0, m.index).split("\n").length;
  n++;
  try { acorn.parse(code, { ecmaVersion: "latest", sourceType: "script" }); }
  catch (e) { bad++; console.log(`FAIL inline script starting line ${line}: ${e.message}`); }
}
console.log(`${n} inline scripts, ${bad} broken`);
process.exit(bad ? 1 : 0);
