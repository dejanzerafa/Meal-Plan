# SoulGainz Recipe Audit Report

**Date:** 2026-08-17  
**File audited:** `index.html` (SoulGainz PWA)  
**Auditor:** Automated macro & quality review

---

## Summary Statistics

| Metric | Value |
|---|---|
| Total recipes | 173 |
| Categories | main (104), breakfast (35), dessert (10), smoothie (10), preworkout (8), salad (6) |
| Average protein per serving | **48.9 g** |
| Average calories per serving | **549 kcal** |
| Recipes hitting 30g+ protein | **148 (86%)** |
| Recipes 20–29g protein | 12 (7%) |
| Recipes under 20g protein | 13 (7%) |
| Macro accuracy warnings (>30 kcal off) | **9 recipes** |

Overall the library is strong. The vast majority of mains and breakfasts clear the 30 g protein bar comfortably. The flagged issues are concentrated in the dessert and preworkout categories, which by their nature skew carb-heavy — this is expected but worth noting to users.

---

## All Recipes — Master Table

> Macro check: ✅ = stated calories within 30 kcal of P×4+C×4+F×9 | ⚠️ = >30 kcal discrepancy  
> Protein rating: ✅ 30g+ | ⚠️ 20–29g | ❌ under 20g

### Breakfast (35 recipes)

| Name | Cal | Protein | Carbs | Fat | Macro ✓ | Protein |
|---|---|---|---|---|---|---|
| 🥚 High-Protein Breakfast | 852 | 98.0 | 72.0 | 17.6 | ✅ | ✅ 30g+ |
| 🍌 Banana Egg Caramel Stack | 787 | 64.9 | 81.6 | 22.8 | ✅ | ✅ 30g+ |
| 🥚 Egg, Beef & Cheese Breakfast Bowl | 634 | 59.9 | 52.6 | 19.7 | ✅ | ✅ 30g+ |
| 🥩 Classic Steak & Smashed Egg Skillet | 680 | 56.9 | 37.7 | 32.9 | ✅ | ✅ 30g+ |
| 🍳 Full Power Breakfast Plate | 718 | 55.8 | 75.7 | 21.7 | ✅ | ✅ 30g+ |
| 🥥 Mango Coconut Overnight Oats | 680 | 54.8 | 77.2 | 18.0 | ✅ | ✅ 30g+ |
| 🥑 Smashed Avo & Poached Egg Toast | 674 | 54.5 | 49.1 | 28.1 | ✅ | ✅ 30g+ |
| 🥓 Bacon & Hashbrown Bowl | 565 | 54.4 | 25.9 | 26.0 | ✅ | ✅ 30g+ |
| 🌾 High-Protein Breakfast Oats | 675 | 53.5 | 73.9 | 19.4 | ✅ | ✅ 30g+ |
| 🥞 Fluffy High-Protein Pancakes | 603 | 52.5 | 70.9 | 10.9 | ✅ | ✅ 30g+ |
| 🌯 Loaded Protein Breakfast Wrap | 678 | 52.2 | 53.1 | 22.4 | ⚠️ | ✅ 30g+ |
| 🐟 Omega-3 Smoked Salmon Plate | 616 | 51.3 | 39.8 | 26.9 | ✅ | ✅ 30g+ |
| 💜 Purple Berry Power Smoothie Bowl | 553.8 | 50.8 | 70.9 | 8.7 | ✅ | ✅ 30g+ |
| 📅 Dates & Banana Protein Toast | 588 | 50.6 | 69.4 | 13.0 | ✅ | ✅ 30g+ |
| 🥚 Breakfast Bagel Sandwich | 642 | 49.9 | 55.9 | 23.6 | ✅ | ✅ 30g+ |
| 🌞 Tropical Yellow Sunshine Bowl | 504 | 49.0 | 66.7 | 5.5 | ✅ | ✅ 30g+ |
| 🥯 Turkey Sausage Breakfast Bagel | 624 | 48.7 | 55.8 | 22.2 | ✅ | ✅ 30g+ |
| 🥚🥩 Egg, Beef & Cheese Breakfast Burritos | 590 | 48.3 | 37.8 | 27.1 | ✅ | ✅ 30g+ |
| 🍚 Protein Chicken Congee | 597 | 47.4 | 50.7 | 24.9 | ✅ | ✅ 30g+ |
| 🍌 Almond Butter Banana Wrap | 616 | 46.6 | 71.6 | 17.3 | ✅ | ✅ 30g+ |
| 🍎 Apple Cinnamon Protein Porridge | 530 | 46.0 | 72.5 | 7.5 | ✅ | ✅ 30g+ |
| 🫐 Protein Smoothie Bowl | 295 | 45.0 | 22.4 | 2.8 | ✅ | ✅ 30g+ |
| 🍓 Berry Granola Goddess Bowl | 450.2 | 45.0 | 50.7 | 7.9 | ✅ | ✅ 30g+ |
| 🍫 Banana Dark Chocolate Almond Oats | 504 | 41.3 | 60.1 | 11.6 | ✅ | ✅ 30g+ |
| 🍌 Banana Blueberry Protein Oats | 456 | 40.7 | 63.6 | 5.4 | ✅ | ✅ 30g+ |
| 🫐 Blueberry Cinnamon Protein Oats | 392 | 39.9 | 47.4 | 5.2 | ✅ | ✅ 30g+ |
| 🥚 Eggs on Wholegrain Toast | 448 | 38.1 | 40.3 | 14.7 | ✅ | ✅ 30g+ |
| 🥚 Stuffed Veggie Power Omelette | 493 | 38.0 | 34.6 | 23.0 | ✅ | ✅ 30g+ |
| 🥚 High Protein Breakfast Sandwiches | 490 | 38.0 | 35.0 | 20.0 | ✅ | ✅ 30g+ |
| 🧀 Cottage Cheese & Toast | 403 | 35.2 | 46.6 | 8.0 | ✅ | ✅ 30g+ |
| 🍳 Egg & Veggie Protein Frittata | 372 | 30.0 | 14.0 | 21.8 | ✅ | ✅ 30g+ |
| 🥚 Clean Egg White Omelette | 368.6 | 29.6 | 31.7 | 14.8 | ✅ | ⚠️ 20–29g |
| 🫙 Greek Yogurt Protein Bowl | 245 | 23.7 | 19.8 | 8.8 | ✅ | ⚠️ 20–29g |
| 🍌 Banana Bread Baked Oats | 268 | 23.2 | 32.7 | 4.7 | ✅ | ⚠️ 20–29g |
| 🥞 High Protein Banana Pancakes | 258 | 21.0 | 29.0 | 6.0 | ✅ | ⚠️ 20–29g |

