#!/usr/bin/env python3
# build-2026-09-07.py — generates the 2026-09-07 batch from the approved
# decisions. Output: recipe-intake/build-2026-09-07.json (one object per recipe,
# app shape minus allergens/tips, which the node step adds) + report.
import json, re, sys, collections
sys.path.insert(0, 'recipe-intake')
import ingmap
ING = ingmap.ING

DEC = json.load(open('/sessions/clever-ecstatic-sagan/mnt/uploads/recipe-decisions.json'))['decisions']
RD = json.load(open('recipe-intake/review-data-2026-09-06.json')); CAND = {c['id']: c for c in RD['candidates']}
COOK = {str(x['page']): x for x in json.load(open('recipe-intake/cookbook-2026-09-06.json'))}

# Duplicate drops (recommendations accepted by "go"), plus the 7 already built.
DROP = {'cb196', 'cb239', 'cb174', 'cb19', 'cb256', 'cb259', 'cb260', 'cb246', 'cb243', 'cb161', 'cb22', 'cb186', 'cb211', 'cb71'}
DROP_REASON = {'cb196': 'twin of cb204', 'cb239': 'twin of cb46', 'cb174': 'same title as cb103', 'cb19': 'cb56 without the banana', 'cb256': 'twin of cb220',
               'cb259': 'twin of cb219', 'cb260': 'covered by cb252', 'cb246': 'covered by cb252', 'cb243': 'subset of cb267', 'cb161': 'twin of cb130',
               'cb22': 'plain base of cb215/cb61', 'cb186': 'plain base of cb215', 'cb211': 'twin of cb188', 'cb71': 'twin of cb128'}
PREBUILT = {'ig2': 'm125', 'ig11': 'm126', 'ig9': 'm127', 'cb135': 'm128', 'cb85': 'm129'}   # from build-2026-09-06.mjs
SMOOTHIE_WHEY = True

BUILD = [k for k, v in DEC.items() if v['decision'] in ('new', 'both', 'replace') and k not in DROP and k not in PREBUILT]

# ── Instagram recipes: structured by hand (ingredients as posted) ────────────
IG = {
 'ig4': dict(serves=4, section='snack', time='20 min + chill', ingredients=['3 cups nonfat Greek yogurt','4 oz light cream cheese','1 scoop vanilla protein powder','1 tsp vanilla','2 tsp honey','2 cups strawberries','4 graham cracker sheets','1 tsp lemon juice']),
 'ig5': dict(serves=1, section='breakfast', time='35 min', ingredients=['½ small banana','1 egg','50 ml skim milk','½ tbsp honey','¼ tsp vanilla','¼ cup flour','30 g vanilla protein powder','1 tsp cinnamon','½ tsp baking powder','10 g dark chocolate chips']),
 'ig7': dict(serves=1, section='breakfast', time='5 min', ingredients=['250 g Greek yogurt','20 g vanilla protein powder','100 g mixed berries','10 g honey','½ tsp cinnamon']),
 'ig8': dict(serves=1, section='dinner', time='35 min', ingredients=['180 g chicken breast','300 g potatoes','150 g broccoli','10 ml olive oil','1 tsp smoked paprika','1 tsp garlic powder','1 tbsp lemon juice']),
 'ig12': dict(serves=9, section='snack', time='30 min', ingredients=['80 g flour','20 g cocoa powder','65 g chocolate protein powder','10 g sweetener','150 ml egg whites','2 large eggs','100 g cottage cheese','20 g applesauce','20 ml maple syrup','5 ml vanilla extract']),
}

def cat_of(section, title, ings):
    t = title.lower()
    if section == 'smoothie': return 'smoothie'
    if section == 'breakfast': return 'breakfast'
    if section == 'snack':
        if re.search(r'cookie|cake|bite|ball|pudding|bark|chocolate|brownie|parfait|dip with fruit|nachos', t): return 'dessert'
        return 'salad'
    if re.search(r'salad|lettuce|cups|wraps?$', t) and not re.search(r'pasta|rice|grain|quinoa', t): return 'salad'
    return 'main'
