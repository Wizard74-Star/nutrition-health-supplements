export type NutrientCategory = 'vitamin' | 'mineral' | 'amino_acid' | 'fatty_acid';

export interface Nutrient {
  id: string;
  name: string;
  category: NutrientCategory;
  alternateNames?: string[];
  rda: string;
  unit: string;
  description: string;
  functions: string[];
  deficiencySymptoms: string[];
  foodSources: string[];
  molecularFormula?: string;
  solubility?: string;
  criticalFor: string[];
  excessRisk?: string;
  absorptionTips?: string;
}

export const vitamins: Nutrient[] = [
  {
    id: 'vit-a',
    name: 'Vitamin A',
    category: 'vitamin',
    alternateNames: ['Retinol', 'Beta-carotene'],
    rda: '900',
    unit: 'mcg RAE',
    description: 'A fat-soluble vitamin essential for vision, immune function, and cell growth. Exists as preformed retinol (animal sources) and provitamin A carotenoids (plant sources).',
    functions: ['Vision and eye health', 'Immune system regulation', 'Cell differentiation', 'Skin integrity', 'Reproductive health'],
    deficiencySymptoms: ['Night blindness', 'Dry eyes', 'Frequent infections', 'Dry, rough skin', 'Delayed growth in children'],
    foodSources: ['Liver', 'Sweet potatoes', 'Carrots', 'Spinach', 'Eggs', 'Cod liver oil'],
    molecularFormula: 'C₂₀H₃₀O',
    solubility: 'Fat-soluble',
    criticalFor: ['Vision', 'Immunity', 'Skin'],
    excessRisk: 'Liver toxicity, birth defects at very high doses',
    absorptionTips: 'Consume with dietary fat for optimal absorption'
  },
  {
    id: 'vit-b1',
    name: 'Vitamin B1',
    category: 'vitamin',
    alternateNames: ['Thiamine'],
    rda: '1.2',
    unit: 'mg',
    description: 'A water-soluble vitamin crucial for energy metabolism and nervous system function. Essential coenzyme in carbohydrate metabolism.',
    functions: ['Energy metabolism', 'Nervous system function', 'Carbohydrate metabolism', 'Muscle contraction', 'Heart function'],
    deficiencySymptoms: ['Fatigue', 'Irritability', 'Poor memory', 'Muscle weakness', 'Beriberi', 'Nerve damage'],
    foodSources: ['Whole grains', 'Pork', 'Legumes', 'Nuts', 'Seeds', 'Fortified cereals'],
    molecularFormula: 'C₁₂H₁₇N₄OS⁺',
    solubility: 'Water-soluble',
    criticalFor: ['Energy', 'Nervous System', 'Heart'],
    absorptionTips: 'Alcohol and raw fish can deplete thiamine levels'
  },
  {
    id: 'vit-b2',
    name: 'Vitamin B2',
    category: 'vitamin',
    alternateNames: ['Riboflavin'],
    rda: '1.3',
    unit: 'mg',
    description: 'Essential for energy production, cellular function, and metabolism of fats, drugs, and steroids.',
    functions: ['Energy production', 'Antioxidant activity', 'Iron metabolism', 'Skin and eye health', 'Red blood cell production'],
    deficiencySymptoms: ['Cracked lips', 'Sore throat', 'Swollen tongue', 'Skin rashes', 'Anemia', 'Light sensitivity'],
    foodSources: ['Dairy products', 'Eggs', 'Lean meats', 'Almonds', 'Mushrooms', 'Spinach'],
    molecularFormula: 'C₁₇H₂₀N₄O₆',
    solubility: 'Water-soluble',
    criticalFor: ['Energy', 'Skin', 'Eyes'],
    absorptionTips: 'Light-sensitive; store foods in opaque containers'
  },
  {
    id: 'vit-b3',
    name: 'Vitamin B3',
    category: 'vitamin',
    alternateNames: ['Niacin', 'Nicotinamide'],
    rda: '16',
    unit: 'mg NE',
    description: 'Vital for converting food to energy, DNA repair, and maintaining healthy skin and nervous system.',
    functions: ['Energy metabolism', 'DNA repair', 'Cell signaling', 'Cholesterol management', 'Skin health'],
    deficiencySymptoms: ['Pellagra', 'Dermatitis', 'Diarrhea', 'Dementia', 'Fatigue', 'Depression'],
    foodSources: ['Chicken', 'Tuna', 'Turkey', 'Peanuts', 'Mushrooms', 'Green peas'],
    molecularFormula: 'C₆H₅NO₂',
    solubility: 'Water-soluble',
    criticalFor: ['Energy', 'Brain', 'Skin'],
    excessRisk: 'Flushing, liver damage at very high doses'
  },
  {
    id: 'vit-b5',
    name: 'Vitamin B5',
    category: 'vitamin',
    alternateNames: ['Pantothenic Acid'],
    rda: '5',
    unit: 'mg',
    description: 'Essential component of coenzyme A, critical for fatty acid synthesis and energy metabolism.',
    functions: ['Coenzyme A synthesis', 'Fatty acid metabolism', 'Hormone production', 'Red blood cell production', 'Wound healing'],
    deficiencySymptoms: ['Fatigue', 'Insomnia', 'Numbness in extremities', 'Digestive issues', 'Headaches'],
    foodSources: ['Avocado', 'Chicken', 'Beef', 'Sunflower seeds', 'Mushrooms', 'Potatoes'],
    molecularFormula: 'C₉H₁₇NO₅',
    solubility: 'Water-soluble',
    criticalFor: ['Energy', 'Hormones', 'Healing']
  },
  {
    id: 'vit-b6',
    name: 'Vitamin B6',
    category: 'vitamin',
    alternateNames: ['Pyridoxine'],
    rda: '1.7',
    unit: 'mg',
    description: 'Involved in over 100 enzyme reactions, primarily in protein metabolism, neurotransmitter synthesis, and immune function.',
    functions: ['Protein metabolism', 'Neurotransmitter synthesis', 'Hemoglobin production', 'Immune function', 'Brain development'],
    deficiencySymptoms: ['Anemia', 'Skin rashes', 'Cracked lip corners', 'Weakened immunity', 'Confusion', 'Depression'],
    foodSources: ['Chickpeas', 'Salmon', 'Chicken breast', 'Potatoes', 'Bananas', 'Fortified cereals'],
    molecularFormula: 'C₈H₁₁NO₃',
    solubility: 'Water-soluble',
    criticalFor: ['Brain', 'Blood', 'Immunity'],
    excessRisk: 'Nerve damage at very high supplemental doses'
  },
  {
    id: 'vit-b7',
    name: 'Vitamin B7',
    category: 'vitamin',
    alternateNames: ['Biotin'],
    rda: '30',
    unit: 'mcg',
    description: 'Essential for metabolism of carbohydrates, fats, and amino acids. Known for supporting hair, skin, and nail health.',
    functions: ['Macronutrient metabolism', 'Gene regulation', 'Cell signaling', 'Hair and nail growth', 'Blood sugar regulation'],
    deficiencySymptoms: ['Hair loss', 'Brittle nails', 'Skin rash around eyes/nose', 'Fatigue', 'Tingling in extremities'],
    foodSources: ['Eggs', 'Almonds', 'Sweet potatoes', 'Spinach', 'Broccoli', 'Salmon'],
    molecularFormula: 'C₁₀H₁₆N₂O₃S',
    solubility: 'Water-soluble',
    criticalFor: ['Hair', 'Skin', 'Metabolism'],
    absorptionTips: 'Raw egg whites contain avidin which blocks biotin absorption'
  },
  {
    id: 'vit-b9',
    name: 'Vitamin B9',
    category: 'vitamin',
    alternateNames: ['Folate', 'Folic Acid'],
    rda: '400',
    unit: 'mcg DFE',
    description: 'Critical for DNA synthesis, cell division, and proper fetal development. One of the most important prenatal nutrients.',
    functions: ['DNA synthesis', 'Cell division', 'Red blood cell formation', 'Fetal neural tube development', 'Homocysteine metabolism'],
    deficiencySymptoms: ['Megaloblastic anemia', 'Fatigue', 'Mouth sores', 'Neural tube defects in pregnancy', 'Poor growth', 'Gray hair'],
    foodSources: ['Dark leafy greens', 'Legumes', 'Asparagus', 'Beets', 'Citrus fruits', 'Fortified grains'],
    molecularFormula: 'C₁₉H₁₉N₇O₆',
    solubility: 'Water-soluble',
    criticalFor: ['DNA', 'Pregnancy', 'Blood'],
    absorptionTips: 'Methylfolate form is better absorbed than folic acid for some individuals'
  },
  {
    id: 'vit-b12',
    name: 'Vitamin B12',
    category: 'vitamin',
    alternateNames: ['Cobalamin', 'Methylcobalamin'],
    rda: '2.4',
    unit: 'mcg',
    description: 'Essential for nerve function, DNA synthesis, and red blood cell formation. Only naturally found in animal products.',
    functions: ['Nerve function', 'DNA synthesis', 'Red blood cell formation', 'Brain health', 'Energy production'],
    deficiencySymptoms: ['Fatigue', 'Numbness/tingling', 'Memory problems', 'Megaloblastic anemia', 'Balance issues', 'Mood changes'],
    foodSources: ['Shellfish', 'Liver', 'Fish', 'Meat', 'Dairy', 'Fortified nutritional yeast'],
    molecularFormula: 'C₆₃H₈₈CoN₁₄O₁₄P',
    solubility: 'Water-soluble',
    criticalFor: ['Nerves', 'Brain', 'Blood'],
    absorptionTips: 'Requires intrinsic factor for absorption; sublingual forms bypass this'
  },
  {
    id: 'vit-c',
    name: 'Vitamin C',
    category: 'vitamin',
    alternateNames: ['Ascorbic Acid'],
    rda: '90',
    unit: 'mg',
    description: 'Powerful antioxidant essential for collagen synthesis, immune defense, and iron absorption. Cannot be synthesized by humans.',
    functions: ['Collagen synthesis', 'Antioxidant protection', 'Immune defense', 'Iron absorption', 'Wound healing', 'Neurotransmitter synthesis'],
    deficiencySymptoms: ['Scurvy', 'Bleeding gums', 'Slow wound healing', 'Frequent infections', 'Fatigue', 'Joint pain'],
    foodSources: ['Citrus fruits', 'Bell peppers', 'Strawberries', 'Broccoli', 'Kiwi', 'Tomatoes'],
    molecularFormula: 'C₆H₈O₆',
    solubility: 'Water-soluble',
    criticalFor: ['Immunity', 'Collagen', 'Antioxidant'],
    absorptionTips: 'Divided doses throughout the day improve absorption'
  },
  {
    id: 'vit-d',
    name: 'Vitamin D',
    category: 'vitamin',
    alternateNames: ['Cholecalciferol', 'D3', 'Calciferol'],
    rda: '600',
    unit: 'IU',
    description: 'The "sunshine vitamin" — a hormone precursor critical for calcium absorption, bone health, and immune regulation. Widespread deficiency globally.',
    functions: ['Calcium absorption', 'Bone mineralization', 'Immune modulation', 'Muscle function', 'Mood regulation', 'Cell growth regulation'],
    deficiencySymptoms: ['Bone pain', 'Muscle weakness', 'Fatigue', 'Depression', 'Frequent illness', 'Hair loss', 'Rickets in children'],
    foodSources: ['Fatty fish', 'Cod liver oil', 'Egg yolks', 'Fortified milk', 'Mushrooms (UV-exposed)', 'Sunlight exposure'],
    molecularFormula: 'C₂₇H₄₄O',
    solubility: 'Fat-soluble',
    criticalFor: ['Bones', 'Immunity', 'Mood'],
    excessRisk: 'Hypercalcemia at very high doses',
    absorptionTips: 'Take with a fat-containing meal; D3 form preferred over D2'
  },
  {
    id: 'vit-e',
    name: 'Vitamin E',
    category: 'vitamin',
    alternateNames: ['Alpha-tocopherol'],
    rda: '15',
    unit: 'mg',
    description: 'Fat-soluble antioxidant that protects cell membranes from oxidative damage. Important for skin, eyes, and immune function.',
    functions: ['Antioxidant protection', 'Cell membrane integrity', 'Immune function', 'Skin health', 'Anti-inflammatory', 'Blood vessel dilation'],
    deficiencySymptoms: ['Nerve damage', 'Muscle weakness', 'Vision problems', 'Weakened immunity', 'Poor coordination'],
    foodSources: ['Sunflower seeds', 'Almonds', 'Spinach', 'Avocado', 'Olive oil', 'Wheat germ'],
    molecularFormula: 'C₂₉H₅₀O₂',
    solubility: 'Fat-soluble',
    criticalFor: ['Antioxidant', 'Skin', 'Immunity'],
    excessRisk: 'May increase bleeding risk at high doses',
    absorptionTips: 'Natural d-alpha-tocopherol is more bioavailable than synthetic dl-alpha'
  },
  {
    id: 'vit-k',
    name: 'Vitamin K',
    category: 'vitamin',
    alternateNames: ['Phylloquinone (K1)', 'Menaquinone (K2)'],
    rda: '120',
    unit: 'mcg',
    description: 'Essential for blood clotting and bone metabolism. K1 from plants, K2 from fermented foods and animal products.',
    functions: ['Blood clotting', 'Bone metabolism', 'Calcium regulation', 'Heart health', 'Wound healing'],
    deficiencySymptoms: ['Easy bruising', 'Excessive bleeding', 'Heavy periods', 'Blood in urine/stool', 'Weak bones'],
    foodSources: ['Kale', 'Spinach', 'Broccoli', 'Brussels sprouts', 'Natto', 'Fermented cheese'],
    molecularFormula: 'C₃₁H₄₆O₂',
    solubility: 'Fat-soluble',
    criticalFor: ['Blood Clotting', 'Bones', 'Heart'],
    absorptionTips: 'K2 (MK-7) has longer half-life and better bioavailability than K1'
  }
];