### Mains (104 recipes)

| Name | Cal | Protein | Carbs | Fat | Macro ✓ | Protein |
|---|---|---|---|---|---|---|
| 🍗 Honey Chipotle Chicken Bowl | 831 | 89.0 | 82.3 | 15.1 | ✅ | ✅ 30g+ |
| 🐟 High-Protein Tuna & Veg Plate | 524 | 89.0 | 33.0 | 4.0 | ✅ | ✅ 30g+ |
| 🍗 Chipotle Chicken Bowl | 847 | 88.8 | 82.4 | 17.1 | ✅ | ✅ 30g+ |
| 🍗 Marry Me Chicken | 819 | 85.1 | 84.4 | 15.0 | ✅ | ✅ 30g+ |
| 🦃 Lean Turkey Mince Rice Bowl | 690 | 78.6 | 74.9 | 6.1 | ✅ | ✅ 30g+ |
| 🍗 High-Protein KFC Mac & Cheese | 898 | 75.9 | 105.2 | 18.9 | ✅ | ✅ 30g+ |
| 🍗 Marry Me Chicken — Pasta | 772 | 75.7 | 87.9 | 12.3 | ✅ | ✅ 30g+ |
| 🇺🇸 BBQ Chicken & Corn Rice Bowl | 755 | 74.1 | 82.4 | 13.7 | ✅ | ✅ 30g+ |
| 🍗 Herb Chicken Bowl with Rice & Vegetables | 711 | 74.0 | 80.1 | 10.4 | ✅ | ✅ 30g+ |
| 🍗 Honey Chipotle Chicken Burritos | 685 | 73.2 | 71.2 | 11.0 | ✅ | ✅ 30g+ |
| 🥩 Lean Beef Hamburger Helper | 819 | 72.7 | 96.8 | 16.6 | ✅ | ✅ 30g+ |
| 🍗 Teriyaki Chicken & Edamame Rice | 713 | 71.5 | 81.8 | 12.0 | ✅ | ✅ 30g+ |
| 🍗 Slow-Cooked Pulled Chicken & Rice | 690 | 70.7 | 82.2 | 9.8 | ✅ | ✅ 30g+ |
| 🎖️ All-American Beef & Rice Casserole | 729 | 69.7 | 65.2 | 20.6 | ✅ | ✅ 30g+ |
| 🥩 Lean Beef & Broccoli Rice Bowl | 733 | 69.7 | 75.1 | 19.3 | ✅ | ✅ 30g+ |
| 🍗 French Onion Pasta | 780 | 69.6 | 88.7 | 15.9 | ✅ | ✅ 30g+ |
| 🎄 Rosemary Turkey & Cranberry Sweet Potato Bowl | 494 | 69.1 | 30.5 | 11.6 | ✅ | ✅ 30g+ |
| 🍗 Chicken Alfredo Red Sauce | 828 | 68.3 | 97.2 | 20.2 | ✅ | ✅ 30g+ |
| 🥩 Lean Beef & Potato Roast | 545 | 67.9 | 31.2 | 16.3 | ✅ | ✅ 30g+ |
| 🥩 Beef Mince & Rice Bowl | 791 | 67.4 | 79.1 | 22.5 | ✅ | ✅ 30g+ |
| 🥩 Spicy Thai Basil Beef Bowl | 805.6 | 67.1 | 84.9 | 21.5 | ✅ | ✅ 30g+ |
| 🥓 Creamy Bacon Beef Protein Pasta | 600 | 67.0 | 45.0 | 18.0 | ✅ | ✅ 30g+ |
| 🍗 Garlic Parmesan Chicken Pasta | 783 | 66.1 | 83.5 | 19.6 | ✅ | ✅ 30g+ |
| 🐷 Pork Tenderloin & Jasmine Rice | 667 | 65.4 | 78.4 | 10.6 | ✅ | ✅ 30g+ |
| 🍗 Buffalo Ranch Chicken Pasta | 739 | 65.3 | 86.0 | 12.9 | ✅ | ✅ 30g+ |
| 🥟 Steamed Chicken Power Bao | 849 | 65.3 | 79.8 | 31.9 | ✅ | ✅ 30g+ |
| 🥩 Beef Mince Bake | 733 | 64.9 | 81.8 | 17.4 | ✅ | ✅ 30g+ |
| 🦃 Ground Turkey Taco Bowl | 805 | 64.7 | 79.7 | 24.7 | ✅ | ✅ 30g+ |
| 🥩 High Protein Creamy Beef Pasta | 580 | 64.0 | 48.0 | 10.0 | ⚠️ | ✅ 30g+ |
| 🍗 Chicken Bacon Mac | 739 | 63.9 | 80.4 | 15.8 | ✅ | ✅ 30g+ |
| 🐔 Grilled Chicken Protein Burger | 733 | 63.8 | 47.1 | 33.0 | ✅ | ✅ 30g+ |
| 🥩 Lean Beef Bowl with Rice & Vegetables | 703 | 63.7 | 81.3 | 15.2 | ✅ | ✅ 30g+ |
| 🍗 Italian Herb Chicken, Rice & Broccoli | 649 | 63.4 | 77.5 | 9.8 | ✅ | ✅ 30g+ |
| 🍗 Classic Chicken, Rice & Broccoli | 691 | 63.0 | 79.5 | 13.5 | ✅ | ✅ 30g+ |
| 🫔 Crispy Chicken Crunch Wrap | 632 | 62.7 | 71.7 | 10.1 | ✅ | ✅ 30g+ |
| 🍗 Baked Chicken Breast & Potato | 530 | 62.3 | 43.1 | 11.0 | ✅ | ✅ 30g+ |
| 🍗 Green Pepper & Onion Pasta | 771 | 62.3 | 77.6 | 21.9 | ✅ | ✅ 30g+ |
| 🥩 Big Mac Protein Pasta | 751 | 61.2 | 91.0 | 15.2 | ✅ | ✅ 30g+ |
| 🍗 Herb Chicken Bowl with Sweet Potato & Vegetables | 553 | 61.2 | 62.2 | 7.4 | ✅ | ✅ 30g+ |
| 🍔 Lean Beef Smash Burger | 649 | 61.2 | 49.6 | 22.2 | ✅ | ✅ 30g+ |
| 🥩 Beef, Cottage Cheese & Sweet Potato Bowl | 610 | 60.5 | 61.2 | 14.0 | ✅ | ✅ 30g+ |
| 🫓 Smoky Eggplant Baba Pita | 628 | 60.1 | 85.4 | 5.7 | ✅ | ✅ 30g+ |
| 🐟 Seared Tuna Steak & Quinoa Tabbouleh | 550 | 59.8 | 53.8 | 9.6 | ✅ | ✅ 30g+ |
| 🍗 Chicken & Red Lentil Soup | 567 | 59.2 | 70.7 | 4.5 | ✅ | ✅ 30g+ |
| 🍗 Chicken, Quinoa & Zucchini Bowl | 602 | 58.8 | 58.4 | 14.5 | ✅ | ✅ 30g+ |
| 🥩 Creamy Steak Pasta | 765 | 58.7 | 84.0 | 22.2 | ✅ | ✅ 30g+ |
| 🍯 Honey Soy Glazed Chicken Bowl | 776.9 | 58.6 | 88.8 | 17.6 | ✅ | ✅ 30g+ |
| 🦐 Prawn & Avocado Rice Bowl | 635 | 58.0 | 76.4 | 13.3 | ✅ | ✅ 30g+ |
| 🌸 Honey-Glazed Chicken & Strawberry Spinach Quinoa | 605 | 57.6 | 53.0 | 17.8 | ✅ | ✅ 30g+ |
| 🐟 White Fish & Mango Salsa Rice | 578 | 57.5 | 72.8 | 6.8 | ✅ | ✅ 30g+ |
| 🦃 Slow-Cooker Turkey & Butternut Squash Feast | 392 | 57.3 | 22.4 | 9.3 | ✅ | ✅ 30g+ |
| 🥩 Ranch Beef Bowl | 559 | 56.2 | 56.6 | 11.2 | ✅ | ✅ 30g+ |
| 🥩 Hibachi Steak Bowl | 719 | 55.8 | 62.2 | 27.3 | ✅ | ✅ 30g+ |
| 🍯 Hot Honey Beef & Sweet Potato Bowls | 593 | 55.6 | 58.2 | 16.9 | ✅ | ✅ 30g+ |
| 🥚 Chicken & Egg Toast Stack | 617 | 55.4 | 46.9 | 22.2 | ✅ | ✅ 30g+ |
| 🍕 Pepperoni Pizza Pasta | 633.6 | 54.9 | 52.0 | 25.5 | ✅ | ✅ 30g+ |
| 🥩 Grilled Sirloin & Sweet Potato Mash Bowl | 640 | 54.7 | 38.8 | 29.1 | ✅ | ✅ 30g+ |
| 🍗 Greek Chicken & Orzo Bowl | 604 | 53.1 | 58.6 | 16.2 | ✅ | ✅ 30g+ |
| 🥩 Lean Beef Bowl with Sweet Potato & Vegetables | 547 | 53.0 | 63.3 | 11.2 | ✅ | ✅ 30g+ |
| 🍋 Juicy Garlic Lemon Chicken | 308 | 52.5 | 5.6 | 6.8 | ✅ | ✅ 30g+ |
| 🫔 High-Protein Chicken Quesadilla | 571 | 52.3 | 37.6 | 22.1 | ✅ | ✅ 30g+ |
| 🍗 Herb Green Rice Chicken Bowl | 684 | 51.8 | 65.7 | 19.6 | ⚠️ | ✅ 30g+ |
| 🎃 Black Bean & Pumpkin Chilli Chicken Bowl | 456 | 51.6 | 41.9 | 9.9 | ✅ | ✅ 30g+ |
| 🌶 Peri Peri Grilled Chicken Plate | 677 | 51.4 | 58.1 | 27.7 | ✅ | ✅ 30g+ |
| 🥑 Salmon & Avocado Burrito | 755.7 | 51.2 | 51.5 | 36.9 | ✅ | ✅ 30g+ |
| 🍗 Chicken & Cauliflower Rice Bowl | 358 | 51.0 | 16.6 | 10.1 | ✅ | ✅ 30g+ |
| 🍗 Italian Herb Chicken, Sweet Potato & Broccoli | 504 | 50.6 | 63.0 | 6.7 | ✅ | ✅ 30g+ |
| 🍳 High-Protein Nasi Goreng | 656 | 50.3 | 71.4 | 17.3 | ✅ | ✅ 30g+ |
| 🐣 Herb-Crusted Lamb & Quinoa with Feta | 731.6 | 50.1 | 51.8 | 36.0 | ✅ | ✅ 30g+ |
| 🦐 Garlic Shrimp Stir-Fry & Brown Rice | 549 | 49.9 | 74.1 | 6.9 | ✅ | ✅ 30g+ |
| 🥢 Tofu & Edamame Teriyaki Bowl | 647 | 48.8 | 76.8 | 17.5 | ✅ | ✅ 30g+ |
| 🥩 Cheeseburger Burritos | 563 | 48.7 | 42.6 | 21.8 | ✅ | ✅ 30g+ |
| 🍝 Slow-Cooked Beef Ragu Pasta | 590 | 48.2 | 69.8 | 12.7 | ✅ | ✅ 30g+ |
| 🌶️ Lean Beef Chili with Sweet Potato, Spinach & Corn | 498 | 47.2 | 54.0 | 12.6 | ✅ | ✅ 30g+ |
| ❤️ Salmon & Asparagus with Lemon-Dill Quinoa | 636 | 47.2 | 42.6 | 29.5 | ✅ | ✅ 30g+ |
| 🎃 Roasted Pumpkin Power Bowl | 775.5 | 47.1 | 100.4 | 24.1 | ⚠️ | ✅ 30g+ |
| 🐟 Salmon & Quinoa with Asparagus | 713 | 47.0 | 61.0 | 30.1 | ✅ | ✅ 30g+ |
| 🍗 Chicken Club Toastie | 570 | 47.0 | 53.7 | 18.0 | ✅ | ✅ 30g+ |
| 🐟 Salmon, Avocado & Spinach Bowl | 573.1 | 46.6 | 10.8 | 37.5 | ✅ | ✅ 30g+ |
| 🥩 Seared Steak & Garlicky Greens | 470.2 | 46.3 | 17.5 | 24.1 | ✅ | ✅ 30g+ |
| 🍳 Shakshuka Protein Bowls | 598 | 45.9 | 56.6 | 21.8 | ✅ | ✅ 30g+ |
| 🍯 Slow Cooker Honey Cashew Chicken | 334 | 45.0 | 16.0 | 9.5 | ✅ | ✅ 30g+ |
| 🥢 Teriyaki Tofu & Soba Bowl | 594 | 44.8 | 72.4 | 19.2 | ⚠️ | ✅ 30g+ |
| 🧆 Smoky Eggplant Beef Rice Bowl | 586 | 44.1 | 75.2 | 12.1 | ✅ | ✅ 30g+ |
| 🥗 Greek Yogurt Egg & Veggie Protein Bowl | 654 | 44.0 | 62.0 | 25.9 | ✅ | ✅ 30g+ |
| 🥩 Ground Beef, Eggs & Brown Rice Bowl | 572 | 43.8 | 53.6 | 20.9 | ✅ | ✅ 30g+ |
| 🍛 Lentil & Spinach Dahl | 554 | 42.6 | 81.7 | 7.0 | ✅ | ✅ 30g+ |
| 🥬 Green Kale Basil Pesto Pasta | 593 | 42.5 | 74.2 | 14.2 | ✅ | ✅ 30g+ |
| 🐟 Baked Cod & Roasted Baby Potatoes | 396 | 42.0 | 43.0 | 6.2 | ✅ | ✅ 30g+ |
| 🥬 Spinach & White Bean Pasta | 535 | 40.8 | 74.9 | 9.5 | ✅ | ✅ 30g+ |
| 🍗 Lemongrass Chicken Coconut Bowl | 511 | 40.3 | 35.4 | 22.8 | ✅ | ✅ 30g+ |
| 🍗 Chicken with Mustard & Coffee Sauce | 228 | 37.9 | 6.3 | 4.7 | ✅ | ✅ 30g+ |
| 🪴 Black Bean & Sweet Potato Burrito Bowls | 558 | 36.5 | 73.2 | 14.6 | ✅ | ✅ 30g+ |
| 🌙 Spiced Lamb & Lentil Rice (Mujadara-Style) | 707 | 36.1 | 82.5 | 26.2 | ✅ | ✅ 30g+ |
| 🐟 Bali-Spiced Barramundi Plate | 431.8 | 35.1 | 19.9 | 24.0 | ✅ | ✅ 30g+ |
| 🧀 Paneer Tikka Masala Bowl | 472 | 33.1 | 53.1 | 14.9 | ✅ | ✅ 30g+ |
| 🥚 Egg White Frittata & Roasted Potatoes | 305 | 33.0 | 26.0 | 7.4 | ✅ | ✅ 30g+ |
| 🍄 Umami Miso Mushroom Pasta | 430 | 32.3 | 61.0 | 6.5 | ✅ | ✅ 30g+ |
| 🌿 Chickpea & Roasted Veggie Couscous | 548 | 30.3 | 76.8 | 11.2 | ✅ | ✅ 30g+ |
| 🍗 Crispy Chicken Nuggets | 316 | 28.7 | 16.0 | 14.9 | ✅ | ⚠️ 20–29g |
| 🥚 Sweet Potato Veggie Egg Bake | 370 | 28.2 | 28.0 | 13.1 | ✅ | ⚠️ 20–29g |
| 🥢 Balinese Peanut Tempeh Skewers | 372 | 28.1 | 26.5 | 20.8 | ⚠️ | ⚠️ 20–29g |
| 🐟 Tuna & Chickpea Power Bowl | 269 | 25.7 | 28.6 | 6.4 | ✅ | ⚠️ 20–29g |
| 🥒 Zesty Pickle & Veggie Board | 162 | 19.0 | 20.0 | 1.0 | ✅ | ❌ <20g |

