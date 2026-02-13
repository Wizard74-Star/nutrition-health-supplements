// Maps common supplements to the nutrient IDs they address
export interface SupplementInfo {
  name: string;
  category: string;
  commonDosages: string[];
  defaultUnit: string;
  nutrientIds: string[]; // maps to nutrient IDs from nutrients.ts
  description: string;
  bestTimeOfDay: string;
  tips?: string;
}

export const supplementCategories = [
  'Vitamins',
  'Minerals',
  'Omega Fatty Acids',
  'Amino Acids',
  'Multivitamins',
  'Herbal & Botanical',
  'Specialty',
] as const;

export const supplementDatabase: SupplementInfo[] = [
  // Vitamins
  {
    name: 'Vitamin A (Retinol)',
    category: 'Vitamins',
    commonDosages: ['750', '1500', '3000', '5000'],
    defaultUnit: 'mcg',
    nutrientIds: ['vit-a'],
    description: 'Fat-soluble vitamin for vision, immunity, and skin health.',
    bestTimeOfDay: 'morning',
    tips: 'Take with a meal containing fat for best absorption.',
  },
  {
    name: 'Vitamin B Complex',
    category: 'Vitamins',
    commonDosages: ['50', '100'],
    defaultUnit: 'mg',
    nutrientIds: ['vit-b1', 'vit-b2', 'vit-b3', 'vit-b5', 'vit-b6', 'vit-b7', 'vit-b9', 'vit-b12'],
    description: 'Complete B-vitamin complex for energy and nervous system support.',
    bestTimeOfDay: 'morning',
    tips: 'Take in the morning as B vitamins can be energizing.',
  },
  {
    name: 'Vitamin B1 (Thiamine)',
    category: 'Vitamins',
    commonDosages: ['50', '100', '250'],
    defaultUnit: 'mg',
    nutrientIds: ['vit-b1'],
    description: 'Supports energy metabolism and nervous system function.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'Vitamin B6 (Pyridoxine)',
    category: 'Vitamins',
    commonDosages: ['25', '50', '100'],
    defaultUnit: 'mg',
    nutrientIds: ['vit-b6'],
    description: 'Supports neurotransmitter synthesis and protein metabolism.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'Vitamin B9 (Folate/Folic Acid)',
    category: 'Vitamins',
    commonDosages: ['400', '800', '1000'],
    defaultUnit: 'mcg',
    nutrientIds: ['vit-b9'],
    description: 'Essential for DNA synthesis and cell division. Critical during pregnancy.',
    bestTimeOfDay: 'morning',
    tips: 'Methylfolate form is better absorbed for those with MTHFR variants.',
  },
  {
    name: 'Vitamin B12 (Methylcobalamin)',
    category: 'Vitamins',
    commonDosages: ['500', '1000', '2500', '5000'],
    defaultUnit: 'mcg',
    nutrientIds: ['vit-b12'],
    description: 'Essential for nerve function, DNA synthesis, and red blood cells.',
    bestTimeOfDay: 'morning',
    tips: 'Sublingual form bypasses absorption issues.',
  },
  {
    name: 'Vitamin C',
    category: 'Vitamins',
    commonDosages: ['250', '500', '1000', '2000'],
    defaultUnit: 'mg',
    nutrientIds: ['vit-c'],
    description: 'Powerful antioxidant for immune support and collagen synthesis.',
    bestTimeOfDay: 'morning',
    tips: 'Divided doses throughout the day improve absorption.',
  },
  {
    name: 'Vitamin D3',
    category: 'Vitamins',
    commonDosages: ['1000', '2000', '4000', '5000', '10000'],
    defaultUnit: 'IU',
    nutrientIds: ['vit-d'],
    description: 'The sunshine vitamin for bone health, immunity, and mood.',
    bestTimeOfDay: 'morning',
    tips: 'Take with a fatty meal. Pair with Vitamin K2 for bone health.',
  },
  {
    name: 'Vitamin E',
    category: 'Vitamins',
    commonDosages: ['100', '200', '400'],
    defaultUnit: 'IU',
    nutrientIds: ['vit-e'],
    description: 'Fat-soluble antioxidant protecting cell membranes.',
    bestTimeOfDay: 'morning',
    tips: 'Natural d-alpha-tocopherol is more bioavailable than synthetic.',
  },
  {
    name: 'Vitamin K2 (MK-7)',
    category: 'Vitamins',
    commonDosages: ['90', '100', '200'],
    defaultUnit: 'mcg',
    nutrientIds: ['vit-k'],
    description: 'Directs calcium to bones and teeth, away from arteries.',
    bestTimeOfDay: 'morning',
    tips: 'Pair with Vitamin D3 for synergistic bone and heart benefits.',
  },
  {
    name: 'Biotin (B7)',
    category: 'Vitamins',
    commonDosages: ['1000', '2500', '5000', '10000'],
    defaultUnit: 'mcg',
    nutrientIds: ['vit-b7'],
    description: 'Supports hair, skin, and nail health.',
    bestTimeOfDay: 'morning',
  },

  // Minerals
  {
    name: 'Calcium',
    category: 'Minerals',
    commonDosages: ['250', '500', '600', '1000'],
    defaultUnit: 'mg',
    nutrientIds: ['min-calcium'],
    description: 'Essential for bone structure, muscle function, and nerve signaling.',
    bestTimeOfDay: 'evening',
    tips: 'Split into doses of 500mg or less. Requires Vitamin D for absorption.',
  },
  {
    name: 'Iron (Ferrous Bisglycinate)',
    category: 'Minerals',
    commonDosages: ['18', '25', '36', '65'],
    defaultUnit: 'mg',
    nutrientIds: ['min-iron'],
    description: 'Essential for oxygen transport and energy metabolism.',
    bestTimeOfDay: 'morning',
    tips: 'Take with Vitamin C on empty stomach. Avoid with calcium, tea, or coffee.',
  },
  {
    name: 'Magnesium Glycinate',
    category: 'Minerals',
    commonDosages: ['200', '300', '400'],
    defaultUnit: 'mg',
    nutrientIds: ['min-magnesium'],
    description: 'Highly bioavailable form for muscle relaxation, sleep, and stress.',
    bestTimeOfDay: 'evening',
    tips: 'Take in the evening for better sleep quality.',
  },
  {
    name: 'Magnesium Threonate',
    category: 'Minerals',
    commonDosages: ['1000', '1500', '2000'],
    defaultUnit: 'mg',
    nutrientIds: ['min-magnesium'],
    description: 'Crosses the blood-brain barrier for cognitive support.',
    bestTimeOfDay: 'evening',
  },
  {
    name: 'Zinc Picolinate',
    category: 'Minerals',
    commonDosages: ['15', '22', '30', '50'],
    defaultUnit: 'mg',
    nutrientIds: ['min-zinc'],
    description: 'Highly absorbable zinc for immune function and wound healing.',
    bestTimeOfDay: 'morning',
    tips: 'Take with food to avoid nausea. Balance with copper if taking long-term.',
  },
  {
    name: 'Selenium',
    category: 'Minerals',
    commonDosages: ['55', '100', '200'],
    defaultUnit: 'mcg',
    nutrientIds: ['min-selenium'],
    description: 'Antioxidant mineral for thyroid function and immune support.',
    bestTimeOfDay: 'morning',
    tips: 'Just 2 Brazil nuts daily provides adequate selenium naturally.',
  },
  {
    name: 'Potassium',
    category: 'Minerals',
    commonDosages: ['99', '200', '400'],
    defaultUnit: 'mg',
    nutrientIds: ['min-potassium'],
    description: 'Electrolyte for heart rhythm, muscle, and nerve function.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'Copper',
    category: 'Minerals',
    commonDosages: ['1', '2'],
    defaultUnit: 'mg',
    nutrientIds: ['min-copper'],
    description: 'Trace mineral for iron metabolism and connective tissue.',
    bestTimeOfDay: 'morning',
    tips: 'Important to supplement if taking high-dose zinc long-term.',
  },
  {
    name: 'Iodine',
    category: 'Minerals',
    commonDosages: ['150', '225', '325'],
    defaultUnit: 'mcg',
    nutrientIds: ['min-iodine'],
    description: 'Essential for thyroid hormone production and metabolism.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'Chromium Picolinate',
    category: 'Minerals',
    commonDosages: ['200', '400', '500'],
    defaultUnit: 'mcg',
    nutrientIds: ['min-chromium'],
    description: 'Supports insulin sensitivity and blood sugar regulation.',
    bestTimeOfDay: 'morning',
  },

  // Omega Fatty Acids
  {
    name: 'Fish Oil (EPA/DHA)',
    category: 'Omega Fatty Acids',
    commonDosages: ['1000', '2000', '3000'],
    defaultUnit: 'mg',
    nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha'],
    description: 'Combined EPA and DHA for heart, brain, and anti-inflammatory support.',
    bestTimeOfDay: 'morning',
    tips: 'Take with a fatty meal. Triglyceride form is better absorbed.',
  },
  {
    name: 'EPA (Omega-3)',
    category: 'Omega Fatty Acids',
    commonDosages: ['500', '1000', '1500'],
    defaultUnit: 'mg',
    nutrientIds: ['fa-omega3-epa'],
    description: 'Anti-inflammatory omega-3 for cardiovascular and mental health.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'DHA (Omega-3)',
    category: 'Omega Fatty Acids',
    commonDosages: ['250', '500', '1000'],
    defaultUnit: 'mg',
    nutrientIds: ['fa-omega3-dha'],
    description: 'Primary structural fat in the brain and retina.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'Algae Oil (Vegan Omega-3)',
    category: 'Omega Fatty Acids',
    commonDosages: ['250', '500', '1000'],
    defaultUnit: 'mg',
    nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha'],
    description: 'Plant-based EPA/DHA from algae for vegans and vegetarians.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'Flaxseed Oil (ALA)',
    category: 'Omega Fatty Acids',
    commonDosages: ['1000', '1300', '2000'],
    defaultUnit: 'mg',
    nutrientIds: ['fa-omega3-ala'],
    description: 'Plant-based ALA omega-3 from flaxseed.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'Evening Primrose Oil (GLA)',
    category: 'Omega Fatty Acids',
    commonDosages: ['500', '1000', '1300'],
    defaultUnit: 'mg',
    nutrientIds: ['fa-omega6-gla'],
    description: 'GLA omega-6 for skin health, hormones, and inflammation.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'Krill Oil',
    category: 'Omega Fatty Acids',
    commonDosages: ['500', '1000', '1500'],
    defaultUnit: 'mg',
    nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha'],
    description: 'Phospholipid-bound omega-3s with astaxanthin antioxidant.',
    bestTimeOfDay: 'morning',
    tips: 'Phospholipid form may be better absorbed than standard fish oil.',
  },

  // Amino Acids
  {
    name: 'BCAA (Branched-Chain Amino Acids)',
    category: 'Amino Acids',
    commonDosages: ['5000', '7000', '10000'],
    defaultUnit: 'mg',
    nutrientIds: ['aa-leucine', 'aa-isoleucine', 'aa-valine'],
    description: 'Leucine, isoleucine, and valine for muscle recovery and growth.',
    bestTimeOfDay: 'morning',
    tips: 'Best taken around workouts for muscle support.',
  },
  {
    name: 'L-Leucine',
    category: 'Amino Acids',
    commonDosages: ['2000', '3000', '5000'],
    defaultUnit: 'mg',
    nutrientIds: ['aa-leucine'],
    description: 'Key BCAA for stimulating muscle protein synthesis.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'L-Lysine',
    category: 'Amino Acids',
    commonDosages: ['500', '1000', '1500'],
    defaultUnit: 'mg',
    nutrientIds: ['aa-lysine'],
    description: 'Essential for collagen synthesis, calcium absorption, and immunity.',
    bestTimeOfDay: 'morning',
    tips: 'May help prevent cold sore outbreaks.',
  },
  {
    name: 'L-Tryptophan',
    category: 'Amino Acids',
    commonDosages: ['500', '1000', '1500'],
    defaultUnit: 'mg',
    nutrientIds: ['aa-tryptophan'],
    description: 'Precursor to serotonin and melatonin for mood and sleep.',
    bestTimeOfDay: 'evening',
    tips: 'Take on an empty stomach for best conversion to serotonin.',
  },
  {
    name: 'L-Methionine',
    category: 'Amino Acids',
    commonDosages: ['500', '1000'],
    defaultUnit: 'mg',
    nutrientIds: ['aa-methionine'],
    description: 'Sulfur amino acid for methylation and detoxification.',
    bestTimeOfDay: 'morning',
  },
  {
    name: 'L-Histidine',
    category: 'Amino Acids',
    commonDosages: ['500', '1000'],
    defaultUnit: 'mg',
    nutrientIds: ['aa-histidine'],
    description: 'Precursor to histamine for immune response and digestion.',
    bestTimeOfDay: 'morning',
  },

  // Multivitamins
  {
    name: 'Daily Multivitamin',
    category: 'Multivitamins',
    commonDosages: ['1', '2'],
    defaultUnit: 'tablet(s)',
    nutrientIds: ['vit-a', 'vit-b1', 'vit-b2', 'vit-b3', 'vit-b5', 'vit-b6', 'vit-b7', 'vit-b9', 'vit-b12', 'vit-c', 'vit-d', 'vit-e', 'vit-k', 'min-calcium', 'min-iron', 'min-magnesium', 'min-zinc', 'min-selenium', 'min-copper', 'min-manganese', 'min-chromium', 'min-iodine', 'min-molybdenum'],
    description: 'Comprehensive daily multivitamin covering essential vitamins and minerals.',
    bestTimeOfDay: 'morning',
    tips: 'Take with food for best absorption and to avoid nausea.',
  },
  {
    name: 'Prenatal Multivitamin',
    category: 'Multivitamins',
    commonDosages: ['1'],
    defaultUnit: 'tablet(s)',
    nutrientIds: ['vit-a', 'vit-b6', 'vit-b9', 'vit-b12', 'vit-c', 'vit-d', 'min-iron', 'min-calcium', 'min-zinc', 'min-iodine', 'fa-omega3-dha'],
    description: 'Specially formulated for pregnancy with extra folate, iron, and DHA.',
    bestTimeOfDay: 'morning',
  },

  // Specialty
  {
    name: 'Vitamin D3 + K2 Combo',
    category: 'Specialty',
    commonDosages: ['1000/45', '2000/90', '5000/100'],
    defaultUnit: 'IU/mcg',
    nutrientIds: ['vit-d', 'vit-k'],
    description: 'Synergistic combination for bone health and calcium metabolism.',
    bestTimeOfDay: 'morning',
    tips: 'Take with a fatty meal for optimal absorption of both nutrients.',
  },
  {
    name: 'Calcium + Magnesium + D3',
    category: 'Specialty',
    commonDosages: ['500/250/400', '1000/500/1000'],
    defaultUnit: 'mg/mg/IU',
    nutrientIds: ['min-calcium', 'min-magnesium', 'vit-d'],
    description: 'Bone health trio for calcium absorption and utilization.',
    bestTimeOfDay: 'evening',
  },
  {
    name: 'Iron + Vitamin C',
    category: 'Specialty',
    commonDosages: ['25/200', '36/250'],
    defaultUnit: 'mg/mg',
    nutrientIds: ['min-iron', 'vit-c'],
    description: 'Iron with Vitamin C for enhanced absorption.',
    bestTimeOfDay: 'morning',
    tips: 'Take on an empty stomach for best iron absorption.',
  },
  {
    name: 'Zinc + Copper',
    category: 'Specialty',
    commonDosages: ['15/1', '30/2'],
    defaultUnit: 'mg/mg',
    nutrientIds: ['min-zinc', 'min-copper'],
    description: 'Balanced zinc and copper to prevent depletion.',
    bestTimeOfDay: 'morning',
  },
];