PREFIX = {'main': 'm', 'salad': 'sn', 'breakfast': 'bf', 'dessert': 'ds', 'smoothie': 'sm'}
NEXT = {'m': 131, 'sn': 10, 'bf': 43, 'ds': 10, 'sm': 10}

def emoji_for(title, cat, ings):
    t = title.lower(); names = ' '.join(i['label'].lower() for i in ings)
    for pat, e in [('chicken', '🍗'), ('turkey', '🦃'), ('salmon', '🐟'), ('cod|tilapia', '🐟'), ('tuna', '🐟'), ('shrimp|prawn', '🦐'), ('beef|steak', '🥩'), ('egg', '🥚'),
                   ('tofu|tempeh', '🌱'), ('lentil', '🌿'), ('chickpea|falafel|hummus', '🫘'), ('halloumi|feta|goat cheese', '🧀'), ('smoothie|shake', '🥤'), ('juice', '🧃'),
                   ('oat', '🌾'), ('yogurt|yoghurt|parfait', '🫙'), ('cottage', '🧀'), ('chia', '🥣'), ('pancake|waffle', '🥞'), ('muffin|cookie|cake|brownie|bite', '🍪'),
                   ('avocado', '🥑'), ('mango|pineapple|tropical', '🥭'), ('berry|strawberr|blueberr|raspberr', '🫐'), ('banana', '🍌'), ('peach', '🍑'), ('apple', '🍎'),
                   ('soup|stew|curry|tagine', '🍲'), ('pasta|orzo|spaghetti', '🍝'), ('quinoa|grain|farro|barley', '🌾'), ('wrap|pita|sandwich|toast|roll', '🌯'), ('veggie|vegetable|zucchini|eggplant|beet|mushroom', '🥦')]:
        if re.search(pat, t): return e
    return '🍽️'
def badge_for(steps, cat):
    s = ' '.join(steps).lower()
    if cat == 'smoothie' or re.search(r'\bblend', s): return '🌀 Blender'
    if re.search(r'air.?fry', s): return '💨 Air Fryer'
    if re.search(r'oven|bake|roast', s): return '🌬️ Oven'
    if re.search(r'refrigerate|overnight|no cooking|no-cook|chill', s) and not re.search(r'saut|simmer|fry|boil|cook ', s): return '🥗 No-Cook'
    return '🍳 Stovetop'
def carb_for(items):
    for pat, lab in [('sweet potato', '🍠 Sweet Potato'), ('potato', '🥔 Potato'), ('brown rice', '🍚 Brown Rice'), ('rice', '🍚 Rice'), ('quinoa', '🌾 Quinoa'), ('farro|barley|millet|wild rice', '🌾 Grains'),
                     ('pasta|spaghetti|orzo', '🍝 Pasta'), ('oat', '🌾 Oats'), ('bread|toast|sourdough', '🍞 Toast'), ('tortilla|wrap|pita', '🌯 Wrap'), ('lentil', '🌿 Lentils'), ('chickpea', '🫘 Chickpeas'),
                     ('banana', '🍌 Banana'), ('berr', '🫐 Berries'), ('mango|pineapple', '🥭 Fruit'), ('apple', '🍎 Apple'), ('granola', '🌾 Granola')]:
        if any(re.search(pat, i['label'].lower()) for i in items): return lab
    return '🥗 Low Carb'
def tidy_title(t):
    t = t.replace('’S', "'s").replace('Roastedveggies', 'Roasted Veggies').replace('Roastedsweetpotatoes', 'Roasted Sweet Potatoes').replace('Withasparagus', 'with Asparagus')
    t = t.replace('Brusselssprouts', 'Brussels Sprouts').replace('Greenbeans', 'Green Beans').replace('Cucumberyogurt', 'Cucumber-Yogurt').replace('Tahinidrizzle', 'Tahini Drizzle')
    t = re.sub(r'\bWith\b', 'with', t).replace('“', '"').replace('”', '"').replace('(Lightened-Up)', '').replace('"Super F*ck" ', '').strip()
    t = re.sub(r'\s+', ' ', t)
    return t
