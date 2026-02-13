/**
 * Supplement Interaction Database
 * 
 * Maps known negative interactions between supplements, including:
 * - Absorption competition (minerals competing for same transporters)
 * - Depletion effects (one supplement depleting another over time)
 * - Contraindications with medications
 * - Antagonistic effects
 * 
 * Each interaction includes severity, explanation, and timing recommendations.
 */

export type InteractionSeverity = 'caution' | 'warning' | 'avoid';

export interface SupplementInteraction {
  id: string;
  /** First supplement - matched by name patterns (case-insensitive, partial match) */
  supplementA: {
    namePatterns: string[];
    nutrientIds?: string[];
  };
  /** Second supplement - matched by name patterns (case-insensitive, partial match) */
  supplementB: {
    namePatterns: string[];
    nutrientIds?: string[];
  };
  severity: InteractionSeverity;
  /** Short title for the interaction */
  title: string;
  /** Detailed explanation of the interaction mechanism */
  explanation: string;
  /** Recommendation to minimize the interaction */
  timingRecommendation: string;
  /** Category of interaction */
  category: 'absorption' | 'depletion' | 'antagonism' | 'medication' | 'toxicity';
  /** Source/reference for the interaction */
  source?: string;
}

export const supplementInteractions: SupplementInteraction[] = [
  // ===== ABSORPTION COMPETITION =====
  {
    id: 'calcium-iron',
    supplementA: {
      namePatterns: ['calcium'],
      nutrientIds: ['min-calcium'],
    },
    supplementB: {
      namePatterns: ['iron', 'ferrous'],
      nutrientIds: ['min-iron'],
    },
    severity: 'warning',
    title: 'Calcium blocks iron absorption',
    explanation:
      'Calcium significantly inhibits both heme and non-heme iron absorption by up to 50-60%. They compete for the same divalent metal transporter (DMT1) in the intestinal lining. This is one of the most well-documented supplement interactions.',
    timingRecommendation:
      'Separate calcium and iron supplements by at least 2 hours. Take iron in the morning on an empty stomach with vitamin C, and calcium in the evening or with a different meal.',
    category: 'absorption',
    source: 'Hallberg L, et al. Am J Clin Nutr. 1991;53(1):112-9',
  },
  {
    id: 'calcium-magnesium',
    supplementA: {
      namePatterns: ['calcium'],
      nutrientIds: ['min-calcium'],
    },
    supplementB: {
      namePatterns: ['magnesium'],
      nutrientIds: ['min-magnesium'],
    },
    severity: 'caution',
    title: 'Calcium and magnesium compete for absorption',
    explanation:
      'High doses of calcium (>500mg) can reduce magnesium absorption as they share similar absorption pathways. In moderate doses, they can be taken together, but high-dose supplementation of both should be separated.',
    timingRecommendation:
      'If taking high doses (>500mg calcium), separate from magnesium by 2 hours. Moderate doses can be taken together. Consider taking calcium in the morning and magnesium in the evening.',
    category: 'absorption',
  },
  {
    id: 'calcium-zinc',
    supplementA: {
      namePatterns: ['calcium'],
      nutrientIds: ['min-calcium'],
    },
    supplementB: {
      namePatterns: ['zinc'],
      nutrientIds: ['min-zinc'],
    },
    severity: 'caution',
    title: 'Calcium may reduce zinc absorption',
    explanation:
      'High-dose calcium supplementation can interfere with zinc absorption, particularly when taken simultaneously. The effect is dose-dependent and most significant at calcium doses above 600mg.',
    timingRecommendation:
      'Separate high-dose calcium from zinc by at least 2 hours. Taking zinc with a meal that doesn\'t include a calcium supplement helps ensure adequate absorption.',
    category: 'absorption',
  },
  {
    id: 'iron-zinc',
    supplementA: {
      namePatterns: ['iron', 'ferrous'],
      nutrientIds: ['min-iron'],
    },
    supplementB: {
      namePatterns: ['zinc'],
      nutrientIds: ['min-zinc'],
    },
    severity: 'caution',
    title: 'Iron and zinc compete for absorption',
    explanation:
      'Iron and zinc compete for the same intestinal absorption pathways (DMT1 transporter). Taking them together, especially in supplement form on an empty stomach, can reduce absorption of both minerals by 30-50%.',
    timingRecommendation:
      'Take iron and zinc at different times of day. Iron is best absorbed in the morning on an empty stomach with vitamin C. Zinc can be taken with lunch or dinner.',
    category: 'absorption',
  },
  {
    id: 'calcium-thyroid',
    supplementA: {
      namePatterns: ['calcium'],
      nutrientIds: ['min-calcium'],
    },
    supplementB: {
      namePatterns: ['thyroid', 'levothyroxine', 'synthroid', 'iodine'],
      nutrientIds: ['min-iodine'],
    },
    severity: 'warning',
    title: 'Calcium interferes with thyroid medication/iodine',
    explanation:
      'Calcium can bind to thyroid medications (levothyroxine) in the gut, significantly reducing their absorption. It can also interfere with iodine utilization for thyroid hormone synthesis when taken simultaneously.',
    timingRecommendation:
      'Take thyroid medication or iodine supplements at least 4 hours apart from calcium. Thyroid medication is best taken first thing in the morning on an empty stomach, 30-60 minutes before eating.',
    category: 'absorption',
  },
  {
    id: 'iron-tea-coffee',
    supplementA: {
      namePatterns: ['iron', 'ferrous'],
      nutrientIds: ['min-iron'],
    },
    supplementB: {
      namePatterns: ['green tea', 'tea extract', 'caffeine'],
    },
    severity: 'warning',
    title: 'Tannins and polyphenols block iron absorption',
    explanation:
      'Tannins in tea and polyphenols in coffee can reduce non-heme iron absorption by up to 60-90%. Green tea extract supplements are particularly potent at blocking iron uptake due to their concentrated catechin content.',
    timingRecommendation:
      'Separate iron supplements from tea/coffee/green tea extract by at least 1-2 hours. Take iron with vitamin C instead to enhance absorption.',
    category: 'absorption',
  },
  {
    id: 'magnesium-manganese',
    supplementA: {
      namePatterns: ['magnesium'],
      nutrientIds: ['min-magnesium'],
    },
    supplementB: {
      namePatterns: ['manganese'],
      nutrientIds: ['min-manganese'],
    },
    severity: 'caution',
    title: 'Magnesium may reduce manganese absorption',
    explanation:
      'High-dose magnesium supplementation can compete with manganese for absorption in the intestines, as they share similar transport mechanisms. This is primarily a concern at higher supplemental doses.',
    timingRecommendation:
      'If supplementing both, take them at different meals. Manganese is best taken with food, while magnesium can be taken in the evening.',
    category: 'absorption',
  },

  // ===== DEPLETION EFFECTS =====
  {
    id: 'zinc-copper',
    supplementA: {
      namePatterns: ['zinc'],
      nutrientIds: ['min-zinc'],
    },
    supplementB: {
      namePatterns: ['copper'],
      nutrientIds: ['min-copper'],
    },
    severity: 'warning',
    title: 'Long-term zinc depletes copper levels',
    explanation:
      'Zinc supplementation above 40mg/day induces metallothionein production in intestinal cells, which preferentially binds copper and prevents its absorption. Chronic high-dose zinc supplementation can lead to copper deficiency anemia within weeks to months.',
    timingRecommendation:
      'If taking zinc long-term (especially >25mg/day), supplement with 1-2mg copper daily. Take them at different times — zinc with breakfast, copper with dinner. Look for zinc supplements that include copper (e.g., 15mg zinc + 1mg copper).',
    category: 'depletion',
    source: 'Prasad AS, et al. JAMA. 1978;240(20):2166-8',
  },
  {
    id: 'vitc-vitb12',
    supplementA: {
      namePatterns: ['vitamin c', 'ascorbic acid'],
      nutrientIds: ['vit-c'],
    },
    supplementB: {
      namePatterns: ['vitamin b12', 'b12', 'methylcobalamin', 'cyanocobalamin'],
      nutrientIds: ['vit-b12'],
    },
    severity: 'caution',
    title: 'High-dose vitamin C may reduce B12 absorption',
    explanation:
      'Very high doses of vitamin C (>1000mg) taken simultaneously with vitamin B12 may convert some B12 to inactive analogues, reducing its bioavailability. The clinical significance is debated but worth noting for those with B12 deficiency.',
    timingRecommendation:
      'Separate high-dose vitamin C (>1000mg) from B12 supplements by at least 2 hours. This is less of a concern at moderate vitamin C doses (<500mg).',
    category: 'depletion',
  },
  {
    id: 'vitb6-levodopa',
    supplementA: {
      namePatterns: ['vitamin b6', 'pyridoxine', 'b6'],
      nutrientIds: ['vit-b6'],
    },
    supplementB: {
      namePatterns: ['levodopa', 'l-dopa', 'carbidopa'],
    },
    severity: 'avoid',
    title: 'Vitamin B6 reduces levodopa effectiveness',
    explanation:
      'Vitamin B6 (pyridoxine) accelerates the peripheral conversion of levodopa to dopamine before it can cross the blood-brain barrier, significantly reducing its therapeutic effect for Parkinson\'s disease. This interaction does NOT apply when levodopa is combined with carbidopa.',
    timingRecommendation:
      'If taking levodopa WITHOUT carbidopa, avoid B6 supplementation entirely. If taking levodopa/carbidopa combination, moderate B6 is generally safe. Consult your neurologist before supplementing.',
    category: 'antagonism',
  },

  // ===== ANTAGONISM =====
  {
    id: 'vite-vitk',
    supplementA: {
      namePatterns: ['vitamin e', 'tocopherol'],
      nutrientIds: ['vit-e'],
    },
    supplementB: {
      namePatterns: ['vitamin k', 'k2', 'mk-7', 'phylloquinone', 'menaquinone'],
      nutrientIds: ['vit-k'],
    },
    severity: 'caution',
    title: 'High-dose vitamin E may antagonize vitamin K',
    explanation:
      'High-dose vitamin E supplementation (>400 IU/day) can interfere with vitamin K-dependent clotting factors, potentially increasing bleeding risk. Vitamin E inhibits the vitamin K-dependent carboxylase enzyme needed for blood clotting protein activation.',
    timingRecommendation:
      'Keep vitamin E supplementation at moderate doses (<400 IU/day). If taking both, ensure adequate vitamin K intake. Take them at different times of day for optimal absorption of each.',
    category: 'antagonism',
  },
  {
    id: 'vita-vitd-high',
    supplementA: {
      namePatterns: ['vitamin a', 'retinol'],
      nutrientIds: ['vit-a'],
    },
    supplementB: {
      namePatterns: ['vitamin d', 'd3', 'cholecalciferol'],
      nutrientIds: ['vit-d'],
    },
    severity: 'caution',
    title: 'High-dose vitamin A may antagonize vitamin D',
    explanation:
      'Excessive vitamin A (retinol form, >10,000 IU/day) can interfere with vitamin D\'s ability to promote calcium absorption and may counteract vitamin D\'s bone-protective effects. Both are fat-soluble and compete for similar nuclear receptors.',
    timingRecommendation:
      'Keep preformed vitamin A (retinol) at moderate doses (<5,000 IU/day). Beta-carotene form does not have this interaction. If supplementing both, take at different meals.',
    category: 'antagonism',
  },
  {
    id: 'folate-b12-mask',
    supplementA: {
      namePatterns: ['folate', 'folic acid', 'b9', 'methylfolate'],
      nutrientIds: ['vit-b9'],
    },
    supplementB: {
      namePatterns: ['vitamin b12', 'b12', 'methylcobalamin'],
      nutrientIds: ['vit-b12'],
    },
    severity: 'caution',
    title: 'High folate can mask B12 deficiency',
    explanation:
      'High-dose folic acid supplementation (>800mcg/day) can correct the megaloblastic anemia caused by B12 deficiency, masking the deficiency while neurological damage continues to progress silently. This doesn\'t mean you shouldn\'t take both — just ensure adequate B12.',
    timingRecommendation:
      'Always ensure adequate B12 intake when supplementing with high-dose folate. These can be taken together — the concern is about taking folate WITHOUT adequate B12. Consider a B-complex that includes both.',
    category: 'antagonism',
  },

  // ===== MEDICATION INTERACTIONS =====
  {
    id: 'vite-blood-thinners',
    supplementA: {
      namePatterns: ['vitamin e', 'tocopherol'],
      nutrientIds: ['vit-e'],
    },
    supplementB: {
      namePatterns: ['warfarin', 'coumadin', 'blood thinner', 'anticoagulant', 'aspirin'],
    },
    severity: 'avoid',
    title: 'Vitamin E increases bleeding risk with blood thinners',
    explanation:
      'Vitamin E has antiplatelet and anticoagulant properties that can significantly enhance the effects of blood-thinning medications like warfarin, increasing the risk of serious bleeding events. Even moderate doses (200-400 IU) can potentiate anticoagulant effects.',
    timingRecommendation:
      'Avoid vitamin E supplementation if taking blood thinners unless specifically approved by your physician. If approved, use the lowest effective dose and monitor INR levels more frequently.',
    category: 'medication',
    source: 'Booth SL, et al. J Nutr. 2004;134(11):3100-5',
  },
  {
    id: 'vitk-blood-thinners',
    supplementA: {
      namePatterns: ['vitamin k', 'k2', 'mk-7', 'phylloquinone', 'menaquinone'],
      nutrientIds: ['vit-k'],
    },
    supplementB: {
      namePatterns: ['warfarin', 'coumadin', 'blood thinner', 'anticoagulant'],
    },
    severity: 'avoid',
    title: 'Vitamin K counteracts blood thinner medications',
    explanation:
      'Vitamin K directly counteracts warfarin and similar anticoagulants by promoting the synthesis of clotting factors that these medications are designed to suppress. This can make blood thinner therapy unpredictable and dangerous.',
    timingRecommendation:
      'Do NOT supplement vitamin K while on warfarin or similar anticoagulants without physician supervision. Maintain consistent dietary vitamin K intake. If K2 supplementation is needed, work closely with your doctor to adjust warfarin dosing.',
    category: 'medication',
  },
  {
    id: 'fishoil-blood-thinners',
    supplementA: {
      namePatterns: ['fish oil', 'omega-3', 'omega 3', 'epa', 'dha', 'krill oil', 'algae oil'],
      nutrientIds: ['fa-omega3-epa', 'fa-omega3-dha'],
    },
    supplementB: {
      namePatterns: ['warfarin', 'coumadin', 'blood thinner', 'anticoagulant', 'aspirin'],
    },
    severity: 'warning',
    title: 'Fish oil may increase bleeding risk with blood thinners',
    explanation:
      'Omega-3 fatty acids (EPA/DHA) have mild antiplatelet effects that can add to the blood-thinning effects of anticoagulant medications. At high doses (>3g/day), the bleeding risk becomes more significant.',
    timingRecommendation:
      'Moderate fish oil doses (1-2g/day) are generally safe with blood thinners under medical supervision. Inform your doctor about fish oil use. Monitor for unusual bruising or bleeding. Avoid doses above 3g/day.',
    category: 'medication',
  },
  {
    id: 'iron-thyroid-meds',
    supplementA: {
      namePatterns: ['iron', 'ferrous'],
      nutrientIds: ['min-iron'],
    },
    supplementB: {
      namePatterns: ['thyroid', 'levothyroxine', 'synthroid'],
    },
    severity: 'warning',
    title: 'Iron blocks thyroid medication absorption',
    explanation:
      'Iron supplements form insoluble complexes with levothyroxine (thyroid medication) in the stomach, reducing thyroid medication absorption by up to 50-75%. This can lead to inadequate thyroid hormone levels.',
    timingRecommendation:
      'Separate iron from thyroid medication by at least 4 hours. Take thyroid medication first thing in the morning on an empty stomach, and iron later in the day.',
    category: 'medication',
  },
  {
    id: 'calcium-antibiotics',
    supplementA: {
      namePatterns: ['calcium'],
      nutrientIds: ['min-calcium'],
    },
    supplementB: {
      namePatterns: ['antibiotic', 'tetracycline', 'ciprofloxacin', 'doxycycline', 'fluoroquinolone'],
    },
    severity: 'avoid',
    title: 'Calcium blocks antibiotic absorption',
    explanation:
      'Calcium forms insoluble chelates with tetracycline and fluoroquinolone antibiotics, reducing their absorption by 50-90%. This can render the antibiotic ineffective against the infection being treated.',
    timingRecommendation:
      'Separate calcium supplements from antibiotics by at least 2-4 hours (take antibiotic 2 hours before or 4-6 hours after calcium). This applies to dairy products as well.',
    category: 'medication',
  },
  {
    id: 'magnesium-antibiotics',
    supplementA: {
      namePatterns: ['magnesium'],
      nutrientIds: ['min-magnesium'],
    },
    supplementB: {
      namePatterns: ['antibiotic', 'tetracycline', 'ciprofloxacin', 'doxycycline', 'fluoroquinolone'],
    },
    severity: 'warning',
    title: 'Magnesium reduces antibiotic effectiveness',
    explanation:
      'Magnesium can chelate (bind to) certain antibiotics, particularly tetracyclines and fluoroquinolones, significantly reducing their absorption and therapeutic effectiveness.',
    timingRecommendation:
      'Separate magnesium from antibiotics by at least 2-4 hours. Take the antibiotic first, then magnesium later in the day.',
    category: 'medication',
  },
  {
    id: 'iron-antibiotics',
    supplementA: {
      namePatterns: ['iron', 'ferrous'],
      nutrientIds: ['min-iron'],
    },
    supplementB: {
      namePatterns: ['antibiotic', 'tetracycline', 'ciprofloxacin', 'doxycycline', 'fluoroquinolone'],
    },
    severity: 'warning',
    title: 'Iron reduces antibiotic absorption',
    explanation:
      'Iron forms chelation complexes with tetracycline and fluoroquinolone antibiotics, reducing absorption of both the iron and the antibiotic. This can compromise infection treatment.',
    timingRecommendation:
      'Separate iron from antibiotics by at least 2-4 hours. Prioritize the antibiotic schedule and adjust iron timing accordingly.',
    category: 'medication',
  },
  {
    id: 'potassium-ace-inhibitors',
    supplementA: {
      namePatterns: ['potassium'],
      nutrientIds: ['min-potassium'],
    },
    supplementB: {
      namePatterns: ['ace inhibitor', 'lisinopril', 'enalapril', 'ramipril', 'arb', 'losartan'],
    },
    severity: 'avoid',
    title: 'Potassium with ACE inhibitors risks hyperkalemia',
    explanation:
      'ACE inhibitors and ARBs reduce potassium excretion by the kidneys. Adding potassium supplements on top of these medications can lead to dangerous hyperkalemia (high blood potassium), which can cause life-threatening heart rhythm abnormalities.',
    timingRecommendation:
      'Do NOT supplement potassium while taking ACE inhibitors or ARBs without physician approval and regular blood monitoring. Dietary potassium from food is generally safe but should be discussed with your doctor.',
    category: 'medication',
  },

  // ===== SAME-TIME COMPETITION =====
  {
    id: 'calcium-bisphosphonate',
    supplementA: {
      namePatterns: ['calcium'],
      nutrientIds: ['min-calcium'],
    },
    supplementB: {
      namePatterns: ['bisphosphonate', 'alendronate', 'fosamax', 'risedronate'],
    },
    severity: 'avoid',
    title: 'Calcium blocks bisphosphonate absorption',
    explanation:
      'Calcium dramatically reduces the absorption of bisphosphonate osteoporosis medications. Since bisphosphonates already have very low absorption (1-5%), any further reduction can make them therapeutically useless.',
    timingRecommendation:
      'Take bisphosphonates first thing in the morning with plain water only. Wait at least 30-60 minutes before taking calcium or eating. Some bisphosphonates require waiting 2 hours.',
    category: 'medication',
  },
  {
    id: 'vitc-iron-positive',
    supplementA: {
      namePatterns: ['vitamin c', 'ascorbic acid'],
      nutrientIds: ['vit-c'],
    },
    supplementB: {
      namePatterns: ['iron', 'ferrous'],
      nutrientIds: ['min-iron'],
    },
    severity: 'caution',
    title: 'Vitamin C enhances iron absorption (beneficial but note)',
    explanation:
      'Vitamin C dramatically increases non-heme iron absorption by converting ferric iron (Fe3+) to the more absorbable ferrous form (Fe2+) and forming a soluble chelate. This is beneficial for those with iron deficiency but could be problematic for those with iron overload conditions (hemochromatosis).',
    timingRecommendation:
      'Take vitamin C with iron to enhance absorption — this is a POSITIVE interaction for most people. However, if you have hemochromatosis or iron overload, separate them by 2+ hours and consult your doctor.',
    category: 'absorption',
  },

  // ===== SAME-NUTRIENT OVERLAP / TOXICITY =====
  {
    id: 'vitd-multi-overlap',
    supplementA: {
      namePatterns: ['vitamin d', 'd3', 'cholecalciferol'],
      nutrientIds: ['vit-d'],
    },
    supplementB: {
      namePatterns: ['multivitamin', 'multi vitamin', 'daily multi'],
    },
    severity: 'caution',
    title: 'Vitamin D overlap with multivitamin',
    explanation:
      'Most multivitamins contain 400-1000 IU of vitamin D. If you\'re also taking a separate vitamin D supplement, the combined dose may exceed safe levels (>4000 IU/day for most adults), increasing risk of hypercalcemia over time.',
    timingRecommendation:
      'Check your multivitamin label for vitamin D content and subtract that from your standalone vitamin D dose. Total daily intake should generally stay below 4,000 IU unless directed by a physician based on blood levels.',
    category: 'toxicity',
  },
  {
    id: 'iron-multi-overlap',
    supplementA: {
      namePatterns: ['iron', 'ferrous'],
      nutrientIds: ['min-iron'],
    },
    supplementB: {
      namePatterns: ['multivitamin', 'multi vitamin', 'daily multi', 'prenatal'],
    },
    severity: 'caution',
    title: 'Iron overlap with multivitamin',
    explanation:
      'Many multivitamins (especially prenatal formulas) contain 18-27mg of iron. Taking additional iron supplements on top of this can lead to excessive iron intake, causing gastrointestinal side effects and potentially iron overload.',
    timingRecommendation:
      'Check your multivitamin for iron content. If it contains iron, you may not need a separate iron supplement. If additional iron is prescribed, take it at a different time than your multivitamin for better absorption of both.',
    category: 'toxicity',
  },
  {
    id: 'vita-multi-overlap',
    supplementA: {
      namePatterns: ['vitamin a', 'retinol'],
      nutrientIds: ['vit-a'],
    },
    supplementB: {
      namePatterns: ['multivitamin', 'multi vitamin', 'daily multi'],
    },
    severity: 'warning',
    title: 'Vitamin A overlap risk with multivitamin',
    explanation:
      'Preformed vitamin A (retinol) is fat-soluble and accumulates in the body. Most multivitamins contain 2,500-5,000 IU of vitamin A. Adding a separate vitamin A supplement can push total intake to potentially toxic levels (>10,000 IU/day), risking liver damage and birth defects.',
    timingRecommendation:
      'Avoid separate vitamin A (retinol) supplementation if your multivitamin already contains it. Beta-carotene is a safer alternative as the body regulates its conversion. Check labels carefully.',
    category: 'toxicity',
  },

  // ===== ADDITIONAL INTERACTIONS =====
  {
    id: 'selenium-vitc-high',
    supplementA: {
      namePatterns: ['selenium'],
      nutrientIds: ['min-selenium'],
    },
    supplementB: {
      namePatterns: ['vitamin c', 'ascorbic acid'],
      nutrientIds: ['vit-c'],
    },
    severity: 'caution',
    title: 'High-dose vitamin C may reduce selenium absorption',
    explanation:
      'Very high doses of vitamin C (>1000mg) may reduce the bioavailability of certain forms of selenium (particularly selenite) by converting it to a less absorbable elemental form. Selenomethionine is less affected.',
    timingRecommendation:
      'Separate high-dose vitamin C from selenium by 1-2 hours. Choose selenomethionine form of selenium which is less affected. Moderate vitamin C doses are fine to take together.',
    category: 'absorption',
  },
  {
    id: 'fiber-minerals',
    supplementA: {
      namePatterns: ['fiber', 'psyllium', 'metamucil', 'inulin', 'prebiotic fiber'],
    },
    supplementB: {
      namePatterns: ['iron', 'zinc', 'calcium', 'magnesium', 'mineral'],
      nutrientIds: ['min-iron', 'min-zinc', 'min-calcium', 'min-magnesium'],
    },
    severity: 'caution',
    title: 'Fiber supplements reduce mineral absorption',
    explanation:
      'Soluble fiber supplements (psyllium, inulin, etc.) can bind to minerals in the digestive tract, reducing their absorption. Phytates in fiber are particularly effective at chelating iron, zinc, and calcium.',
    timingRecommendation:
      'Take mineral supplements at least 1-2 hours before or after fiber supplements. This allows minerals to be absorbed before fiber can bind them.',
    category: 'absorption',
  },
  {
    id: 'copper-zinc-ratio',
    supplementA: {
      namePatterns: ['copper'],
      nutrientIds: ['min-copper'],
    },
    supplementB: {
      namePatterns: ['zinc'],
      nutrientIds: ['min-zinc'],
    },
    severity: 'warning',
    title: 'Zinc and copper require careful ratio balancing',
    explanation:
      'Zinc and copper are antagonistic minerals. High zinc intake induces intestinal metallothionein which traps copper and prevents absorption. The ideal zinc-to-copper ratio is approximately 8:1 to 15:1. Supplementing one without considering the other can create an imbalance.',
    timingRecommendation:
      'Maintain a zinc-to-copper ratio of about 10:1 (e.g., 30mg zinc with 2-3mg copper). Take them at different times of day — zinc with breakfast, copper with dinner. If taking >25mg zinc daily, always supplement copper.',
    category: 'depletion',
  },
  {
    id: 'vitd-calcium-synergy-excess',
    supplementA: {
      namePatterns: ['vitamin d', 'd3', 'cholecalciferol'],
      nutrientIds: ['vit-d'],
    },
    supplementB: {
      namePatterns: ['calcium'],
      nutrientIds: ['min-calcium'],
    },
    severity: 'caution',
    title: 'High vitamin D with high calcium may increase kidney stone risk',
    explanation:
      'While vitamin D is essential for calcium absorption (a positive effect), combining high-dose vitamin D (>4000 IU/day) with high-dose calcium (>1200mg/day) may increase the risk of hypercalcemia and kidney stones in susceptible individuals.',
    timingRecommendation:
      'These work synergistically and should be taken together for bone health, but avoid excessive doses of both simultaneously. Keep vitamin D under 4000 IU and calcium under 1200mg daily unless directed by a physician monitoring your blood calcium.',
    category: 'toxicity',
  },
  {
    id: 'melatonin-5htp',
    supplementA: {
      namePatterns: ['melatonin'],
    },
    supplementB: {
      namePatterns: ['5-htp', '5htp', 'tryptophan', 'l-tryptophan'],
      nutrientIds: ['aa-tryptophan'],
    },
    severity: 'caution',
    title: 'Melatonin and 5-HTP/tryptophan may cause excess sedation',
    explanation:
      'Tryptophan and 5-HTP are precursors to both serotonin and melatonin. Taking them with supplemental melatonin can lead to excessive sedation and potentially contribute to serotonin syndrome symptoms in sensitive individuals, especially if also taking SSRIs.',
    timingRecommendation:
      'Avoid combining all three. If using tryptophan/5-HTP for sleep, you likely don\'t need additional melatonin. Start with one and assess before adding another. Never combine with SSRI/SNRI medications without medical supervision.',
    category: 'antagonism',
  },
  {
    id: 'stjohns-medications',
    supplementA: {
      namePatterns: ['st john', 'st. john', 'hypericum'],
    },
    supplementB: {
      namePatterns: ['ssri', 'antidepressant', 'birth control', 'oral contraceptive', 'immunosuppressant', 'cyclosporine'],
    },
    severity: 'avoid',
    title: 'St. John\'s Wort has dangerous drug interactions',
    explanation:
      'St. John\'s Wort is a potent inducer of cytochrome P450 enzymes and P-glycoprotein, which accelerates the metabolism of many medications. It can reduce the effectiveness of birth control pills, antidepressants, immunosuppressants, HIV medications, and blood thinners. Combined with SSRIs, it risks serotonin syndrome.',
    timingRecommendation:
      'Do NOT take St. John\'s Wort with prescription medications without consulting your physician. There is no safe timing separation — the enzyme induction effect lasts for weeks. Inform all healthcare providers if you use this supplement.',
    category: 'medication',
  },
];

