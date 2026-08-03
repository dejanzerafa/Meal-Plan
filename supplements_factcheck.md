# Supplements Reference — Fact-Check Report

**Document audited:** the Examine/Thorne/NIH/ISSN-based supplements reference for the meal-prep app.
**Method:** spot-checked specific numerical claims, study citations, and dose recommendations against current peer-reviewed literature, regulatory guidance (NIH ODS, EFSA, TGA, HSA Singapore), and meta-analyses.
**Date of audit:** 6 May 2026.

---

## Top-line verdict

The document is, on the whole, **well-grounded and significantly above average** for consumer-facing supplement reference material. The tier system, meal-pairing logic, conflict/spacing matrix, and goal-based stacks are genuinely useful and largely correct. ~80% of specific claims hold up.

But there are issues — one of them is a **safety problem you should fix before app users see it**, several are **overstatements that would embarrass the app if a savvy user pushed back**, and a handful are **citation slips** (right substance, wrong year/study).

I've sorted findings into four buckets:
1. **Correct as-is** — no changes needed
2. **Needs hedging** — claim is technically defensible but oversells the evidence
3. **Needs correction** — the number or attribution is wrong
4. **Safety-relevant** — change this before users act on it

---

## 1. Safety-relevant — change before shipping

### 🔴 Vitamin B6 dosing recommendation is outdated and potentially unsafe

**Document says:** "50–100 mg/day. Don't exceed 200 mg long-term (nerve damage risk)" for PMS support.

**Current evidence:**
- The European Food Safety Authority's revised Tolerable Upper Intake Level is **12 mg/day** — not 200.
- Australia's Therapeutic Goods Administration (TGA, updated 2023) now requires warning labels on B6 products above 10 mg/day after documenting peripheral neuropathy cases at doses **below 50 mg/day**, sometimes at the multivitamin level.
- A 2023 case report describes peripheral neuropathy in a 73-year-old man taking only **6 mg/day** of B6 from a multivitamin (Cureus, 2023).
- A 2023 Singapore HSA safety advisory notes neuropathy risk at <50 mg with no clearly established lower threshold.

**The 200 mg figure traces to Schaumburg 1983**, which identified frank neuropathy at ≥2,000 mg/day. Subsequent case reports have driven the threshold down dramatically.

**Recommended change:** drop the routine 50–100 mg/day recommendation entirely. Replace with: "50 mg/day is the practical ceiling for PMS use, capped at the luteal phase only (~10 days/cycle). Long-term continuous dosing above 10–12 mg/day is associated with peripheral neuropathy in case reports, sometimes at low doses. Discontinue and seek medical advice if numbness, tingling, or balance issues develop." For an app, the **safer default is to recommend B-complex with food-level B6 (~1.7–10 mg) plus magnesium for PMS**, with high-dose B6 reserved for clinician-supervised use.

---

## 2. Needs correction — wrong numbers or wrong citations

### 🟠 Soy isoflavones "up to 92%" hot flash reduction

**Document says:** "Phytoestrogens (Soy isoflavones): 50–80 mg/day reduces severe hot flashes by up to 92% in some trials."

**Reality:** the 92% figure comes from a single 2025 secondary analysis of a vegan diet trial (ScienceDirect, 2025) — vegan diet + soy combined, not isoflavones alone. **The actual meta-analytic estimate is ~20–26% reduction.**

- Taku 2012 meta-analysis (Menopause): **20.6% reduction in frequency, 26.2% in severity** (median 54 mg/day).
- Li 2015 model-based meta-analysis (BJCP): **25.2% maximal reduction** vs placebo, ~57% of estradiol's effect.
- A 36-study review found ~21% frequency reduction, 26% severity reduction at 30–80 mg/day.

**Recommended change:** replace with: "Soy isoflavones (50–80 mg/day) reduce hot flash frequency by ~20–25% and severity by ~25% in meta-analyses — a real but modest effect, far smaller than HRT. Higher genistein content (>18.8 mg) appears more potent."

### 🟠 Schoenfeld "2017" anabolic window citation

**Document says:** "Anabolic window is ~2 hours post-workout, not 30 min as old myth suggested... per Schoenfeld 2017."