def f_to_c(s):
    def conv(m):
        f = int(m.group(1)); c = round((f - 32) * 5 / 9 / 5) * 5
        return f'{c}°C'
    s = re.sub(r'(\d{3})\s*°?\s*F\b(?:\s*\(\d+\s*°?C\))?', conv, s)
    return s
def metric_steps(steps):
    out = []
    for s in steps:
        s = re.sub(r'^\d+\.\s*', '', s).strip()
        s = f_to_c(s)
        if s: out.append(s)
    return out
def unit_for(ing):
    n = ing['name'].lower()
    return 'ml' if re.search(r'milk|oil|juice|water|stock|broth|cream|vinegar|sauce|syrup|extract|aminos|tamari|kefir', n) and not re.search(r'chips|powder|flakes', n) else 'g'
def rnd(g):
    if g >= 50: return round(g)
    if g >= 5: return round(g * 2) / 2
    return round(g, 1)
def slug(label, used):
    s = re.sub(r'[^a-z]', '', label.lower())[:6] or 'ing'
    b = s; i = 2
    while s in used: s = b[:5] + str(i); i += 1
    used.add(s); return s

out = []; report = []; skipped_lines = collections.defaultdict(list)
for k in BUILD:
    c = CAND[k]; dec = DEC[k]
    if k.startswith('ig'):
        src = IG.get(k)
        if not src: report.append((k, c['title'], 'NOT BUILT — no structured source')); continue
        serves, section, time, ing_lines, steps = src['serves'], src['section'], src['time'], src['ingredients'], c['steps']
    else:
        page = COOK[k[2:]]; serves, section, time, ing_lines, steps = page['servings'] or 1, page['section'], page['time'] or '20 min', c['ingredients'], page['steps_raw']
    used = set(); items = []; kcal = p = cb = f = 0.0; issues = []
    for line in ing_lines:
        pr = ingmap.parse(line)
        if pr is None: continue
        if pr.get('skip'): continue          # salt / pepper
        if pr['id'] is None or pr['g'] is None:
            if re.search(r'garnish|optional|to thin|to taste', line, re.I): continue
            skipped_lines[k].append(line); continue
        ing = pr['ing']; g = pr['g'] / serves
        if g <= 0: continue
        label = re.sub(r'\s+', ' ', re.split(r',|\(', pr['line'])[0]); label = re.sub(r'^[\d½¼¾⅓⅔⅛/\.\s\-–]+', '', label); label = re.sub(r'^(cups?|tbsp|tsp|oz|lbs?|g|ml|cloves?|slices?|scoops?|cans?|large|medium|small|ripe|whole|stalks?|sticks?|fillets?|block|inch|sheets?)\b\.?\s*(of\s+)?', '', label, flags=re.I).strip()
        label = label[:1].upper() + label[1:] if label else ing['name']
        cat = ing.get('cat', 'Other'); cat = {'Grains & Carbs': 'Carbs', 'Protein & Meat': 'Protein', 'Fish & Seafood': 'Protein', 'Dairy & Eggs': 'Dairy', 'Fats & Nuts': 'Fats', 'Herbs & Spices': 'Spices', 'Dairy & Alternatives': 'Dairy', 'Meat & Poultry': 'Protein', 'Legumes': 'Legumes', 'Fruits': 'Fruits', 'Vegetables': 'Vegetables', 'Liquids': 'Liquids', 'Sauces': 'Sauces', 'Condiments': 'Condiments', 'Spices': 'Spices', 'Baking': 'Baking', 'Supplements': 'Supplements', 'Snacks & Treats': 'Snacks', 'Aromatics': 'Aromatics', 'Herbs': 'Herbs', 'Fats': 'Fats', 'Dairy': 'Dairy', 'Carbs': 'Carbs', 'Protein': 'Protein'}.get(cat, cat)
        q = rnd(g)
        items.append(dict(key=slug(label, used), label=label, qty=q, unit=unit_for(ing), cat=cat, ingId=ing['id']))
        kcal += ing['kcal'] * q / 100; p += ing['p'] * q / 100; cb += ing['c'] * q / 100; f += ing['f'] * q / 100
    cat = cat_of(section, c['title'], items)
    # ── Protein normalisation ──
    # The book's portions are small (½ lb turkey between two). For mains and
    # salads under target, scale the primary protein source up — never more
    # than double — and record it. Recipes with no scalable source are flagged.
    PROT = {1, 2, 345, 407, 4, 5, 287, 6, 289, 11, 20, 23, 24, 21, 25, 97, 341, 40, 41, 42, 43, 47, 53, 380, 381, 91, 93, 92, 311, 312, 94, 297, 210, 52, 44}
    target = 30 if cat == 'main' else 25 if cat == 'salad' else None
    scaled = None
    if target and p < target:
        prim = max((i for i in items if i['ingId'] in PROT), key=lambda i: ING[i['ingId']]['p'] * i['qty'], default=None)
        if prim:
            ing = ING[prim['ingId']]; need = target - p; add = need / (ing['p'] / 100); add = min(add, prim['qty'])
            if add > 0:
                old = prim['qty']; prim['qty'] = rnd(old + add)
                d = prim['qty'] - old; kcal += ing['kcal'] * d / 100; p += ing['p'] * d / 100; cb += ing['c'] * d / 100; f += ing['f'] * d / 100
                scaled = f"{prim['label']} {old} → {prim['qty']} g"
        if p < target: issues.append(f'protein {round(p,1)} g — no scalable source')
    if cat == 'smoothie' and SMOOTHIE_WHEY and not any(i['ingId'] == 210 for i in items):
        w = ING[210]; items.append(dict(key=slug('whey', used), label='Whey protein (vanilla) — our addition', qty=30, unit='g', cat='Protein', ingId=210))
        kcal += w['kcal'] * .3; p += w['p'] * .3; cb += w['c'] * .3; f += w['f'] * .3
    pre = PREFIX[cat]; rid = f'{pre}{NEXT[pre]}'; NEXT[pre] += 1
    title = tidy_title(c['title']); name = f'{emoji_for(title, cat, items)} {title}'
    steps_m = metric_steps(steps)
    if scaled: steps_m.append(f"Protein scaled for the app: {scaled} per serving (the book's portion was smaller). Macros are computed on this amount.")
    if cat == 'smoothie' and SMOOTHIE_WHEY: steps_m.append('Add the whey with the liquid, before the fruit, so it dissolves without clumping. We added 30 g to the book\'s recipe to make this a proper post-training drink.')
    badge = badge_for(steps_m, cat)
    per = dict(kcal=round(kcal), protein=round(p, 1), carbs=round(cb, 1), fat=round(f, 1))
    claim = c.get('claim')
    out.append(dict(source=k, sourceTitle=c['title'], category=cat, id=rid, name=name, subtitle=f'{badge.split(" ",1)[1]} · {time}', badge=badge, carb=carb_for(items), portions=1,
                    perPortion=per, batchItems=items, steps=steps_m, serves=serves, claim=claim, scaled=scaled, issues=issues, decision=dec['decision'], replaces=dec.get('ours') if dec['decision'] == 'replace' else None, note=dec.get('note', '')))
    report.append((k, rid, name, serves, per, claim, dec['decision'], dec.get('ours')))
json.dump(out, open('recipe-intake/build-2026-09-07.json', 'w'), indent=1)
json.dump(dict(skipped=skipped_lines, dropped=DROP_REASON, prebuilt=PREBUILT), open('recipe-intake/build-2026-09-07-meta.json', 'w'), indent=1)
print(len(out), 'built;', sum(len(v) for v in skipped_lines.values()), 'lines skipped in', len(skipped_lines), 'recipes')
for k, v in skipped_lines.items(): print('  ', k, v)
lo = [r for r in out if r['category'] in ('main', 'salad') and r['perPortion']['protein'] < 25]
print(len(lo), 'mains/salads under 25 g protein:', [(r['id'], r['sourceTitle'], r['perPortion']['protein']) for r in lo][:40])