export const minerals: Nutrient[] = [
  {
    id: 'min-calcium',
    name: 'Calcium',
    category: 'mineral',
    rda: '1000',
    unit: 'mg',
    description: 'The most abundant mineral in the body. Critical for bone structure, muscle contraction, nerve signaling, and blood clotting.',
    functions: ['Bone and teeth structure', 'Muscle contraction', 'Nerve signaling', 'Blood clotting', 'Hormone secretion'],
    deficiencySymptoms: ['Osteoporosis', 'Muscle cramps', 'Numbness/tingling', 'Brittle nails', 'Tooth decay', 'Fatigue'],
    foodSources: ['Dairy products', 'Sardines', 'Kale', 'Broccoli', 'Fortified plant milks', 'Tofu'],
    criticalFor: ['Bones', 'Muscles', 'Nerves'],
    excessRisk: 'Kidney stones, cardiovascular concerns at very high doses',
    absorptionTips: 'Requires vitamin D for absorption; split doses of 500mg or less'
  },
  {
    id: 'min-iron',
    name: 'Iron',
    category: 'mineral',
    rda: '18',
    unit: 'mg',
    description: 'Essential for oxygen transport in blood and energy metabolism. One of the most common deficiencies worldwide.',
    functions: ['Oxygen transport (hemoglobin)', 'Energy metabolism', 'DNA synthesis', 'Immune function', 'Cognitive development'],
    deficiencySymptoms: ['Anemia', 'Extreme fatigue', 'Pale skin', 'Shortness of breath', 'Cold hands/feet', 'Brittle nails', 'Restless legs'],
    foodSources: ['Red meat', 'Liver', 'Spinach', 'Lentils', 'Oysters', 'Dark chocolate'],
    criticalFor: ['Blood', 'Energy', 'Brain'],
    excessRisk: 'Iron overload (hemochromatosis), organ damage',
    absorptionTips: 'Vitamin C dramatically increases absorption; avoid with calcium and tea'
  },
  {
    id: 'min-magnesium',
    name: 'Magnesium',
    category: 'mineral',
    rda: '420',
    unit: 'mg',
    description: 'Involved in 300+ enzymatic reactions. Critical for energy production, muscle/nerve function, and blood sugar control. Widely deficient.',
    functions: ['Energy production', 'Muscle and nerve function', 'Blood sugar regulation', 'Blood pressure regulation', 'Protein synthesis', 'Sleep quality'],
    deficiencySymptoms: ['Muscle cramps', 'Insomnia', 'Anxiety', 'Fatigue', 'Migraines', 'Heart palpitations', 'Restless legs'],
    foodSources: ['Dark chocolate', 'Avocados', 'Almonds', 'Spinach', 'Pumpkin seeds', 'Black beans'],
    criticalFor: ['Muscles', 'Sleep', 'Energy'],
    absorptionTips: 'Glycinate and threonate forms are best absorbed; take in evening for sleep'
  },
  {
    id: 'min-zinc',
    name: 'Zinc',
    category: 'mineral',
    rda: '11',
    unit: 'mg',
    description: 'Essential trace mineral for immune function, wound healing, DNA synthesis, and taste/smell perception.',
    functions: ['Immune defense', 'Wound healing', 'DNA synthesis', 'Taste and smell', 'Protein synthesis', 'Cell division'],
    deficiencySymptoms: ['Frequent infections', 'Slow wound healing', 'Loss of taste/smell', 'Hair loss', 'Diarrhea', 'Skin lesions'],
    foodSources: ['Oysters', 'Beef', 'Pumpkin seeds', 'Chickpeas', 'Cashews', 'Crab'],
    criticalFor: ['Immunity', 'Healing', 'Growth'],
    excessRisk: 'Copper deficiency at chronic high doses',
    absorptionTips: 'Zinc picolinate is well-absorbed; take with food to avoid nausea'
  },
  {
    id: 'min-selenium',
    name: 'Selenium',
    category: 'mineral',
    rda: '55',
    unit: 'mcg',
    description: 'Powerful antioxidant mineral essential for thyroid function, DNA synthesis, and protection from oxidative damage.',
    functions: ['Thyroid hormone metabolism', 'Antioxidant defense', 'DNA synthesis', 'Immune function', 'Reproductive health'],
    deficiencySymptoms: ['Thyroid dysfunction', 'Weakened immunity', 'Fatigue', 'Mental fog', 'Muscle weakness', 'Hair loss'],
    foodSources: ['Brazil nuts', 'Tuna', 'Sardines', 'Turkey', 'Eggs', 'Sunflower seeds'],
    criticalFor: ['Thyroid', 'Antioxidant', 'Immunity'],
    excessRisk: 'Selenosis (garlic breath, nail loss, nausea)',
    absorptionTips: 'Just 2 Brazil nuts daily provides adequate selenium'
  },
  {
    id: 'min-potassium',
    name: 'Potassium',
    category: 'mineral',
    rda: '2600',
    unit: 'mg',
    description: 'Critical electrolyte for heart rhythm, muscle contraction, nerve function, and fluid balance.',
    functions: ['Heart rhythm regulation', 'Muscle contraction', 'Nerve impulses', 'Fluid balance', 'Blood pressure regulation'],
    deficiencySymptoms: ['Muscle weakness', 'Cramps', 'Heart palpitations', 'Fatigue', 'Constipation', 'Numbness'],
    foodSources: ['Bananas', 'Sweet potatoes', 'Spinach', 'Avocados', 'Coconut water', 'White beans'],
    criticalFor: ['Heart', 'Muscles', 'Electrolyte'],
    excessRisk: 'Hyperkalemia — dangerous heart rhythm changes'
  },
  {
    id: 'min-sodium',
    name: 'Sodium',
    category: 'mineral',
    rda: '1500',
    unit: 'mg',
    description: 'Essential electrolyte for fluid balance, nerve function, and muscle contraction. Most people consume excess.',
    functions: ['Fluid balance', 'Nerve transmission', 'Muscle contraction', 'Nutrient absorption', 'Blood pressure regulation'],
    deficiencySymptoms: ['Hyponatremia', 'Headache', 'Nausea', 'Confusion', 'Muscle cramps', 'Fatigue'],
    foodSources: ['Table salt', 'Seaweed', 'Celery', 'Beets', 'Olives', 'Processed foods'],
    criticalFor: ['Fluid Balance', 'Nerves', 'Muscles'],
    excessRisk: 'Hypertension, cardiovascular disease, kidney damage'
  },
  {
    id: 'min-phosphorus',
    name: 'Phosphorus',
    category: 'mineral',
    rda: '700',
    unit: 'mg',
    description: 'Second most abundant mineral in the body. Essential for bone formation, energy production (ATP), and DNA/RNA structure.',
    functions: ['Bone and teeth formation', 'Energy production (ATP)', 'DNA/RNA structure', 'Cell membrane integrity', 'pH balance'],
    deficiencySymptoms: ['Bone pain', 'Weakness', 'Loss of appetite', 'Numbness', 'Anxiety', 'Irregular breathing'],
    foodSources: ['Dairy', 'Meat', 'Fish', 'Poultry', 'Lentils', 'Nuts'],
    criticalFor: ['Bones', 'Energy', 'DNA']
  },
  {
    id: 'min-copper',
    name: 'Copper',
    category: 'mineral',
    rda: '900',
    unit: 'mcg',
    description: 'Trace mineral essential for iron metabolism, connective tissue formation, and nervous system function.',
    functions: ['Iron metabolism', 'Connective tissue formation', 'Energy production', 'Nervous system', 'Antioxidant defense'],
    deficiencySymptoms: ['Anemia', 'Bone abnormalities', 'Low white blood cells', 'Fatigue', 'Pale skin', 'Frequent illness'],
    foodSources: ['Liver', 'Oysters', 'Dark chocolate', 'Cashews', 'Sunflower seeds', 'Shiitake mushrooms'],
    criticalFor: ['Blood', 'Connective Tissue', 'Nerves'],
    absorptionTips: 'High zinc intake can impair copper absorption'
  },
  {
    id: 'min-manganese',
    name: 'Manganese',
    category: 'mineral',
    rda: '2.3',
    unit: 'mg',
    description: 'Trace mineral involved in bone formation, blood clotting, and metabolism of amino acids, cholesterol, and carbohydrates.',
    functions: ['Bone formation', 'Blood clotting', 'Metabolism', 'Antioxidant defense (SOD)', 'Wound healing'],
    deficiencySymptoms: ['Weak bones', 'Poor growth', 'Skin rash', 'Impaired glucose tolerance', 'Altered mood'],
    foodSources: ['Mussels', 'Hazelnuts', 'Brown rice', 'Chickpeas', 'Spinach', 'Pineapple'],
    criticalFor: ['Bones', 'Metabolism', 'Antioxidant']
  },
  {
    id: 'min-chromium',
    name: 'Chromium',
    category: 'mineral',
    rda: '35',
    unit: 'mcg',
    description: 'Trace mineral that enhances insulin action and is involved in macronutrient metabolism.',
    functions: ['Insulin sensitivity', 'Blood sugar regulation', 'Macronutrient metabolism', 'Lipid metabolism'],
    deficiencySymptoms: ['Impaired glucose tolerance', 'Weight gain', 'Fatigue', 'Anxiety', 'Poor concentration'],
    foodSources: ['Broccoli', 'Grape juice', 'Turkey', 'Green beans', 'Potatoes', 'Whole grains'],
    criticalFor: ['Blood Sugar', 'Metabolism', 'Insulin']
  },
  {
    id: 'min-iodine',
    name: 'Iodine',
    category: 'mineral',
    rda: '150',
    unit: 'mcg',
    description: 'Essential for thyroid hormone production, which regulates metabolism, growth, and development.',
    functions: ['Thyroid hormone synthesis', 'Metabolic regulation', 'Brain development', 'Growth', 'Reproductive function'],
    deficiencySymptoms: ['Goiter', 'Hypothyroidism', 'Fatigue', 'Weight gain', 'Cognitive impairment', 'Cold intolerance'],
    foodSources: ['Seaweed', 'Iodized salt', 'Cod', 'Dairy', 'Shrimp', 'Eggs'],
    criticalFor: ['Thyroid', 'Metabolism', 'Brain'],
    excessRisk: 'Thyroid dysfunction at very high doses'
  },
  {
    id: 'min-molybdenum',
    name: 'Molybdenum',
    category: 'mineral',
    rda: '45',
    unit: 'mcg',
    description: 'Trace mineral that activates enzymes involved in breaking down harmful sulfites and preventing toxin buildup.',
    functions: ['Enzyme activation', 'Sulfite detoxification', 'Uric acid production', 'Drug metabolism'],
    deficiencySymptoms: ['Rapid heart rate', 'Rapid breathing', 'Headaches', 'Night blindness', 'Nausea'],
    foodSources: ['Legumes', 'Grains', 'Nuts', 'Dairy', 'Leafy greens', 'Liver'],
    criticalFor: ['Detoxification', 'Enzymes', 'Metabolism']
  },
  {
    id: 'min-fluoride',
    name: 'Fluoride',
    category: 'mineral',
    rda: '4',
    unit: 'mg',
    description: 'Mineral that strengthens tooth enamel and supports bone density.',
    functions: ['Tooth enamel strengthening', 'Cavity prevention', 'Bone density support'],
    deficiencySymptoms: ['Dental cavities', 'Weak tooth enamel', 'Increased bone fracture risk'],
    foodSources: ['Fluoridated water', 'Tea', 'Canned fish with bones', 'Raisins', 'Potatoes'],
    criticalFor: ['Teeth', 'Bones', 'Dental Health']
  },
  {
    id: 'min-chloride',
    name: 'Chloride',
    category: 'mineral',
    rda: '2300',
    unit: 'mg',
    description: 'Essential electrolyte that maintains fluid balance, blood volume, and stomach acid production.',
    functions: ['Fluid balance', 'Stomach acid (HCl) production', 'Nerve impulse transmission', 'Blood pH balance'],
    deficiencySymptoms: ['Alkalosis', 'Muscle cramps', 'Weakness', 'Loss of appetite', 'Dehydration'],
    foodSources: ['Table salt', 'Seaweed', 'Tomatoes', 'Lettuce', 'Celery', 'Olives'],
    criticalFor: ['Digestion', 'Fluid Balance', 'pH']
  },
  {
    id: 'min-boron',
    name: 'Boron',
    category: 'mineral',
    rda: '1-3',
    unit: 'mg',
    description: 'Trace mineral important for bone health, brain function, and hormone metabolism. Not yet classified as essential but highly beneficial.',
    functions: ['Bone health', 'Hormone metabolism', 'Brain function', 'Wound healing', 'Vitamin D metabolism'],
    deficiencySymptoms: ['Poor bone health', 'Impaired cognitive function', 'Hormonal imbalances', 'Arthritis symptoms'],
    foodSources: ['Avocados', 'Prunes', 'Raisins', 'Almonds', 'Apples', 'Grapes'],
    criticalFor: ['Bones', 'Hormones', 'Brain']
  }
];