**Reality:** the relevant Schoenfeld papers are **2013** (the meta-analysis in JISSN) and the **Aragon & Schoenfeld 2013** review that introduced the "4–6 hour window" concept; there's also a 2018 JOSPT update. There's no foundational Schoenfeld 2017 paper on this.

The substantive claim (no narrow 30-minute window; total daily protein matters more than timing) is correct — just fix the year and ideally cite Aragon & Schoenfeld 2013 for the broader window concept.

### 🟠 "Shaw et al. 2017 showed elevated collagen synthesis post-exercise with 15 g + Vit C"

**Document implies:** robust evidence that pre-workout collagen + vitamin C builds tendons.

**Reality:** Shaw 2017 (AJCN) was an **8-subject crossover study using gelatin**, not collagen peptides. It measured acute serum amino-acid bioavailability and PINP (a collagen synthesis marker), plus in vitro effects on engineered ligaments — **not actual human tendon outcomes**. The mechanism is plausible and the study is real, but the doc treats it as stronger than it is.

**Recommended hedging:** "Mechanistic evidence (Shaw 2017, n=8 acute study) suggests gelatin/collagen + ~50 mg vitamin C 30–60 min before exercise may transiently increase collagen synthesis biomarkers. Whether this translates to clinical tendon/ligament outcomes is not yet established by RCTs."

---

## 3. Needs hedging — true but oversold

### 🟡 Vitamin D3 absorption "32–50% greater with fat"

**Document says:** "Studies show 32–50% greater absorption when taken with fat vs empty stomach."

**Reality:**
- 32% is well-supported (Dawson-Hughes 2015, Tufts, 50 healthy older adults).
- 50% traces to Mulligan & Licata 2010, a small (n=17) study of patients with malabsorption — not a clean comparison.
- **Critically:** the 2013 follow-up (Dawson-Hughes, J Bone Miner Res) found that while *acute* absorption differed by meal fat content, **plasma 25(OH)D levels at 30 and 90 days did not differ significantly** between fat-free and high-fat meal groups. So the "take it with fat" rule is a small acute-absorption effect that may not change long-term blood levels.

**Recommended hedging:** "Acute absorption is ~32% higher when taken with a meal containing fat; whether this translates to higher long-term blood 25(OH)D levels is mixed. Practical advice: take with whatever meal makes you most likely to remember it daily."

### 🟡 Iron + vitamin C "boosts non-heme iron absorption ~65%"

**Document says:** "Vitamin C boosts non-heme iron absorption ~65% (American J Clinical Nutrition)."

**Reality:** the 65% figure is from controlled single-meal studies. Multiple long-term studies show **vitamin C supplementation has minimal effect on iron status over time** — a key 2001 paper in AJCN found no significant difference in iron absorption from a complete diet across vitamin C intakes from 51–247 mg/day (Cook & Reddy). The single-meal effect is real but doesn't reliably translate to long-term ferritin improvement.

The practical advice (take iron with orange juice or 250–500 mg vit C) is still defensible — the effect at the meal level is real — but the doc shouldn't imply 65% better iron status long-term.

### 🟡 Alternate-day iron "30–40% better absorption"

**Document says:** "Alternate-day dosing absorbs 30–40% better than daily because hepcidin has time to drop."

**Reality:** this is well-supported by the Stoffel/Moretti research (Lancet Haematology 2017; Haematologica 2020) — fractional absorption ~16% (consecutive) vs ~22% (alternate), a ~33% relative improvement. **However, a 2023 RCT in actually anemic patients (Sci Rep, n=200) found no significant difference in hemoglobin recovery between daily and alternate-day dosing over 8 weeks.** Better absorption per dose ≠ faster recovery in real patients.

**Recommended hedging:** "Alternate-day dosing improves per-dose fractional absorption ~30%, but evidence that this translates to faster hemoglobin recovery in clinically anemic patients is mixed."

### 🟡 Postmenopausal protein "up to 2.0 g/kg"

**Document says:** "Research supports up to 2.0 g/kg for postmenopausal women preserving lean mass."

