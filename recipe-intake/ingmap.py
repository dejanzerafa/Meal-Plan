# Ingredient mapping for the 2026-09-07 build: source text → registry id +
# metric conversion. First matching pattern wins, so specific before general.
#   (regex, id, grams per cup, grams per "unit"/piece)
# id None = registry has no row; NEW_ROWS below proposes one (source named).
import json, re
ING = {i['id']: i for i in json.load(open('/tmp/ing.json'))}

NEW_ROWS = [
  # id, name, cat, kcal, p, c, f, unitG, source
  (371, "Turkey Breakfast Sausage (raw)", "Protein & Meat", 155, 16.6, 1.5, 9.3, None, "USDA FDC: Sausage, turkey, fresh, raw"),
  (372, "Chorizo (cured)", "Protein & Meat", 455, 24.1, 1.9, 38.3, None, "USDA FDC: Chorizo, pork and beef"),
  (373, "Arborio Rice (dry)", "Grains & Carbs", 355, 6.9, 78, 0.6, None, "manufacturer declarations (Riso Gallo, Tilda)"),
  (374, "Chicken Stock (ready-to-use)", "Liquids", 5, 0.6, 0.5, 0.1, None, "USDA FDC: Soup, chicken broth, ready-to-serve"),
  (375, "Single Cream (18% fat)", "Dairy", 193, 2.6, 3.9, 19, None, "McCance & Widdowson: Cream, single"),
  (376, "Cayenne Pepper (ground)", "Spices", 318, 12, 57, 17, None, "USDA FDC: Spices, pepper, red or cayenne"),
  (377, "Chili Powder (blend)", "Spices", 282, 13.5, 50, 14.3, None, "USDA FDC: Spices, chili powder"),
  (378, "Pecans", "Fats & Nuts", 691, 9.2, 13.9, 72, None, "USDA FDC: Nuts, pecans"),
  (379, "Hemp Seeds (hulled)", "Fats & Nuts", 553, 31.6, 8.7, 48.8, None, "USDA FDC: Seeds, hemp seed, hulled"),
  (380, "Goat Cheese (soft)", "Dairy", 264, 18.5, 0, 21.1, None, "USDA FDC: Cheese, goat, soft type"),
  (381, "Halloumi", "Dairy", 321, 22, 2.2, 25, None, "McCance & Widdowson: Halloumi cheese"),
  (382, "Coconut Yogurt (plain)", "Dairy & Alternatives", 140, 1.2, 9.5, 10.5, None, "manufacturer declarations (Coconut Collaborative, Alpro)"),
  (383, "Poppy Seeds", "Baking", 525, 18, 28.1, 41.6, None, "USDA FDC: Spices, poppy seed"),
  (384, "Basil Pesto", "Sauces", 418, 4.2, 6.1, 42, None, "USDA FDC: Pesto, ready-to-serve (Sacla-type)"),
  (385, "Salsa (jarred)", "Sauces", 36, 1.5, 7, 0.2, None, "USDA FDC: Salsa, ready-to-serve"),
  (386, "Farro (dry)", "Grains & Carbs", 340, 12.7, 71, 2, None, "USDA FDC: Farro, dry (Bob's Red Mill)"),
  (387, "Pearl Barley (dry)", "Grains & Carbs", 352, 9.9, 77.7, 1.2, None, "USDA FDC: Barley, pearled, raw"),
  (388, "Millet (dry)", "Grains & Carbs", 378, 11, 72.9, 4.2, None, "USDA FDC: Millet, raw"),
  (389, "Wild Rice (dry)", "Grains & Carbs", 357, 14.7, 74.9, 1.1, None, "USDA FDC: Wild rice, raw"),
  (390, "Chickpea Pasta (dry)", "Grains & Carbs", 340, 20, 57, 4, None, "manufacturer declaration (Banza)"),
  (391, "Applesauce (unsweetened)", "Fruits", 42, 0.2, 11.3, 0.1, None, "USDA FDC: Applesauce, canned, unsweetened"),
  (392, "Grapes", "Fruits", 69, 0.7, 18.1, 0.2, None, "USDA FDC: Grapes, red or green"),
  (393, "Melon (honeydew / cantaloupe)", "Fruits", 35, 0.7, 8.6, 0.2, None, "USDA FDC: Melons, average"),
  (395, "Peas (garden, frozen)", "Vegetables", 77, 5.2, 13.6, 0.4, None, "USDA FDC: Peas, green, frozen"),
  (396, "Mixed Salad Leaves", "Vegetables", 20, 1.8, 3.2, 0.3, None, "USDA FDC: Lettuce/spinach spring mix, average"),
  (397, "Red Cabbage", "Vegetables", 31, 1.4, 7.4, 0.2, None, "USDA FDC: Cabbage, red, raw"),
  (398, "Eggplant / Aubergine (roasted)", "Vegetables", 25, 1, 6, 0.2, None, "use raw row 331 — placeholder not needed"),
  (399, "Coconut Cream", "Dairy & Alternatives", 330, 3.6, 6.7, 34.7, None, "USDA FDC: Nuts, coconut cream, raw"),
  (400, "Oat Milk (unsweetened)", "Dairy & Alternatives", 43, 1, 6.6, 1.3, None, "manufacturer declaration (Oatly Barista-free)"),
  (401, "Soy Milk (unsweetened)", "Dairy & Alternatives", 33, 3.3, 0.8, 1.8, None, "USDA FDC: Soymilk, unsweetened"),
  (402, "Nutritional Yeast", "Supplements", 325, 50, 36, 5, None, "manufacturer declaration (Bragg)"),
  (403, "Cardamom (ground)", "Spices", 311, 10.8, 68.5, 6.7, None, "USDA FDC: Spices, cardamom"),
  (404, "Dried Lavender (culinary)", "Herbs & Spices", 49, 0, 12, 0, None, "manufacturer declaration; used in tiny amounts"),
  (405, "Cocoa Nibs / Cacao", "Baking", 464, 14, 33, 43, None, "USDA FDC: Cocoa nibs"),
  (406, "Dried Cranberries (sweetened)", "Fruits", 308, 0.2, 82.8, 1.1, None, "USDA FDC: Cranberries, dried, sweetened"),
  (407, "Ground Chicken (lean, raw)", "Protein & Meat", 143, 17.4, 0, 8.1, None, "USDA FDC: Chicken, ground, raw"),
  (408, "Lemon Zest", "Fruits", 47, 1.5, 16, 0.3, None, "USDA FDC: Lemon peel, raw"),
  (409, "Croutons (plain)", "Grains & Carbs", 407, 11.9, 73.5, 6.6, None, "USDA FDC: Croutons, plain"),
  (410, "Orange Juice (fresh)", "Liquids", 45, 0.7, 10.4, 0.2, None, "USDA FDC: Orange juice, raw"),
  (411, "Ice / Water", "Liquids", 0, 0, 0, 0, None, "zero-energy"),
]
NEWID = {r[1]: r[0] for r in NEW_ROWS}
for r in NEW_ROWS:
    ING[r[0]] = dict(id=r[0], name=r[1], cat=r[2], kcal=r[3], p=r[4], c=r[5], f=r[6], unitG=r[7])