export const aminoAcids: Nutrient[] = [
  {
    id: 'aa-leucine',
    name: 'Leucine',
    category: 'amino_acid',
    rda: '42',
    unit: 'mg/kg/day',
    description: 'The most potent branched-chain amino acid (BCAA) for stimulating muscle protein synthesis. Key trigger for mTOR pathway activation.',
    functions: ['Muscle protein synthesis', 'mTOR pathway activation', 'Blood sugar regulation', 'Wound healing', 'Growth hormone production'],
    deficiencySymptoms: ['Muscle wasting', 'Fatigue', 'Poor wound healing', 'Skin rashes', 'Hair loss'],
    foodSources: ['Chicken breast', 'Beef', 'Tuna', 'Soybeans', 'Eggs', 'Whey protein'],
    criticalFor: ['Muscle Growth', 'Recovery', 'Metabolism'],
    absorptionTips: 'Most effective when consumed post-exercise with other BCAAs'
  },
  {
    id: 'aa-isoleucine',
    name: 'Isoleucine',
    category: 'amino_acid',
    rda: '19',
    unit: 'mg/kg/day',
    description: 'BCAA involved in muscle metabolism, immune function, and energy regulation. Concentrated in muscle tissue.',
    functions: ['Muscle metabolism', 'Immune function', 'Hemoglobin synthesis', 'Energy regulation', 'Blood sugar control'],
    deficiencySymptoms: ['Muscle wasting', 'Fatigue', 'Dizziness', 'Depression', 'Confusion', 'Irritability'],
    foodSources: ['Eggs', 'Soy protein', 'Seaweed', 'Turkey', 'Lamb', 'Cheese'],
    criticalFor: ['Muscles', 'Energy', 'Immunity']
  },
  {
    id: 'aa-valine',
    name: 'Valine',
    category: 'amino_acid',
    rda: '24',
    unit: 'mg/kg/day',
    description: 'Third BCAA essential for muscle growth, tissue repair, and energy production during exercise.',
    functions: ['Muscle growth', 'Tissue repair', 'Energy production', 'Nervous system function', 'Cognitive function'],
    deficiencySymptoms: ['Insomnia', 'Reduced mental function', 'Muscle loss', 'Poor coordination'],
    foodSources: ['Dairy', 'Meat', 'Mushrooms', 'Peanuts', 'Soy', 'Whole grains'],
    criticalFor: ['Muscles', 'Energy', 'Brain']
  },
  {
    id: 'aa-lysine',
    name: 'Lysine',
    category: 'amino_acid',
    rda: '38',
    unit: 'mg/kg/day',
    description: 'Essential for collagen synthesis, calcium absorption, and immune function. Important for cold sore prevention.',
    functions: ['Collagen synthesis', 'Calcium absorption', 'Immune function', 'Carnitine production', 'Hormone production'],
    deficiencySymptoms: ['Fatigue', 'Nausea', 'Dizziness', 'Slow growth', 'Anemia', 'Frequent cold sores'],
    foodSources: ['Red meat', 'Poultry', 'Parmesan cheese', 'Sardines', 'Eggs', 'Soybeans'],
    criticalFor: ['Collagen', 'Immunity', 'Growth']
  },
  {
    id: 'aa-methionine',
    name: 'Methionine',
    category: 'amino_acid',
    rda: '19',
    unit: 'mg/kg/day',
    description: 'Sulfur-containing amino acid critical for methylation, detoxification, and antioxidant production (glutathione precursor).',
    functions: ['Methylation', 'Glutathione production', 'Detoxification', 'Tissue growth', 'Selenium absorption'],
    deficiencySymptoms: ['Liver damage', 'Muscle weakness', 'Slow growth', 'Skin lesions', 'Edema', 'Lethargy'],
    foodSources: ['Brazil nuts', 'Eggs', 'Fish', 'Sesame seeds', 'Meat', 'Dairy'],
    criticalFor: ['Detox', 'Antioxidant', 'Methylation']
  },
  {
    id: 'aa-phenylalanine',
    name: 'Phenylalanine',
    category: 'amino_acid',
    rda: '33',
    unit: 'mg/kg/day',
    description: 'Precursor to tyrosine, dopamine, epinephrine, and norepinephrine. Critical for neurotransmitter production.',
    functions: ['Neurotransmitter precursor', 'Dopamine production', 'Pain modulation', 'Skin pigmentation', 'Mood regulation'],
    deficiencySymptoms: ['Confusion', 'Depression', 'Memory problems', 'Low energy', 'Decreased alertness', 'Reduced appetite'],
    foodSources: ['Soybeans', 'Cheese', 'Nuts', 'Seeds', 'Beef', 'Poultry'],
    criticalFor: ['Brain', 'Mood', 'Neurotransmitters']
  },
  {
    id: 'aa-threonine',
    name: 'Threonine',
    category: 'amino_acid',
    rda: '20',
    unit: 'mg/kg/day',
    description: 'Important for collagen, elastin, and tooth enamel. Supports immune function and gut health.',
    functions: ['Collagen and elastin production', 'Immune function', 'Gut barrier integrity', 'Fat metabolism', 'Tooth enamel'],
    deficiencySymptoms: ['Digestive issues', 'Fatty liver', 'Emotional agitation', 'Confusion', 'Poor immunity'],
    foodSources: ['Lean meat', 'Cottage cheese', 'Lentils', 'Sesame seeds', 'Fish', 'Wheat germ'],
    criticalFor: ['Gut Health', 'Collagen', 'Immunity']
  },
  {
    id: 'aa-tryptophan',
    name: 'Tryptophan',
    category: 'amino_acid',
    rda: '5',
    unit: 'mg/kg/day',
    description: 'Precursor to serotonin and melatonin. Essential for mood regulation, sleep quality, and appetite control.',
    functions: ['Serotonin production', 'Melatonin synthesis', 'Mood regulation', 'Sleep quality', 'Appetite control', 'Niacin synthesis'],
    deficiencySymptoms: ['Depression', 'Anxiety', 'Insomnia', 'Irritability', 'Poor concentration', 'Carbohydrate cravings'],
    foodSources: ['Turkey', 'Chicken', 'Oats', 'Cheese', 'Nuts', 'Seeds', 'Chocolate'],
    criticalFor: ['Sleep', 'Mood', 'Serotonin']
  },
  {
    id: 'aa-histidine',
    name: 'Histidine',
    category: 'amino_acid',
    rda: '14',
    unit: 'mg/kg/day',
    description: 'Precursor to histamine. Essential for immune response, digestion, sexual function, and protection of nerve cells.',
    functions: ['Histamine production', 'Immune response', 'Digestion (stomach acid)', 'Myelin sheath protection', 'Blood cell production'],
    deficiencySymptoms: ['Anemia', 'Hearing loss', 'Skin inflammation', 'Poor growth in children', 'Joint pain'],
    foodSources: ['Meat', 'Fish', 'Poultry', 'Dairy', 'Rice', 'Wheat', 'Buckwheat'],
    criticalFor: ['Immunity', 'Digestion', 'Nerves']
  }
];