**Reality:** this is mostly **observational** (WHI cohort: lean mass correlates with intake up to ~2.02 g/kg) plus expert opinion (Stacy Sims popularized 2.0–2.3 g/kg). RCT evidence is weak: a 2-year RCT in 70–80-year-old women showed +30 g/day protein had **no effect** on muscle outcomes; the 2017 RCT comparing 0.8 vs 1.6 g/kg in older men found no acute MPS difference; a 2024 narrative review concluded "limited evidence and not of high quality."

**Recommended phrasing:** "Most evidence supports 1.0–1.6 g/kg for postmenopausal lean-mass preservation, with observational data suggesting potential benefit up to ~2.0 g/kg. Trial evidence at the highest end is limited."

### 🟡 Creatine 14-week perimenopause study

**Document says:** "14-week trial showed improved lower-body strength + sleep quality in perimenopausal women."

**Reality:** the study exists (JISSN 2025) but had **n=15 total, only 5 perimenopausal** — quasi-experimental, not RCT. The result is real but the evidence base for perimenopausal creatine specifically is genuinely thin. Mention it, but don't make it sound like settled science.

---

## 4. Correct as-is — no changes needed

These claims I checked and found well-supported:

- **Creatine 3–5 g/day, daily consistency > timing** — ISSN 2017 position stand confirms.
- **Antonio & Ciccone 2013 post-workout creatine edge** — citation correct, study real, finding genuinely modest (n=19, 4 weeks). The doc's hedging ("slight edge", "marginal benefit") is appropriate.
- **Caffeine 3–6 mg/kg, peak at ~45 min, half-life 5–6 hours** — ISSN 2021 position stand.
- **Beta-alanine saturation mechanism, 3.2–6.4 g/day** — ISSN position stand confirms.
- **Magnesium upper limit 350 mg from supplements** (NIH ODS), distinct from total intake including food.
- **Calcium >500 mg/dose absorption ceiling + ~15% CVD risk increase** — supported by Myung 2021 meta-analysis (RR 1.15 in postmenopausal women on 1000 mg/day supplemental calcium).
- **Inositol 40:1 myo:D-chiro for PCOS** — multiple RCTs confirm; 2 g myo + 50 mg D-chiro twice daily is standard protocol.
- **Boron 10 mg/day modest free testosterone effect** — Naghii 2011 (n=8, 1 week, +28% free T, -39% estradiol) is the source. Doc's hedging ("modest", "low evidence") is appropriate.
- **K2 + warfarin warning** — correct and important.
- **Zinc upper limit 40 mg/day long-term** (NIH ODS) — correct.
- **König 2018 — 5 g specific collagen peptides over 12 months improving postmenopausal BMD** — citation correct; a 4-year follow-up (Zdzieblik 2021) supports the finding.
- **Folate methylated form for ~30% with MTHFR variants** — correct; methylfolate (5-MTHF) is preferred for those with MTHFR C677T variant, which is common.
- **Iron RDA: 18 mg premenopausal, 27 mg pregnant, 8 mg men** — NIH ODS confirms.

---

## 5. Things missing or underweighted

### ⚠️ Drug interactions are under-covered

The conflicts table is good but several common ones are missing:

| Pair | Issue |
|---|---|
| **Calcium + levothyroxine** | Calcium reduces thyroid med absorption. Separate by 4 hours. |
| **Iron + levothyroxine** | Same issue. Separate by 4 hours. |
| **Magnesium + bisphosphonates** | Mg reduces absorption. Separate by 2+ hours. |
| **Magnesium + certain antibiotics** (quinolones, tetracyclines) | Chelation. Separate by 2+ hours. |
| **St John's Wort** (not in doc, but common) | Major interactions with SSRIs, contraceptives, warfarin, many others. |
| **Ashwagandha + SSRIs/SNRIs/sedatives** | Possible additive sedation; serotonin concerns reported. |
| **Curcumin/turmeric high-dose + anticoagulants** | Bleeding risk. |
| **Fish oil >3 g/day + anticoagulants** | Bleeding risk (though clinically modest). |

### ⚠️ Supplement saturation point not flagged

The doc could helpfully flag that **most healthy adults on a varied diet don't benefit from most of these supplements**. The "stack" sections risk reading as "everyone should take all of this." A line like "Most users only need: foundational tier IF their diet/sun exposure/blood work supports it" would be more honest and reduce app liability exposure.