// Helper to find supplements that address a specific nutrient deficiency
export function findSupplementsForNutrient(nutrientId: string): SupplementInfo[] {
  return supplementDatabase.filter(s => s.nutrientIds.includes(nutrientId));
}

// Helper to get all nutrient IDs covered by a list of supplements
export function getCoveredNutrientIds(supplementNames: string[]): Set<string> {
  const covered = new Set<string>();
  supplementNames.forEach(name => {
    const supp = supplementDatabase.find(s => s.name === name);
    if (supp) {
      supp.nutrientIds.forEach(id => covered.add(id));
    }
  });
  return covered;
}

// Time of day options
export const timeOfDayOptions = [
  { value: 'morning', label: 'Morning', icon: 'sunrise' },
  { value: 'afternoon', label: 'Afternoon', icon: 'sun' },
  { value: 'evening', label: 'Evening', icon: 'sunset' },
  { value: 'bedtime', label: 'Bedtime', icon: 'moon' },
  { value: 'with-meals', label: 'With Meals', icon: 'utensils' },
] as const;

// Frequency options
export const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice-daily', label: 'Twice Daily' },
  { value: 'three-times-daily', label: '3x Daily' },
  { value: 'every-other-day', label: 'Every Other Day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as-needed', label: 'As Needed' },
] as const;

// Common dosage units
export const dosageUnits = [
  'mg', 'mcg', 'g', 'IU', 'ml', 'drops', 'tablet(s)', 'capsule(s)', 'softgel(s)', 'scoop(s)',
  'IU/mcg', 'mg/mg', 'mg/mg/IU',
];