/**
 * Severity level metadata for display
 */
export const severityConfig: Record<InteractionSeverity, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}> = {
  caution: {
    label: 'Caution',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    description: 'Minor interaction — timing separation recommended',
  },
  warning: {
    label: 'Warning',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-500',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    description: 'Significant interaction — take precautions',
  },
  avoid: {
    label: 'Avoid',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-800',
    description: 'Serious interaction — do not combine without medical supervision',
  },
};

/**
 * Category metadata
 */
export const interactionCategoryConfig: Record<string, { label: string; icon: string }> = {
  absorption: { label: 'Absorption Competition', icon: 'arrow-down-up' },
  depletion: { label: 'Nutrient Depletion', icon: 'trending-down' },
  antagonism: { label: 'Antagonistic Effect', icon: 'swords' },
  medication: { label: 'Medication Interaction', icon: 'pill' },
  toxicity: { label: 'Toxicity / Overlap Risk', icon: 'alert-octagon' },
};

/**
 * Check if a supplement name matches any of the given patterns
 */
function matchesPatterns(supplementName: string, patterns: string[]): boolean {
  const nameLower = supplementName.toLowerCase();
  return patterns.some(pattern => nameLower.includes(pattern.toLowerCase()));
}

/**
 * Check if a supplement's nutrient IDs overlap with the given nutrient IDs
 */