### ⚠️ Ashwagandha is underrated as "moderate" for risks

Doc lists pregnancy, autoimmune, thyroid med interactions. Should also include:
- **Hepatotoxicity case reports** — there have been documented cases of liver injury from ashwagandha (LiverTox, Iceland 2020 series). Discontinue if any liver-related symptoms.
- **Sedative interactions** — additive with benzodiazepines, sleep meds, alcohol.

### ⚠️ Form matters for some supplements but not all

Doc handles this well for magnesium (glycinate vs citrate vs oxide) and iron (bisglycinate vs ferrous sulfate). Could also flag:
- **Vitamin D3 > D2** for raising 25(OH)D (not strongly stated).
- **Methylated B12 (methylcobalamin) vs cyanocobalamin** — preference for methyl form in MTHFR variants, but cyanocobalamin is fine for most and cheaper.
- **Probiotics: strain matters more than CFU count** — doc gets this right but could emphasize more.

---

## 6. Suggested updates to your structured JSON

Below are the specific rows in the JSON that I'd update based on the audit. The structure is fine — just the contents.

### `b6` — significant update

```json
{
  "id": "b6",
  "name": "Vitamin B6",
  "category": "Women_health",
  "evidence": "moderate",
  "dose": "Cycle-only use for PMS: up to 50 mg/day during luteal phase. Long-term ceiling: 10-12 mg/day per current EFSA/TGA guidance.",
  "timing": "Morning or breakfast",
  "withMeal": "breakfast",
  "foodPairing": "Not critical",
  "avoidWith": ["long_term_high_dose"],
  "femaleNote": "PMS support (luteal phase only); discontinue and seek medical advice if numbness, tingling, or balance issues develop",
  "maleNote": "Use only at RDA level (1.3-1.7 mg/day) unless deficient",
  "warning": "Peripheral neuropathy reported in case reports at doses as low as 6 mg/day with long-term use. EFSA tolerable upper intake: 12 mg/day."
}
```

### `soy_isoflavones` — add this as a new entry

```json
{
  "id": "soy_isoflavones",
  "name": "Soy Isoflavones",
  "category": "Women_health",
  "evidence": "moderate",
  "dose": "50-80 mg/day aglycone equivalents; >18.8 mg genistein content preferred",
  "timing": "Anytime",
  "withMeal": "breakfast_or_dinner",
  "foodPairing": "Not critical",
  "avoidWith": ["estrogen_sensitive_cancer_history_consult_oncologist"],
  "femaleNote": "Hot flash frequency reduction ~20-25% and severity ~25-26% in meta-analyses; effect smaller than HRT but real and well-tolerated. Considered safe for breast tissue at dietary/supplement doses per current evidence.",
  "maleNote": "No general indication; high-dose effects on hormones in men are largely overstated"
}
```

### `collagen` — small revision

Update `dose` to specify "5 g (postmenopausal bone)" alongside "10–15 g/day (joint/skin)" since König 2018 used 5 g.

### `iron` — small revision

Update `femaleNote`: "Critical premenopausal; alternate-day dosing improves per-dose absorption ~30%, though clinical hemoglobin recovery may not differ from daily dosing."

---

## 7. Bottom line for app integration

If I had to triage what's worth fixing first for the supplements tab/copy:

1. **Fix B6 dosing** (safety) — top priority.
2. **Fix soy isoflavone "92%" claim** (credibility) — anyone fact-checking the app will catch this.
3. **Fix Schoenfeld year** (citation hygiene) — easy fix.
4. **Add the missing drug interactions** (safety, especially levothyroxine).
5. **Hedge the postmenopausal protein 2.0 g/kg, the Vit D fat absorption story, and the Shaw collagen study** — none of these are wrong enough to mislead anyone, but a careful user will spot the overreach.

Everything else is solid. The doc is a stronger starting point than most consumer supplement guides.

---

*Audit performed against: Examine.com (Aug 2025 updates), NIH ODS fact sheets (current), EFSA tolerable upper intake levels (2023 revision), TGA (Australia) safety advisories, Cochrane reviews where available, and individual peer-reviewed RCTs/meta-analyses cited inline. Where I disagree with the doc, I've shown my work.*
