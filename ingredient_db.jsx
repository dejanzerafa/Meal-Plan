import { useState, useMemo } from "react";

const CATEGORIES = [
  "All",
  "Protein & Meat",
  "Fish & Seafood",
  "Dairy & Eggs",
  "Grains & Carbs",
  "Legumes",
  "Vegetables",
  "Fruits",
  "Fats & Nuts",
  "Condiments & Sauces",
  "Herbs & Spices",
  "Baking & Sweeteners",
  "Supplements",
];

const BASE = [
  // ── PROTEIN & MEAT ──────────────────────────────────────────────────────────
  {id:1,  name:"Chicken Breast (skinless)",          cat:"Protein & Meat", kcal:165, p:31.0, c:0.0,  f:3.6},
  {id:2,  name:"Chicken Thigh (boneless, skinless)", cat:"Protein & Meat", kcal:177, p:24.0, c:0.0,  f:8.2},
  {id:3,  name:"Ground Chicken (lean)",              cat:"Protein & Meat", kcal:148, p:27.0, c:0.0,  f:4.0},
  {id:4,  name:"Turkey Breast (skinless)",           cat:"Protein & Meat", kcal:135, p:29.0, c:0.0,  f:1.0},
  {id:5,  name:"Ground Turkey (93% lean)",           cat:"Protein & Meat", kcal:163, p:22.0, c:0.0,  f:8.0},
  {id:6,  name:"Beef Mince (5% fat)",                cat:"Protein & Meat", kcal:121, p:21.0, c:0.0,  f:4.0},
  {id:7,  name:"Beef Mince (10% fat)",               cat:"Protein & Meat", kcal:176, p:20.0, c:0.0,  f:10.0},
  {id:8,  name:"Beef Mince (20% fat)",               cat:"Protein & Meat", kcal:254, p:17.0, c:0.0,  f:20.0},
  {id:9,  name:"Sirloin Steak",                      cat:"Protein & Meat", kcal:207, p:26.0, c:0.0,  f:11.0},
  {id:10, name:"Ribeye Steak",                       cat:"Protein & Meat", kcal:289, p:24.0, c:0.0,  f:20.0},
  {id:11, name:"Lean Beef (tenderloin)",             cat:"Protein & Meat", kcal:179, p:29.0, c:0.0,  f:6.0},
  {id:12, name:"Pork Tenderloin",                    cat:"Protein & Meat", kcal:143, p:26.0, c:0.0,  f:3.5},
  {id:13, name:"Pork Loin Chop",                     cat:"Protein & Meat", kcal:172, p:26.0, c:0.0,  f:7.0},
  {id:14, name:"Lamb Mince",                         cat:"Protein & Meat", kcal:282, p:16.0, c:0.0,  f:24.0},
  {id:15, name:"Bacon (streaky, raw)",               cat:"Protein & Meat", kcal:458, p:12.0, c:1.4,  f:45.0},
  {id:16, name:"Turkey Bacon",                       cat:"Protein & Meat", kcal:218, p:28.0, c:4.0,  f:11.0},
  {id:17, name:"Chicken Sausage",                    cat:"Protein & Meat", kcal:181, p:19.0, c:4.0,  f:10.0},
  {id:18, name:"Deli Turkey (sliced)",               cat:"Protein & Meat", kcal:89,  p:17.0, c:2.0,  f:1.0},
  {id:19, name:"Turkey / Chicken Ham (sliced)",      cat:"Protein & Meat", kcal:105, p:16.0, c:2.5,  f:3.5},

  // ── FISH & SEAFOOD ───────────────────────────────────────────────────────────
  {id:20, name:"Salmon (Atlantic)",                  cat:"Fish & Seafood", kcal:208, p:20.0, c:0.0,  f:13.0},
  {id:21, name:"Tuna (canned in water)",             cat:"Fish & Seafood", kcal:116, p:26.0, c:0.0,  f:0.8},
  {id:22, name:"Tuna Steak (fresh)",                 cat:"Fish & Seafood", kcal:144, p:23.0, c:0.0,  f:5.0},
  {id:23, name:"Cod",                                cat:"Fish & Seafood", kcal:82,  p:18.0, c:0.0,  f:0.7},
  {id:24, name:"Tilapia",                            cat:"Fish & Seafood", kcal:96,  p:20.0, c:0.0,  f:1.7},
  {id:25, name:"Shrimp / Prawns",                    cat:"Fish & Seafood", kcal:99,  p:24.0, c:0.2,  f:0.3},
  {id:26, name:"Mackerel",                           cat:"Fish & Seafood", kcal:205, p:19.0, c:0.0,  f:14.0},
  {id:27, name:"Sardines (canned in water)",         cat:"Fish & Seafood", kcal:208, p:25.0, c:0.0,  f:11.0},
  {id:28, name:"Sea Bass",                           cat:"Fish & Seafood", kcal:97,  p:18.0, c:0.0,  f:2.0},
  {id:29, name:"Squid / Calamari",                   cat:"Fish & Seafood", kcal:92,  p:16.0, c:3.1,  f:1.4},
  {id:30, name:"Hake Fillet",                        cat:"Fish & Seafood", kcal:82,  p:18.5, c:0.0,  f:0.7},
  {id:31, name:"Smoked Salmon",                      cat:"Fish & Seafood", kcal:117, p:18.3, c:0.0,  f:4.3},
  {id:32, name:"Trout (rainbow)",                    cat:"Fish & Seafood", kcal:141, p:20.0, c:0.0,  f:6.2},
  {id:33, name:"Crab (cooked)",                      cat:"Fish & Seafood", kcal:97,  p:19.4, c:0.0,  f:1.6},
  {id:34, name:"Mussels (cooked)",                   cat:"Fish & Seafood", kcal:86,  p:12.0, c:3.7,  f:2.2},

  // ── DAIRY & EGGS ─────────────────────────────────────────────────────────────
  {id:40, name:"Eggs (whole, large)",                cat:"Dairy & Eggs",   kcal:155, p:13.0, c:1.1,  f:11.0},
  {id:41, name:"Egg Whites",                         cat:"Dairy & Eggs",   kcal:52,  p:11.0, c:0.7,  f:0.2},
  {id:42, name:"Fat-Free Cottage Cheese",            cat:"Dairy & Eggs",   kcal:72,  p:12.4, c:4.3,  f:0.3},
  {id:43, name:"Low-Fat Cottage Cheese (2%)",        cat:"Dairy & Eggs",   kcal:90,  p:12.0, c:4.0,  f:2.5},
  {id:44, name:"Président Light Mozzarella",         cat:"Dairy & Eggs",   kcal:180, p:20.0, c:1.0,  f:11.0},
  {id:45, name:"Mozzarella (full fat)",              cat:"Dairy & Eggs",   kcal:280, p:18.0, c:2.2,  f:22.0},
  {id:46, name:"Parmesan",                           cat:"Dairy & Eggs",   kcal:431, p:38.0, c:3.2,  f:29.0},
  {id:47, name:"Greek Yogurt (0% fat)",              cat:"Dairy & Eggs",   kcal:59,  p:10.0, c:3.6,  f:0.4},
  {id:48, name:"Greek Yogurt (2% fat)",              cat:"Dairy & Eggs",   kcal:73,  p:9.0,  c:3.9,  f:1.9},
  {id:49, name:"Milk (whole, 3.5%)",                 cat:"Dairy & Eggs",   kcal:61,  p:3.2,  c:4.8,  f:3.3},
  {id:50, name:"Milk (skim / 0%)",                   cat:"Dairy & Eggs",   kcal:34,  p:3.4,  c:4.9,  f:0.2},
  {id:51, name:"Cheddar Cheese",                     cat:"Dairy & Eggs",   kcal:403, p:25.0, c:1.3,  f:33.0},
  {id:52, name:"Ricotta (part-skim)",                cat:"Dairy & Eggs",   kcal:138, p:10.0, c:6.0,  f:8.0},
  {id:53, name:"Feta Cheese",                        cat:"Dairy & Eggs",   kcal:264, p:14.0, c:4.1,  f:21.0},
  {id:54, name:"Cream Cheese (light / spreadable)",  cat:"Dairy & Eggs",   kcal:231, p:9.0,  c:5.0,  f:20.0},
  {id:55, name:"Skyr (0% fat)",                      cat:"Dairy & Eggs",   kcal:56,  p:10.5, c:4.0,  f:0.2},
  {id:56, name:"Kefir (low fat)",                    cat:"Dairy & Eggs",   kcal:43,  p:3.8,  c:4.7,  f:0.9},
  {id:57, name:"Sour Cream (light)",                 cat:"Dairy & Eggs",   kcal:100, p:1.5,  c:4.0,  f:8.0},
  {id:58, name:"Almond Milk (unsweetened)",          cat:"Dairy & Eggs",   kcal:15,  p:0.6,  c:1.5,  f:0.7},
  {id:59, name:"Quark (0% fat)",                     cat:"Dairy & Eggs",   kcal:58,  p:10.5, c:3.5,  f:0.2},

  // ── GRAINS & CARBS ───────────────────────────────────────────────────────────
  {id:60, name:"White Rice (dry)",                   cat:"Grains & Carbs", kcal:365, p:7.1,  c:80.0, f:0.7},
  {id:61, name:"White Rice (cooked)",                cat:"Grains & Carbs", kcal:130, p:2.7,  c:28.2, f:0.3},
  {id:62, name:"Brown Rice (dry)",                   cat:"Grains & Carbs", kcal:370, p:8.0,  c:77.0, f:2.9},
  {id:63, name:"Brown Rice (cooked)",                cat:"Grains & Carbs", kcal:123, p:2.7,  c:25.6, f:1.0},
  {id:64, name:"Oats (rolled, dry)",                 cat:"Grains & Carbs", kcal:389, p:17.0, c:66.0, f:7.0},
  {id:65, name:"Pasta (dry, white)",                 cat:"Grains & Carbs", kcal:371, p:13.0, c:74.0, f:1.5},
  {id:66, name:"Pasta (cooked)",                     cat:"Grains & Carbs", kcal:158, p:5.8,  c:31.0, f:0.9},
  {id:67, name:"Pasta (dry, whole wheat)",           cat:"Grains & Carbs", kcal:348, p:14.0, c:68.0, f:2.5},
  {id:68, name:"Sweet Potato",                       cat:"Grains & Carbs", kcal:86,  p:1.6,  c:20.0, f:0.1},
  {id:69, name:"White Potato",                       cat:"Grains & Carbs", kcal:77,  p:2.0,  c:17.0, f:0.1},
  {id:70, name:"Bread (white sliced)",               cat:"Grains & Carbs", kcal:265, p:9.0,  c:49.0, f:3.2},
  {id:71, name:"Bread (whole wheat)",                cat:"Grains & Carbs", kcal:247, p:13.0, c:41.0, f:3.4},
  {id:72, name:"Tortilla (flour, 25cm)",             cat:"Grains & Carbs", kcal:312, p:8.0,  c:52.0, f:7.8},
  {id:73, name:"Tortilla (corn)",                    cat:"Grains & Carbs", kcal:234, p:5.7,  c:47.0, f:3.5},
  {id:74, name:"Quinoa (dry)",                       cat:"Grains & Carbs", kcal:368, p:14.0, c:64.0, f:6.0},
  {id:75, name:"Quinoa (cooked)",                    cat:"Grains & Carbs", kcal:120, p:4.4,  c:22.0, f:1.9},
  {id:76, name:"Couscous (dry)",                     cat:"Grains & Carbs", kcal:376, p:12.8, c:77.0, f:0.6},
  {id:77, name:"Couscous (cooked)",                  cat:"Grains & Carbs", kcal:112, p:3.8,  c:23.2, f:0.2},
  {id:78, name:"Corn / Sweetcorn",                   cat:"Grains & Carbs", kcal:86,  p:3.2,  c:19.0, f:1.2},
  {id:79, name:"Breadcrumbs (panko)",                cat:"Grains & Carbs", kcal:395, p:12.0, c:77.0, f:3.0},
  {id:80, name:"Oat Flour",                          cat:"Grains & Carbs", kcal:404, p:15.0, c:66.0, f:9.0},
  {id:81, name:"Almond Flour",                       cat:"Grains & Carbs", kcal:576, p:21.4, c:19.6, f:52.5},
  {id:82, name:"Coconut Flour",                      cat:"Grains & Carbs", kcal:400, p:20.0, c:60.0, f:15.0},
  {id:83, name:"Tapioca Starch / Flour",             cat:"Grains & Carbs", kcal:358, p:0.2,  c:88.7, f:0.0},
  {id:84, name:"Rice Cakes (plain, lightly salted)", cat:"Grains & Carbs", kcal:385, p:7.0,  c:83.0, f:1.8},
  {id:85, name:"Rice Paper (sheets)",                cat:"Grains & Carbs", kcal:344, p:0.0,  c:84.0, f:0.0},
  {id:86, name:"Orzo Pasta (dry)",                   cat:"Grains & Carbs", kcal:360, p:12.0, c:72.0, f:1.5},
  {id:87, name:"Buckwheat (dry)",                    cat:"Grains & Carbs", kcal:343, p:13.3, c:71.5, f:3.4},
  {id:88, name:"Whole Wheat Wrap (medium)",          cat:"Grains & Carbs", kcal:280, p:9.0,  c:49.0, f:5.0},

  // ── LEGUMES ──────────────────────────────────────────────────────────────────
  {id:90, name:"Chickpeas (cooked)",                 cat:"Legumes",        kcal:164, p:8.9,  c:27.0, f:2.6},
  {id:91, name:"Chickpeas (canned, drained)",        cat:"Legumes",        kcal:140, p:7.5,  c:22.0, f:2.0},
  {id:92, name:"Lentils (red, dry)",                 cat:"Legumes",        kcal:352, p:25.0, c:60.0, f:1.0},
  {id:93, name:"Lentils (cooked)",                   cat:"Legumes",        kcal:116, p:9.0,  c:20.0, f:0.4},
  {id:94, name:"Black Beans (cooked)",               cat:"Legumes",        kcal:132, p:8.9,  c:24.0, f:0.5},
  {id:95, name:"Kidney Beans (cooked)",              cat:"Legumes",        kcal:127, p:8.7,  c:22.8, f:0.5},
  {id:96, name:"Edamame (shelled)",                  cat:"Legumes",        kcal:121, p:11.0, c:8.9,  f:5.2},
  {id:97, name:"Tofu (firm)",                        cat:"Legumes",        kcal:76,  p:8.1,  c:1.9,  f:4.8},
  {id:98, name:"Tofu (silken)",                      cat:"Legumes",        kcal:55,  p:4.8,  c:3.1,  f:2.7},
  {id:99, name:"Butter Beans (cooked)",              cat:"Legumes",        kcal:115, p:7.7,  c:21.0, f:0.4},

  // ── VEGETABLES ───────────────────────────────────────────────────────────────
  {id:100, name:"Broccoli",                          cat:"Vegetables",     kcal:34,  p:2.8,  c:6.6,  f:0.4},
  {id:101, name:"Spinach (fresh)",                   cat:"Vegetables",     kcal:23,  p:2.9,  c:3.6,  f:0.4},
  {id:102, name:"Kale",                              cat:"Vegetables",     kcal:49,  p:4.3,  c:8.8,  f:0.9},
  {id:103, name:"Zucchini / Courgette",              cat:"Vegetables",     kcal:17,  p:1.2,  c:3.1,  f:0.3},
  {id:104, name:"Bell Pepper (red)",                 cat:"Vegetables",     kcal:31,  p:1.0,  c:6.0,  f:0.3},
  {id:105, name:"Bell Pepper (green)",               cat:"Vegetables",     kcal:20,  p:0.9,  c:4.6,  f:0.2},
  {id:106, name:"Onion",                             cat:"Vegetables",     kcal:40,  p:1.1,  c:9.3,  f:0.1},
  {id:107, name:"Red Onion",                         cat:"Vegetables",     kcal:40,  p:1.1,  c:9.3,  f:0.1},
  {id:108, name:"Garlic",                            cat:"Vegetables",     kcal:149, p:6.4,  c:33.0, f:0.5},
  {id:109, name:"Tomato",                            cat:"Vegetables",     kcal:18,  p:0.9,  c:3.9,  f:0.2},
  {id:110, name:"Cherry Tomatoes",                   cat:"Vegetables",     kcal:18,  p:0.9,  c:3.9,  f:0.2},
  {id:111, name:"Cucumber",                          cat:"Vegetables",     kcal:15,  p:0.7,  c:3.6,  f:0.1},
  {id:112, name:"Lettuce (romaine)",                 cat:"Vegetables",     kcal:17,  p:1.2,  c:3.3,  f:0.3},
  {id:113, name:"Mushrooms (white button)",          cat:"Vegetables",     kcal:22,  p:3.1,  c:3.3,  f:0.3},
  {id:114, name:"Asparagus",                         cat:"Vegetables",     kcal:20,  p:2.2,  c:3.9,  f:0.1},
  {id:115, name:"Green Beans",                       cat:"Vegetables",     kcal:31,  p:1.8,  c:7.0,  f:0.1},
  {id:116, name:"Cauliflower",                       cat:"Vegetables",     kcal:25,  p:1.9,  c:5.0,  f:0.3},
  {id:117, name:"Carrot",                            cat:"Vegetables",     kcal:41,  p:0.9,  c:9.6,  f:0.2},
  {id:118, name:"Celery",                            cat:"Vegetables",     kcal:16,  p:0.7,  c:3.0,  f:0.2},
  {id:119, name:"Eggplant / Aubergine",              cat:"Vegetables",     kcal:25,  p:1.0,  c:5.9,  f:0.2},
  {id:120, name:"Peas (frozen)",                     cat:"Vegetables",     kcal:81,  p:5.4,  c:14.0, f:0.4},
  {id:121, name:"Baby Spinach",                      cat:"Vegetables",     kcal:23,  p:2.9,  c:3.6,  f:0.4},
  {id:122, name:"Arugula / Rocket",                  cat:"Vegetables",     kcal:25,  p:2.6,  c:3.7,  f:0.7},
  {id:123, name:"Leek",                              cat:"Vegetables",     kcal:61,  p:1.5,  c:14.0, f:0.3},
  {id:124, name:"Beetroot",                          cat:"Vegetables",     kcal:43,  p:1.6,  c:9.6,  f:0.2},
  {id:125, name:"Cabbage (white)",                   cat:"Vegetables",     kcal:25,  p:1.3,  c:5.8,  f:0.1},
  {id:126, name:"Corn on the Cob",                   cat:"Vegetables",     kcal:86,  p:3.2,  c:19.0, f:1.2},
  {id:127, name:"Jalapeño",                          cat:"Vegetables",     kcal:29,  p:0.9,  c:6.5,  f:0.4},
  {id:128, name:"Butternut Squash",                  cat:"Vegetables",     kcal:45,  p:1.0,  c:11.7, f:0.1},
  {id:129, name:"Pumpkin",                           cat:"Vegetables",     kcal:26,  p:1.0,  c:6.5,  f:0.1},
  {id:130, name:"Olives (green/black)",              cat:"Vegetables",     kcal:145, p:1.0,  c:3.8,  f:15.0},
  {id:131, name:"Watercress",                        cat:"Vegetables",     kcal:11,  p:2.3,  c:1.3,  f:0.1},
  {id:132, name:"Spring Onion / Scallion",           cat:"Vegetables",     kcal:32,  p:1.8,  c:7.3,  f:0.2},
  {id:133, name:"Sun-Dried Tomatoes",                cat:"Vegetables",     kcal:258, p:14.0, c:55.0, f:3.0},
  {id:134, name:"Bell Pepper (yellow)",              cat:"Vegetables",     kcal:27,  p:1.0,  c:6.3,  f:0.2},
  {id:135, name:"Snap Peas",                         cat:"Vegetables",     kcal:34,  p:2.8,  c:7.0,  f:0.4},
  {id:136, name:"Brussels Sprouts",                  cat:"Vegetables",     kcal:43,  p:3.4,  c:9.0,  f:0.3},
  {id:137, name:"Pumpkin Purée (canned)",            cat:"Vegetables",     kcal:34,  p:1.2,  c:8.1,  f:0.1},

  // ── FRUITS ───────────────────────────────────────────────────────────────────
  {id:140, name:"Banana",                            cat:"Fruits",         kcal:89,  p:1.1,  c:23.0, f:0.3},
  {id:141, name:"Apple",                             cat:"Fruits",         kcal:52,  p:0.3,  c:14.0, f:0.2},
  {id:142, name:"Strawberries",                      cat:"Fruits",         kcal:32,  p:0.7,  c:7.7,  f:0.3},
  {id:143, name:"Blueberries",                       cat:"Fruits",         kcal:57,  p:0.7,  c:14.0, f:0.3},
  {id:144, name:"Raspberries",                       cat:"Fruits",         kcal:52,  p:1.2,  c:12.0, f:0.7},
  {id:145, name:"Orange",                            cat:"Fruits",         kcal:47,  p:0.9,  c:12.0, f:0.1},
  {id:146, name:"Mango",                             cat:"Fruits",         kcal:60,  p:0.8,  c:15.0, f:0.4},
  {id:147, name:"Pineapple",                         cat:"Fruits",         kcal:50,  p:0.5,  c:13.0, f:0.1},
  {id:148, name:"Watermelon",                        cat:"Fruits",         kcal:30,  p:0.6,  c:7.6,  f:0.2},
  {id:149, name:"Avocado",                           cat:"Fruits",         kcal:160, p:2.0,  c:9.0,  f:15.0},
  {id:150, name:"Lemon (juice)",                     cat:"Fruits",         kcal:22,  p:0.4,  c:6.9,  f:0.2},
  {id:151, name:"Lime (juice)",                      cat:"Fruits",         kcal:25,  p:0.4,  c:8.4,  f:0.1},
  {id:152, name:"Pear",                              cat:"Fruits",         kcal:57,  p:0.4,  c:15.2, f:0.1},
  {id:153, name:"Mixed Berries (frozen)",            cat:"Fruits",         kcal:49,  p:0.7,  c:12.0, f:0.4},
  {id:154, name:"Dates (medjool)",                   cat:"Fruits",         kcal:277, p:1.8,  c:75.0, f:0.2},
  {id:155, name:"Kiwi",                              cat:"Fruits",         kcal:61,  p:1.1,  c:15.0, f:0.5},
  {id:156, name:"Cherry",                            cat:"Fruits",         kcal:63,  p:1.1,  c:16.0, f:0.2},
  {id:157, name:"Pomegranate Seeds",                 cat:"Fruits",         kcal:83,  p:1.7,  c:18.7, f:1.2},
  {id:158, name:"Cranberries (fresh)",               cat:"Fruits",         kcal:46,  p:0.4,  c:12.2, f:0.1},
  {id:159, name:"Peach",                             cat:"Fruits",         kcal:39,  p:0.9,  c:10.0, f:0.3},

  // ── FATS & NUTS ──────────────────────────────────────────────────────────────
  {id:160, name:"Olive Oil (extra virgin)",          cat:"Fats & Nuts",    kcal:884, p:0.0,  c:0.0,  f:100.0},
  {id:161, name:"Coconut Oil",                       cat:"Fats & Nuts",    kcal:892, p:0.0,  c:0.0,  f:100.0},
  {id:162, name:"Butter (unsalted)",                 cat:"Fats & Nuts",    kcal:717, p:0.9,  c:0.1,  f:81.0},
  {id:163, name:"Almonds",                           cat:"Fats & Nuts",    kcal:579, p:21.0, c:22.0, f:50.0},
  {id:164, name:"Walnuts",                           cat:"Fats & Nuts",    kcal:654, p:15.0, c:14.0, f:65.0},
  {id:165, name:"Cashews",                           cat:"Fats & Nuts",    kcal:553, p:18.0, c:30.0, f:44.0},
  {id:166, name:"Peanut Butter (natural)",           cat:"Fats & Nuts",    kcal:588, p:25.0, c:20.0, f:50.0},
  {id:167, name:"Almond Butter",                     cat:"Fats & Nuts",    kcal:614, p:21.0, c:19.0, f:56.0},
  {id:168, name:"Flaxseeds / Linseeds",              cat:"Fats & Nuts",    kcal:534, p:18.0, c:29.0, f:42.0},
  {id:169, name:"Chia Seeds",                        cat:"Fats & Nuts",    kcal:486, p:17.0, c:42.0, f:31.0},
  {id:170, name:"Sunflower Seeds",                   cat:"Fats & Nuts",    kcal:584, p:21.0, c:20.0, f:51.0},
  {id:171, name:"Sesame Oil",                        cat:"Fats & Nuts",    kcal:884, p:0.0,  c:0.0,  f:100.0},
  {id:172, name:"Cooking Spray (light)",             cat:"Fats & Nuts",    kcal:47,  p:0.0,  c:0.0,  f:4.7},
  {id:173, name:"Peanuts",                           cat:"Fats & Nuts",    kcal:567, p:25.8, c:16.1, f:49.2},
  {id:174, name:"Hazelnuts",                         cat:"Fats & Nuts",    kcal:628, p:14.9, c:17.0, f:60.7},
  {id:175, name:"Pistachios",                        cat:"Fats & Nuts",    kcal:562, p:20.2, c:27.0, f:45.3},
  {id:176, name:"Sesame Seeds",                      cat:"Fats & Nuts",    kcal:573, p:17.7, c:23.5, f:49.7},
  {id:177, name:"Pumpkin Seeds",                     cat:"Fats & Nuts",    kcal:559, p:30.2, c:10.7, f:49.1},
  {id:178, name:"Coconut Flakes (unsweetened)",      cat:"Fats & Nuts",    kcal:604, p:5.6,  c:26.0, f:55.0},
  {id:179, name:"Peanut Butter Powder (PBfit)",      cat:"Fats & Nuts",    kcal:375, p:35.0, c:30.0, f:13.0},

  // ── CONDIMENTS & SAUCES ──────────────────────────────────────────────────────
  {id:180, name:"Soy Sauce (low sodium)",            cat:"Condiments & Sauces", kcal:53,  p:8.1,  c:4.9,  f:0.1},
  {id:181, name:"Hot Sauce (Tabasco style)",         cat:"Condiments & Sauces", kcal:12,  p:0.4,  c:1.6,  f:0.4},
  {id:182, name:"Ketchup",                           cat:"Condiments & Sauces", kcal:101, p:1.4,  c:26.0, f:0.1},
  {id:183, name:"Yellow Mustard",                    cat:"Condiments & Sauces", kcal:60,  p:4.0,  c:5.8,  f:3.6},
  {id:184, name:"Dijon Mustard",                     cat:"Condiments & Sauces", kcal:66,  p:3.8,  c:5.1,  f:4.0},
  {id:185, name:"Worcestershire Sauce",              cat:"Condiments & Sauces", kcal:78,  p:0.0,  c:19.0, f:0.0},
  {id:186, name:"Tomato Paste",                      cat:"Condiments & Sauces", kcal:82,  p:4.3,  c:18.9, f:0.5},
  {id:187, name:"Passata (tomato sauce)",            cat:"Condiments & Sauces", kcal:27,  p:1.3,  c:6.3,  f:0.2},
  {id:188, name:"Sriracha",                          cat:"Condiments & Sauces", kcal:93,  p:1.5,  c:19.0, f:1.1},
  {id:189, name:"Coconut Aminos",                    cat:"Condiments & Sauces", kcal:33,  p:0.0,  c:8.5,  f:0.0},
  {id:190, name:"Apple Cider Vinegar",               cat:"Condiments & Sauces", kcal:22,  p:0.0,  c:0.9,  f:0.0},
  {id:191, name:"Balsamic Vinegar",                  cat:"Condiments & Sauces", kcal:88,  p:0.5,  c:17.0, f:0.0},
  {id:192, name:"Oyster Sauce",                      cat:"Condiments & Sauces", kcal:91,  p:3.5,  c:18.0, f:0.3},
  {id:193, name:"Fish Sauce",                        cat:"Condiments & Sauces", kcal:35,  p:5.0,  c:3.6,  f:0.0},
  {id:194, name:"Hoisin Sauce",                      cat:"Condiments & Sauces", kcal:220, p:4.0,  c:42.0, f:4.5},
  {id:195, name:"Honey",                             cat:"Condiments & Sauces", kcal:304, p:0.3,  c:82.0, f:0.0},
  {id:196, name:"Maple Syrup",                       cat:"Condiments & Sauces", kcal:260, p:0.0,  c:67.0, f:0.1},
  {id:197, name:"BBQ Sauce",                         cat:"Condiments & Sauces", kcal:172, p:1.2,  c:38.0, f:0.6},
  {id:198, name:"Teriyaki Sauce",                    cat:"Condiments & Sauces", kcal:89,  p:2.5,  c:19.0, f:0.1},
  {id:199, name:"Buffalo Sauce",                     cat:"Condiments & Sauces", kcal:24,  p:1.7,  c:2.6,  f:0.9},
  {id:200, name:"Chipotle Peppers in Adobo",         cat:"Condiments & Sauces", kcal:120, p:3.0,  c:20.0, f:3.0},
  {id:201, name:"Rice Vinegar",                      cat:"Condiments & Sauces", kcal:18,  p:0.0,  c:0.7,  f:0.0},
  {id:202, name:"White Vinegar",                     cat:"Condiments & Sauces", kcal:18,  p:0.0,  c:0.7,  f:0.0},
  {id:203, name:"Pickles / Gherkins",                cat:"Condiments & Sauces", kcal:11,  p:0.3,  c:2.3,  f:0.2},
  {id:204, name:"Ranch Dressing (fat-free)",         cat:"Condiments & Sauces", kcal:88,  p:1.5,  c:18.0, f:0.9},
  {id:205, name:"Pico de Gallo",                     cat:"Condiments & Sauces", kcal:36,  p:1.5,  c:7.0,  f:0.5},
  {id:206, name:"Enchilada Sauce (mild)",            cat:"Condiments & Sauces", kcal:33,  p:1.5,  c:6.5,  f:0.4},
  {id:207, name:"Chicken Bone Broth",                cat:"Condiments & Sauces", kcal:10,  p:2.3,  c:0.0,  f:0.0},
  {id:208, name:"Beef Bone Broth",                   cat:"Condiments & Sauces", kcal:14,  p:3.2,  c:0.0,  f:0.0},
  {id:209, name:"Sugar-Free Ketchup",                cat:"Condiments & Sauces", kcal:25,  p:0.5,  c:5.0,  f:0.0},

  // ── HERBS & SPICES ───────────────────────────────────────────────────────────
  {id:220, name:"Cinnamon (ground)",                 cat:"Herbs & Spices", kcal:247, p:4.0,  c:81.0, f:1.2},
  {id:221, name:"Paprika (ground)",                  cat:"Herbs & Spices", kcal:282, p:14.1, c:54.0, f:13.0},
  {id:222, name:"Cumin (ground)",                    cat:"Herbs & Spices", kcal:375, p:17.8, c:44.0, f:22.0},
  {id:223, name:"Oregano (dried)",                   cat:"Herbs & Spices", kcal:265, p:9.0,  c:69.0, f:4.3},
  {id:224, name:"Garlic Powder",                     cat:"Herbs & Spices", kcal:331, p:16.6, c:73.0, f:0.7},
  {id:225, name:"Onion Powder",                      cat:"Herbs & Spices", kcal:341, p:10.4, c:79.1, f:1.0},
  {id:226, name:"Black Pepper (ground)",             cat:"Herbs & Spices", kcal:251, p:10.4, c:64.0, f:3.3},
  {id:227, name:"Chili Flakes / Red Pepper Flakes",  cat:"Herbs & Spices", kcal:282, p:12.3, c:50.0, f:14.3},
  {id:228, name:"Ginger (fresh root)",               cat:"Herbs & Spices", kcal:80,  p:1.8,  c:18.0, f:0.8},
  {id:229, name:"Parsley (fresh)",                   cat:"Herbs & Spices", kcal:36,  p:3.0,  c:6.3,  f:0.8},
  {id:230, name:"Coriander / Cilantro (fresh)",      cat:"Herbs & Spices", kcal:23,  p:2.1,  c:3.7,  f:0.5},
  {id:231, name:"Basil (fresh)",                     cat:"Herbs & Spices", kcal:23,  p:3.2,  c:2.7,  f:0.6},
  {id:232, name:"Mint (fresh)",                      cat:"Herbs & Spices", kcal:70,  p:3.8,  c:14.9, f:0.9},
  {id:233, name:"Dill (fresh)",                      cat:"Herbs & Spices", kcal:43,  p:3.5,  c:7.0,  f:1.1},
  {id:234, name:"Rosemary (fresh/dried)",            cat:"Herbs & Spices", kcal:131, p:3.3,  c:20.7, f:5.9},
  {id:235, name:"Thyme (fresh/dried)",               cat:"Herbs & Spices", kcal:101, p:5.6,  c:24.4, f:1.7},
  {id:236, name:"Chives (fresh)",                    cat:"Herbs & Spices", kcal:30,  p:3.3,  c:4.4,  f:0.7},
  {id:237, name:"Curry Powder",                      cat:"Herbs & Spices", kcal:325, p:12.7, c:58.0, f:14.0},
  {id:238, name:"Smoked Paprika",                    cat:"Herbs & Spices", kcal:282, p:14.1, c:54.0, f:13.0},
  {id:239, name:"Turmeric (ground)",                 cat:"Herbs & Spices", kcal:354, p:7.8,  c:65.0, f:9.9},
  {id:240, name:"Matcha Powder",                     cat:"Herbs & Spices", kcal:324, p:30.0, c:38.0, f:5.0},
  {id:241, name:"Ginger (ground)",                   cat:"Herbs & Spices", kcal:335, p:8.9,  c:72.0, f:4.2},

  // ── BAKING & SWEETENERS ──────────────────────────────────────────────────────
  {id:250, name:"Baking Powder",                     cat:"Baking & Sweeteners", kcal:53,  p:0.0,  c:27.7, f:0.0},
  {id:251, name:"Baking Soda",                       cat:"Baking & Sweeteners", kcal:0,   p:0.0,  c:0.0,  f:0.0},
  {id:252, name:"Vanilla Extract",                   cat:"Baking & Sweeteners", kcal:288, p:0.1,  c:12.5, f:0.1},
  {id:253, name:"Stevia (powder)",                   cat:"Baking & Sweeteners", kcal:0,   p:0.0,  c:0.0,  f:0.0},
  {id:254, name:"Cocoa Powder (unsweetened, low-fat)",cat:"Baking & Sweeteners",kcal:228, p:20.0, c:54.0, f:14.0},
  {id:255, name:"Dark Chocolate (85%, sugar-free)",  cat:"Baking & Sweeteners", kcal:598, p:7.8,  c:46.0, f:43.0},
  {id:256, name:"Dark Chocolate Chips (sugar-free)", cat:"Baking & Sweeteners", kcal:547, p:5.0,  c:60.0, f:33.0},
  {id:257, name:"Protein Pancake Mix",               cat:"Baking & Sweeteners", kcal:370, p:30.0, c:43.0, f:8.0},
  {id:258, name:"Xylitol",                           cat:"Baking & Sweeteners", kcal:240, p:0.0,  c:100.0,f:0.0},
  {id:259, name:"Coconut Sugar",                     cat:"Baking & Sweeteners", kcal:375, p:0.0,  c:100.0,f:0.0},
  {id:260, name:"Brown Sugar Substitute (zero-cal)", cat:"Baking & Sweeteners", kcal:0,   p:0.0,  c:0.0,  f:0.0},

  // ── SUPPLEMENTS ──────────────────────────────────────────────────────────────
  {id:210, name:"Whey Protein Powder",               cat:"Supplements",    kcal:400, p:80.0, c:8.0,  f:4.0},
  {id:211, name:"Casein Protein Powder",             cat:"Supplements",    kcal:380, p:78.0, c:5.0,  f:4.5},
  {id:212, name:"Plant Protein Powder",              cat:"Supplements",    kcal:370, p:70.0, c:12.0, f:5.0},
  {id:213, name:"Collagen Powder",                   cat:"Supplements",    kcal:360, p:90.0, c:0.0,  f:0.0},
  {id:214, name:"Creatine Monohydrate",              cat:"Supplements",    kcal:0,   p:0.0,  c:0.0,  f:0.0},
  {id:215, name:"BCAA Powder (unflavored)",          cat:"Supplements",    kcal:46,  p:10.0, c:0.5,  f:0.7},
];

