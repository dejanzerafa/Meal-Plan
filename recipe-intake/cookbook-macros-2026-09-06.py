# Computes per-serving macros for every cookbook recipe from its ingredient
# lines. Ingredient values come from the app's registry (ING_FLAT) where a row
# exists, else USDA FoodData Central (marked U). Cup/tbsp/unit → gram
# conversions are per-ingredient (a cup of oats is 80 g, a cup of yogurt 245 g).
# Anything unparsed is listed so the coverage is visible, not hidden.
import json,re
ING={i['id']:i for i in json.load(open('/tmp/ing.json'))}
def R(id,cup=None,unit=None): i=ING[id]; return dict(kcal=i['kcal'],p=i['p'],c=i['c'],f=i['f'],cup=cup,unit=unit or i.get('unitG'))
def U(k,p,c,f,cup=None,unit=None): return dict(kcal=k,p=p,c=c,f=f,cup=cup,unit=unit)
# keyword (regex, first match wins — order matters) → nutrition + conversions
T=[
 (r'olive oil|avocado oil', R(160,cup=216,unit=None)),
 (r'coconut oil', U(892,0,0,99,cup=218)),
 (r'sesame oil', U(884,0,0,100,cup=218)),
 (r'\bhoney\b', R(195,cup=340)),
 (r'maple syrup', R(196,cup=320)),
 (r'garlic', R(108,cup=136,unit=3)),
 (r'greek yogurt|greek yoghurt', R(47,cup=245)),
 (r'coconut yogurt', U(140,1,10,10,cup=245)),
 (r'almond milk|oat milk', R(58,cup=240)),
 (r'light coconut milk', U(67,0.5,1.4,6.5,cup=240)),
 (r'coconut milk', R(263,cup=240)),
 (r'coconut water', U(19,0.7,3.7,0.2,cup=240)),
 (r'\bbananas?\b', R(140,cup=150,unit=118)),
 (r'lemon juice|juice of .*lemon|\blemon\b', R(150,cup=244,unit=45)),
 (r'lime juice|juice of .*lime|\blime\b', R(151,cup=244,unit=30)),
 (r'chia seeds?', U(486,16.5,42,31,cup=170)),
 (r'flaxseed|flax', U(534,18,29,42,cup=150)),
 (r'hemp seeds?', U(553,32,9,49,cup=160)),
 (r'pumpkin seeds?', U(559,30,11,49,cup=130)),
 (r'sesame seeds', U(573,18,23,50,cup=144)),
 (r'poppy seeds', U(525,18,28,42,cup=140)),
 (r'cinnamon', R(220,cup=125)),
 (r'nutmeg|turmeric|cumin|paprika|chili powder|chilli powder|curry powder|cayenne|italian seasoning|oregano|thyme|basil(?! pesto)|dill|parsley|cilantro|chives|mint|rosemary|garlic powder|onion powder|ginger|matcha', U(300,10,55,10,cup=100,unit=2)),
 (r'chili flakes|red pepper flakes', R(227,cup=90,unit=2)),
 (r'black pepper|\bpepper\b(?! flakes)|salt', U(0,0,0,0,cup=0,unit=0)),
 (r'vanilla', R(252,cup=208)),
 (r'almond butter', R(167,cup=256)),
 (r'peanut butter', R(166,cup=256)),
 (r'tahini', U(595,17,21,54,cup=240)),
 (r'hummus', U(166,8,14,10,cup=245)),
 (r'basil pesto|pesto', U(418,4,6,42,cup=240)),
 (r'cucumber', R(111,cup=120,unit=300)),
 (r'avocado', R(149,cup=150,unit=150)),
 (r'rolled oats|\boats\b', R(64,cup=80)),
 (r'oat flour', R(80,cup=90)),
 (r'almond flour', R(81,cup=96)),
 (r'whole.?wheat flour|\bflour\b', R(277,cup=125)),
 (r'protein powder|protein$|chocolate protein', R(210,cup=120,unit=30)),
 (r'cherry tomatoes', R(110,cup=150,unit=17)),
 (r'tomato(es)?(?! paste)(?! sauce)', R(110,cup=150,unit=120)),
 (r'diced tomatoes|crushed tomatoes|marinara', R(187,cup=240)),
 (r'tomato paste', R(186,cup=260,unit=16)),
 (r'soy sauce|tamari|teriyaki', R(180,cup=255)),
 (r'miso', U(199,12,26,6,cup=275)),
 (r'\bice\b|water|broth|stock|chai tea|orange juice', U(3,0.3,0.3,0,cup=240,unit=0)),
 (r'apple cider vinegar|balsamic glaze|balsamic', R(191,cup=255)),
 (r'apple', R(141,cup=125,unit=180)),
 (r'\beggs?\b|egg whites?', R(40,cup=245,unit=60)),
 (r'cooked quinoa', U(120,4.4,21,1.9,cup=185)),
 (r'quinoa', U(368,14,64,6,cup=170)),
 (r'cooked brown rice|cooked .*rice|cooked farro|cooked wild rice|cooked basmati', R(305,cup=195)),
 (r'brown rice cakes?|rice cakes?', U(387,8,82,3,cup=0,unit=9)),
 (r'brown rice|basmati|wild rice|farro|pearl barley|millet|arborio', R(62,cup=185)),
 (r'\bonions?\b', R(106,cup=160,unit=150)),
 (r'sweet potato', R(68,cup=133,unit=200)),
 (r'potato', R(69,cup=150,unit=170)),
 (r'mixed berries|raspberries|blueberries|strawberries|berries', R(153,cup=150)),
 (r'mango', U(60,0.8,15,0.4,cup=165,unit=200)),
 (r'pineapple', U(50,0.5,13,0.1,cup=165)),
 (r'peach', U(39,0.9,10,0.3,cup=154,unit=150)),
 (r'kiwi', U(61,1.1,15,0.5,cup=180,unit=75)),
 (r'orange', U(47,0.9,12,0.1,cup=180,unit=130)),
 (r'grapes', U(69,0.7,18,0.2,cup=150)),
 (r'medjool dates|dates', U(277,1.8,75,0.2,cup=150,unit=24)),
 (r'raisins|cranberries', U(299,3,79,0.5,cup=150)),
 (r'zucchini|courgette', R(103,cup=125,unit=200)),
 (r'spinach|kale|mixed greens|lettuce|romaine|arugula|microgreens|cabbage', R(121,cup=30,unit=30)),
 (r'whole.?grain bread|whole.?wheat bread|bread', R(71,cup=0,unit=40)),
 (r'tortilla|pita', R(72,cup=0,unit=55)),
 (r'baking powder|baking soda', R(250,cup=220,unit=4)),
 (r'vegetable broth', R(279,cup=240)),
 (r'shrimp|prawn', R(23,cup=145,unit=15)) if 23 in ING else (r'shrimp|prawn', U(85,20,0,1,cup=145)),
 (r'chicken breast|chicken', R(1,cup=140,unit=170)),
 (r'chicken thigh', U(121,19.7,0,4.5,cup=140,unit=110)),
 (r'ground turkey|turkey', R(5,cup=225,unit=120)),
 (r'ground chicken', U(143,17,0,8,cup=225)),
 (r'salmon', R(20,cup=0,unit=150)),
 (r'cod|tilapia|white fish', U(82,18,0,0.7,cup=0,unit=150)),
 (r'tuna', U(116,26,0,1,cup=150,unit=120)),
 (r'carrot', R(117,cup=110,unit=60)),
 (r'celery', R(118,cup=100,unit=40)),
 (r'bell pepper|peppers?\b', R(104,cup=150,unit=120)),
 (r'broccoli', R(100,cup=90,unit=150)),
 (r'green beans|snap peas|snow peas|\bpeas\b|edamame', U(50,4,8,0.5,cup=120)),
 (r'asparagus', R(114,cup=134)),
 (r'brussels', U(43,3.4,9,0.3,cup=88)),
 (r'mushrooms?', U(22,3.1,3.3,0.3,cup=70)),
 (r'eggplant', R(331,cup=82,unit=450)),
 (r'cauliflower', U(25,1.9,5,0.3,cup=100)),
 (r'spaghetti squash', U(31,0.6,7,0.6,cup=100)),
 (r'beets?', U(43,1.6,10,0.2,cup=136)),
 (r'corn', U(86,3.3,19,1.2,cup=145)),
 (r'olives', U(115,0.8,6,11,cup=135)),
 (r'red cabbage', U(31,1.4,7,0.2,cup=90)),
 (r'shredded coconut|coconut(?! oil)', U(660,7,24,65,cup=93)),
 (r'granola', U(471,10,64,20,cup=110)),
 (r'grated parmesan|parmesan', R(46,cup=100,unit=5)),
 (r'feta', R(53,cup=150)),
 (r'goat cheese', U(364,22,0,30,cup=140)),
 (r'ricotta', U(174,11,3,13,cup=246)),
 (r'cottage cheese', R(43,cup=225)),
 (r'mini mozzarella', R(44,cup=112,unit=10)),
 (r'mozzarella', R(44,cup=112,unit=28)),
 (r'halloumi', U(321,22,2,25,cup=0,unit=100)),
 (r'cheddar|shredded cheese|cheese', R(51,cup=113)),
 (r'chickpeas', U(139,7.5,22,2.6,cup=164)),
 (r'black beans', R(94,cup=172)),
 (r'lentils', U(116,9,20,0.4,cup=198)),
 (r'red lentils|dry .*lentils|dried lentils', U(352,25,60,1,cup=190)),
 (r'tofu', U(76,8,2,4.8,cup=250,unit=350)),
 (r'chickpea pasta', U(340,20,57,4,cup=100)),
 (r'pasta|spaghetti|orzo', U(355,13,72,1.5,cup=100)),
 (r'walnuts|almonds|pecans|cashews|nuts', U(600,16,20,54,cup=120)),
 (r'dark chocolate|chocolate chips', R(256,cup=170)),
 (r'cocoa', R(254,cup=86)),
 (r'nutritional yeast', U(325,50,36,5,cup=60)),
 (r'breadcrumbs', R(79,cup=100)),
 (r'cornstarch', U(381,0.3,91,0.1,cup=128)),
 (r'butter', R(162,cup=227)),
 (r'light cream|cream', U(193,2.6,3.9,19,cup=240)),
 (r'applesauce|apple sauce', U(42,0.2,11,0.1,cup=244)),
 (r'pumpkin pur', U(34,1,8,0.3,cup=245)),
 (r'dijon|mustard', R(184,cup=250)),
 (r'sweetener|stevia', U(0,0,0,0,cup=0)),
 (r'mixed veg|mixed vegetables', U(60,2.5,12,0.5,cup=130)),
 (r'\bmilk\b', U(42,3.4,5,1,cup=245)),
]
FR={'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125}
def qty(s):
    s=s.strip(); m=re.match(r'^(\d+)?\s*([½¼¾⅓⅔⅛])',s)
    if m: return (int(m.group(1)) if m.group(1) else 0)+FR[m.group(2)], s[m.end():]
    m=re.match(r'^(\d+(?:\.\d+)?)(?:\s*[-–]\s*\d+(?:\.\d+)?)?(?:/(\d+))?',s)
    if m:
        v=float(m.group(1)); 
        if m.group(2): v=v/float(m.group(2))
        return v, s[m.end():]
    m=re.match(r'^(juice of|zest of|pinch|dash|handful|a handful of)\s*',s,re.I)
    if m: return (1 if 'handful' in m.group(1).lower() else 0.5 if 'juice' in m.group(1).lower() else 0), s
    return None, s
UNITS=[('cups?',None),('tbsp|tablespoons?',15),('tsp|teaspoons?',5),('oz',28.35),('lbs?',453.6),('g\\b|grams?',1),('ml',1),('cloves?','unit'),('slices?','unit'),('scoops?','unit'),('cans?',240),('large|medium|small|ripe|whole','unit'),('stalks?|sticks?','unit'),('fillets?','unit'),('block','unit'),('inch','inch'),('cubes?','unit'),('leaves|leaf','unit')]
def grams(q,unit,ing,name):
    if q is None: return None
    if unit=='cup': return q*(ing['cup'] or 0)
    if unit==15: return q*((ing['cup'] or 0)/16 if ing['cup'] else 15)
    if unit==5: return q*((ing['cup'] or 0)/48 if ing['cup'] else 5)
    if unit in (28.35,453.6,1,240): return q*unit
    if unit=='inch': return q*6
    # unit / bare count
    u=ing.get('unit')
    if u: return q*u
    if ing['cup']: return q*ing['cup']   # e.g. "1 avocado" w/o unit
    return None
def parse(line):
    l=line.strip().lstrip('·').strip()
    if not l or l.lower().startswith(('salt','toppings','for garnish','optional')): return None
    q,rest=qty(l); rest=rest.strip()
    unit=None
    for pat,val in UNITS:
        m=re.match(r'^(?:'+pat+r')\b\.?\s*(?:of\s+)?',rest,re.I)
        if m: unit='cup' if val is None else val; rest=rest[m.end():]; break
    name=re.split(r',|\(',rest)[0].strip().lower()
    for pat,ing in T:
        if re.search(pat,name):
            g=grams(q,unit,ing,name)
            return dict(line=l,name=name,g=g,ing=ing)
    return dict(line=l,name=name,g=None,ing=None)
recs=json.load(open('recipe-intake/cookbook-2026-09-06.json'))
out={}
for r in recs:
    tot=dict(kcal=0,p=0,c=0,f=0); miss=[]; n=0
    for line in r['ingredients']:
        p=parse(line)
        if p is None: continue
        n+=1
        if p['ing'] is None or p['g'] is None: miss.append(p['line']); continue
        for k in tot: tot[k]+=p['ing'][k]*p['g']/100
    sv=r['servings'] or 1
    per={k:round(v/sv,1) for k,v in tot.items()}; per['kcal']=round(per['kcal'])
    out[r['page']]=dict(computed=per,unparsed=miss,parsed=n-len(miss),total=n)
json.dump(out,open('recipe-intake/cookbook-computed-2026-09-06.json','w'),indent=1)
cov=[v['parsed']/max(1,v['total']) for v in out.values()]
print("recipes",len(out),"full coverage",sum(c==1 for c in cov),"≥80%",sum(c>=.8 for c in cov))
allmiss=[m for v in out.values() for m in v['unparsed']]
import collections; print(collections.Counter(re.sub(r'^[\d½¼¾⅓⅔⅛/\.\s\-–]+','',m).lower() for m in allmiss).most_common(40))
