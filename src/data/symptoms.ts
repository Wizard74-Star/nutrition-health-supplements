export interface SymptomQuestion {
  id: string;
  category: string;
  question: string;
  linkedNutrients: string[]; // nutrient IDs
  severity: 'high' | 'medium' | 'low';
}

export interface AssessmentCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  questions: SymptomQuestion[];
}

export const assessmentCategories: AssessmentCategory[] = [
  {
    id: 'energy',
    name: 'Energy & Vitality',
    icon: 'Zap',
    description: 'How your body produces and manages energy throughout the day',
    questions: [
      { id: 'e1', category: 'energy', question: 'Do you feel chronically fatigued even after adequate sleep?', linkedNutrients: ['min-iron', 'vit-b12', 'vit-d', 'min-magnesium', 'vit-b1'], severity: 'high' },
      { id: 'e2', category: 'energy', question: 'Do you experience afternoon energy crashes?', linkedNutrients: ['min-chromium', 'vit-b3', 'vit-b5', 'min-magnesium'], severity: 'medium' },
      { id: 'e3', category: 'energy', question: 'Do you rely on caffeine to get through the day?', linkedNutrients: ['min-iron', 'vit-b12', 'vit-b5', 'min-magnesium'], severity: 'medium' },
      { id: 'e4', category: 'energy', question: 'Do you feel short of breath during mild physical activity?', linkedNutrients: ['min-iron', 'vit-b12', 'vit-b9'], severity: 'high' },
      { id: 'e5', category: 'energy', question: 'Do you wake up feeling unrefreshed despite sleeping 7-8 hours?', linkedNutrients: ['min-magnesium', 'vit-d', 'vit-b6', 'aa-tryptophan'], severity: 'medium' },
      { id: 'e6', category: 'energy', question: 'Do you experience muscle weakness or lack of stamina?', linkedNutrients: ['vit-d', 'min-potassium', 'min-magnesium', 'aa-leucine', 'min-iron'], severity: 'high' },
    ]
  },
  {
    id: 'skin',
    name: 'Skin, Hair & Nails',
    icon: 'Sparkles',
    description: 'External indicators that often reflect internal nutrient status',
    questions: [
      { id: 's1', category: 'skin', question: 'Do you have dry, flaky, or rough skin?', linkedNutrients: ['vit-a', 'fa-omega3-epa', 'fa-omega6-la', 'vit-e', 'vit-c'], severity: 'medium' },
      { id: 's2', category: 'skin', question: 'Are you experiencing unusual hair loss or thinning?', linkedNutrients: ['vit-b7', 'min-iron', 'min-zinc', 'vit-d', 'vit-b12'], severity: 'high' },
      { id: 's3', category: 'skin', question: 'Do you have brittle, ridged, or spoon-shaped nails?', linkedNutrients: ['min-iron', 'vit-b7', 'min-zinc', 'vit-c'], severity: 'medium' },
      { id: 's4', category: 'skin', question: 'Do you bruise easily or notice unexplained bruises?', linkedNutrients: ['vit-c', 'vit-k', 'min-iron'], severity: 'high' },
      { id: 's5', category: 'skin', question: 'Do you have cracked lips or sores at the corners of your mouth?', linkedNutrients: ['vit-b2', 'vit-b6', 'min-iron', 'vit-b3'], severity: 'medium' },
      { id: 's6', category: 'skin', question: 'Do wounds take a long time to heal?', linkedNutrients: ['vit-c', 'min-zinc', 'vit-a', 'aa-lysine'], severity: 'high' },
      { id: 's7', category: 'skin', question: 'Do you have persistent acne or skin inflammation?', linkedNutrients: ['min-zinc', 'vit-a', 'fa-omega3-epa', 'vit-d', 'fa-omega6-gla'], severity: 'medium' },
    ]
  },
  {
    id: 'cognitive',
    name: 'Brain & Cognitive Function',
    icon: 'Brain',
    description: 'Mental clarity, memory, focus, and neurological health',
    questions: [
      { id: 'c1', category: 'cognitive', question: 'Do you experience brain fog or difficulty concentrating?', linkedNutrients: ['fa-omega3-dha', 'vit-b12', 'min-iron', 'vit-d', 'min-magnesium'], severity: 'high' },
      { id: 'c2', category: 'cognitive', question: 'Have you noticed a decline in your memory?', linkedNutrients: ['fa-omega3-dha', 'vit-b12', 'vit-b1', 'aa-phenylalanine'], severity: 'high' },
      { id: 'c3', category: 'cognitive', question: 'Do you experience frequent headaches or migraines?', linkedNutrients: ['min-magnesium', 'vit-b2', 'fa-omega3-epa', 'min-iron'], severity: 'medium' },
      { id: 'c4', category: 'cognitive', question: 'Do you feel anxious or have racing thoughts?', linkedNutrients: ['min-magnesium', 'vit-b6', 'fa-omega3-epa', 'aa-tryptophan', 'vit-d'], severity: 'high' },
      { id: 'c5', category: 'cognitive', question: 'Do you experience numbness or tingling in hands/feet?', linkedNutrients: ['vit-b12', 'vit-b6', 'vit-b1', 'min-magnesium'], severity: 'high' },
      { id: 'c6', category: 'cognitive', question: 'Do you struggle with low mood or depressive feelings?', linkedNutrients: ['vit-d', 'fa-omega3-epa', 'vit-b12', 'vit-b9', 'aa-tryptophan', 'min-magnesium'], severity: 'high' },
    ]
  },
  {
    id: 'immunity',
    name: 'Immune System',
    icon: 'Shield',
    description: 'Your body\'s defense system and ability to fight infections',
    questions: [
      { id: 'i1', category: 'immunity', question: 'Do you catch colds or infections frequently (more than 3x/year)?', linkedNutrients: ['vit-c', 'vit-d', 'min-zinc', 'vit-a', 'min-selenium'], severity: 'high' },
      { id: 'i2', category: 'immunity', question: 'Do infections take a long time to resolve?', linkedNutrients: ['vit-c', 'min-zinc', 'vit-d', 'vit-a'], severity: 'high' },
      { id: 'i3', category: 'immunity', question: 'Do you suffer from frequent cold sores or herpes outbreaks?', linkedNutrients: ['aa-lysine', 'vit-c', 'min-zinc', 'vit-d'], severity: 'medium' },
      { id: 'i4', category: 'immunity', question: 'Do you have chronic allergies or autoimmune symptoms?', linkedNutrients: ['vit-d', 'fa-omega3-epa', 'min-selenium', 'vit-c', 'aa-histidine'], severity: 'high' },
      { id: 'i5', category: 'immunity', question: 'Do you experience frequent digestive issues (bloating, gas, irregular bowel)?', linkedNutrients: ['vit-d', 'min-zinc', 'aa-threonine', 'vit-a', 'min-magnesium'], severity: 'medium' },
    ]
  },
  {
    id: 'musculoskeletal',
    name: 'Muscles & Bones',
    icon: 'Bone',
    description: 'Structural health, strength, and physical performance',
    questions: [
      { id: 'm1', category: 'musculoskeletal', question: 'Do you experience frequent muscle cramps or spasms?', linkedNutrients: ['min-magnesium', 'min-potassium', 'min-calcium', 'vit-d', 'min-sodium'], severity: 'high' },
      { id: 'm2', category: 'musculoskeletal', question: 'Do you have joint pain or stiffness?', linkedNutrients: ['fa-omega3-epa', 'vit-d', 'vit-c', 'min-boron', 'min-manganese'], severity: 'medium' },
      { id: 'm3', category: 'musculoskeletal', question: 'Do you have concerns about bone density or osteoporosis?', linkedNutrients: ['min-calcium', 'vit-d', 'vit-k', 'min-magnesium', 'min-boron', 'min-phosphorus'], severity: 'high' },
      { id: 'm4', category: 'musculoskeletal', question: 'Do you experience restless legs, especially at night?', linkedNutrients: ['min-iron', 'min-magnesium', 'vit-b9', 'vit-d'], severity: 'medium' },
      { id: 'm5', category: 'musculoskeletal', question: 'Do you recover slowly from exercise or physical activity?', linkedNutrients: ['aa-leucine', 'aa-isoleucine', 'aa-valine', 'min-magnesium', 'vit-c', 'min-zinc'], severity: 'medium' },
      { id: 'm6', category: 'musculoskeletal', question: 'Do you experience muscle twitching or eye twitching?', linkedNutrients: ['min-magnesium', 'min-calcium', 'min-potassium', 'vit-b6'], severity: 'medium' },
    ]
  },
  {
    id: 'sleep',
    name: 'Sleep & Recovery',
    icon: 'Moon',
    description: 'Quality of rest and your body\'s ability to regenerate',
    questions: [
      { id: 'sl1', category: 'sleep', question: 'Do you have difficulty falling asleep?', linkedNutrients: ['min-magnesium', 'aa-tryptophan', 'vit-b6', 'vit-d'], severity: 'high' },
      { id: 'sl2', category: 'sleep', question: 'Do you wake up frequently during the night?', linkedNutrients: ['min-magnesium', 'aa-tryptophan', 'vit-d', 'min-potassium'], severity: 'medium' },
      { id: 'sl3', category: 'sleep', question: 'Do you experience vivid dreams or nightmares regularly?', linkedNutrients: ['vit-b6', 'min-magnesium'], severity: 'low' },
      { id: 'sl4', category: 'sleep', question: 'Do you grind your teeth at night (bruxism)?', linkedNutrients: ['min-magnesium', 'min-calcium', 'vit-b5'], severity: 'medium' },
    ]
  },
  {
    id: 'hormonal',
    name: 'Hormonal Balance',
    icon: 'Activity',
    description: 'Endocrine function, thyroid health, and hormonal regulation',
    questions: [
      { id: 'h1', category: 'hormonal', question: 'Do you experience cold hands/feet or cold intolerance?', linkedNutrients: ['min-iodine', 'min-iron', 'min-selenium', 'vit-b12'], severity: 'medium' },
      { id: 'h2', category: 'hormonal', question: 'Have you experienced unexplained weight changes?', linkedNutrients: ['min-iodine', 'min-selenium', 'vit-d', 'min-chromium'], severity: 'high' },
      { id: 'h3', category: 'hormonal', question: 'Do you experience PMS, irregular cycles, or hormonal symptoms?', linkedNutrients: ['vit-b6', 'min-magnesium', 'fa-omega6-gla', 'vit-d', 'min-zinc'], severity: 'medium' },
      { id: 'h4', category: 'hormonal', question: 'Do you have low libido or reproductive concerns?', linkedNutrients: ['min-zinc', 'vit-d', 'vit-a', 'min-selenium', 'min-boron'], severity: 'medium' },
      { id: 'h5', category: 'hormonal', question: 'Do you experience blood sugar swings (shakiness, irritability when hungry)?', linkedNutrients: ['min-chromium', 'min-magnesium', 'vit-b3', 'vit-b1'], severity: 'high' },
    ]
  },
  {
    id: 'cardiovascular',
    name: 'Heart & Circulation',
    icon: 'Heart',
    description: 'Cardiovascular health, blood pressure, and circulation',
    questions: [
      { id: 'cv1', category: 'cardiovascular', question: 'Do you experience heart palpitations or irregular heartbeat?', linkedNutrients: ['min-magnesium', 'min-potassium', 'fa-omega3-epa', 'vit-b12'], severity: 'high' },
      { id: 'cv2', category: 'cardiovascular', question: 'Do you have high blood pressure or cholesterol concerns?', linkedNutrients: ['fa-omega3-epa', 'fa-omega3-dha', 'min-magnesium', 'min-potassium', 'vit-b3', 'fa-omega9'], severity: 'high' },
      { id: 'cv3', category: 'cardiovascular', question: 'Do you notice poor circulation (cold extremities, slow healing)?', linkedNutrients: ['min-iron', 'vit-b12', 'vit-e', 'fa-omega3-epa', 'vit-c'], severity: 'medium' },
      { id: 'cv4', category: 'cardiovascular', question: 'Do you experience dizziness when standing up quickly?', linkedNutrients: ['min-iron', 'vit-b12', 'min-sodium', 'min-potassium'], severity: 'medium' },
    ]
  },
  {
    id: 'vision',
    name: 'Eye & Vision Health',
    icon: 'Eye',
    description: 'Visual acuity, eye comfort, and long-term eye health',
    questions: [
      { id: 'v1', category: 'vision', question: 'Do you have difficulty seeing in low light (night blindness)?', linkedNutrients: ['vit-a', 'min-zinc'], severity: 'high' },
      { id: 'v2', category: 'vision', question: 'Do you experience dry, irritated eyes?', linkedNutrients: ['vit-a', 'fa-omega3-dha', 'fa-omega3-epa', 'fa-omega6-gla'], severity: 'medium' },
      { id: 'v3', category: 'vision', question: 'Have you noticed declining vision or eye fatigue?', linkedNutrients: ['fa-omega3-dha', 'vit-a', 'vit-e', 'min-zinc', 'vit-c'], severity: 'medium' },
    ]
  }
];

export const allQuestions: SymptomQuestion[] = assessmentCategories.flatMap(cat => cat.questions);