const EMPTY_T = { kcal:"", p:"", c:"", f:"" };
const IS = { background:"#0d0d0d", border:"1px solid #252525", color:"#e5e5e5", padding:"9px 12px", borderRadius:6, fontSize:13, fontFamily:"inherit", outline:"none" };
const MF = [
  { k:"kcal", label:"Calories", unit:"kcal", ph:"e.g. 2200", color:"#f59e0b" },
  { k:"p",    label:"Protein",  unit:"g",    ph:"e.g. 180",  color:"#22c55e" },
  { k:"c",    label:"Carbs",    unit:"g",    ph:"e.g. 250",  color:"#3b82f6" },
  { k:"f",    label:"Fat",      unit:"g",    ph:"e.g. 60",   color:"#ef4444" },
];

function Bar({ value, target, color }) {
  if (!target || target <= 0) return null;
  const pct = Math.min((value / target) * 100, 100);
  const over = value > target;
  return (
    <div style={{ marginTop:5 }}>
      <div style={{ background:"#1e1e1e", borderRadius:3, height:4, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background: over ? "#ef4444" : color, borderRadius:3, transition:"width 0.3s" }}/>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
        <span style={{ fontSize:10, color: over ? "#ef4444" : "#3a3a3a" }}>
          {over ? `▲ ${((value/target-1)*100).toFixed(0)}% over` : `${pct.toFixed(0)}% of daily`}
        </span>
        <span style={{ fontSize:10, color:"#2a2a2a" }}>/ {Number(target).toLocaleString()}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [ings, setIngs] = useState(BASE);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState({ key:"name", dir:1 });
  const [sel, setSel] = useState(null);
  const [grams, setGrams] = useState(100);
  const [showAdd, setShowAdd] = useState(false);
  const [showT, setShowT] = useState(false);
  const [targets, setTargets] = useState(EMPTY_T);
  const [form, setForm] = useState({ name:"", cat:"Protein & Meat", kcal:"", p:"", c:"", f:"" });
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const list = useMemo(() => {
    let r = ings.filter(i => (cat==="All"||i.cat===cat) && i.name.toLowerCase().includes(search.toLowerCase()));
    return r.sort((a,b) => {
      const av = typeof a[sort.key]==="string"?a[sort.key].toLowerCase():a[sort.key];
      const bv = typeof b[sort.key]==="string"?b[sort.key].toLowerCase():b[sort.key];
      return av<bv?-sort.dir:av>bv?sort.dir:0;
    });
  }, [ings, search, cat, sort]);

  const selIng = ings.find(i=>i.id===sel);
  const ratio = grams/100;
  const hasT = MF.some(m => targets[m.k] !== "" && Number(targets[m.k]) > 0);

  function toggleSort(k) { setSort(s=>s.key===k?{key:k,dir:-s.dir}:{key:k,dir:1}); }
  function addIng() {
    if (!form.name.trim()) { setErr("Name required."); return; }
    if (MF.some(m=>form[m.k]===""||isNaN(Number(form[m.k])))) { setErr("All macro fields must be numbers."); return; }
    setIngs(p=>[...p,{id:Date.now(),name:form.name.trim(),cat:form.cat,kcal:+form.kcal,p:+form.p,c:+form.c,f:+form.f,custom:true}]);
    setForm({name:"",cat:"Protein & Meat",kcal:"",p:"",c:"",f:""}); setErr(""); setShowAdd(false); flash("Added ✓");
  }
  function delIng(id) { setIngs(p=>p.filter(i=>i.id!==id)); if(sel===id)setSel(null); flash("Removed"); }
  function exportCSV() {
    const rows=["Name,Category,Calories,Protein(g),Carbs(g),Fat(g)",...ings.map(i=>`"${i.name}","${i.cat}",${i.kcal},${i.p},${i.c},${i.f}`)];
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"}));
    a.download="soulgainz_ingredients.csv"; a.click(); flash("CSV exported ✓");
  }
  function flash(msg) { setToast(msg); setTimeout(()=>setToast(""),2500); }
  const Arr = ({k}) => sort.key!==k?<span style={{opacity:.2,marginLeft:3}}>↕</span>:<span style={{color:"#f59e0b",marginLeft:3}}>{sort.dir===1?"↑":"↓"}</span>;

  return (
    <div style={{fontFamily:"'DM Mono',monospace",background:"#0a0a0a",minHeight:"100vh",color:"#e5e5e5",padding:"22px 18px"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap" rel="stylesheet"/>
      {toast&&<div style={{position:"fixed",top:18,right:18,background:"#f59e0b",color:"#000",padding:"10px 18px",borderRadius:6,fontWeight:600,zIndex:999,fontSize:13}}>{toast}</div>}

      {/* HEADER */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:4,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:38,letterSpacing:2,color:"#f59e0b",lineHeight:1}}>SOULGAINZ</span>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:1,color:"#444",lineHeight:1}}>INGREDIENT DATABASE</span>
        </div>
        <p style={{color:"#3a3a3a",fontSize:12,margin:0}}>{ings.length} ingredients · macros per 100g · tap any row to calculate</p>
      </div>

      {/* MY DAILY TARGETS */}
      <div style={{background:"#0e0e0e",border:`1px solid ${showT?"#f59e0b33":"#1a1a1a"}`,borderRadius:8,marginBottom:12,overflow:"hidden"}}>
        <button onClick={()=>setShowT(v=>!v)}
          style={{width:"100%",background:"none",border:"none",padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"#f59e0b",letterSpacing:2}}>MY DAILY TARGETS</span>
            {hasT ? (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {MF.map(m=>targets[m.k]?(
                  <span key={m.k} style={{fontSize:11,color:m.color,background:m.color+"18",padding:"2px 7px",borderRadius:3}}>
                    {Number(targets[m.k]).toLocaleString()}{m.unit==="kcal"?" kcal":`g ${m.label.toLowerCase()}`}
                  </span>
                ):null)}
              </div>
            ) : (
              <span style={{fontSize:11,color:"#2a2a2a"}}>not set · set once, used in the calculator below</span>
            )}
          </div>
          <span style={{color:"#444",fontSize:14,fontFamily:"inherit"}}>{showT?"▲":"▼"}</span>
        </button>
        {showT&&(
          <div style={{padding:"0 16px 16px"}}>
            <p style={{color:"#444",fontSize:12,marginTop:0,marginBottom:14}}>
              Enter your personal daily targets from your macro calculator. The ingredient calculator will then show each serving as a % of your day.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
              {MF.map(m=>(
                <div key={m.k} style={{flex:"1 1 90px"}}>
                  <div style={{fontSize:10,color:m.color,letterSpacing:1.5,marginBottom:5}}>{m.label.toUpperCase()} ({m.unit})</div>
                  <input type="number" placeholder={m.ph} value={targets[m.k]}
                    onChange={e=>setTargets(t=>({...t,[m.k]:e.target.value}))}
                    style={{...IS,width:"100%",boxSizing:"border-box",borderColor:targets[m.k]?m.color+"55":"#252525"}}/>
                </div>
              ))}
              <button onClick={()=>{setTargets(EMPTY_T);flash("Targets cleared");}}
                style={{...IS,cursor:"pointer",color:"#555",padding:"9px 14px"}}>Clear</button>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="🔍  search…" value={search} onChange={e=>setSearch(e.target.value)} style={{...IS,flex:"1 1 200px"}}/>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{...IS,cursor:"pointer"}}>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={()=>setShowAdd(v=>!v)}
          style={{...IS,border:"1px solid #f59e0b",background:showAdd?"#f59e0b":"transparent",color:showAdd?"#000":"#f59e0b",cursor:"pointer",padding:"9px 16px",fontWeight:500}}>
          {showAdd?"✕ Cancel":"+ Add Custom"}
        </button>
        <button onClick={exportCSV} style={{...IS,color:"#555",cursor:"pointer",padding:"9px 14px"}}>↓ CSV</button>
      </div>

      {/* ADD FORM */}
      {showAdd&&(
        <div style={{background:"#111",border:"1px solid #f59e0b22",borderRadius:8,padding:16,marginBottom:12}}>
          <div style={{fontSize:11,color:"#f59e0b",letterSpacing:2,marginBottom:10}}>NEW INGREDIENT — values per 100g</div>
          {err&&<div style={{color:"#ef4444",fontSize:12,marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <input placeholder="Name *" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{...IS,flex:"2 1 160px"}}/>
            <select value={form.cat} onChange={e=>setForm(p=>({...p,cat:e.target.value}))} style={{...IS,cursor:"pointer",flex:"1 1 140px"}}>
              {CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
            </select>
            {MF.map(m=>(
              <input key={m.k} placeholder={m.label} type="number" value={form[m.k]}
                onChange={e=>setForm(p=>({...p,[m.k]:e.target.value}))} style={{...IS,flex:"1 1 70px"}}/>
            ))}
            <button onClick={addIng} style={{background:"#f59e0b",border:"none",color:"#000",padding:"9px 18px",borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Save</button>
          </div>
        </div>
      )}

      {/* CALCULATOR */}
      {selIng&&(
        <div style={{background:"#0e0e0e",border:"1px solid #1e1e1e",borderRadius:8,padding:16,marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:14}}>
            <span style={{fontSize:11,color:"#f59e0b",letterSpacing:2}}>CALCULATOR</span>
            <span style={{color:"#e5e5e5",fontSize:14,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selIng.name}</span>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input type="number" value={grams} min={1} onChange={e=>setGrams(+e.target.value)}
                style={{...IS,width:72,textAlign:"center"}}/>
              <span style={{color:"#555",fontSize:13}}>g</span>
            </div>
            <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:20,lineHeight:1,padding:0}}>×</button>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {MF.map(m=>{
              const val = selIng[m.k]*ratio;
              const tgt = Number(targets[m.k]);
              return (
                <div key={m.k} style={{background:"#141414",borderRadius:8,padding:"12px 16px",flex:"1 1 90px",border:`1px solid ${m.color}1a`}}>
                  <div style={{color:m.color,fontSize:22,fontWeight:500,fontVariantNumeric:"tabular-nums"}}>{val.toFixed(1)}</div>
                  <div style={{color:"#444",fontSize:11,marginTop:2}}>{m.label}{m.unit!=="kcal"?" (g)":""}</div>
                  {hasT&&tgt>0&&<Bar value={val} target={tgt} color={m.color}/>}
                </div>
              );
            })}
          </div>
          {!hasT&&(
            <p style={{color:"#2a2a2a",fontSize:11,margin:"12px 0 0",textAlign:"center"}}>
              set your daily targets above to see each serving as a % of your day
            </p>
          )}
        </div>
      )}

      {/* COUNT */}
      <div style={{fontSize:11,color:"#252525",marginBottom:8,letterSpacing:1}}>SHOWING {list.length} / {ings.length}</div>

      {/* TABLE */}
      <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #161616"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{background:"#0d0d0d",borderBottom:"1px solid #1a1a1a"}}>
              {[{k:"name",l:"INGREDIENT",a:"left"},{k:"cat",l:"CATEGORY",a:"left"},{k:"kcal",l:"KCAL",a:"right"},{k:"p",l:"P",a:"right"},{k:"c",l:"C",a:"right"},{k:"f",l:"F",a:"right"}].map(col=>(
                <th key={col.k} onClick={()=>toggleSort(col.k)}
                  style={{padding:"11px 14px",textAlign:col.a,color:sort.key===col.k?"#f59e0b":"#333",fontSize:11,letterSpacing:1.5,cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",fontWeight:500}}>
                  {col.l}<Arr k={col.k}/>
                </th>
              ))}
              <th style={{padding:"11px 14px",width:30}}></th>
            </tr>
          </thead>
          <tbody>
            {list.map((ing,idx)=>{
              const active=sel===ing.id;
              return (
                <tr key={ing.id} onClick={()=>setSel(p=>p===ing.id?null:ing.id)}
                  style={{background:active?"#140d00":idx%2===0?"#0d0d0d":"#0a0a0a",borderBottom:"1px solid #111",cursor:"pointer",borderLeft:active?"3px solid #f59e0b":"3px solid transparent"}}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background="#111"}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background=idx%2===0?"#0d0d0d":"#0a0a0a"}}>
                  <td style={{padding:"10px 14px",color:active?"#f59e0b":"#ddd",whiteSpace:"nowrap"}}>
                    {ing.name}
                    {ing.custom&&<span style={{marginLeft:7,fontSize:10,color:"#f59e0b",background:"#f59e0b18",padding:"1px 5px",borderRadius:3}}>custom</span>}
                  </td>
                  <td style={{padding:"10px 14px",color:"#333",whiteSpace:"nowrap",fontSize:12}}>{ing.cat}</td>
                  {[{k:"kcal",c:"#f59e0b"},{k:"p",c:"#22c55e"},{k:"c",c:"#3b82f6"},{k:"f",c:"#ef4444"}].map(m=>(
                    <td key={m.k} style={{padding:"10px 14px",textAlign:"right",color:active?m.c:"#555",fontVariantNumeric:"tabular-nums"}}>
                      {ing[m.k].toFixed(1)}
                    </td>
                  ))}
                  <td style={{padding:"10px 14px",textAlign:"center"}}>
                    {ing.custom&&<button onClick={e=>{e.stopPropagation();delIng(ing.id)}}
                      style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:18,lineHeight:1,padding:0}}>×</button>}
                  </td>
                </tr>
              );
            })}
            {list.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"#252525"}}>No results</td></tr>}
          </tbody>
        </table>
      </div>

      {/* LEGEND */}
      <div style={{display:"flex",gap:16,marginTop:14,flexWrap:"wrap",alignItems:"center"}}>
        {MF.map(m=>(
          <span key={m.k} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#2a2a2a"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:m.color,display:"inline-block"}}></span>
            {m.label} ({m.unit}/100g)
          </span>
        ))}
        <span style={{fontSize:11,color:"#1e1e1e",marginLeft:"auto"}}>tap row → calculator</span>
      </div>
    </div>
  );
}