# (pattern, id, g per cup, g per piece)
M = [
 (r'olive oil|avocado oil', 160, 216, 14), (r'coconut oil', 161, 218, 14), (r'sesame oil', 171, 218, 14),
 (r'cooking spray|oil spray', 172, 0, 1),
 (r'\bhoney\b', 195, 340, 21), (r'maple syrup', 196, 320, 20), (r'agave', 196, 320, 20),
 (r'garlic powder', 224, 140, 3), (r'onion powder', 225, 120, 3), (r'garlic', 108, 136, 3),
 (r'nonfat greek|0% greek', 47, 245, None), (r'low-fat greek|greek yogurt|greek yoghurt|plain greek', 48, 245, None), (r'coconut yogurt', 382, 245, None),
 (r'low-fat cottage|cottage cheese', 43, 225, None),
 (r'unsweetened almond milk|almond milk', 58, 240, None), (r'oat milk', 400, 240, None), (r'soy milk', 401, 240, None),
 (r'light coconut milk|unsweetened coconut milk', 336, 240, None), (r'coconut cream', 399, 240, None), (r'coconut milk', 263, 240, None), (r'coconut water', 329, 240, None),
 (r'skim milk', 50, 245, None), (r'\bmilk\b(?! chocolate)', 49, 245, None),
 (r'frozen banana|\bbananas?\b', 140, 150, 118),
 (r'lemon zest', 408, 0, 2), (r'lemon juice|juice of .*lemon|squeeze of lemon|\blemon\b', 150, 244, 45),
 (r'lime juice|juice of .*lime|\blime\b', 151, 244, 30),
 (r'fresh orange juice|orange juice', 410, 248, None), (r'\borange\b', 145, 180, 130),
 (r'chia seeds?', 169, 170, None), (r'flaxseed|flax', 168, 150, None), (r'hemp seeds?', 379, 160, None),
 (r'pumpkin seeds?', 177, 130, None), (r'sunflower seeds?', 170, 140, None), (r'sesame seeds', 176, 144, None), (r'poppy seeds', 383, 140, None),
 (r'cinnamon', 220, 125, 2.6), (r'nutmeg', 357, 110, 2.2), (r'turmeric', 239, 150, 3), (r'cumin', 222, 100, 2.1), (r'smoked paprika', 238, 110, 2.3),
 (r'paprika', 221, 110, 2.3), (r'chili powder|chilli powder', 377, 128, 2.7), (r'curry powder', 237, 100, 2), (r'cayenne', 376, 90, 1.8),
 (r'italian seasoning|dried basil|dried oregano|oregano', 223, 50, 1), (r'thyme', 235, 45, 1), (r'rosemary', 234, 60, 1.2),
 (r'garam masala', 269, 100, 2), (r'cardamom', 403, 100, 2), (r'chili flakes|red pepper flakes', 227, 90, 2),
 (r'fresh ginger|grated ginger|inch .*ginger|\bginger\b', 228, 96, 6), (r'matcha', 240, 100, 2),
 (r'fresh basil|basil leaves|\bbasil\b(?! pesto)', 231, 24, 0.5), (r'parsley', 229, 60, 1), (r'cilantro|coriander', 230, 16, 0.5),
 (r'\bdill\b', 233, 9, 0.5), (r'\bmint\b', 232, 25, 0.5), (r'chives', 236, 48, 1), (r'lavender', 404, 30, 1),
 (r'black pepper|\bpepper\b(?! flakes)(?!s)|sea salt|\bsalt\b', None, 0, 0),
 (r'chocolate protein|vanilla protein|protein powder|whey|plant.?based protein', 210, 120, 30), (r'light cream cheese|cream cheese', 54, 232, None), (r'vanilla', 252, 208, 4), (r'almond butter', 167, 256, 16), (r'natural peanut butter|peanut butter', 166, 256, 16), (r'tahini', 320, 240, 15),
 (r'hummus', 325, 245, 15), (r'basil pesto|pesto', 384, 240, 16), (r'salsa', 385, 240, None),
 (r'cucumber', 111, 120, 300), (r'ripe avocado|avocado', 149, 150, 150),
 (r'rolled oats|\boats\b', 64, 80, None), (r'oat flour', 80, 90, None), (r'almond flour', 81, 96, None),
 (r'whole.?wheat flour|whole-wheat flour|\bflour\b', 277, 125, None),
 (r'chocolate protein|vanilla protein|protein powder|whey', 210, 120, 30),
 (r'tomato paste', 186, 260, 16), (r'diced tomatoes|crushed tomatoes|canned tomatoes|marinara|tomato sauce', 187, 240, None),
 (r'cherry tomatoes', 110, 150, 17), (r'tomato slices|\btomato(es)?\b', 110, 150, 120),
 (r'low-sodium soy sauce|soy sauce|tamari|coconut aminos', 180, 255, 16), (r'teriyaki', 198, 255, 16), (r'miso', 316, 275, 17), (r'fish sauce', 193, 255, 15),
 (r'sriracha|hot sauce', 188, 240, 15), (r'balsamic glaze|balsamic drizzle', 332, 255, 16), (r'balsamic', 191, 255, 16), (r'apple cider vinegar', 190, 240, 15), (r'rice vinegar', 201, 240, 15),
 (r'dijon|mustard', 184, 250, 15),
 (r'low-sodium vegetable|vegetable broth|vegetable stock', 279, 240, None), (r'chicken broth|chicken stock|\bbroth\b|\bstock\b', 374, 240, None),
 (r'tuna', 21, 150, 120), (r'\bice\b|water|chai tea|cold water', 411, 240, 0),
 (r'applesauce|apple sauce', 391, 244, None), (r'green apple|\bapples?\b', 141, 125, 180),
 (r'poached eggs?|scrambled egg|soft-boiled egg|boiled eggs?|\beggs?\b(?! whites?)', 40, 245, 60), (r'egg whites?', 41, 245, 33),
 (r'cooked quinoa', 309, 185, None), (r'quinoa', 74, 170, None),
 (r'cooked basmati|cooked white rice|cooked jasmine', 304, 195, None), (r'cooked brown rice|cooked .*rice|cooked farro|cooked wild rice', 305, 195, None),
 (r'brown rice cakes?|rice cakes?', 84, 0, 9), (r'cauliflower rice', 116, 100, None), (r'brown rice', 62, 185, None), (r'basmati|jasmine|white rice', 339, 185, None),
 (r'wild rice', 389, 160, None), (r'farro', 386, 190, None), (r'pearl barley|barley', 387, 200, None), (r'millet', 388, 200, None), (r'arborio', 373, 200, None),
 (r'red onion', 107, 160, 150), (r'green onions?|spring onions?|scallions?', 132, 100, 15), (r'\bonions?\b', 106, 160, 150),
 (r'sweet potato', 68, 133, 200), (r'potato', 69, 150, 170),
 (r'blueberr', 143, 150, None), (r'strawberr', 142, 150, 12), (r'raspberr', 144, 125, None), (r'frozen mixed berries|mixed berries|berries', 153, 150, None),
 (r'frozen mango|mango', 146, 165, 200), (r'pineapple', 147, 165, None), (r'peach', 159, 154, 150), (r'kiwi', 155, 180, 75), (r'\bpear\b', 152, 160, 170),
 (r'grapes', 392, 150, None), (r'melon|honeydew|cantaloupe', 393, 160, None), (r'medjool dates|dates', 154, 150, 24), (r'raisins', 356, 150, None),
 (r'dried cranberries|cranberries', 406, 120, None), (r'pomegranate', 157, 175, None), (r'watermelon', 148, 150, None),
 (r'zucchini|courgette', 103, 125, 200), (r'baby spinach|spinach', 121, 30, None), (r'kale', 102, 65, None),
 (r'mixed greens|spring mix|salad greens|microgreens', 396, 47, 30), (r'rocket|arugula', 352, 20, None), (r'lettuce leaves|shredded lettuce|lettuce|romaine', 112, 47, 30),
 (r'red cabbage', 397, 90, None), (r'cabbage', 125, 90, None),
 (r'croutons', 409, 40, None), (r'whole.?grain bread|whole.?wheat bread|sourdough|\bbread\b', 71, 0, 40), (r'corn tortillas?', 73, 0, 30), (r'whole.?wheat tortillas?|whole.?grain tortillas?|tortillas?|wraps?\b', 72, 0, 55), (r'pita', 322, 0, 60),
 (r'baking powder', 250, 220, 4), (r'baking soda', 251, 220, 4),
 (r'shrimp|prawn', 25, 145, 15), (r'chicken thigh', 2, 140, 110), (r'ground chicken', 407, 225, None), (r'cooked chicken|rotisserie|shredded chicken', 345, 140, None),
 (r'chicken breast|chicken', 1, 140, 170), (r'lean ground turkey|ground turkey', 5, 225, None), (r'turkey', 4, 140, 150),
 (r'salmon', 20, 0, 150), (r'\bcod\b', 23, 0, 150), (r'tilapia|white fish', 24, 0, 150),
 (r'carrot', 117, 110, 60), (r'celery', 118, 100, 40), (r'red bell pepper|bell peppers?|\bpeppers?\b', 104, 150, 120),
 (r'broccoli', 100, 90, 150), (r'green beans', 115, 120, None), (r'snap peas|snow peas', 135, 100, None), (r'\bpeas\b', 395, 145, None), (r'edamame', 96, 155, None),
 (r'asparagus', 114, 134, None), (r'brussels', 136, 88, None), (r'mushrooms?', 113, 70, 18), (r'eggplant|aubergine', 331, 82, 450), (r'cauliflower', 116, 100, None),
 (r'spaghetti squash|butternut', 128, 140, None), (r'beets?', 124, 136, 80), (r'sweet corn|corn kernels|\bcorn\b', 78, 145, None), (r'kalamata', 340, 135, 4), (r'olives', 130, 135, 4),
 (r'shredded coconut|coconut flakes|unsweetened coconut|\bcoconut\b(?! oil)(?! milk)(?! water)(?! cream)(?! yogurt)', 178, 93, None), (r'granola', 270, 110, None),
 (r'grated parmesan|parmesan', 46, 100, 5), (r'crumbled feta|feta', 53, 150, None), (r'goat cheese', 380, 140, None), (r'ricotta', 52, 246, None),
 (r'mini mozzarella|fresh mozzarella|mozzarella', 44, 112, 10), (r'halloumi', 381, 0, 100), (r'sharp cheddar|shredded cheese|cheddar|cheese', 344, 113, None),
 (r'canned chickpeas|roasted chickpeas|chickpeas', 91, 164, None), (r'black beans', 94, 172, None), (r'kidney', 95, 172, None), (r'cannellini|white beans', 297, 172, None),
 (r'red lentils', 92, 190, None), (r'cooked lentils', 311, 198, None), (r'dry .*lentils|dried lentils|lentils', 93, 190, None),
 (r'firm tofu|tofu', 97, 250, 350), (r'chickpea pasta', 390, 100, None), (r'whole.?grain pasta|whole.?wheat pasta|whole.?grain spaghetti|whole wheat pasta', 67, 100, None),
 (r'orzo', 86, 170, None), (r'pasta|spaghetti', 65, 100, None), (r'soba', 328, 100, None),
 (r'chopped walnuts|crushed walnuts|walnuts', 164, 120, None), (r'sliced almonds|chopped almonds|crushed almonds|raw almonds|almonds', 163, 140, None), (r'pecans', 378, 110, None), (r'cashews', 165, 130, None), (r'pistachio', 175, 125, None),
 (r'dark chocolate chips|chocolate chips', 256, 170, None), (r'dark chocolate', 255, 170, None), (r'cocoa nibs|cacao', 405, 120, None), (r'cocoa', 254, 86, None),
 (r'nutritional yeast', 402, 60, None), (r'breadcrumbs|panko', 79, 100, None), (r'cornstarch', 265, 128, 8), (r'unsalted butter|butter', 162, 227, 14),
 (r'light cream|\bcream\b', 375, 240, None), (r'stevia|sweetener', 253, 0, 1), (r'brown sugar|coconut sugar|\bsugar\b', 259, 200, 12),
 (r'mixed veg|mixed vegetables|mixed veggies|roasted mixed vegetables', 275, 130, None), (r'graham cracker', 367, 0, 14), (r'croutons', 409, 40, None), (r'espresso', 268, 0, 60), (r'horseradish', 353, 240, 15),
 (r'whole.?grain pita', 322, 0, 60), (r'kefir', 349, 240, None), (r'chorizo', 372, 0, 75), (r'turkey breakfast sausage|turkey sausage', 371, 0, 57),
]
FR = {'½': .5, '¼': .25, '¾': .75, '⅓': 1/3, '⅔': 2/3, '⅛': .125}
def qty(s):
    s = s.strip()
    m = re.match(r'^(\d+)?\s*([½¼¾⅓⅔⅛])', s)
    if m: return (int(m.group(1)) if m.group(1) else 0) + FR[m.group(2)], s[m.end():]
    m = re.match(r'^(\d+(?:\.\d+)?)(?:\s*[-–]\s*\d+(?:\.\d+)?)?(?:/(\d+))?', s)
    if m:
        v = float(m.group(1));
        if m.group(2): v = v / float(m.group(2))
        return v, s[m.end():]
    m = re.match(r'^(juice of|zest of|pinch of|pinch|dash of|dash|a handful of|handful of|handful|squeeze of)\s*', s, re.I)
    if m:
        w = m.group(1).lower()
        return (1 if 'handful' in w else 0.5 if 'juice' in w else 0.25 if 'zest' in w else 0.02 if 'pinch' in w or 'dash' in w else 0.3 if 'squeeze' in w else 0), s[m.end():]
    return None, s