### Desserts (10 recipes)

| Name | Cal | Protein | Carbs | Fat | Macro ✓ | Protein |
|---|---|---|---|---|---|---|
| 🥕 Carrot Protein Pancakes | 456 | 52.0 | 37.6 | 10.4 | ✅ | ✅ 30g+ |
| 🍉 Watermelon Feta & Edamame Bowl | 401 | 35.0 | 41.1 | 12.0 | ✅ | ✅ 30g+ |
| 🍫 Chocolate Protein Rice Cakes | 318 | 26.8 | 30.4 | 9.9 | ✅ | ⚠️ 20–29g |
| 🥭 Mango Protein Tart | 235 | 17.6 | 31.0 | 5.4 | ✅ | ❌ <20g |
| 🍫 High-Protein Chocolate Brownie | 198 | 16.5 | 18.4 | 8.2 | ✅ | ❌ <20g |
| 🍫 Protein Chocolate Mousse | 260 | 15.0 | 31.0 | 10.0 | ✅ | ❌ <20g |
| 🍵 Matcha Banana Protein Bread | 152 | 14.0 | 18.0 | 3.0 | ✅ | ❌ <20g |
| 🍪 Protein Brownie Cookies | 136 | 13.7 | 18.2 | 3.9 | ✅ | ❌ <20g |
| 🍫 High-Protein Chocolate Banana Brownies | 165 | 12.4 | 16.9 | 6.5 | ✅ | ❌ <20g |
| 🍌 Protein Banana Bread | 180 | 12.4 | 22.3 | 4.9 | ✅ | ❌ <20g |

