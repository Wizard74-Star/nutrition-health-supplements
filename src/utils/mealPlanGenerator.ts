import { foodDatabase, FoodItem } from '@/data/foodDatabase';
import { allNutrients, Nutrient } from '@/data/nutrients';
import { bloodMarkers, evaluateMarkerValue } from '@/data/bloodMarkers';

// ─── Types ─────────────────────────────────────────────────────────────
export interface NutrientDeficiency {
  nutrientId: string;
  nutrientName: string;
  priority: 'critical' | 'moderate' | 'low';
  score: number; // 0-100
  source: 'assessment' | 'blood-test' | 'both';
}

export interface MealItem {
  food: FoodItem;
  servings: number;
  deficienciesAddressed: string[]; // nutrient IDs
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  label: string;
  items: MealItem[];
  totalCalories: number;
  nutrientCoverage: Record<string, number>; // nutrient ID → amount
}

export interface DayPlan {
  day: number; // 0-6 (Mon-Sun)
  dayLabel: string;
  meals: Meal[];
  totalCalories: number;
  nutrientTotals: Record<string, number>;
}

export interface MealPlan {
  id: string;
  generatedAt: string;
  deficiencies: NutrientDeficiency[];
  days: DayPlan[];
  weeklyNutrientAverages: Record<string, number>;
}

export interface GroceryItem {
  food: FoodItem;
  totalServings: number;
  category: string;
  daysNeeded: number[];
}

// ─── Meal Templates ────────────────────────────────────────────────────
interface MealTemplate {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  label: string;
  slots: { categories: string[]; optional?: boolean }[];
}

const mealTemplates: MealTemplate[] = [
  {
    type: 'breakfast',
    label: 'Breakfast',
    slots: [
      { categories: ['Grains'] },
      { categories: ['Fruits'] },
      { categories: ['Dairy', 'Proteins'] },
      { categories: ['Nuts & Seeds'], optional: true },
    ],
  },
  {
    type: 'lunch',
    label: 'Lunch',
    slots: [
      { categories: ['Proteins', 'Legumes', 'Fish & Seafood'] },
      { categories: ['Vegetables'] },
      { categories: ['Grains'] },
      { categories: ['Fruits'], optional: true },
    ],
  },
  {
    type: 'dinner',
    label: 'Dinner',
    slots: [
      { categories: ['Proteins', 'Fish & Seafood', 'Legumes'] },
      { categories: ['Vegetables'] },
      { categories: ['Vegetables'] },
      { categories: ['Grains'], optional: true },
    ],
  },
  {
    type: 'snack',
    label: 'Snack',
    slots: [
      { categories: ['Nuts & Seeds', 'Snacks', 'Dairy'] },
      { categories: ['Fruits', 'Beverages'], optional: true },
    ],
  },
];

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── Scoring ───────────────────────────────────────────────────────────
function scoreFoodForDeficiencies(food: FoodItem, deficiencies: NutrientDeficiency[]): {
  score: number;
  addressedIds: string[];
} {
  let score = 0;
  const addressedIds: string[] = [];

  for (const def of deficiencies) {
    const amount = food.nutrients[def.nutrientId];
    if (amount && amount > 0) {
      const nutrient = allNutrients.find(n => n.id === def.nutrientId);
      if (!nutrient) continue;

      const rdaNum = parseFloat(nutrient.rda);
      if (isNaN(rdaNum) || rdaNum <= 0) {
        // No numeric RDA, give a flat score
        const priorityWeight = def.priority === 'critical' ? 3 : def.priority === 'moderate' ? 2 : 1;
        score += priorityWeight * 5;
        addressedIds.push(def.nutrientId);
        continue;
      }

      const percentRda = (amount / rdaNum) * 100;
      const priorityWeight = def.priority === 'critical' ? 3 : def.priority === 'moderate' ? 2 : 1;
      score += Math.min(percentRda, 100) * priorityWeight * 0.1;
      if (percentRda > 5) {
        addressedIds.push(def.nutrientId);
      }
    }
  }

  return { score, addressedIds };
}

