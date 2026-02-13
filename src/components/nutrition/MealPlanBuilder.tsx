import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAssessment } from '@/context/AssessmentContext';
import { supabase } from '@/lib/supabase';
import { allNutrients } from '@/data/nutrients';
import { bloodMarkers, evaluateMarkerValue } from '@/data/bloodMarkers';
import {
  generateMealPlan,
  getAlternativeFoods,
  mergeDeficiencies,
  extractDeficienciesFromBloodTests,
  getNutrientRdaPercent,
  getNutrientInfo,
  NutrientDeficiency,
  MealPlan,
  DayPlan,
  Meal,
  MealItem,
} from '@/utils/mealPlanGenerator';
import GroceryList from './GroceryList';
import {
  ChefHat, Calendar, ShoppingCart, ArrowRight, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, Shuffle, X,
  Apple, Flame, Target, AlertTriangle, TrendingUp,
  Sparkles, Info, Check, BarChart3, Leaf, Sun, Moon, Coffee,
  Cookie, ArrowLeft, Zap, Heart
} from 'lucide-react';
import { FoodItem } from '@/data/foodDatabase';

// ─── Meal type icons & colors ──────────────────────────────────────────
const MEAL_CONFIG = {
  breakfast: { icon: Coffee, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Breakfast' },
  lunch: { icon: Sun, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Lunch' },
  dinner: { icon: Moon, color: 'from-indigo-400 to-purple-500', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Dinner' },
  snack: { icon: Cookie, color: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', label: 'Snack' },
};

type TabView = 'plan' | 'coverage' | 'grocery';

const MealPlanBuilder: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { results, assessmentComplete, setCurrentView } = useAssessment();

  // State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState<TabView>('plan');
  const [deficiencies, setDeficiencies] = useState<NutrientDeficiency[]>([]);
  const [bloodTestDeficiencies, setBloodTestDeficiencies] = useState<NutrientDeficiency[]>([]);
  const [swapModal, setSwapModal] = useState<{
    mealIndex: number;
    slotIndex: number;
    currentFood: FoodItem;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  } | null>(null);

  // ─── Load blood test deficiencies ────────────────────────────────
  const loadBloodTestDeficiencies = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: tests } = await supabase
        .from('blood_tests')
        .select('id')
        .eq('user_id', user.id)
        .order('test_date', { ascending: false })
        .limit(1);

      if (!tests || tests.length === 0) return;

      const { data: markers } = await supabase
        .from('blood_test_markers')
        .select('marker_id, value')
        .eq('blood_test_id', tests[0].id)
        .eq('user_id', user.id);

      if (markers && markers.length > 0) {
        const btDefs = extractDeficienciesFromBloodTests(
          markers.map(m => ({ markerId: m.marker_id, value: Number(m.value) }))
        );
        setBloodTestDeficiencies(btDefs);
      }
    } catch (err) {
      console.error('Failed to load blood test data:', err);
    }
  }, [user?.id]);

  // ─── Build deficiency list ───────────────────────────────────────
  useEffect(() => {
    const assessmentDefs: NutrientDeficiency[] = assessmentComplete
      ? results.map(r => ({
          nutrientId: r.nutrient.id,
          nutrientName: r.nutrient.name,
          priority: r.priority,
          score: r.score,
          source: 'assessment' as const,
        }))
      : [];

    const merged = mergeDeficiencies(assessmentDefs, bloodTestDeficiencies);
    setDeficiencies(merged);
  }, [results, assessmentComplete, bloodTestDeficiencies]);

  // ─── Initialize ──────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (isAuthenticated) {
        await loadBloodTestDeficiencies();
      }
      setLoading(false);
    };
    init();
  }, [isAuthenticated, loadBloodTestDeficiencies]);

  // ─── Generate plan ───────────────────────────────────────────────
  const handleGenerate = () => {
    setGenerating(true);
    // Small delay for UX
    setTimeout(() => {
      const newPlan = generateMealPlan(deficiencies);
      setPlan(newPlan);
      setSelectedDay(0);
      setGenerating(false);
    }, 600);
  };

  // ─── Regenerate single day ───────────────────────────────────────
  const regenerateDay = () => {
    if (!plan) return;
    const newPlan = generateMealPlan(deficiencies);
    const updatedDays = [...plan.days];
    updatedDays[selectedDay] = { ...newPlan.days[selectedDay], day: selectedDay };
    setPlan({ ...plan, days: updatedDays });
  };

  // ─── Swap a food item ────────────────────────────────────────────
  const swapFood = (mealIndex: number, slotIndex: number, newFood: FoodItem) => {
    if (!plan) return;
    const updatedDays = [...plan.days];
    const day = { ...updatedDays[selectedDay] };
    const meals = [...day.meals];
    const meal = { ...meals[mealIndex] };
    const items = [...meal.items];

    const oldItem = items[slotIndex];
    const newItem: MealItem = {
      food: newFood,
      servings: oldItem.servings,
      deficienciesAddressed: deficiencies
        .filter(d => newFood.nutrients[d.nutrientId] > 0)
        .map(d => d.nutrientId),
    };
    items[slotIndex] = newItem;

    // Recalculate meal totals
    meal.items = items;
    meal.totalCalories = items.reduce((s, i) => s + i.food.calories * i.servings, 0);
    meal.nutrientCoverage = {};
    items.forEach(item => {
      Object.entries(item.food.nutrients).forEach(([nId, amt]) => {
        meal.nutrientCoverage[nId] = (meal.nutrientCoverage[nId] || 0) + amt * item.servings;
      });
    });

    meals[mealIndex] = meal;
    day.meals = meals;

    // Recalculate day totals
    day.totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
    day.nutrientTotals = {};
    meals.forEach(m => {
      Object.entries(m.nutrientCoverage).forEach(([nId, amt]) => {
        day.nutrientTotals[nId] = (day.nutrientTotals[nId] || 0) + amt;
      });
    });

    updatedDays[selectedDay] = day;
    setPlan({ ...plan, days: updatedDays });
    setSwapModal(null);
  };

  // ─── Current day data ────────────────────────────────────────────
  const currentDay = plan?.days[selectedDay];

  // ─── Deficiency coverage for current day ─────────────────────────
  const dayCoverage = useMemo(() => {
    if (!currentDay || deficiencies.length === 0) return [];
    return deficiencies.map(def => {
      const amount = currentDay.nutrientTotals[def.nutrientId] || 0;
      const percent = getNutrientRdaPercent(def.nutrientId, amount);
      const info = getNutrientInfo(def.nutrientId);
      return {
        ...def,
        amount,
        percent,
        unit: info?.unit || '',
        rda: info?.rda || '?',
      };
    });
  }, [currentDay, deficiencies]);

  // ─── Weekly average coverage ─────────────────────────────────────
  const weeklyAvgCoverage = useMemo(() => {
    if (!plan || deficiencies.length === 0) return [];
    return deficiencies.map(def => {
      const avg = plan.weeklyNutrientAverages[def.nutrientId] || 0;
      const percent = getNutrientRdaPercent(def.nutrientId, avg);
      const info = getNutrientInfo(def.nutrientId);
      return { ...def, amount: avg, percent, unit: info?.unit || '', rda: info?.rda || '?' };
    });
  }, [plan, deficiencies]);

  // ─── Not authenticated ───────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Personalized Meal Plans</h1>
          <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            Get AI-powered meal plans tailored to your nutrient deficiencies from blood tests and symptom assessments.
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Sign in to get started
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  // ─── No plan yet — Generation screen ─────────────────────────────
  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Personalized Nutrition
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              Meal Plan Builder
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              Generate a 7-day meal plan tailored to your nutrient deficiencies, with breakfast, lunch, dinner, and snacks.
            </p>
          </div>

          {/* Deficiency sources */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Assessment deficiencies */}
            <div className={`p-5 rounded-2xl border ${
              assessmentComplete ? 'bg-white border-emerald-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  assessmentComplete ? 'bg-emerald-100' : 'bg-gray-200'
                }`}>
                  <Target className={`w-5 h-5 ${assessmentComplete ? 'text-emerald-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Symptom Assessment</h3>
                  <p className="text-xs text-gray-500">
                    {assessmentComplete
                      ? `${results.filter(r => r.priority === 'critical' || r.priority === 'moderate').length} deficiencies detected`
                      : 'Not completed yet'
                    }
                  </p>
                </div>
                {assessmentComplete && <Check className="w-5 h-5 text-emerald-500 ml-auto" />}
              </div>
              {assessmentComplete ? (
                <div className="flex flex-wrap gap-1">
                  {results.slice(0, 6).map(r => (
                    <span key={r.nutrient.id} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      r.priority === 'critical' ? 'bg-red-50 text-red-600' :
                      r.priority === 'moderate' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {r.nutrient.name}
                    </span>
                  ))}
                  {results.length > 6 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      +{results.length - 6} more
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setCurrentView('assessment')}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  Take assessment <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Blood test deficiencies */}
            <div className={`p-5 rounded-2xl border ${
              bloodTestDeficiencies.length > 0 ? 'bg-white border-rose-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  bloodTestDeficiencies.length > 0 ? 'bg-rose-100' : 'bg-gray-200'
                }`}>
                  <Heart className={`w-5 h-5 ${bloodTestDeficiencies.length > 0 ? 'text-rose-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Blood Test Results</h3>
                  <p className="text-xs text-gray-500">
                    {bloodTestDeficiencies.length > 0
                      ? `${bloodTestDeficiencies.length} nutrient deficiencies found`
                      : 'No blood tests uploaded yet'
                    }
                  </p>
                </div>
                {bloodTestDeficiencies.length > 0 && <Check className="w-5 h-5 text-rose-500 ml-auto" />}
              </div>
              {bloodTestDeficiencies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {bloodTestDeficiencies.slice(0, 6).map(d => (
                    <span key={d.nutrientId} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      d.priority === 'critical' ? 'bg-red-50 text-red-600' :
                      d.priority === 'moderate' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {d.nutrientName}
                    </span>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setCurrentView('blood-tests')}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  Upload blood test <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Merged deficiencies summary */}
          {deficiencies.length > 0 && (
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 p-5 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-bold text-gray-900">
                  {deficiencies.length} nutrient deficiencies to address
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {deficiencies.map(d => (
                  <span key={d.nutrientId} className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
                    d.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    d.priority === 'moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {d.nutrientName}
                    {d.source === 'both' && (
                      <span className="ml-1 text-[9px] opacity-60">2 sources</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* No deficiencies warning */}
          {deficiencies.length === 0 && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">No deficiency data available</h4>
                  <p className="text-xs text-gray-600">
                    Complete a symptom assessment or upload blood test results to get personalized meal plans.
                    You can still generate a general balanced meal plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <div className="text-center">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Your Plan...
                </>
              ) : (
                <>
                  <ChefHat className="w-5 h-5" />
                  Generate 7-Day Meal Plan
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Personalized for your {deficiencies.length > 0 ? `${deficiencies.length} nutrient deficiencies` : 'general nutrition needs'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Plan View ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              Your 7-Day Meal Plan
            </h1>
            <p className="text-gray-500 mt-1 ml-14 text-sm">
              {deficiencies.length > 0
                ? `Optimized for ${deficiencies.length} nutrient deficiencies`
                : 'Balanced nutrition plan'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 ml-14 md:ml-0">
            <button
              onClick={() => setPlan(null)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {([
            { id: 'plan' as TabView, label: 'Meal Plan', icon: <Calendar className="w-4 h-4" /> },
            { id: 'coverage' as TabView, label: 'Nutrient Coverage', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'grocery' as TabView, label: 'Grocery List', icon: <ShoppingCart className="w-4 h-4" /> },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── PLAN TAB ──────────────────────────────────────────── */}
        {activeTab === 'plan' && currentDay && (
          <div>
            {/* Day selector */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setSelectedDay(Math.max(0, selectedDay - 1))}
                disabled={selectedDay === 0}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 flex gap-1 overflow-x-auto pb-1">
                {plan.days.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`flex-1 min-w-[80px] py-2.5 px-2 rounded-xl text-center transition-all ${
                      selectedDay === i
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="text-xs font-bold">{day.dayLabel.slice(0, 3)}</div>
                    <div className={`text-[10px] mt-0.5 ${selectedDay === i ? 'text-white/80' : 'text-gray-400'}`}>
                      {day.totalCalories} cal
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedDay(Math.min(6, selectedDay + 1))}
                disabled={selectedDay === 6}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{currentDay.dayLabel}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {currentDay.totalCalories} calories
                  </span>
                  <span className="flex items-center gap-1">
                    <Apple className="w-3 h-3 text-green-500" />
                    {currentDay.meals.reduce((s, m) => s + m.items.length, 0)} foods
                  </span>
                  <span className="flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-teal-500" />
                    {Object.keys(currentDay.nutrientTotals).length} nutrients
                  </span>
                </div>
              </div>
              <button
                onClick={regenerateDay}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle Day
              </button>
            </div>

            {/* Meals */}
            <div className="space-y-4">
              {currentDay.meals.map((meal, mealIdx) => {
                const config = MEAL_CONFIG[meal.type];
                const Icon = config.icon;

                return (
                  <div key={meal.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${config.border}`}>
                    {/* Meal header */}
                    <div className={`flex items-center gap-3 px-4 py-3 ${config.bg}`}>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center shadow-sm`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-sm font-bold ${config.text}`}>{config.label}</h3>
                        <p className="text-[10px] text-gray-500">{meal.totalCalories} cal</p>
                      </div>
                    </div>

                    {/* Food items */}
                    <div className="p-3 space-y-2">
                      {meal.items.map((item, slotIdx) => (
                        <div
                          key={`${item.food.id}-${slotIdx}`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Apple className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800 truncate">{item.food.name}</span>
                              <span className="text-[10px] text-gray-400">{item.food.servingSize}</span>
                            </div>
                            {item.deficienciesAddressed.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.deficienciesAddressed.slice(0, 4).map(nId => {
                                  const n = getNutrientInfo(nId);
                                  const def = deficiencies.find(d => d.nutrientId === nId);
                                  return (
                                    <span key={nId} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                      def?.priority === 'critical' ? 'bg-red-50 text-red-600' :
                                      def?.priority === 'moderate' ? 'bg-amber-50 text-amber-600' :
                                      'bg-teal-50 text-teal-600'
                                    }`}>
                                      {n?.name || nId}
                                    </span>
                                  );
                                })}
                                {item.deficienciesAddressed.length > 4 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                    +{item.deficienciesAddressed.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">{item.food.calories} cal</span>
                            <button
                              onClick={() => setSwapModal({
                                mealIndex: mealIdx,
                                slotIndex: slotIdx,
                                currentFood: item.food,
                                mealType: meal.type,
                              })}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-teal-600 hover:bg-teal-50 transition-colors opacity-0 group-hover:opacity-100"
                              title="Swap food"
                            >
                              <Shuffle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Meal nutrient highlights */}
                    {deficiencies.length > 0 && (
                      <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-2">
                          {deficiencies.slice(0, 5).map(def => {
                            const amount = meal.nutrientCoverage[def.nutrientId] || 0;
                            if (amount === 0) return null;
                            const percent = getNutrientRdaPercent(def.nutrientId, amount);
                            return (
                              <div key={def.nutrientId} className="flex items-center gap-1.5">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      percent >= 30 ? 'bg-emerald-400' : percent >= 15 ? 'bg-amber-400' : 'bg-gray-300'
                                    }`}
                                    style={{ width: `${Math.min(percent, 100)}%` }}
                                  />
                                </div>
                                <span className="text-[9px] text-gray-500 whitespace-nowrap">
                                  {def.nutrientName.replace('Vitamin ', 'Vit ').replace('(Omega-3)', '')} {percent}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── COVERAGE TAB ──────────────────────────────────────── */}
        {activeTab === 'coverage' && (
          <div className="space-y-6">
            {/* Daily coverage */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                Daily Nutrient Coverage — {plan.days[selectedDay]?.dayLabel}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                How much of your daily recommended intake each meal plan day covers for your deficient nutrients.
              </p>

              {/* Day selector mini */}
              <div className="flex gap-1 mb-4">
                {plan.days.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedDay === i
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {d.dayLabel.slice(0, 3)}
                  </button>
                ))}
              </div>

              {dayCoverage.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  <Info className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No deficiency data. Complete an assessment or upload blood tests.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayCoverage.map(item => (
                    <div key={item.nutrientId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            item.priority === 'critical' ? 'bg-red-500' :
                            item.priority === 'moderate' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-xs font-semibold text-gray-800">{item.nutrientName}</span>
                          {item.source === 'both' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">
                              2 sources
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">{Math.round(item.amount * 10) / 10}</span>
                          <span className="text-gray-400"> / {item.rda} {item.unit}</span>
                          <span className={`ml-2 font-bold ${
                            item.percent >= 80 ? 'text-emerald-600' :
                            item.percent >= 40 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {item.percent}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.percent >= 80 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                            item.percent >= 40 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                            'bg-gradient-to-r from-red-400 to-orange-500'
                          }`}
                          style={{ width: `${Math.min(item.percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly averages */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Weekly Average Coverage
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Average daily nutrient intake across the full 7-day plan.
              </p>

              {weeklyAvgCoverage.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {weeklyAvgCoverage.map(item => (
                    <div key={item.nutrientId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                        item.percent >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        item.percent >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.percent}%
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{item.nutrientName}</div>
                        <div className="text-[10px] text-gray-400">
                          {Math.round(item.amount * 10) / 10} / {item.rda} {item.unit} daily avg
                        </div>
                      </div>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.priority === 'critical' ? 'bg-red-500' :
                        item.priority === 'moderate' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-500">
                  No deficiency data available.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── GROCERY TAB ───────────────────────────────────────── */}
        {activeTab === 'grocery' && (
          <GroceryList plan={plan} />
        )}
      </div>

      {/* ─── Swap Modal ──────────────────────────────────────────── */}
      {swapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Swap Food</h3>
                <p className="text-xs text-gray-500">
                  Replace <span className="font-semibold">{swapModal.currentFood.name}</span>
                </p>
              </div>
              <button
                onClick={() => setSwapModal(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-3 space-y-1.5">
              {getAlternativeFoods(
                swapModal.mealType,
                swapModal.slotIndex,
                swapModal.currentFood.id,
                deficiencies
              ).map(alt => (
                <button
                  key={alt.food.id}
                  onClick={() => swapFood(swapModal.mealIndex, swapModal.slotIndex, alt.food)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-teal-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Apple className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{alt.food.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {alt.food.servingSize} · {alt.food.calories} cal
                    </div>
                    {alt.addressedIds.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {alt.addressedIds.slice(0, 3).map(nId => {
                          const n = getNutrientInfo(nId);
                          return (
                            <span key={nId} className="text-[8px] px-1 py-0.5 rounded bg-teal-50 text-teal-600 font-medium">
                              {n?.name || nId}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 flex-shrink-0">
                    Score: {Math.round(alt.score)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanBuilder;