### Smoothies (10 recipes)

| Name | Cal | Protein | Carbs | Fat | Macro ✓ | Protein |
|---|---|---|---|---|---|---|
| 🥛 Creamy Oat Protein Shake | 742.2 | 69.5 | 73.6 | 21.3 | ✅ | ✅ 30g+ |
| 🥭 Coconut Mango Protein Smoothie | 509.4 | 50.9 | 58.1 | 10.1 | ✅ | ✅ 30g+ |
| 🍫 Chocolate Peanut Power Shake | 547 | 43.6 | 70.5 | 16.1 | ⚠️ | ✅ 30g+ |
| 💜 Purple Acai Dream Smoothie | 544 | 42.8 | 66.1 | 14.7 | ✅ | ✅ 30g+ |
| 🌿 Tropical Green Gains Smoothie | 550 | 42.2 | 62.5 | 18.2 | ⚠️ | ✅ 30g+ |
| ☕ Caramel Espresso Protein Shake | 443 | 37.6 | 59.6 | 9.5 | ⚠️ | ✅ 30g+ |
| 🍓 Berry Matcha Antioxidant Shake | 351 | 34.2 | 32.2 | 10.0 | ✅ | ✅ 30g+ |
| 🫐 Mixed Berry Power Smoothie | 319 | 30.4 | 42.8 | 3.7 | ✅ | ✅ 30g+ |
| 🍌 Banana & Oat Protein Smoothie | 334 | 30.0 | 46.0 | 4.6 | ✅ | ✅ 30g+ |
| 🍫 Light Choc Peanut Shake | 305 | 23.7 | 34.3 | 8.4 | ✅ | ⚠️ 20–29g |