function getFoodsForCategories(
  categories: string[],
  deficiencies: NutrientDeficiency[],
  usedFoodIds: Set<string>,
  preferUnused: boolean = true
): { food: FoodItem; score: number; addressedIds: string[] }[] {
  const candidates = foodDatabase.filter(f => categories.includes(f.category));

  return candidates
    .map(food => {
      const { score, addressedIds } = scoreFoodForDeficiencies(food, deficiencies);
      const usedPenalty = preferUnused && usedFoodIds.has(food.id) ? 0.3 : 1;
      return { food, score: score * usedPenalty, addressedIds };
    })
    .sort((a, b) => b.score - a.score);
}

// ─── Meal Generation ───────────────────────────────────────────────────
function generateMeal(
  template: MealTemplate,
  deficiencies: NutrientDeficiency[],
  usedFoodIds: Set<string>,
  dayIndex: number,
  mealIndex: number
): Meal {
  const items: MealItem[] = [];
  const localUsed = new Set(usedFoodIds);

  for (const slot of template.slots) {
    const ranked = getFoodsForCategories(slot.categories, deficiencies, localUsed);
    if (ranked.length === 0) continue;

    // Pick from top candidates with some variety
    const pickIndex = Math.min(
      Math.floor((dayIndex * 3 + mealIndex) % Math.min(ranked.length, 5)),
      ranked.length - 1
    );
    const pick = ranked[pickIndex];

    if (slot.optional && pick.score < 1) continue;

    items.push({
      food: pick.food,
      servings: 1,
      deficienciesAddressed: pick.addressedIds,
    });
    localUsed.add(pick.food.id);
  }

  const totalCalories = items.reduce((sum, item) => sum + item.food.calories * item.servings, 0);
  const nutrientCoverage: Record<string, number> = {};
  items.forEach(item => {
    Object.entries(item.food.nutrients).forEach(([nId, amount]) => {
      nutrientCoverage[nId] = (nutrientCoverage[nId] || 0) + amount * item.servings;
    });
  });

  return {
    id: `meal-${dayIndex}-${mealIndex}`,
    type: template.type,
    label: template.label,
    items,
    totalCalories,
    nutrientCoverage,
  };
}