UNITS = [('cups?', 'cup'), ('tbsp|tablespoons?', 'tbsp'), ('tsp|teaspoons?', 'tsp'), ('oz', 'oz'), ('lbs?', 'lb'), ('g\\b|grams?', 'g'), ('ml', 'ml'),
         ('cloves?', 'piece'), ('slices?', 'piece'), ('scoops?', 'scoop'), ('cans?', 'can'), ('large|medium|small|ripe|whole', 'piece'), ('stalks?|sticks?', 'piece'),
         ('fillets?', 'piece'), ('block', 'piece'), ('inch', 'inch'), ('cubes?', 'piece'), ('leaves|leaf', 'piece'), ('sheets?', 'piece'), ('sprigs?', 'piece')]
def parse(line):
    l = line.strip().lstrip('·').strip()
    if not l or re.match(r'^(toppings?|for garnish|optional|garnish)', l, re.I): return None
    q, rest = qty(l); rest = rest.strip()
    unit = None
    canoz = None
    for pat, u in UNITS:
        m = re.match(r'^(?:' + pat + r')\b\.?\s*(?:\((\d+(?:\.\d+)?)\s*oz\))?\s*(?:of\s+)?', rest, re.I)
        if m: unit = u; canoz = float(m.group(1)) if m.group(1) else None; rest = rest[m.end():]; break
    name = re.split(r',|\(', rest)[0].strip().lower()
    for pat, iid, cup, piece in M:
        if re.search(pat, name):
            if iid is None: return dict(line=l, name=name, g=0, id=None, skip=True)
            ing = ING[iid]
            if q is None: g = None
            elif unit == 'cup': g = q * cup
            elif unit == 'tbsp': g = q * (cup / 16 if cup else 15)
            elif unit == 'tsp': g = q * (cup / 48 if cup else 5)
            elif unit == 'oz': g = q * 28.35
            elif unit == 'lb': g = q * 453.6
            elif unit in ('g', 'ml'): g = q
            elif unit == 'can': g = q * (canoz * 28.35 * 0.72 if canoz else 240)   # drained weight ≈ 72% of the declared can
            elif unit == 'scoop': g = q * 30
            elif unit == 'inch': g = q * 6
            else: g = q * piece if piece else (q * cup if cup else None)
            return dict(line=l, name=name, g=g, id=iid, ing=ing, unit=unit, q=q)
    return dict(line=l, name=name, g=None, id=None)