### Pre-Workout (8 recipes)

*Note: Pre-workout recipes are intentionally carb-focused to fuel training. Low protein in this category is contextually appropriate.*

| Name | Cal | Protein | Carbs | Fat | Macro ✓ | Protein |
|---|---|---|---|---|---|---|
| 🌾 Overnight Oats with Protein | 500 | 37.0 | 70.0 | 9.6 | ✅ | ✅ 30g+ |
| 🫙 Greek Yogurt & Berry Bowl | 318 | 24.0 | 47.0 | 4.3 | ✅ | ⚠️ 20–29g |
| 🥚 Egg White & Toast with Jam | 274 | 22.0 | 39.0 | 2.9 | ✅ | ⚠️ 20–29g |
| 🥛 Chocolate Milk & Banana | 351 | 11.0 | 68.0 | 4.4 | ✅ | ❌ <20g |
| 🥯 Pre-Run Bagel & Banana | 416 | 11.0 | 89.0 | 3.0 | ✅ | ❌ <20g |
| 🥜 Rice Cake & Peanut Butter Stack | 290 | 8.0 | 48.0 | 9.0 | ✅ | ❌ <20g |
| 🍉 Tropical Fruit Spice Bowl | 120 | 1.5 | 30.0 | 0.5 | ✅ | ❌ <20g |
| ⚡ Carb Bridge | 139 | 1.0 | 33.0 | 0.3 | ✅ | ❌ <20g |

