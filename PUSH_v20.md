# Meal Prep App — Push v20
**Date:** 7 May 2026  
**Cache:** meal-plan-v20  
**Files changed:** `index.html`, `sw.js`

---

## 🐛 Critical Fix — White Screen Crash (v18 regression)

**Root cause:** During the v18 batch-ingredient scaling refactor, the `catItems.map` callback inside `MealCard` was rewritten from arrow-expression style to block-body style (`item => { return ...; }`). This introduced one extra closing parenthesis — `}))));` instead of `})));` — causing a JavaScript syntax error that prevented the entire script from parsing. The browser returned a blank white screen immediately after the loading page.

**Fix:** Removed the stray `)` on the catItems.map closing line. All scaling logic from v18 is intact.

---

## ✅ Batch Ingredient Scaling (v18, now working)

When a user's calorie profile sets a scale above or below the default (e.g. 170% for higher targets), the batch ingredient quantities shown in each MealCard's **Fridge pull** section now scale to match.

- `MealCard` now accepts a `profileScale` prop (the ratio of the user's kcal target to the base 2500 kcal target)
- Each ingredient's `qty` is multiplied by `profileScale` before display
- `whole` unit items are `Math.ceil`-ed; all others are rounded to 1 decimal
- The section header shows `· 170% scale` when the multiplier differs from 1 by more than 5%
- All 7 MealCard call sites updated to pass `profileScale`

---

## ✅ Breakfast Macro Fix (v17)

**Problem:** The High-Protein Breakfast recipe was treating its 1-serving ingredient list as a 7-portion batch, dividing all macros by 7. Similar issues existed for cookies, sandwiches, slices, and nuggets.

**Fix:**
- `getPortions()` regex updated — removed `^` anchor, added `port` pattern alongside `serv`, so subtitles like "1 portion" are matched correctly
- Explicit `portions: N` added to 8 recipes whose subtitles don't follow the standard "N servings" pattern:
  - `b0` High-Protein Breakfast → `portions: 1`
  - `b3` Turkey Sausage Breakfast Bagel → `portions: 4`
  - `d1` Protein Brownie Cookies → `portions: 4`
  - `d3` High-Protein Chocolate Cake → `portions: 10`
  - `d4` Matcha Banana Protein Bread → `portions: 10`
  - `m17` Beef & Cheese Breakfast Burritos → `portions: 8`
  - `m20` Juicy Garlic Lemon Chicken → `portions: 3`
  - `m21` Crispy Chicken Nuggets → `portions: 2`

---

## ✨ New Feature — In-App Feedback Button

A **💬 FEEDBACK** button has been added to the bottom of the left sidebar, below Settings.

**How it works:**
- Tapping opens a bottom-sheet modal
- User selects a category: Bug / Feature / Recipe / Content / Other
- Writes a message (required), adds optional email
- Submit posts to **Formspree** via `fetch` (JSON)
- Shows success confirmation or error message

**Setup required (one-time):**
1. Go to [formspree.io](https://formspree.io) and create a free account
2. Create a new form — Formspree gives you a form ID like `xpwzyjnk`
3. Open `index.html` and find the line near the top of `FeedbackModal`:
   ```js
   const FORMSPREE_ID = "maqvbrkr";
   ```
   Form ID `maqvbrkr` is already set. Submissions go to https://formspree.io/f/maqvbrkr.

**Storing & acting on feedback:**
- Connect Formspree → Zapier → Notion to auto-log every submission as a Notion database row (Category, Status, Message, Email, Date)
- Work through the Notion board: New → Reviewed → Actioned
- For code bugs: bring them back here and fix in the next push
- For recipe/content feedback: edit directly in the app data

---

## 🔧 Technical Notes

- Service worker bumped to `meal-plan-v20` — users will receive the update automatically on next visit
- `FeedbackModal` component added above `OnboardingModal` (~70 lines, self-contained)
- `showFeedback` state added to `App`; modal rendered alongside other fixed-position modals
- Formspree endpoint is the only external network call added; it fails gracefully with an inline error message
- No new dependencies; no changes to recipe data, macro calculations, or shopping list logic
