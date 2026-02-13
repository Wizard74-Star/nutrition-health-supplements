export interface FoodItem {
  id: string;
  name: string;
  category: string;
  servingSize: string;
  calories: number;
  /** Maps nutrient IDs (e.g. 'vit-a', 'min-iron') to amount in the nutrient's unit */
  nutrients: Record<string, number>;
}

export const foodCategories = [
  'Fruits',
  'Vegetables',
  'Proteins',
  'Grains',
  'Dairy',
  'Nuts & Seeds',
  'Fish & Seafood',
  'Beverages',
  'Snacks',
  'Legumes',
];

export const foodDatabase: FoodItem[] = [
  // ─── Fruits ──────────────────────────────────────────────────
  {
    id: 'food-banana',
    name: 'Banana',
    category: 'Fruits',
    servingSize: '1 medium (118g)',
    calories: 105,
    nutrients: {
      'vit-b6': 0.43, 'vit-c': 10.3, 'min-potassium': 422, 'min-magnesium': 32,
      'min-manganese': 0.32, 'vit-b7': 3.1, 'min-copper': 92,
    },
  },
  {
    id: 'food-orange',
    name: 'Orange',
    category: 'Fruits',
    servingSize: '1 medium (131g)',
    calories: 62,
    nutrients: {
      'vit-c': 70, 'vit-b9': 39, 'vit-b1': 0.11, 'min-potassium': 237,
      'min-calcium': 52, 'vit-a': 14,
    },
  },
  {
    id: 'food-apple',
    name: 'Apple',
    category: 'Fruits',
    servingSize: '1 medium (182g)',
    calories: 95,
    nutrients: {
      'vit-c': 8.4, 'min-potassium': 195, 'vit-k': 4, 'min-boron': 0.56,
    },
  },
  {
    id: 'food-strawberries',
    name: 'Strawberries',
    category: 'Fruits',
    servingSize: '1 cup (152g)',
    calories: 49,
    nutrients: {
      'vit-c': 89, 'min-manganese': 0.59, 'vit-b9': 36, 'min-potassium': 233,
      'vit-b7': 1.6, 'min-iodine': 13,
    },
  },
  {
    id: 'food-blueberries',
    name: 'Blueberries',
    category: 'Fruits',
    servingSize: '1 cup (148g)',
    calories: 84,
    nutrients: {
      'vit-c': 14.4, 'vit-k': 28.6, 'min-manganese': 0.5, 'vit-e': 0.84,
    },
  },
  {
    id: 'food-avocado',
    name: 'Avocado',
    category: 'Fruits',
    servingSize: '1/2 medium (100g)',
    calories: 160,
    nutrients: {
      'vit-k': 21, 'vit-b9': 81, 'vit-b5': 1.39, 'vit-b6': 0.26,
      'vit-c': 10, 'vit-e': 2.07, 'min-potassium': 485, 'min-magnesium': 29,
      'min-copper': 190, 'fa-omega9': 9800, 'min-boron': 1.4,
    },
  },
  {
    id: 'food-kiwi',
    name: 'Kiwi',
    category: 'Fruits',
    servingSize: '1 medium (69g)',
    calories: 42,
    nutrients: {
      'vit-c': 64, 'vit-k': 27.8, 'vit-e': 1.0, 'vit-b9': 17, 'min-potassium': 215,
    },
  },

  // ─── Vegetables ──────────────────────────────────────────────
  {
    id: 'food-spinach',
    name: 'Spinach (cooked)',
    category: 'Vegetables',
    servingSize: '1 cup (180g)',
    calories: 41,
    nutrients: {
      'vit-a': 943, 'vit-k': 888, 'vit-b9': 263, 'vit-c': 17.6,
      'min-iron': 6.4, 'min-magnesium': 157, 'min-calcium': 245,
      'min-potassium': 839, 'min-manganese': 1.68, 'vit-b2': 0.42,
      'vit-e': 3.74, 'min-copper': 310,
    },
  },
  {
    id: 'food-broccoli',
    name: 'Broccoli (cooked)',
    category: 'Vegetables',
    servingSize: '1 cup (156g)',
    calories: 55,
    nutrients: {
      'vit-c': 101, 'vit-k': 220, 'vit-a': 120, 'vit-b9': 168,
      'min-potassium': 457, 'min-chromium': 22, 'vit-b6': 0.22,
      'vit-b5': 0.96, 'min-phosphorus': 105, 'min-manganese': 0.34,
    },
  },
  {
    id: 'food-sweet-potato',
    name: 'Sweet Potato (baked)',
    category: 'Vegetables',
    servingSize: '1 medium (114g)',
    calories: 103,
    nutrients: {
      'vit-a': 1096, 'vit-c': 22, 'vit-b6': 0.29, 'min-potassium': 542,
      'min-manganese': 0.56, 'vit-b5': 0.88, 'min-copper': 160,
      'vit-b7': 2.4,
    },
  },
  {
    id: 'food-kale',
    name: 'Kale (raw)',
    category: 'Vegetables',
    servingSize: '1 cup chopped (67g)',
    calories: 33,
    nutrients: {
      'vit-k': 547, 'vit-a': 206, 'vit-c': 80, 'min-calcium': 90,
      'min-potassium': 296, 'min-manganese': 0.54, 'vit-b6': 0.18,
      'min-copper': 200, 'min-iron': 1.1,
    },
  },
  {
    id: 'food-bell-pepper',
    name: 'Red Bell Pepper',
    category: 'Vegetables',
    servingSize: '1 medium (119g)',
    calories: 37,
    nutrients: {
      'vit-c': 152, 'vit-a': 187, 'vit-b6': 0.29, 'vit-e': 1.88,
      'vit-b9': 55, 'min-potassium': 251,
    },
  },
  {
    id: 'food-carrots',
    name: 'Carrots',
    category: 'Vegetables',
    servingSize: '1 cup chopped (128g)',
    calories: 52,
    nutrients: {
      'vit-a': 1069, 'vit-k': 16.9, 'vit-c': 7.6, 'min-potassium': 410,
      'vit-b7': 6.1,
    },
  },
  {
    id: 'food-mushrooms',
    name: 'Mushrooms (cooked)',
    category: 'Vegetables',
    servingSize: '1 cup (156g)',
    calories: 44,
    nutrients: {
      'vit-d': 33, 'vit-b3': 7.0, 'vit-b2': 0.47, 'vit-b5': 3.59,
      'min-selenium': 18.7, 'min-copper': 780, 'min-potassium': 555,
      'min-phosphorus': 136,
    },
  },

  // ─── Proteins ────────────────────────────────────────────────
  {
    id: 'food-chicken-breast',
    name: 'Chicken Breast (grilled)',
    category: 'Proteins',
    servingSize: '3 oz (85g)',
    calories: 128,
    nutrients: {
      'vit-b3': 11.4, 'vit-b6': 0.54, 'min-selenium': 24, 'min-phosphorus': 196,
      'vit-b5': 0.96, 'vit-b12': 0.31, 'min-zinc': 0.86,
      'aa-leucine': 2100, 'aa-isoleucine': 1400, 'aa-valine': 1300,
      'aa-lysine': 2200, 'aa-tryptophan': 310, 'aa-threonine': 1100,
    },
  },
  {
    id: 'food-beef',
    name: 'Beef (lean, cooked)',
    category: 'Proteins',
    servingSize: '3 oz (85g)',
    calories: 170,
    nutrients: {
      'vit-b12': 2.5, 'min-zinc': 5.3, 'min-iron': 2.6, 'vit-b3': 5.1,
      'vit-b6': 0.35, 'min-selenium': 28, 'min-phosphorus': 195,
      'aa-leucine': 2200, 'aa-lysine': 2400, 'aa-methionine': 700,
      'min-chromium': 2,
    },
  },
  {
    id: 'food-eggs',
    name: 'Eggs (2 large)',
    category: 'Proteins',
    servingSize: '2 large (100g)',
    calories: 143,
    nutrients: {
      'vit-b12': 0.89, 'vit-d': 82, 'vit-a': 160, 'vit-b2': 0.46,
      'min-selenium': 30.7, 'min-phosphorus': 198, 'vit-b7': 10,
      'vit-b5': 1.53, 'min-iron': 1.75, 'min-zinc': 1.29, 'min-iodine': 24,
      'aa-leucine': 1090, 'aa-tryptophan': 167, 'aa-methionine': 392,
      'aa-histidine': 309,
    },
  },
  {
    id: 'food-turkey',
    name: 'Turkey Breast',
    category: 'Proteins',
    servingSize: '3 oz (85g)',
    calories: 125,
    nutrients: {
      'vit-b3': 7.6, 'vit-b6': 0.46, 'min-selenium': 27, 'min-zinc': 1.5,
      'min-phosphorus': 196, 'vit-b12': 0.33, 'min-chromium': 11,
      'aa-tryptophan': 290, 'aa-leucine': 1900,
    },
  },
  {
    id: 'food-liver',
    name: 'Beef Liver',
    category: 'Proteins',
    servingSize: '3 oz (85g)',
    calories: 149,
    nutrients: {
      'vit-a': 6582, 'vit-b12': 59, 'vit-b2': 2.9, 'vit-b3': 14.7,
      'vit-b9': 215, 'min-iron': 5.2, 'min-copper': 12000, 'min-zinc': 4.0,
      'min-selenium': 36, 'vit-b5': 5.9, 'vit-b6': 0.87, 'min-phosphorus': 392,
      'min-chromium': 32, 'min-molybdenum': 104,
    },
  },

  // ─── Fish & Seafood ──────────────────────────────────────────
  {
    id: 'food-salmon',
    name: 'Salmon (wild, cooked)',
    category: 'Fish & Seafood',
    servingSize: '3 oz (85g)',
    calories: 177,
    nutrients: {
      'fa-omega3-epa': 411, 'fa-omega3-dha': 1240, 'vit-b12': 2.6,
      'vit-d': 447, 'min-selenium': 31, 'vit-b3': 8.6, 'vit-b6': 0.64,
      'min-potassium': 326, 'min-phosphorus': 252, 'vit-b5': 1.03,
      'aa-leucine': 1700, 'aa-lysine': 1900,
    },
  },
  {
    id: 'food-sardines',
    name: 'Sardines (canned)',
    category: 'Fish & Seafood',
    servingSize: '1 can (92g)',
    calories: 191,
    nutrients: {
      'vit-b12': 8.9, 'vit-d': 178, 'min-calcium': 351, 'min-selenium': 49,
      'min-phosphorus': 451, 'fa-omega3-epa': 473, 'fa-omega3-dha': 509,
      'vit-b3': 4.8, 'min-iron': 2.7, 'min-fluoride': 0.35,
    },
  },
  {
    id: 'food-tuna',
    name: 'Tuna (canned in water)',
    category: 'Fish & Seafood',
    servingSize: '3 oz (85g)',
    calories: 73,
    nutrients: {
      'vit-b12': 2.5, 'vit-b3': 11.3, 'min-selenium': 56, 'vit-d': 68,
      'min-phosphorus': 139, 'vit-b6': 0.32, 'fa-omega3-dha': 190,
      'fa-omega3-epa': 40,
    },
  },
  {
    id: 'food-oysters',
    name: 'Oysters (cooked)',
    category: 'Fish & Seafood',
    servingSize: '3 oz (85g)',
    calories: 69,
    nutrients: {
      'min-zinc': 32, 'vit-b12': 16.4, 'min-copper': 2300, 'min-iron': 5.7,
      'min-selenium': 54, 'vit-d': 80, 'fa-omega3-epa': 290,
      'fa-omega3-dha': 230, 'min-manganese': 0.45,
    },
  },
  {
    id: 'food-shrimp',
    name: 'Shrimp (cooked)',
    category: 'Fish & Seafood',
    servingSize: '3 oz (85g)',
    calories: 84,
    nutrients: {
      'min-selenium': 34, 'vit-b12': 1.4, 'min-iodine': 35, 'min-phosphorus': 201,
      'min-zinc': 1.4, 'vit-b3': 2.2, 'min-copper': 170,
      'fa-omega3-epa': 115, 'fa-omega3-dha': 120,
    },
  },

  // ─── Dairy ───────────────────────────────────────────────────
  {
    id: 'food-yogurt',
    name: 'Greek Yogurt (plain)',
    category: 'Dairy',
    servingSize: '1 cup (245g)',
    calories: 130,
    nutrients: {
      'min-calcium': 230, 'vit-b12': 1.3, 'min-phosphorus': 220,
      'vit-b2': 0.52, 'min-potassium': 282, 'min-zinc': 1.4,
      'min-iodine': 50, 'vit-b5': 0.89,
      'aa-leucine': 1400, 'aa-isoleucine': 800,
    },
  },
  {
    id: 'food-milk',
    name: 'Milk (whole)',
    category: 'Dairy',
    servingSize: '1 cup (244ml)',
    calories: 149,
    nutrients: {
      'min-calcium': 276, 'vit-d': 98, 'vit-b12': 1.1, 'vit-b2': 0.45,
      'min-phosphorus': 205, 'min-potassium': 322, 'vit-a': 68,
      'min-iodine': 56, 'min-selenium': 9.0,
    },
  },
  {
    id: 'food-cheese',
    name: 'Cheddar Cheese',
    category: 'Dairy',
    servingSize: '1 oz (28g)',
    calories: 113,
    nutrients: {
      'min-calcium': 200, 'vit-a': 75, 'vit-b12': 0.24, 'min-phosphorus': 145,
      'min-zinc': 0.88, 'min-selenium': 4.1, 'vit-k': 2.8,
      'aa-phenylalanine': 370, 'aa-histidine': 250,
    },
  },

  // ─── Grains ──────────────────────────────────────────────────
  {
    id: 'food-oatmeal',
    name: 'Oatmeal (cooked)',
    category: 'Grains',
    servingSize: '1 cup (234g)',
    calories: 166,
    nutrients: {
      'min-manganese': 1.37, 'min-phosphorus': 180, 'min-magnesium': 56,
      'min-iron': 2.1, 'min-zinc': 2.3, 'vit-b1': 0.26, 'min-selenium': 13,
      'min-copper': 170, 'vit-b5': 0.47,
    },
  },
  {
    id: 'food-brown-rice',
    name: 'Brown Rice (cooked)',
    category: 'Grains',
    servingSize: '1 cup (195g)',
    calories: 216,
    nutrients: {
      'min-manganese': 1.76, 'min-magnesium': 84, 'min-selenium': 19.1,
      'min-phosphorus': 162, 'vit-b3': 3.0, 'vit-b1': 0.19, 'vit-b6': 0.28,
      'min-zinc': 1.2, 'min-copper': 100,
    },
  },
  {
    id: 'food-quinoa',
    name: 'Quinoa (cooked)',
    category: 'Grains',
    servingSize: '1 cup (185g)',
    calories: 222,
    nutrients: {
      'min-manganese': 1.17, 'min-magnesium': 118, 'min-phosphorus': 281,
      'min-iron': 2.8, 'min-zinc': 2.0, 'vit-b9': 78, 'vit-b1': 0.2,
      'vit-b2': 0.2, 'vit-b6': 0.23, 'min-copper': 355,
      'min-selenium': 5.2,
    },
  },
  {
    id: 'food-whole-wheat-bread',
    name: 'Whole Wheat Bread',
    category: 'Grains',
    servingSize: '1 slice (28g)',
    calories: 69,
    nutrients: {
      'min-manganese': 0.65, 'min-selenium': 11, 'vit-b1': 0.1,
      'vit-b3': 1.4, 'min-iron': 0.7, 'min-magnesium': 23,
      'min-phosphorus': 57, 'min-zinc': 0.5,
    },
  },

  // ─── Nuts & Seeds ────────────────────────────────────────────
  {
    id: 'food-almonds',
    name: 'Almonds',
    category: 'Nuts & Seeds',
    servingSize: '1 oz (28g)',
    calories: 164,
    nutrients: {
      'vit-e': 7.3, 'min-magnesium': 76, 'min-manganese': 0.63,
      'min-copper': 290, 'vit-b2': 0.29, 'min-phosphorus': 136,
      'min-calcium': 76, 'min-zinc': 0.88, 'min-iron': 1.05,
      'vit-b7': 1.5, 'min-boron': 0.7,
    },
  },
  {
    id: 'food-walnuts',
    name: 'Walnuts',
    category: 'Nuts & Seeds',
    servingSize: '1 oz (28g)',
    calories: 185,
    nutrients: {
      'fa-omega3-ala': 2.6, 'min-manganese': 0.97, 'min-copper': 450,
      'min-magnesium': 45, 'min-phosphorus': 98, 'vit-b6': 0.15,
      'min-zinc': 0.88,
    },
  },
  {
    id: 'food-pumpkin-seeds',
    name: 'Pumpkin Seeds',
    category: 'Nuts & Seeds',
    servingSize: '1 oz (28g)',
    calories: 151,
    nutrients: {
      'min-magnesium': 150, 'min-zinc': 2.2, 'min-iron': 2.3,
      'min-manganese': 0.85, 'min-copper': 393, 'min-phosphorus': 332,
      'vit-k': 4.7,
    },
  },
  {
    id: 'food-sunflower-seeds',
    name: 'Sunflower Seeds',
    category: 'Nuts & Seeds',
    servingSize: '1 oz (28g)',
    calories: 165,
    nutrients: {
      'vit-e': 7.4, 'min-selenium': 22.5, 'min-copper': 512,
      'min-magnesium': 91, 'vit-b6': 0.23, 'min-manganese': 0.56,
      'min-phosphorus': 185, 'vit-b1': 0.41, 'vit-b9': 67,
      'vit-b5': 2.0,
    },
  },
  {
    id: 'food-chia-seeds',
    name: 'Chia Seeds',
    category: 'Nuts & Seeds',
    servingSize: '1 oz (28g)',
    calories: 138,
    nutrients: {
      'fa-omega3-ala': 5.0, 'min-calcium': 179, 'min-manganese': 0.77,
      'min-phosphorus': 244, 'min-magnesium': 95, 'min-iron': 2.2,
      'min-zinc': 1.3, 'min-copper': 90,
    },
  },
  {
    id: 'food-brazil-nuts',
    name: 'Brazil Nuts',
    category: 'Nuts & Seeds',
    servingSize: '3 nuts (15g)',
    calories: 99,
    nutrients: {
      'min-selenium': 288, 'min-magnesium': 56, 'min-copper': 260,
      'min-phosphorus': 109, 'min-zinc': 0.61, 'vit-e': 0.86,
      'aa-methionine': 160, 'min-calcium': 24,
    },
  },
  {
    id: 'food-flaxseeds',
    name: 'Flaxseeds (ground)',
    category: 'Nuts & Seeds',
    servingSize: '2 tbsp (14g)',
    calories: 74,
    nutrients: {
      'fa-omega3-ala': 3.2, 'min-manganese': 0.35, 'min-magnesium': 54,
      'min-phosphorus': 90, 'min-copper': 170, 'vit-b1': 0.23,
    },
  },

  // ─── Legumes ─────────────────────────────────────────────────
  {
    id: 'food-lentils',
    name: 'Lentils (cooked)',
    category: 'Legumes',
    servingSize: '1 cup (198g)',
    calories: 230,
    nutrients: {
      'vit-b9': 358, 'min-iron': 6.6, 'min-manganese': 0.98,
      'min-phosphorus': 356, 'min-potassium': 731, 'min-zinc': 2.5,
      'vit-b1': 0.33, 'vit-b6': 0.35, 'min-copper': 497,
      'min-magnesium': 71, 'min-selenium': 5.5, 'min-molybdenum': 148,
    },
  },
  {
    id: 'food-chickpeas',
    name: 'Chickpeas (cooked)',
    category: 'Legumes',
    servingSize: '1 cup (164g)',
    calories: 269,
    nutrients: {
      'vit-b9': 282, 'min-manganese': 1.69, 'min-iron': 4.7,
      'min-phosphorus': 276, 'min-zinc': 2.5, 'vit-b6': 0.23,
      'min-copper': 577, 'min-magnesium': 79, 'min-potassium': 477,
      'min-molybdenum': 85,
    },
  },
  {
    id: 'food-black-beans',
    name: 'Black Beans (cooked)',
    category: 'Legumes',
    servingSize: '1 cup (172g)',
    calories: 227,
    nutrients: {
      'vit-b9': 256, 'min-iron': 3.6, 'min-magnesium': 120,
      'min-potassium': 611, 'min-phosphorus': 241, 'min-manganese': 0.76,
      'vit-b1': 0.42, 'min-zinc': 1.9, 'min-copper': 360,
      'min-molybdenum': 130,
    },
  },

  // ─── Beverages ───────────────────────────────────────────────
  {
    id: 'food-green-tea',
    name: 'Green Tea',
    category: 'Beverages',
    servingSize: '1 cup (240ml)',
    calories: 2,
    nutrients: {
      'min-manganese': 0.45, 'min-fluoride': 0.3,
    },
  },
  {
    id: 'food-orange-juice',
    name: 'Orange Juice (fortified)',
    category: 'Beverages',
    servingSize: '1 cup (248ml)',
    calories: 112,
    nutrients: {
      'vit-c': 124, 'vit-d': 100, 'min-calcium': 349, 'vit-b9': 74,
      'min-potassium': 496, 'vit-b1': 0.28,
    },
  },

  // ─── Snacks ──────────────────────────────────────────────────
  {
    id: 'food-dark-chocolate',
    name: 'Dark Chocolate (70-85%)',
    category: 'Snacks',
    servingSize: '1 oz (28g)',
    calories: 170,
    nutrients: {
      'min-iron': 3.4, 'min-magnesium': 64, 'min-copper': 500,
      'min-manganese': 0.55, 'min-zinc': 0.93, 'min-phosphorus': 87,
      'min-potassium': 200, 'min-selenium': 1.9,
    },
  },
  {
    id: 'food-hummus',
    name: 'Hummus',
    category: 'Snacks',
    servingSize: '1/4 cup (62g)',
    calories: 104,
    nutrients: {
      'min-iron': 1.5, 'vit-b9': 36, 'min-manganese': 0.38,
      'min-copper': 130, 'min-phosphorus': 70, 'min-zinc': 0.7,
      'vit-b6': 0.1,
    },
  },

  // ─── Additional common foods ─────────────────────────────────
  {
    id: 'food-tofu',
    name: 'Tofu (firm)',
    category: 'Proteins',
    servingSize: '1/2 cup (126g)',
    calories: 88,
    nutrients: {
      'min-calcium': 253, 'min-iron': 6.6, 'min-manganese': 0.79,
      'min-selenium': 11, 'min-phosphorus': 119, 'min-zinc': 1.0,
      'min-magnesium': 37, 'min-copper': 240,
      'aa-leucine': 940, 'aa-isoleucine': 620,
    },
  },
  {
    id: 'food-cottage-cheese',
    name: 'Cottage Cheese',
    category: 'Dairy',
    servingSize: '1 cup (226g)',
    calories: 206,
    nutrients: {
      'min-calcium': 138, 'min-phosphorus': 303, 'min-selenium': 20,
      'vit-b12': 1.4, 'vit-b2': 0.37, 'min-sodium': 706, 'min-zinc': 0.86,
      'aa-threonine': 1200, 'aa-leucine': 2100,
    },
  },
  {
    id: 'food-seaweed-nori',
    name: 'Nori Seaweed',
    category: 'Vegetables',
    servingSize: '1 sheet (2.5g)',
    calories: 5,
    nutrients: {
      'min-iodine': 16, 'vit-a': 32, 'vit-c': 3.9, 'min-iron': 0.31,
      'vit-b12': 0.08, 'min-manganese': 0.02,
    },
  },
];

/** Search foods by name, returns matching items sorted by relevance */
export function searchFoods(query: string): FoodItem[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase().trim();
  
  return foodDatabase
    .filter(f => f.name.toLowerCase().includes(lower) || f.category.toLowerCase().includes(lower))
    .sort((a, b) => {
      // Exact start match first
      const aStarts = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name);
    });
}

/** Get foods by category */
export function getFoodsByCategory(category: string): FoodItem[] {
  return foodDatabase.filter(f => f.category === category);
}
