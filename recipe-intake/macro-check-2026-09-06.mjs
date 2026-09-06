// Per-serving macros computed from ingredient weights. Registry rows from
// ING_FLAT (per 100 g raw); items the registry lacks use USDA FoodData Central
// values inline, marked USDA.
import { readFileSync } from "node:fs";
const raw = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const a = raw.indexOf("const ING_FLAT = ["); const s = raw.indexOf("[", a); let d = 0, b = s;
for (; b < raw.length; b++) { if (raw[b] === "[") d++; else if (raw[b] === "]") { d--; if (!d) break; } }
const ING = eval(raw.slice(s, b + 1));
const R = id => { const i = ING.find(x => x.id === id); return { kcal: i.kcal, p: i.p, c: i.c, f: i.f }; };
const U = (kcal, p, c, f) => ({ kcal, p, c, f });                      // USDA / manufacturer
const X = {
  turkeySausage: U(196, 15.5, 2.5, 14),   // USDA lean turkey breakfast sausage, raw
  crouton: U(407, 11.9, 73, 6.6),         // USDA croutons, plain
  pickledOnion: U(30, 0.6, 7, 0),
  chorizo: U(455, 24.1, 1.9, 38.3),       // USDA chorizo, pork & beef
  arborio: U(360, 6.6, 79.6, 0.6),
  stock: U(4, 0.5, 0.4, 0.1),             // chicken stock, ready-to-use
  sweetener: U(0, 0, 0, 0),
  applesauce: U(42, 0.2, 11, 0.1),
  skimMilk: U(34, 3.4, 5, 0.1),
  granola: U(471, 10, 64, 20),
};
const recipes = [
  ["1 Breakfast Burrito Bowls", 4, [450,34,42,17], [[R(40),480],[X.turkeySausage,227],[R(69),454],[R(94),170],[R(104),150],[R(105),120],[R(106),75],[R(51),56],[R(205),120],[R(160),14]]],
  ["2 Crispy Chicken Caesar Salad", 4, [390,43,22,16], [[R(1),680],[R(79),30],[R(46),25+12],[R(40),60],[R(112),400],[R(111),300],[R(110),150],[X.crouton,40],[R(46),30],[R(47),180],[R(150),15],[R(184),5],[R(185),5],[R(108),3]]],
  ["3 Hot Honey Chicken Bowls", 4, [560,48,55,17], [[R(1),680],[R(160),14],[R(195),63],[R(181),10],[R(339),260],[R(68),400],[R(100),360],[R(149),150],[X.pickledOnion,40],[R(47),120],[R(150),30]]],
  ["4 Strawberry Cheesecake Protein Jars", 4, [270,25,32,5], [[R(47),690],[R(54),113],[R(210),30],[R(252),5],[R(195),14],[R(142),300],[R(367),56],[R(150),10]]],
  ["5 Banana Bread Protein Bowl (per bowl)", 1, null, [[R(140),60],[R(40),60],[X.skimMilk,50],[R(195),10],[R(277),30],[R(210),30],[R(220),2],[R(250),2]]],
  ["6 Avocado & Egg Toast", 1, [350,20,null,null], [[R(327),40],[R(40),120],[R(149),50]]],
  ["7 Protein Berry Yoghurt Bowl", 1, [300,35,null,null], [[R(47),250],[R(210),20],[R(153),100],[R(195),10]]],
  ["8 Garlic Chicken, Crispy Potatoes & Broccoli", 1, [600,55,null,null], [[R(1),180],[R(69),300],[R(100),150],[R(160),10]]],
  ["9 Honey Garlic Salmon & Asparagus", 1, [520,43,null,null], [[R(20),180],[R(114),200],[R(69),200],[R(195),10],[R(180),10],[R(108),3]]],
  ["10 Blueberry Protein Oats", 1, [400,35,null,null], [[R(64),50],[R(210),30],[R(58),200],[R(143),100],[R(166),10]]],
  ["11 One-Pot Chorizo & Rice (as posted, 2 servings)", 2, null, [[R(106),150],[R(117),100],[R(118),40],[R(108),6],[X.chorizo,150],[R(160),28],[X.arborio,120],[X.stock,500],[R(121),60]]],
  ["11b Chorizo & Rice IMPROVED (+400 g chicken thigh, 1 chorizo, 1 tbsp oil; 3 servings)", 3, null, [[R(106),150],[R(117),100],[R(118),40],[R(108),6],[X.chorizo,75],[R(160),14],[X.arborio,150],[X.stock,600],[R(121),60],[R(1),400]]],
  ["12 Protein Brownies (9)", 9, [99,11,8,2], [[R(277),80],[R(254),20],[R(210),65],[X.sweetener,10],[R(41),150],[R(40),120],[R(42),100],[X.applesauce,20],[R(196),20],[R(252),5]]],
];
for (const [name, n, claim, items] of recipes) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const [m, g] of items) for (const k of Object.keys(t)) t[k] += m[k] * g / 100;
  const per = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Math.round(v / n * 10) / 10]));
  const dev = claim ? ["kcal","p","c","f"].map((k,i)=>claim[i]==null?"":` ${k} ${claim[i]}→${per[k]} (${Math.round((per[k]-claim[i])/claim[i]*100)}%)`).join("") : " (no claim)";
  console.log(`${name}\n   computed/serving: ${per.kcal} kcal · ${per.p}P · ${per.c}C · ${per.f}F${dev}\n`);
}