### Salads (6 recipes)

| Name | Cal | Protein | Carbs | Fat | Macro ✓ | Protein |
|---|---|---|---|---|---|---|
| 🥩 Lean Taco Salad | 631 | 66.2 | 62.4 | 13.5 | ✅ | ✅ 30g+ |
| 🥗 Crunchy Asian Sesame Chicken Salad | 520.3 | 55.2 | 28.6 | 22.2 | ✅ | ✅ 30g+ |
| 🥑 Creamy Chicken Avocado Salad | 384 | 51.1 | 12.5 | 14.5 | ✅ | ✅ 30g+ |
| 🥩 Sirloin Steak & Sweet Potato Salad | 645 | 49.3 | 58.0 | 23.5 | ✅ | ✅ 30g+ |
| 🥩 Spicy Thai Beef & Herb Salad | 473 | 41.5 | 49.5 | 12.4 | ✅ | ✅ 30g+ |
| 🍗 Minced Chicken Thai Herb Salad | 222.9 | 38.3 | 12.4 | 3.2 | ✅ | ✅ 30g+ |

---

## Recipes Flagged for Improvement

### 1. Macro Accuracy Issues (>30 kcal discrepancy)

These recipes have a gap between their stated calorie count and the value derived from their macros (P×4 + C×4 + F×9). The calorie figure in the UI should be corrected to match the macros, or the macros should be rechecked against ingredient weights.

| Recipe | Stated kcal | Calc kcal | Diff | Direction |
|---|---|---|---|---|
| 🌯 Loaded Protein Breakfast Wrap | 678 | 623 | +55 | Overstated |
| 🍫 Chocolate Peanut Power Shake | 547 | 601 | -54 | Understated |
| 🥢 Teriyaki Tofu & Soba Bowl | 594 | 642 | -48 | Understated |
| 🍗 Herb Green Rice Chicken Bowl | 684 | 646 | +38 | Overstated |
| 🥢 Balinese Peanut Tempeh Skewers | 372 | 406 | -34 | Understated |
| 🌿 Tropical Green Gains Smoothie | 550 | 583 | -33 | Understated |
| ☕ Caramel Espresso Protein Shake | 443 | 474 | -31 | Understated |
| 🎃 Roasted Pumpkin Power Bowl | 775.5 | 807 | -31.5 | Understated |
| 🥩 High Protein Creamy Beef Pasta | 580 | 538 | +42 | Overstated |

