export type MarkerCategory = 'cbc' | 'metabolic' | 'vitamins' | 'minerals' | 'lipids' | 'thyroid' | 'inflammation' | 'iron_panel';

export type SeverityLevel = 'normal' | 'borderline_low' | 'borderline_high' | 'low' | 'high' | 'critical_low' | 'critical_high';

export interface ReferenceRange {
  low: number;
  high: number;
  borderlineLow?: number;
  borderlineHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  unit: string;
}

export interface BloodMarker {
  id: string;
  name: string;
  abbreviation: string;
  category: MarkerCategory;
  description: string;
  referenceRange: ReferenceRange;
  nutrientIds: string[]; // Maps to nutrient database
  lowMeaning: string;
  highMeaning: string;
  supplementRecommendations: {
    whenLow: string[];
    whenHigh: string[];
  };
  dietaryTips: {
    whenLow: string[];
    whenHigh: string[];
  };
}

export const markerCategories: Record<MarkerCategory, { label: string; color: string; bgColor: string; borderColor: string; description: string }> = {
  cbc: { label: 'Complete Blood Count', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', description: 'Red and white blood cell measurements' },
  metabolic: { label: 'Metabolic Panel', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Kidney, liver, and blood sugar markers' },
  vitamins: { label: 'Vitamin Levels', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', description: 'Essential vitamin concentrations' },
  minerals: { label: 'Mineral Levels', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', description: 'Essential mineral concentrations' },
  lipids: { label: 'Lipid Panel', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', description: 'Cholesterol and triglyceride levels' },
  thyroid: { label: 'Thyroid Panel', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', description: 'Thyroid function markers' },
  inflammation: { label: 'Inflammation', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Inflammatory markers' },
  iron_panel: { label: 'Iron Panel', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', description: 'Iron status markers' },
};

export const bloodMarkers: BloodMarker[] = [
  // === CBC ===
  {
    id: 'hemoglobin',
    name: 'Hemoglobin',
    abbreviation: 'Hgb',
    category: 'cbc',
    description: 'Protein in red blood cells that carries oxygen throughout the body.',
    referenceRange: { low: 12.0, high: 17.5, borderlineLow: 11.0, criticalLow: 7.0, criticalHigh: 20.0, unit: 'g/dL' },
    nutrientIds: ['min-iron', 'vit-b12', 'vit-b9', 'vit-b6', 'min-copper'],
    lowMeaning: 'May indicate anemia, iron deficiency, B12/folate deficiency, or chronic disease.',
    highMeaning: 'May indicate dehydration, lung disease, or polycythemia.',
    supplementRecommendations: { whenLow: ['Iron (ferrous bisglycinate)', 'Vitamin B12 (methylcobalamin)', 'Folate (methylfolate)', 'Vitamin C (enhances iron absorption)'], whenHigh: [] },
    dietaryTips: { whenLow: ['Red meat, liver, and organ meats', 'Dark leafy greens with lemon juice', 'Lentils and beans', 'Avoid tea/coffee with iron-rich meals'], whenHigh: ['Stay well hydrated', 'Limit iron-rich foods if advised'] },
  },
  {
    id: 'hematocrit',
    name: 'Hematocrit',
    abbreviation: 'Hct',
    category: 'cbc',
    description: 'Percentage of blood volume occupied by red blood cells.',
    referenceRange: { low: 36, high: 52, borderlineLow: 33, criticalLow: 20, criticalHigh: 60, unit: '%' },
    nutrientIds: ['min-iron', 'vit-b12', 'vit-b9'],
    lowMeaning: 'May indicate anemia, nutritional deficiency, or blood loss.',
    highMeaning: 'May indicate dehydration, lung disease, or polycythemia vera.',
    supplementRecommendations: { whenLow: ['Iron supplement', 'B-complex vitamins', 'Vitamin C'], whenHigh: [] },
    dietaryTips: { whenLow: ['Iron-rich foods', 'B12-rich foods (meat, fish, dairy)'], whenHigh: ['Increase fluid intake'] },
  },
  {
    id: 'rbc',
    name: 'Red Blood Cell Count',
    abbreviation: 'RBC',
    category: 'cbc',
    description: 'Number of red blood cells per volume of blood.',
    referenceRange: { low: 4.0, high: 5.9, borderlineLow: 3.5, criticalLow: 2.5, criticalHigh: 7.0, unit: 'M/uL' },
    nutrientIds: ['min-iron', 'vit-b12', 'vit-b9', 'min-copper'],
    lowMeaning: 'May indicate anemia, nutritional deficiency, bone marrow problems.',
    highMeaning: 'May indicate dehydration, lung disease, or kidney issues.',
    supplementRecommendations: { whenLow: ['Iron', 'Vitamin B12', 'Folate', 'Copper'], whenHigh: [] },
    dietaryTips: { whenLow: ['Iron and B12-rich foods', 'Folate from dark leafy greens'], whenHigh: ['Stay hydrated'] },
  },
  {
    id: 'mcv',
    name: 'Mean Corpuscular Volume',
    abbreviation: 'MCV',
    category: 'cbc',
    description: 'Average size of red blood cells. Helps classify type of anemia.',
    referenceRange: { low: 80, high: 100, borderlineLow: 75, borderlineHigh: 105, unit: 'fL' },
    nutrientIds: ['min-iron', 'vit-b12', 'vit-b9'],
    lowMeaning: 'Microcytic anemia — often iron deficiency or thalassemia.',
    highMeaning: 'Macrocytic anemia — often B12 or folate deficiency.',
    supplementRecommendations: { whenLow: ['Iron (ferrous bisglycinate)', 'Vitamin C for absorption'], whenHigh: ['Vitamin B12 (methylcobalamin)', 'Folate (5-MTHF)'] },
    dietaryTips: { whenLow: ['Red meat, shellfish', 'Fortified cereals'], whenHigh: ['Liver, fish, eggs for B12', 'Dark leafy greens for folate'] },
  },
  {
    id: 'wbc',
    name: 'White Blood Cell Count',
    abbreviation: 'WBC',
    category: 'cbc',
    description: 'Number of white blood cells, key indicators of immune function.',
    referenceRange: { low: 4.0, high: 11.0, borderlineLow: 3.5, criticalLow: 2.0, criticalHigh: 30.0, unit: 'K/uL' },
    nutrientIds: ['vit-c', 'min-zinc', 'vit-d'],
    lowMeaning: 'May indicate weakened immune system, viral infection, or bone marrow issues.',
    highMeaning: 'May indicate infection, inflammation, stress, or immune disorder.',
    supplementRecommendations: { whenLow: ['Vitamin C', 'Zinc', 'Vitamin D3', 'Selenium'], whenHigh: [] },
    dietaryTips: { whenLow: ['Citrus fruits, berries', 'Garlic and ginger', 'Zinc-rich foods (oysters, pumpkin seeds)'], whenHigh: ['Anti-inflammatory foods', 'Omega-3 rich fish'] },
  },
  {
    id: 'platelets',
    name: 'Platelet Count',
    abbreviation: 'PLT',
    category: 'cbc',
    description: 'Number of platelets, essential for blood clotting.',
    referenceRange: { low: 150, high: 400, borderlineLow: 100, criticalLow: 50, criticalHigh: 1000, unit: 'K/uL' },
    nutrientIds: ['vit-b12', 'vit-b9', 'min-iron'],
    lowMeaning: 'May indicate bone marrow issues, autoimmune conditions, or nutritional deficiency.',
    highMeaning: 'May indicate inflammation, infection, or bone marrow disorder.',
    supplementRecommendations: { whenLow: ['Vitamin B12', 'Folate', 'Iron (if deficient)'], whenHigh: [] },
    dietaryTips: { whenLow: ['B12-rich foods', 'Folate-rich foods', 'Papaya leaf extract (traditional)'], whenHigh: ['Omega-3 fatty acids', 'Turmeric'] },
  },

  // === VITAMINS ===
  {
    id: 'vitamin-d',
    name: 'Vitamin D, 25-Hydroxy',
    abbreviation: '25(OH)D',
    category: 'vitamins',
    description: 'Primary circulating form of vitamin D. Critical for bone health, immunity, and mood.',
    referenceRange: { low: 30, high: 100, borderlineLow: 20, criticalLow: 10, unit: 'ng/mL' },
    nutrientIds: ['vit-d'],
    lowMeaning: 'Vitamin D deficiency — associated with bone loss, weak immunity, depression, fatigue.',
    highMeaning: 'Vitamin D toxicity — may cause hypercalcemia, nausea, kidney damage.',
    supplementRecommendations: { whenLow: ['Vitamin D3 (cholecalciferol) 2000-5000 IU daily', 'Vitamin K2 (MK-7) to direct calcium', 'Magnesium (needed for D activation)'], whenHigh: ['Stop vitamin D supplementation', 'Consult physician immediately'] },
    dietaryTips: { whenLow: ['Fatty fish (salmon, mackerel)', 'Cod liver oil', 'Egg yolks', '15-20 min sunlight exposure daily'], whenHigh: ['Reduce fortified food intake'] },
  },
  {
    id: 'vitamin-b12',
    name: 'Vitamin B12',
    abbreviation: 'B12',
    category: 'vitamins',
    description: 'Essential for nerve function, DNA synthesis, and red blood cell formation.',
    referenceRange: { low: 200, high: 900, borderlineLow: 300, criticalLow: 150, unit: 'pg/mL' },
    nutrientIds: ['vit-b12'],
    lowMeaning: 'B12 deficiency — can cause fatigue, nerve damage, anemia, cognitive issues.',
    highMeaning: 'Usually not harmful from supplements. Rarely indicates liver disease or blood cancer.',
    supplementRecommendations: { whenLow: ['Methylcobalamin 1000-5000 mcg sublingual', 'B-complex vitamin', 'Consider B12 injections if very low'], whenHigh: [] },
    dietaryTips: { whenLow: ['Shellfish (clams, mussels)', 'Liver and organ meats', 'Fish and meat', 'Fortified nutritional yeast'], whenHigh: [] },
  },
  {
    id: 'folate',
    name: 'Folate (Vitamin B9)',
    abbreviation: 'Folate',
    category: 'vitamins',
    description: 'Essential for DNA synthesis, cell division, and fetal development.',
    referenceRange: { low: 2.7, high: 17.0, borderlineLow: 3.5, criticalLow: 2.0, unit: 'ng/mL' },
    nutrientIds: ['vit-b9'],
    lowMeaning: 'Folate deficiency — can cause anemia, birth defects, fatigue, mood changes.',
    highMeaning: 'May mask B12 deficiency. Rarely problematic from food sources.',
    supplementRecommendations: { whenLow: ['Methylfolate (5-MTHF) 400-800 mcg', 'B-complex with methylfolate', 'Avoid folic acid if MTHFR mutation suspected'], whenHigh: [] },
    dietaryTips: { whenLow: ['Dark leafy greens (spinach, kale)', 'Lentils and beans', 'Asparagus', 'Citrus fruits'], whenHigh: [] },
  },
  {
    id: 'vitamin-b6',
    name: 'Vitamin B6',
    abbreviation: 'B6',
    category: 'vitamins',
    description: 'Involved in neurotransmitter synthesis, immune function, and protein metabolism.',
    referenceRange: { low: 5.0, high: 50.0, borderlineLow: 3.0, unit: 'ng/mL' },
    nutrientIds: ['vit-b6'],
    lowMeaning: 'May cause anemia, skin rashes, confusion, weakened immunity.',
    highMeaning: 'High doses can cause nerve damage (peripheral neuropathy).',
    supplementRecommendations: { whenLow: ['Pyridoxal-5-phosphate (P5P) 25-50 mg', 'B-complex vitamin'], whenHigh: ['Discontinue B6 supplements', 'Do not exceed 100mg/day'] },
    dietaryTips: { whenLow: ['Chickpeas, salmon, chicken', 'Potatoes, bananas'], whenHigh: ['Reduce supplement intake'] },
  },
  {
    id: 'vitamin-a',
    name: 'Vitamin A (Retinol)',
    abbreviation: 'Vit A',
    category: 'vitamins',
    description: 'Fat-soluble vitamin essential for vision, immune function, and skin health.',
    referenceRange: { low: 30, high: 65, borderlineLow: 20, criticalLow: 10, unit: 'mcg/dL' },
    nutrientIds: ['vit-a'],
    lowMeaning: 'May cause night blindness, dry skin, frequent infections.',
    highMeaning: 'Toxicity — liver damage, birth defects, bone loss.',
    supplementRecommendations: { whenLow: ['Beta-carotene 10,000-25,000 IU', 'Cod liver oil', 'Retinyl palmitate (preformed)'], whenHigh: ['Stop vitamin A supplements immediately'] },
    dietaryTips: { whenLow: ['Sweet potatoes, carrots', 'Liver, eggs', 'Spinach, kale'], whenHigh: ['Avoid liver and high-dose supplements'] },
  },
  {
    id: 'vitamin-e',
    name: 'Vitamin E (Alpha-Tocopherol)',
    abbreviation: 'Vit E',
    category: 'vitamins',
    description: 'Fat-soluble antioxidant protecting cell membranes from oxidative damage.',
    referenceRange: { low: 5.5, high: 17.0, borderlineLow: 4.0, unit: 'mg/L' },
    nutrientIds: ['vit-e'],
    lowMeaning: 'May cause nerve damage, muscle weakness, vision problems.',
    highMeaning: 'May increase bleeding risk, especially with blood thinners.',
    supplementRecommendations: { whenLow: ['Mixed tocopherols 200-400 IU', 'Natural d-alpha-tocopherol'], whenHigh: ['Reduce or stop vitamin E supplements'] },
    dietaryTips: { whenLow: ['Sunflower seeds, almonds', 'Avocado, olive oil', 'Spinach'], whenHigh: ['Reduce nut and seed oil intake'] },
  },
  {
    id: 'vitamin-c',
    name: 'Vitamin C (Ascorbic Acid)',
    abbreviation: 'Vit C',
    category: 'vitamins',
    description: 'Water-soluble antioxidant essential for collagen, immunity, and iron absorption.',
    referenceRange: { low: 0.4, high: 2.0, borderlineLow: 0.2, criticalLow: 0.1, unit: 'mg/dL' },
    nutrientIds: ['vit-c'],
    lowMeaning: 'Scurvy risk — bleeding gums, slow healing, fatigue, joint pain.',
    highMeaning: 'May cause kidney stones or GI distress at very high doses.',
    supplementRecommendations: { whenLow: ['Vitamin C 500-1000 mg, divided doses', 'Liposomal vitamin C for better absorption'], whenHigh: ['Reduce supplementation'] },
    dietaryTips: { whenLow: ['Bell peppers, citrus fruits', 'Strawberries, kiwi', 'Broccoli, tomatoes'], whenHigh: ['Reduce citrus and supplement intake'] },
  },

  // === MINERALS ===
  {
    id: 'magnesium',
    name: 'Magnesium',
    abbreviation: 'Mg',
    category: 'minerals',
    description: 'Involved in 300+ enzymatic reactions. Critical for muscles, nerves, and energy.',
    referenceRange: { low: 1.7, high: 2.2, borderlineLow: 1.5, criticalLow: 1.0, criticalHigh: 3.0, unit: 'mg/dL' },
    nutrientIds: ['min-magnesium'],
    lowMeaning: 'May cause muscle cramps, insomnia, anxiety, heart palpitations, migraines.',
    highMeaning: 'May cause low blood pressure, nausea, cardiac issues.',
    supplementRecommendations: { whenLow: ['Magnesium glycinate 200-400 mg (best absorbed)', 'Magnesium threonate (for brain)', 'Magnesium citrate (for constipation)'], whenHigh: ['Stop magnesium supplements', 'Check kidney function'] },
    dietaryTips: { whenLow: ['Dark chocolate, almonds', 'Spinach, avocado', 'Pumpkin seeds, black beans'], whenHigh: ['Reduce supplement intake'] },
  },
  {
    id: 'zinc',
    name: 'Zinc',
    abbreviation: 'Zn',
    category: 'minerals',
    description: 'Essential trace mineral for immune function, wound healing, and DNA synthesis.',
    referenceRange: { low: 60, high: 120, borderlineLow: 50, criticalLow: 30, unit: 'mcg/dL' },
    nutrientIds: ['min-zinc'],
    lowMeaning: 'May cause frequent infections, slow healing, hair loss, loss of taste/smell.',
    highMeaning: 'May cause copper deficiency, nausea, impaired immunity.',
    supplementRecommendations: { whenLow: ['Zinc picolinate 15-30 mg', 'Zinc carnosine (for gut health)', 'Always pair with copper if >30mg daily'], whenHigh: ['Reduce zinc supplementation', 'Check copper levels'] },
    dietaryTips: { whenLow: ['Oysters, beef, pumpkin seeds', 'Chickpeas, cashews'], whenHigh: ['Reduce zinc-rich food focus'] },
  },
  {
    id: 'selenium',
    name: 'Selenium',
    abbreviation: 'Se',
    category: 'minerals',
    description: 'Antioxidant mineral essential for thyroid function and immune defense.',
    referenceRange: { low: 70, high: 150, borderlineLow: 60, criticalLow: 40, unit: 'mcg/L' },
    nutrientIds: ['min-selenium'],
    lowMeaning: 'May cause thyroid dysfunction, weakened immunity, cognitive decline.',
    highMeaning: 'Selenosis — garlic breath, hair loss, nail changes, nausea.',
    supplementRecommendations: { whenLow: ['Selenium (selenomethionine) 100-200 mcg', 'Brazil nuts (2 per day)'], whenHigh: ['Stop selenium supplements', 'Reduce Brazil nut intake'] },
    dietaryTips: { whenLow: ['Brazil nuts (1-2 daily)', 'Tuna, sardines', 'Turkey, eggs'], whenHigh: ['Avoid Brazil nuts', 'Reduce selenium-rich foods'] },
  },
  {
    id: 'calcium',
    name: 'Calcium',
    abbreviation: 'Ca',
    category: 'minerals',
    description: 'Most abundant mineral in the body. Critical for bones, muscles, and nerves.',
    referenceRange: { low: 8.5, high: 10.5, borderlineLow: 8.0, criticalLow: 7.0, criticalHigh: 12.0, unit: 'mg/dL' },
    nutrientIds: ['min-calcium'],
    lowMeaning: 'May cause muscle cramps, numbness, osteoporosis, dental problems.',
    highMeaning: 'May indicate hyperparathyroidism, kidney stones, or cancer.',
    supplementRecommendations: { whenLow: ['Calcium citrate 500-600 mg (better absorbed)', 'Vitamin D3 (needed for calcium absorption)', 'Vitamin K2 (directs calcium to bones)'], whenHigh: ['Stop calcium supplements', 'Check parathyroid hormone'] },
    dietaryTips: { whenLow: ['Dairy products, sardines', 'Kale, broccoli', 'Fortified plant milks'], whenHigh: ['Reduce dairy intake', 'Stay well hydrated'] },
  },
  {
    id: 'potassium',
    name: 'Potassium',
    abbreviation: 'K',
    category: 'minerals',
    description: 'Critical electrolyte for heart rhythm, muscle contraction, and nerve function.',
    referenceRange: { low: 3.5, high: 5.0, borderlineLow: 3.0, criticalLow: 2.5, criticalHigh: 6.0, unit: 'mEq/L' },
    nutrientIds: ['min-potassium'],
    lowMeaning: 'May cause muscle weakness, cramps, heart palpitations, fatigue.',
    highMeaning: 'May cause dangerous heart rhythm changes. Medical emergency if very high.',
    supplementRecommendations: { whenLow: ['Potassium citrate (under medical supervision)', 'Electrolyte supplements'], whenHigh: ['Stop potassium supplements immediately', 'Seek medical attention if >6.0'] },
    dietaryTips: { whenLow: ['Bananas, sweet potatoes', 'Avocados, coconut water', 'Spinach, white beans'], whenHigh: ['Limit high-potassium foods', 'Avoid salt substitutes'] },
  },
  {
    id: 'sodium',
    name: 'Sodium',
    abbreviation: 'Na',
    category: 'minerals',
    description: 'Essential electrolyte for fluid balance, nerve transmission, and muscle function.',
    referenceRange: { low: 136, high: 145, borderlineLow: 133, criticalLow: 120, criticalHigh: 155, unit: 'mEq/L' },
    nutrientIds: ['min-sodium'],
    lowMeaning: 'Hyponatremia — headache, nausea, confusion, seizures.',
    highMeaning: 'Hypernatremia — thirst, confusion, muscle twitching.',
    supplementRecommendations: { whenLow: ['Electrolyte supplements with sodium', 'Increase salt intake moderately'], whenHigh: ['Reduce sodium intake', 'Increase water consumption'] },
    dietaryTips: { whenLow: ['Add moderate salt to food', 'Bone broth, olives'], whenHigh: ['Reduce processed foods', 'Limit added salt'] },
  },

  // === IRON PANEL ===
  {
    id: 'serum-iron',
    name: 'Serum Iron',
    abbreviation: 'Fe',
    category: 'iron_panel',
    description: 'Amount of iron circulating in the blood.',
    referenceRange: { low: 60, high: 170, borderlineLow: 50, criticalLow: 30, unit: 'mcg/dL' },
    nutrientIds: ['min-iron'],
    lowMeaning: 'Iron deficiency — fatigue, weakness, pale skin, shortness of breath.',
    highMeaning: 'Iron overload — may indicate hemochromatosis or liver disease.',
    supplementRecommendations: { whenLow: ['Iron bisglycinate 18-36 mg', 'Vitamin C 500mg with iron', 'Take on empty stomach for best absorption'], whenHigh: ['Do NOT supplement iron', 'Consider blood donation', 'Avoid vitamin C with meals'] },
    dietaryTips: { whenLow: ['Red meat, liver', 'Spinach with lemon', 'Lentils, fortified cereals'], whenHigh: ['Reduce red meat', 'Avoid iron-fortified foods', 'Drink tea with meals (inhibits absorption)'] },
  },
  {
    id: 'ferritin',
    name: 'Ferritin',
    abbreviation: 'Ferritin',
    category: 'iron_panel',
    description: 'Iron storage protein. Best indicator of total body iron stores.',
    referenceRange: { low: 20, high: 200, borderlineLow: 30, criticalLow: 10, criticalHigh: 500, unit: 'ng/mL' },
    nutrientIds: ['min-iron'],
    lowMeaning: 'Depleted iron stores — early sign of iron deficiency before anemia develops.',
    highMeaning: 'May indicate iron overload, inflammation, liver disease, or infection.',
    supplementRecommendations: { whenLow: ['Iron bisglycinate 25-50 mg daily', 'Vitamin C to enhance absorption', 'Lactoferrin (gentle iron alternative)'], whenHigh: ['Avoid iron supplements', 'Check for hemochromatosis'] },
    dietaryTips: { whenLow: ['Heme iron sources (meat, fish)', 'Pair non-heme iron with vitamin C', 'Avoid calcium with iron meals'], whenHigh: ['Limit red meat', 'Avoid cooking in cast iron'] },
  },
  {
    id: 'tibc',
    name: 'Total Iron Binding Capacity',
    abbreviation: 'TIBC',
    category: 'iron_panel',
    description: 'Measures the blood\'s capacity to bind iron with transferrin.',
    referenceRange: { low: 250, high: 370, borderlineHigh: 400, unit: 'mcg/dL' },
    nutrientIds: ['min-iron'],
    lowMeaning: 'May indicate iron overload, liver disease, or malnutrition.',
    highMeaning: 'Usually indicates iron deficiency — body is trying to absorb more iron.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Iron supplement (indicates deficiency)', 'Vitamin C for absorption'] },
    dietaryTips: { whenLow: ['Consult physician'], whenHigh: ['Increase iron-rich foods', 'Pair with vitamin C'] },
  },

  // === LIPID PANEL ===
  {
    id: 'total-cholesterol',
    name: 'Total Cholesterol',
    abbreviation: 'TC',
    category: 'lipids',
    description: 'Total amount of cholesterol in the blood.',
    referenceRange: { low: 125, high: 200, borderlineHigh: 240, criticalHigh: 300, unit: 'mg/dL' },
    nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha', 'vit-b3'],
    lowMeaning: 'Very low cholesterol may affect hormone production and brain function.',
    highMeaning: 'Increased risk of cardiovascular disease.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Omega-3 fish oil (EPA/DHA) 2-4g', 'Red yeast rice', 'Plant sterols', 'Berberine 500mg 2x daily'] },
    dietaryTips: { whenLow: ['Healthy fats (avocado, olive oil)'], whenHigh: ['Reduce saturated fats', 'Increase soluble fiber (oats, beans)', 'Eat fatty fish 2-3x/week'] },
  },
  {
    id: 'ldl',
    name: 'LDL Cholesterol',
    abbreviation: 'LDL',
    category: 'lipids',
    description: 'Low-density lipoprotein — "bad" cholesterol that can build up in arteries.',
    referenceRange: { low: 0, high: 100, borderlineHigh: 130, criticalHigh: 190, unit: 'mg/dL' },
    nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha'],
    lowMeaning: 'Generally not a concern. Very low may affect hormone production.',
    highMeaning: 'Increased risk of atherosclerosis and heart disease.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Omega-3 fish oil', 'Plant sterols 2g/day', 'Berberine', 'Psyllium fiber'] },
    dietaryTips: { whenLow: [], whenHigh: ['Mediterranean diet', 'Reduce trans fats and processed foods', 'Increase soluble fiber'] },
  },
  {
    id: 'hdl',
    name: 'HDL Cholesterol',
    abbreviation: 'HDL',
    category: 'lipids',
    description: 'High-density lipoprotein — "good" cholesterol that removes LDL from arteries.',
    referenceRange: { low: 40, high: 100, borderlineLow: 35, unit: 'mg/dL' },
    nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha', 'vit-b3'],
    lowMeaning: 'Increased cardiovascular risk. Associated with metabolic syndrome.',
    highMeaning: 'Generally protective. Very high (>100) may rarely indicate genetic condition.',
    supplementRecommendations: { whenLow: ['Omega-3 fish oil', 'Niacin (vitamin B3) — under medical supervision', 'CoQ10'], whenHigh: [] },
    dietaryTips: { whenLow: ['Olive oil, avocados', 'Fatty fish', 'Regular exercise', 'Moderate red wine (if appropriate)'], whenHigh: [] },
  },
  {
    id: 'triglycerides',
    name: 'Triglycerides',
    abbreviation: 'TG',
    category: 'lipids',
    description: 'Type of fat in the blood. High levels increase heart disease risk.',
    referenceRange: { low: 0, high: 150, borderlineHigh: 200, criticalHigh: 500, unit: 'mg/dL' },
    nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha'],
    lowMeaning: 'Generally not a concern.',
    highMeaning: 'Increased risk of heart disease and pancreatitis.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Omega-3 fish oil 2-4g (EPA/DHA)', 'Berberine', 'Chromium picolinate'] },
    dietaryTips: { whenLow: [], whenHigh: ['Reduce sugar and refined carbs', 'Limit alcohol', 'Increase omega-3 fatty fish', 'Regular exercise'] },
  },

  // === METABOLIC ===
  {
    id: 'glucose-fasting',
    name: 'Fasting Glucose',
    abbreviation: 'Glucose',
    category: 'metabolic',
    description: 'Blood sugar level after fasting. Key indicator of diabetes risk.',
    referenceRange: { low: 70, high: 99, borderlineHigh: 126, criticalLow: 50, criticalHigh: 200, unit: 'mg/dL' },
    nutrientIds: ['min-chromium', 'min-magnesium'],
    lowMeaning: 'Hypoglycemia — dizziness, shakiness, confusion, sweating.',
    highMeaning: 'Pre-diabetes (100-125) or diabetes (>126). Increased cardiovascular risk.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Chromium picolinate 200-1000 mcg', 'Magnesium glycinate 400 mg', 'Berberine 500 mg 2x daily', 'Alpha-lipoic acid 300-600 mg'] },
    dietaryTips: { whenLow: ['Regular balanced meals', 'Complex carbs with protein'], whenHigh: ['Reduce refined carbs and sugar', 'Increase fiber intake', 'Regular exercise', 'Cinnamon (may help)'] },
  },
  {
    id: 'hba1c',
    name: 'Hemoglobin A1c',
    abbreviation: 'HbA1c',
    category: 'metabolic',
    description: 'Average blood sugar over 2-3 months. Gold standard for diabetes monitoring.',
    referenceRange: { low: 4.0, high: 5.6, borderlineHigh: 6.4, criticalHigh: 9.0, unit: '%' },
    nutrientIds: ['min-chromium', 'min-magnesium'],
    lowMeaning: 'Generally not a concern unless very low.',
    highMeaning: 'Pre-diabetes (5.7-6.4%) or diabetes (>6.5%). Long-term glucose control issue.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Chromium picolinate', 'Berberine', 'Magnesium', 'Alpha-lipoic acid', 'Cinnamon extract'] },
    dietaryTips: { whenLow: [], whenHigh: ['Low glycemic diet', 'Increase fiber and protein', 'Regular physical activity', 'Stress management'] },
  },
  {
    id: 'creatinine',
    name: 'Creatinine',
    abbreviation: 'Cr',
    category: 'metabolic',
    description: 'Waste product from muscle metabolism. Indicator of kidney function.',
    referenceRange: { low: 0.6, high: 1.2, borderlineHigh: 1.5, criticalHigh: 4.0, unit: 'mg/dL' },
    nutrientIds: [],
    lowMeaning: 'May indicate low muscle mass or liver disease.',
    highMeaning: 'May indicate kidney dysfunction or dehydration.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Stay well hydrated', 'Avoid excessive protein', 'Consult nephrologist'] },
    dietaryTips: { whenLow: ['Adequate protein intake'], whenHigh: ['Moderate protein intake', 'Stay hydrated', 'Limit creatine supplements'] },
  },
  {
    id: 'alt',
    name: 'ALT (Alanine Aminotransferase)',
    abbreviation: 'ALT',
    category: 'metabolic',
    description: 'Liver enzyme. Elevated levels indicate liver cell damage.',
    referenceRange: { low: 7, high: 35, borderlineHigh: 56, criticalHigh: 200, unit: 'U/L' },
    nutrientIds: [],
    lowMeaning: 'Generally not a concern.',
    highMeaning: 'May indicate liver damage, fatty liver, hepatitis, or medication effects.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Milk thistle (silymarin) 200-400 mg', 'NAC (N-acetyl cysteine) 600 mg', 'Omega-3 fatty acids'] },
    dietaryTips: { whenLow: [], whenHigh: ['Reduce alcohol', 'Avoid processed foods', 'Increase cruciferous vegetables', 'Maintain healthy weight'] },
  },

  // === THYROID ===
  {
    id: 'tsh',
    name: 'Thyroid Stimulating Hormone',
    abbreviation: 'TSH',
    category: 'thyroid',
    description: 'Primary screening test for thyroid function. Controls thyroid hormone production.',
    referenceRange: { low: 0.4, high: 4.0, borderlineLow: 0.1, borderlineHigh: 5.0, criticalLow: 0.01, criticalHigh: 10.0, unit: 'mIU/L' },
    nutrientIds: ['min-iodine', 'min-selenium', 'min-zinc'],
    lowMeaning: 'May indicate hyperthyroidism — weight loss, anxiety, rapid heart rate.',
    highMeaning: 'May indicate hypothyroidism — fatigue, weight gain, cold intolerance.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Selenium 200 mcg (supports T4→T3 conversion)', 'Iodine 150-300 mcg (if deficient)', 'Zinc 15-30 mg', 'Vitamin D3 (thyroid support)', 'Ashwagandha (adaptogen)'] },
    dietaryTips: { whenLow: ['Avoid excess iodine', 'Limit caffeine'], whenHigh: ['Seaweed for iodine', 'Brazil nuts for selenium', 'Avoid goitrogens raw (broccoli, soy)'] },
  },
  {
    id: 'free-t4',
    name: 'Free T4 (Thyroxine)',
    abbreviation: 'FT4',
    category: 'thyroid',
    description: 'Active thyroid hormone available for use by the body.',
    referenceRange: { low: 0.8, high: 1.8, borderlineLow: 0.6, criticalLow: 0.3, criticalHigh: 3.0, unit: 'ng/dL' },
    nutrientIds: ['min-iodine', 'min-selenium'],
    lowMeaning: 'Hypothyroidism — insufficient thyroid hormone production.',
    highMeaning: 'Hyperthyroidism — excessive thyroid hormone.',
    supplementRecommendations: { whenLow: ['Iodine (if deficient)', 'Selenium', 'Tyrosine 500-1000 mg'], whenHigh: [] },
    dietaryTips: { whenLow: ['Iodine-rich foods', 'Selenium-rich foods'], whenHigh: ['Avoid excess iodine'] },
  },
  {
    id: 'free-t3',
    name: 'Free T3 (Triiodothyronine)',
    abbreviation: 'FT3',
    category: 'thyroid',
    description: 'Most active thyroid hormone. Converted from T4 in peripheral tissues.',
    referenceRange: { low: 2.3, high: 4.2, borderlineLow: 2.0, criticalLow: 1.5, unit: 'pg/mL' },
    nutrientIds: ['min-selenium', 'min-zinc', 'min-iron'],
    lowMeaning: 'Poor T4→T3 conversion. May cause fatigue despite normal TSH/T4.',
    highMeaning: 'May indicate hyperthyroidism or excess thyroid medication.',
    supplementRecommendations: { whenLow: ['Selenium 200 mcg (key for conversion)', 'Zinc 15-30 mg', 'Iron (if deficient)', 'Ashwagandha'], whenHigh: [] },
    dietaryTips: { whenLow: ['Brazil nuts, seafood', 'Zinc-rich foods', 'Adequate protein'], whenHigh: [] },
  },

  // === INFLAMMATION ===
  {
    id: 'crp',
    name: 'C-Reactive Protein (hs-CRP)',
    abbreviation: 'hs-CRP',
    category: 'inflammation',
    description: 'Marker of systemic inflammation. Predicts cardiovascular risk.',
    referenceRange: { low: 0, high: 1.0, borderlineHigh: 3.0, criticalHigh: 10.0, unit: 'mg/L' },
    nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha', 'vit-d'],
    lowMeaning: 'Low inflammation — optimal.',
    highMeaning: 'Elevated inflammation — increased cardiovascular risk, may indicate infection or autoimmune condition.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Omega-3 fish oil 2-4g EPA/DHA', 'Curcumin (turmeric) 500-1000 mg', 'Vitamin D3 2000-5000 IU', 'NAC 600 mg'] },
    dietaryTips: { whenLow: [], whenHigh: ['Anti-inflammatory diet (Mediterranean)', 'Fatty fish, berries, leafy greens', 'Avoid processed foods, sugar, seed oils', 'Regular exercise and stress management'] },
  },
  {
    id: 'homocysteine',
    name: 'Homocysteine',
    abbreviation: 'Hcy',
    category: 'inflammation',
    description: 'Amino acid linked to cardiovascular risk. Elevated by B-vitamin deficiency.',
    referenceRange: { low: 4, high: 10, borderlineHigh: 15, criticalHigh: 30, unit: 'umol/L' },
    nutrientIds: ['vit-b12', 'vit-b9', 'vit-b6'],
    lowMeaning: 'Generally optimal.',
    highMeaning: 'Increased cardiovascular risk. Usually indicates B12, folate, or B6 deficiency.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Methylcobalamin (B12) 1000-5000 mcg', 'Methylfolate (5-MTHF) 800-1000 mcg', 'P5P (active B6) 25-50 mg', 'TMG (trimethylglycine) 500-1000 mg'] },
    dietaryTips: { whenLow: [], whenHigh: ['B12-rich foods (meat, fish, dairy)', 'Folate-rich foods (leafy greens, legumes)', 'Reduce alcohol and coffee'] },
  },
  {
    id: 'esr',
    name: 'Erythrocyte Sedimentation Rate',
    abbreviation: 'ESR',
    category: 'inflammation',
    description: 'Non-specific marker of inflammation. Measures how fast red blood cells settle.',
    referenceRange: { low: 0, high: 20, borderlineHigh: 40, criticalHigh: 100, unit: 'mm/hr' },
    nutrientIds: [],
    lowMeaning: 'Generally normal.',
    highMeaning: 'Non-specific inflammation — infection, autoimmune disease, or cancer.',
    supplementRecommendations: { whenLow: [], whenHigh: ['Omega-3 fish oil', 'Curcumin', 'Vitamin D3', 'Consult physician for underlying cause'] },
    dietaryTips: { whenLow: [], whenHigh: ['Anti-inflammatory diet', 'Reduce processed foods and sugar'] },
  },
];