// ─── Main Generator ────────────────────────────────────────────────────
export function generateMealPlan(deficiencies: NutrientDeficiency[]): MealPlan {
  const days: DayPlan[] = [];
  const weeklyUsed = new Set<string>();

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayUsed = new Set(weeklyUsed);
    const meals: Meal[] = [];

    mealTemplates.forEach((template, mealIndex) => {
      const meal = generateMeal(template, deficiencies, dayUsed, dayIndex, mealIndex);
      meals.push(meal);
      meal.items.forEach(item => dayUsed.add(item.food.id));
    });

    const totalCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);
    const nutrientTotals: Record<string, number> = {};
    meals.forEach(m => {
      Object.entries(m.nutrientCoverage).forEach(([nId, amount]) => {
        nutrientTotals[nId] = (nutrientTotals[nId] || 0) + amount;
      });
    });

    days.push({
      day: dayIndex,
      dayLabel: DAY_LABELS[dayIndex],
      meals,
      totalCalories,
      nutrientTotals,
    });

    // Track most-used foods across the week but allow some reuse
    meals.forEach(m => m.items.forEach(item => weeklyUsed.add(item.food.id)));
  }

  // Calculate weekly averages
  const weeklyNutrientAverages: Record<string, number> = {};
  days.forEach(day => {
    Object.entries(day.nutrientTotals).forEach(([nId, amount]) => {
      weeklyNutrientAverages[nId] = (weeklyNutrientAverages[nId] || 0) + amount / 7;
    });
  });

  return {
    id: `plan-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    deficiencies,
    days,
    weeklyNutrientAverages,
  };
}

// ─── Get Alternative Meals ─────────────────────────────────────────────
export function getAlternativeFoods(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  slotIndex: number,
  currentFoodId: string,
  deficiencies: NutrientDeficiency[]
): { food: FoodItem; score: number; addressedIds: string[] }[] {
  const template = mealTemplates.find(t => t.type === mealType);
  if (!template || !template.slots[slotIndex]) return [];

  const slot = template.slots[slotIndex];
  const ranked = getFoodsForCategories(slot.categories, deficiencies, new Set(), false);
  return ranked.filter(r => r.food.id !== currentFoodId).slice(0, 8);
}

// ─── Grocery List Generator ────────────────────────────────────────────
export function generateGroceryList(plan: MealPlan, selectedDays?: number[]): GroceryItem[] {
  const daysToInclude = selectedDays || [0, 1, 2, 3, 4, 5, 6];
  const foodMap = new Map<string, GroceryItem>();

  plan.days
    .filter(d => daysToInclude.includes(d.day))
    .forEach(day => {
      day.meals.forEach(meal => {
        meal.items.forEach(item => {
          const existing = foodMap.get(item.food.id);
          if (existing) {
            existing.totalServings += item.servings;
            if (!existing.daysNeeded.includes(day.day)) {
              existing.daysNeeded.push(day.day);
            }
          } else {
            foodMap.set(item.food.id, {
              food: item.food,
              totalServings: item.servings,
              category: item.food.category,
              daysNeeded: [day.day],
            });
          }
        });
      });
    });

  return Array.from(foodMap.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.food.name.localeCompare(b.food.name);
  });
}

// ─── Extract Deficiencies from Blood Tests ─────────────────────────────
export function extractDeficienciesFromBloodTests(
  markers: { markerId: string; value: number }[]
): NutrientDeficiency[] {
  const deficiencies: NutrientDeficiency[] = [];
  const seenNutrients = new Set<string>();

  markers.forEach(m => {
    const marker = bloodMarkers.find(bm => bm.id === m.markerId);
    if (!marker) return;

    const severity = evaluateMarkerValue(marker, m.value);
    if (severity === 'normal' || severity === 'borderline_high' || severity === 'high' || severity === 'critical_high') return;

    // This marker is low — map to nutrients
    const priority: 'critical' | 'moderate' | 'low' =
      severity === 'critical_low' ? 'critical' :
      severity === 'low' ? 'moderate' : 'low';

    const score = priority === 'critical' ? 90 : priority === 'moderate' ? 60 : 30;

    marker.nutrientIds.forEach(nId => {
      if (seenNutrients.has(nId)) return;
      seenNutrients.add(nId);

      const nutrient = allNutrients.find(n => n.id === nId);
      if (!nutrient) return;

      deficiencies.push({
        nutrientId: nId,
        nutrientName: nutrient.name,
        priority,
        score,
        source: 'blood-test',
      });
    });
  });

  return deficiencies;
}

// ─── Merge Deficiencies from Multiple Sources ──────────────────────────
export function mergeDeficiencies(
  assessmentDefs: NutrientDeficiency[],
  bloodTestDefs: NutrientDeficiency[]
): NutrientDeficiency[] {
  const merged = new Map<string, NutrientDeficiency>();

  assessmentDefs.forEach(d => {
    merged.set(d.nutrientId, { ...d });
  });

  bloodTestDefs.forEach(d => {
    const existing = merged.get(d.nutrientId);
    if (existing) {
      // Upgrade priority if blood test shows worse
      const priorityRank = { critical: 3, moderate: 2, low: 1 };
      if (priorityRank[d.priority] > priorityRank[existing.priority]) {
        existing.priority = d.priority;
      }
      existing.score = Math.max(existing.score, d.score);
      existing.source = 'both';
    } else {
      merged.set(d.nutrientId, { ...d });
    }
  });

  return Array.from(merged.values()).sort((a, b) => b.score - a.score);
}

// ─── Nutrient Coverage Helpers ─────────────────────────────────────────
export function getNutrientRdaPercent(nutrientId: string, amount: number): number {
  const nutrient = allNutrients.find(n => n.id === nutrientId);
  if (!nutrient) return 0;
  const rda = parseFloat(nutrient.rda);
  if (isNaN(rda) || rda <= 0) return 0;
  return Math.round((amount / rda) * 100);
}

export function getNutrientInfo(nutrientId: string): Nutrient | undefined {
  return allNutrients.find(n => n.id === nutrientId);
}