function matchesNutrientIds(supplementNutrientIds: string[], targetNutrientIds?: string[]): boolean {
  if (!targetNutrientIds || targetNutrientIds.length === 0) return false;
  return supplementNutrientIds.some(id => targetNutrientIds.includes(id));
}

export interface DetectedInteraction {
  interaction: SupplementInteraction;
  supplementAName: string;
  supplementBName: string;
  supplementAId?: string;
  supplementBId?: string;
}

interface SupplementInput {
  id?: string;
  name: string;
  nutrient_ids?: string[];
  nutrientIds?: string[];
  active?: boolean;
}

/**
 * Find all interactions between supplements in a user's stack
 */
export function findInteractions(supplements: SupplementInput[]): DetectedInteraction[] {
  const detected: DetectedInteraction[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < supplements.length; i++) {
    for (let j = i + 1; j < supplements.length; j++) {
      const suppA = supplements[i];
      const suppB = supplements[j];
      const nutrientIdsA = suppA.nutrient_ids || suppA.nutrientIds || [];
      const nutrientIdsB = suppB.nutrient_ids || suppB.nutrientIds || [];

      for (const interaction of supplementInteractions) {
        // Check A↔A-side and B↔B-side
        const aMatchesA =
          matchesPatterns(suppA.name, interaction.supplementA.namePatterns) ||
          matchesNutrientIds(nutrientIdsA, interaction.supplementA.nutrientIds);
        const bMatchesB =
          matchesPatterns(suppB.name, interaction.supplementB.namePatterns) ||
          matchesNutrientIds(nutrientIdsB, interaction.supplementB.nutrientIds);

        // Check A↔B-side and B↔A-side (reversed)
        const aMatchesB =
          matchesPatterns(suppA.name, interaction.supplementB.namePatterns) ||
          matchesNutrientIds(nutrientIdsA, interaction.supplementB.nutrientIds);
        const bMatchesA =
          matchesPatterns(suppB.name, interaction.supplementA.namePatterns) ||
          matchesNutrientIds(nutrientIdsB, interaction.supplementA.nutrientIds);

        if ((aMatchesA && bMatchesB) || (aMatchesB && bMatchesA)) {
          const pairKey = [interaction.id, suppA.id || suppA.name, suppB.id || suppB.name].sort().join('::');
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            detected.push({
              interaction,
              supplementAName: aMatchesA ? suppA.name : suppB.name,
              supplementBName: aMatchesA ? suppB.name : suppA.name,
              supplementAId: aMatchesA ? suppA.id : suppB.id,
              supplementBId: aMatchesA ? suppB.id : suppA.id,
            });
          }
        }
      }
    }
  }

  // Sort by severity: avoid > warning > caution
  const severityOrder: Record<InteractionSeverity, number> = { avoid: 0, warning: 1, caution: 2 };
  detected.sort((a, b) => severityOrder[a.interaction.severity] - severityOrder[b.interaction.severity]);

  return detected;
}

/**
 * Find interactions for a single supplement against an existing stack
 */
export function findInteractionsForSupplement(
  newSupplement: SupplementInput,
  existingStack: SupplementInput[]
): DetectedInteraction[] {
  // Create a temporary stack with the new supplement added
  const fullStack = [...existingStack, newSupplement];
  const allInteractions = findInteractions(fullStack);

  // Filter to only interactions involving the new supplement
  return allInteractions.filter(
    d =>
      d.supplementAName === newSupplement.name ||
      d.supplementBName === newSupplement.name ||
      d.supplementAId === newSupplement.id ||
      d.supplementBId === newSupplement.id
  );
}