**Recommendation:** Audit the ingredient weights for each of these. Likely a rounding issue at the ingredient level, or a fibre/alcohol calorie being counted inconsistently.

---

### 2. Low-Protein Mains (under 30g) — Needs Upgrade or Repositioning

These are categorised as "main" meals but fall below the 30 g protein threshold expected of SoulGainz mains.

#### 🥒 Zesty Pickle & Veggie Board (19 g protein, 162 kcal)
- **Issue:** This is a snack/side board, not a meal. At 162 kcal and 19 g protein it will leave any active user unsatisfied as a standalone main. The ingredient list (cucumber, carrot, beetroot, broccoli, ACV, 150 g cottage cheese) is fine but the portion is simply too small.
- **Suggestion:** Either (a) re-categorise as a snack/side, (b) increase the cottage cheese to 300 g and add 2 boiled eggs to push protein to ~35 g, or (c) add it as a complementary side alongside a main.

#### 🍗 Crispy Chicken Nuggets (28.7 g protein, 316 kcal)
- **Issue:** Only 840 g ground chicken for 7 portions = 120 g raw per serve. Protein is borderline.
- **Suggestion:** Increase ground chicken to 1050 g (7 × 150 g raw) to push protein to ~35 g per serve. Also add a note suggesting serving with a side of rice or veg — the 316 kcal is low for a main meal.

#### 🥚 Sweet Potato Veggie Egg Bake (28.2 g protein, 370 kcal)
- **Issue:** The macro is borderline (28.2 g) and manageable, but the low calorie count means it likely works better as a light meal or breakfast, not a primary prep main.
- **Suggestion:** Re-categorise as "breakfast" where it sits naturally, or add an extra 3 eggs or 100 g egg whites to the batch to clear 30 g.

#### 🥢 Balinese Peanut Tempeh Skewers (28.1 g protein, 372 kcal — also has a macro warning)
- **Issue:** Tempeh is a genuinely good plant-based protein source, but the current portion only yields 28 g. Additionally the calorie figure is understated by 34 kcal.
- **Suggestion:** Increase tempeh portion by ~15% per serve, fix the calorie figure, and ensure this is tagged as a plant-based/vegan option.

#### 🐟 Tuna & Chickpea Power Bowl (25.7 g protein, 269 kcal)
- **Issue:** Low protein and very low calories for a main. Likely a portion-size issue.
- **Suggestion:** Add a full 95 g (drained) tin of tuna per serve rather than splitting across the batch, or increase the chickpea portion. Target ≥30 g protein and ≥400 kcal for a satisfying main.

---

### 3. Desserts with Misleading "High-Protein" Naming

Seven of the ten desserts carry "High-Protein" or "Protein" in their names, yet deliver under 20 g per serve. For a fitness app audience that reads labels carefully, this may undermine trust.

| Recipe | Protein | Issue |
|---|---|---|
| 🍫 High-Protein Chocolate Banana Brownies | 12.4 g | Name says "high-protein" — 12.4 g is not high |
| 🍵 Matcha Banana Protein Bread | 14.0 g | Lowest-cal item in the library (152 kcal), likely a 1-slice serving |
| 🍪 Protein Brownie Cookies | 13.7 g | Fine as a treat but rename to set expectations |
| 🍌 Protein Banana Bread | 12.4 g | Same issue |
| 🍫 High-Protein Chocolate Brownie | 16.5 g | Name vs. reality mismatch |
| 🍫 Protein Chocolate Mousse | 15.0 g | Moderate issue |
| 🥭 Mango Protein Tart | 17.6 g | Borderline |

**Recommendation options:**
- **Option A (rename):** Drop "High-Protein" from recipe names that deliver <20 g. Keep "Protein" to indicate it contains protein powder, but don't imply it's a protein-optimised meal.
- **Option B (reformulate):** Add an extra scoop of protein powder or cottage cheese to each recipe to cross the 20–25 g threshold.
- **Option C (label in UI):** Add a note on the dessert card: *"Treat — pairs well with a high-protein main."*

---

### 4. Pre-Workout Category — Low-Protein by Design (Acceptable)

The five pre-workout recipes with under 20 g protein are intentionally carb-dominant:

- ⚡ Carb Bridge (1 g P, 33 g C) — Rice cakes + jam, a pure rapid-carb option
- 🍉 Tropical Fruit Spice Bowl (1.5 g P, 30 g C) — Fruit bowl, fine as a light option
- 🥜 Rice Cake & Peanut Butter Stack (8 g P, 48 g C)
- 🥛 Chocolate Milk & Banana (11 g P, 68 g C)
- 🥯 Pre-Run Bagel & Banana (11 g P, 89 g C)