export const fattyAcids: Nutrient[] = [
  {
    id: 'fa-omega3-epa',
    name: 'EPA (Omega-3)',
    category: 'fatty_acid',
    alternateNames: ['Eicosapentaenoic Acid'],
    rda: '250-500',
    unit: 'mg',
    description: 'Long-chain omega-3 fatty acid with powerful anti-inflammatory properties. Critical for cardiovascular and mental health.',
    functions: ['Anti-inflammatory', 'Cardiovascular protection', 'Mental health support', 'Blood triglyceride reduction', 'Joint health'],
    deficiencySymptoms: ['Chronic inflammation', 'Depression', 'Joint pain', 'Dry skin', 'Poor concentration', 'Heart disease risk'],
    foodSources: ['Salmon', 'Mackerel', 'Sardines', 'Herring', 'Anchovies', 'Algae oil'],
    molecularFormula: 'C₂₀H₃₀O₂',
    criticalFor: ['Heart', 'Brain', 'Inflammation'],
    absorptionTips: 'Triglyceride form is better absorbed than ethyl ester form'
  },
  {
    id: 'fa-omega3-dha',
    name: 'DHA (Omega-3)',
    category: 'fatty_acid',
    alternateNames: ['Docosahexaenoic Acid'],
    rda: '250-500',
    unit: 'mg',
    description: 'Primary structural fat in the brain and retina. Essential for brain development, cognitive function, and vision.',
    functions: ['Brain structure and function', 'Retinal health', 'Fetal brain development', 'Cognitive performance', 'Neuroprotection'],
    deficiencySymptoms: ['Cognitive decline', 'Poor memory', 'Vision problems', 'Depression', 'ADHD symptoms', 'Dry eyes'],
    foodSources: ['Fatty fish', 'Fish oil', 'Algae oil', 'Oysters', 'Caviar', 'Fortified eggs'],
    molecularFormula: 'C₂₂H₃₂O₂',
    criticalFor: ['Brain', 'Vision', 'Development'],
    absorptionTips: 'Take with a fatty meal; phospholipid form (krill oil) may be superior'
  },
  {
    id: 'fa-omega3-ala',
    name: 'ALA (Omega-3)',
    category: 'fatty_acid',
    alternateNames: ['Alpha-linolenic Acid'],
    rda: '1.6',
    unit: 'g',
    description: 'Plant-based omega-3 that can be partially converted to EPA and DHA. Essential fatty acid that must come from diet.',
    functions: ['EPA/DHA precursor', 'Anti-inflammatory', 'Heart health', 'Brain function', 'Skin health'],
    deficiencySymptoms: ['Dry, scaly skin', 'Poor wound healing', 'Growth retardation', 'Cognitive issues', 'Joint stiffness'],
    foodSources: ['Flaxseeds', 'Chia seeds', 'Walnuts', 'Hemp seeds', 'Canola oil', 'Soybeans'],
    molecularFormula: 'C₁₈H₃₀O₂',
    criticalFor: ['Heart', 'Skin', 'Inflammation'],
    absorptionTips: 'Conversion to EPA/DHA is only 5-15%; direct sources preferred'
  },
  {
    id: 'fa-omega6-la',
    name: 'LA (Omega-6)',
    category: 'fatty_acid',
    alternateNames: ['Linoleic Acid'],
    rda: '17',
    unit: 'g',
    description: 'Essential omega-6 fatty acid important for skin barrier function and cell membrane structure. Balance with omega-3 is critical.',
    functions: ['Skin barrier function', 'Cell membrane structure', 'Inflammatory response', 'Growth and development', 'Brain function'],
    deficiencySymptoms: ['Dry, scaly skin', 'Hair loss', 'Poor wound healing', 'Growth retardation', 'Susceptibility to infection'],
    foodSources: ['Sunflower oil', 'Corn oil', 'Soybean oil', 'Nuts', 'Seeds', 'Poultry'],
    molecularFormula: 'C₁₈H₃₂O₂',
    criticalFor: ['Skin', 'Cell Membranes', 'Growth'],
    absorptionTips: 'Most Western diets have excess omega-6; focus on omega-3 balance'
  },
  {
    id: 'fa-omega6-gla',
    name: 'GLA (Omega-6)',
    category: 'fatty_acid',
    alternateNames: ['Gamma-linolenic Acid'],
    rda: '240-300',
    unit: 'mg',
    description: 'Anti-inflammatory omega-6 fatty acid. Unlike most omega-6s, GLA has anti-inflammatory properties.',
    functions: ['Anti-inflammatory', 'Skin health', 'Hormone balance', 'Nerve function', 'PMS relief'],
    deficiencySymptoms: ['Skin disorders (eczema)', 'PMS symptoms', 'Dry eyes', 'Brittle nails', 'Joint inflammation'],
    foodSources: ['Evening primrose oil', 'Borage oil', 'Black currant oil', 'Hemp seeds', 'Spirulina'],
    molecularFormula: 'C₁₈H₃₀O₂',
    criticalFor: ['Skin', 'Hormones', 'Inflammation']
  },
  {
    id: 'fa-omega9',
    name: 'Oleic Acid (Omega-9)',
    category: 'fatty_acid',
    alternateNames: ['Omega-9'],
    rda: 'No established RDA',
    unit: '',
    description: 'Monounsaturated fatty acid that supports heart health and reduces inflammation. Not essential but highly beneficial.',
    functions: ['Heart health', 'Inflammation reduction', 'Insulin sensitivity', 'Immune function', 'Brain health'],
    deficiencySymptoms: ['Dry skin', 'Joint stiffness', 'Poor memory', 'Fatigue', 'Increased inflammation'],
    foodSources: ['Olive oil', 'Avocados', 'Almonds', 'Macadamia nuts', 'Pecans', 'Cashews'],
    molecularFormula: 'C₁₈H₃₄O₂',
    criticalFor: ['Heart', 'Brain', 'Inflammation']
  }
];

export const allNutrients: Nutrient[] = [...vitamins, ...minerals, ...aminoAcids, ...fattyAcids];

export const categoryInfo: Record<NutrientCategory, { label: string; color: string; bgColor: string; borderColor: string; iconBg: string; description: string; count: number }> = {
  vitamin: {
    label: 'Vitamins',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconBg: 'bg-amber-100',
    description: 'Organic compounds essential for metabolic processes',
    count: vitamins.length
  },
  mineral: {
    label: 'Minerals',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    iconBg: 'bg-teal-100',
    description: 'Inorganic elements vital for body structure and function',
    count: minerals.length
  },
  amino_acid: {
    label: 'Amino Acids',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    iconBg: 'bg-rose-100',
    description: 'Building blocks of proteins and neurotransmitters',
    count: aminoAcids.length
  },
  fatty_acid: {
    label: 'Fatty Acids',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    description: 'Essential fats for brain, heart, and cellular health',
    count: fattyAcids.length
  }
};