// Helper functions
export function getMarkersByCategory(category: MarkerCategory): BloodMarker[] {
  return bloodMarkers.filter(m => m.category === category);
}

export function getMarkerById(id: string): BloodMarker | undefined {
  return bloodMarkers.find(m => m.id === id);
}

export function evaluateMarkerValue(marker: BloodMarker, value: number): SeverityLevel {
  const range = marker.referenceRange;

  if (range.criticalLow !== undefined && value < range.criticalLow) return 'critical_low';
  if (range.criticalHigh !== undefined && value > range.criticalHigh) return 'critical_high';
  if (range.borderlineLow !== undefined && value < range.borderlineLow) return 'low';
  if (range.borderlineHigh !== undefined && value > range.borderlineHigh) return 'high';
  if (value < range.low) return 'borderline_low';
  if (value > range.high) return 'borderline_high';
  return 'normal';
}

export function getSeverityInfo(severity: SeverityLevel): { label: string; color: string; bgColor: string; borderColor: string; icon: 'check' | 'info' | 'warning' | 'critical' } {
  switch (severity) {
    case 'normal': return { label: 'Normal', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: 'check' };
    case 'borderline_low': return { label: 'Borderline Low', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: 'info' };
    case 'borderline_high': return { label: 'Borderline High', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: 'info' };
    case 'low': return { label: 'Low', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: 'warning' };
    case 'high': return { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: 'warning' };
    case 'critical_low': return { label: 'Critically Low', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: 'critical' };
    case 'critical_high': return { label: 'Critically High', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: 'critical' };
  }
}

export function getMarkerCategories(): MarkerCategory[] {
  return Object.keys(markerCategories) as MarkerCategory[];
}