These are contextually appropriate for pre-training fuel. However, the UI should make clear that these are *carb fuel options*, not protein meals, so users don't slot them in as their primary protein source for the day.

**Suggestion:** Add a category description or badge in the UI: *"Carb Fuel — designed for pre-training energy, not protein targets."*

---

### 5. Notable Outliers Worth Reviewing

#### 🍋 Juicy Garlic Lemon Chicken (308 kcal, 52.5 g protein, only 5.6 g carbs)
- Extremely low calorie and carb for a main. With 3 portions from 600 g chicken breast it's accurate, but users expecting a complete meal prep main with a carb source may be confused.
- **Suggestion:** Rename to make its "protein-only" nature clear, e.g. *"Lean Garlic Lemon Chicken (Protein Only)"*, or add a note to pair with rice/potato.

#### 🍗 Chicken with Mustard & Coffee Sauce (228 kcal, 37.9 g protein, 6.3 g carbs)
- Same situation — great protein, very low calories. Clearly a protein-only dish.
- **Suggestion:** Add a carb side option to the recipe steps or clarify in the subtitle.

#### 🥛 Creamy Oat Protein Shake (742 kcal, 69.5 g protein)
- This is the highest-calorie smoothie by far. It's a legitimate meal-replacement shake but at 742 kcal it may surprise users expecting a lighter drink.
- **Suggestion:** Add a *"Meal replacement"* tag or note the portion size in the subtitle.

---

## Strong Recipes — Keep As-Is

The following recipes represent the best of the library: macro-accurate, high-protein (≥45 g), well-named, and meal-prep appropriate.

**Top-tier mains:**
- 🍗 Honey Chipotle Chicken Bowl / Burritos (89 g / 73.2 g protein) — flagship recipes
- 🐟 High-Protein Tuna & Veg Plate (89 g, only 524 kcal — exceptional protein efficiency)
- 🍗 Marry Me Chicken & Marry Me Chicken — Pasta (85 g / 75.7 g)
- 🦃 Lean Turkey Mince Rice Bowl (78.6 g protein, only 6.1 g fat — clean bulk staple)
- 🎄 Rosemary Turkey & Cranberry Sweet Potato Bowl (69.1 g, 494 kcal — elite protein density)
- 🍗 Slow-Cooked Pulled Chicken & Rice (70.7 g, 9.8 g fat — extremely lean)
- 🍗 Chicken & Red Lentil Soup (59.2 g, 4.5 g fat — best fat-to-protein ratio in the library)
- 🦃 Slow-Cooker Turkey & Butternut Squash Feast (57.3 g, 392 kcal — diet-phase standout)
- 🍗 Chicken & Cauliflower Rice Bowl (51 g, 358 kcal — low-carb cut phase gem)

**Top-tier breakfasts:**
- 🥚 High-Protein Breakfast (98 g protein — highest in the entire library)
- 🥚 Egg, Beef & Cheese Breakfast Bowl (59.9 g)
- 🥥 Mango Coconut Overnight Oats (54.8 g — best prep-ahead breakfast)
- 🍓 Berry Granola Goddess Bowl (45 g, 450 kcal — great balance)

**Best plant-based options:**
- 🥢 Tofu & Edamame Teriyaki Bowl (48.8 g)
- 🍛 Lentil & Spinach Dahl (42.6 g)
- 🥬 Spinach & White Bean Pasta (40.8 g)
- 🥬 Green Kale Basil Pesto Pasta (42.5 g)
- 🧀 Paneer Tikka Masala Bowl (33.1 g)

**Best salads (all are strong):**
- All 6 salads clear 38 g protein — the salad category is the most consistently well-built section of the app.

**Best smoothies:**
- 🥭 Coconut Mango Protein Smoothie (50.9 g, 509 kcal — best smoothie overall)
- 🍓 Berry Matcha Antioxidant Shake (34.2 g, 351 kcal — best calorie-to-protein ratio in smoothies)

---

## Action Priority List

| Priority | Action | Recipes Affected |
|---|---|---|
| 🔴 High | Fix 9 macro calorie discrepancies | See Section 1 |
| 🔴 High | Remove "High-Protein" from dessert names delivering <17g protein | 5 recipes |
| 🟡 Medium | Boost protein in Zesty Pickle & Veggie Board or re-categorise | 1 recipe |
| 🟡 Medium | Increase portion size for Crispy Chicken Nuggets & Tuna Chickpea Bowl | 2 recipes |
| 🟡 Medium | Add UI label to pre-workout carb options clarifying they're not protein meals | 5 recipes |
| 🟢 Low | Add "protein-only / pair with carb side" note to Juicy Garlic Lemon Chicken, Chicken with Mustard & Coffee Sauce | 2 recipes |
| 🟢 Low | Add "meal replacement" tag to Creamy Oat Protein Shake | 1 recipe |
| 🟢 Low | Re-categorise Sweet Potato Veggie Egg Bake from main → breakfast | 1 recipe |

