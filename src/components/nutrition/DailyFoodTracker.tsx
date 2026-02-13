import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAssessment } from '@/context/AssessmentContext';
import { supabase } from '@/lib/supabase';
import { allNutrients } from '@/data/nutrients';
import { foodDatabase, searchFoods, foodCategories, FoodItem } from '@/data/foodDatabase';
import { getAllReports, SavedNutrientResult } from '@/utils/reportStorage';
import NutrientProgressSummary from './NutrientProgressSummary';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Search, X, Trash2,
  Loader2, UtensilsCrossed, Apple, Clock, StickyNote, AlertTriangle,
  ArrowRight, Filter, BarChart3, ListOrdered, ChevronDown, Edit3,
  Save, Info, Flame, Target
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────
interface DailyLog {
  id: string;
  food_name: string;
  serving_size: string;
  nutrients: Record<string, number>;
  notes: string | null;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────
function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(d: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (formatDateKey(d) === formatDateKey(today)) return 'Today';
  if (formatDateKey(d) === formatDateKey(yesterday)) return 'Yesterday';
  if (formatDateKey(d) === formatDateKey(tomorrow)) return 'Tomorrow';

  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── Main Component ────────────────────────────────────────────────────
const DailyFoodTracker: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { setCurrentView } = useAssessment();

  // Date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Food log state
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Food entry state
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [customFoodName, setCustomFoodName] = useState('');
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [foodNotes, setFoodNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // View state
  const [activeTab, setActiveTab] = useState<'log' | 'progress'>('log');
  const [progressFilter, setProgressFilter] = useState<'flagged' | 'tracked' | 'all'>('flagged');

  // Deficiency data
  const [flaggedNutrients, setFlaggedNutrients] = useState<SavedNutrientResult[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // ─── Load flagged nutrients from latest report ───────────────────
  useEffect(() => {
    const reports = getAllReports();
    if (reports.length > 0) {
      const latest = reports[0];
      setFlaggedNutrients(latest.results);
    }
  }, []);

  // ─── Load daily logs ─────────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setIsLoading(true);
    try {
      const dateKey = formatDateKey(selectedDate);
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateKey)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to load daily logs:', error);
      } else {
        setLogs((data || []) as DailyLog[]);
      }
    } catch (err) {
      console.error('Error loading daily logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, selectedDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // ─── Search foods ────────────────────────────────────────────────
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setSearchResults(searchFoods(searchQuery));
      setActiveCategory(null);
    } else if (searchQuery.trim().length === 0) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // ─── Close date picker on outside click ──────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── Calculate daily intake totals ───────────────────────────────
  const dailyIntake = useMemo(() => {
    const totals: Record<string, number> = {};
    logs.forEach(log => {
      if (log.nutrients) {
        Object.entries(log.nutrients).forEach(([nutrientId, amount]) => {
          totals[nutrientId] = (totals[nutrientId] || 0) + (amount as number);
        });
      }
    });
    return totals;
  }, [logs]);

  // ─── Calculate total calories ────────────────────────────────────
  const totalCalories = useMemo(() => {
    return logs.reduce((sum, log) => {
      // Try to find the food in our database to get calories
      const food = foodDatabase.find(f => f.name === log.food_name);
      return sum + (food?.calories || 0);
    }, 0);
  }, [logs]);

  // ─── Date navigation ────────────────────────────────────────────
  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const goToToday = () => setSelectedDate(new Date());

  // ─── Add food log ────────────────────────────────────────────────
  const handleAddFood = async () => {
    if (!isAuthenticated || !user) return;
    if (!selectedFood && !customFoodName.trim()) return;

    setIsSaving(true);
    try {
      const foodName = selectedFood ? selectedFood.name : customFoodName.trim();
      const servingSize = selectedFood
        ? `${servingMultiplier > 1 ? servingMultiplier + 'x ' : ''}${selectedFood.servingSize}`
        : '1 serving';

      // Calculate nutrients with multiplier
      const nutrients: Record<string, number> = {};
      if (selectedFood) {
        Object.entries(selectedFood.nutrients).forEach(([id, amount]) => {
          nutrients[id] = amount * servingMultiplier;
        });
      }

      const { error } = await supabase
        .from('daily_logs')
        .insert({
          user_id: user.id,
          date: formatDateKey(selectedDate),
          food_name: foodName,
          serving_size: servingSize,
          nutrients,
          notes: foodNotes.trim() || null,
        });

      if (error) {
        console.error('Failed to add food log:', error);
        return;
      }

      // Reset form
      setSelectedFood(null);
      setCustomFoodName('');
      setSearchQuery('');
      setSearchResults([]);
      setServingMultiplier(1);
      setFoodNotes('');
      setShowAddForm(false);
      setActiveCategory(null);

      // Reload logs
      await loadLogs();
    } catch (err) {
      console.error('Error adding food log:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete food log ─────────────────────────────────────────────
  const handleDeleteLog = async (logId: string) => {
    if (!isAuthenticated || !user) return;
    try {
      const { error } = await supabase
        .from('daily_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to delete log:', error);
        return;
      }
      setLogs(prev => prev.filter(l => l.id !== logId));
    } catch (err) {
      console.error('Error deleting log:', err);
    }
  };

  // ─── Update notes ────────────────────────────────────────────────
  const handleUpdateNotes = async (logId: string) => {
    if (!isAuthenticated || !user) return;
    try {
      const { error } = await supabase
        .from('daily_logs')
        .update({ notes: editNotes.trim() || null })
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update notes:', error);
        return;
      }
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, notes: editNotes.trim() || null } : l));
      setEditingLogId(null);
    } catch (err) {
      console.error('Error updating notes:', err);
    }
  };

  // ─── Browse by category ──────────────────────────────────────────
  const categoryFoods = activeCategory
    ? foodDatabase.filter(f => f.category === activeCategory)
    : [];

  // ─── Not authenticated state ─────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Daily Food Tracker
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Log your daily food intake and track how your nutrition compares to recommended values.
            Sign in to start tracking your meals.
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all"
          >
            Sign In to Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-semibold mb-4">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Daily Nutrient Tracking
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Food Tracker
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Log what you eat and see how your daily intake compares to recommended values — especially for nutrients you're deficient in.
          </p>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevDay}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="relative flex-1 text-center" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4 text-teal-500" />
                <span className="font-semibold text-gray-900">{formatDisplayDate(selectedDate)}</span>
                <span className="text-sm text-gray-400">{formatFullDate(selectedDate)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {showDatePicker && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-30 w-72">
                  <input
                    type="date"
                    value={formatDateKey(selectedDate)}
                    onChange={(e) => {
                      const d = new Date(e.target.value + 'T12:00:00');
                      setSelectedDate(d);
                      setShowDatePicker(false);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => { goToToday(); setShowDatePicker(false); }}
                    className="w-full mt-2 px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    Go to Today
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day summary bar */}
          <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5 text-sm">
              <Apple className="w-4 h-4 text-green-500" />
              <span className="text-gray-500">{logs.length} foods logged</span>
            </div>
            {totalCalories > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-gray-500">~{totalCalories} cal</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm">
              <Target className="w-4 h-4 text-teal-500" />
              <span className="text-gray-500">
                {Object.keys(dailyIntake).length} nutrients tracked
              </span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('log')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'log'
                ? 'bg-white text-gray-900 shadow-md border border-gray-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Food Log
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'progress'
                ? 'bg-white text-gray-900 shadow-md border border-gray-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Nutrient Progress
            {flaggedNutrients.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>

        {/* ─── Food Log Tab ──────────────────────────────────────── */}
        {activeTab === 'log' && (
          <div className="space-y-4">
            {/* Add food button */}
            {!showAddForm && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex items-center justify-center gap-2 text-gray-500 hover:text-teal-700"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Food</span>
              </button>
            )}

            {/* Add food form */}
            {showAddForm && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Add Food</h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setSelectedFood(null);
                        setSearchQuery('');
                        setSearchResults([]);
                        setCustomFoodName('');
                        setActiveCategory(null);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Food selected state */}
                  {selectedFood ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                        <Apple className="w-5 h-5 text-teal-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">{selectedFood.name}</div>
                          <div className="text-xs text-gray-500">{selectedFood.servingSize} · {selectedFood.calories} cal</div>
                        </div>
                        <button
                          onClick={() => { setSelectedFood(null); setSearchQuery(''); }}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Serving multiplier */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Servings</label>
                        <div className="flex items-center gap-2">
                          {[0.5, 1, 1.5, 2, 3].map(mult => (
                            <button
                              key={mult}
                              onClick={() => setServingMultiplier(mult)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                servingMultiplier === mult
                                  ? 'bg-teal-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {mult}x
                            </button>
                          ))}
                          <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={servingMultiplier}
                            onChange={(e) => setServingMultiplier(parseFloat(e.target.value) || 1)}
                            className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      {/* Nutrient preview */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Key Nutrients</label>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(selectedFood.nutrients).slice(0, 8).map(([nId, amount]) => {
                            const nutrient = allNutrients.find(n => n.id === nId);
                            if (!nutrient) return null;
                            const isFlagged = flaggedNutrients.some(f => f.nutrientId === nId);
                            return (
                              <span
                                key={nId}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  isFlagged
                                    ? 'bg-red-50 text-red-700 border border-red-100'
                                    : 'bg-gray-50 text-gray-600 border border-gray-100'
                                }`}
                              >
                                {nutrient.name}: {Math.round(amount * servingMultiplier * 10) / 10} {nutrient.unit}
                                {isFlagged && <AlertTriangle className="w-2.5 h-2.5 inline ml-0.5" />}
                              </span>
                            );
                          })}
                          {Object.keys(selectedFood.nutrients).length > 8 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400">
                              +{Object.keys(selectedFood.nutrients).length - 8} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Notes (optional)</label>
                        <input
                          type="text"
                          value={foodNotes}
                          onChange={(e) => setFoodNotes(e.target.value)}
                          placeholder="e.g., breakfast, with olive oil..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      </div>

                      {/* Add button */}
                      <button
                        onClick={handleAddFood}
                        disabled={isSaving}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.01] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add to Log
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Search input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search foods (e.g., salmon, spinach, almonds...)"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Search results */}
                      {searchResults.length > 0 && (
                        <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
                          {searchResults.map(food => {
                            const hasFlagged = flaggedNutrients.some(f => food.nutrients[f.nutrientId]);
                            return (
                              <button
                                key={food.id}
                                onClick={() => {
                                  setSelectedFood(food);
                                  setSearchQuery('');
                                  setSearchResults([]);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-teal-50 transition-colors group"
                              >
                                <Apple className="w-4 h-4 text-gray-400 group-hover:text-teal-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 truncate">{food.name}</span>
                                    {hasFlagged && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold flex-shrink-0">
                                        has flagged nutrients
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400">{food.servingSize} · {food.calories} cal · {food.category}</div>
                                </div>
                                <Plus className="w-4 h-4 text-gray-300 group-hover:text-teal-500 flex-shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {searchQuery.length >= 2 && searchResults.length === 0 && (
                        <div className="text-center py-4 text-sm text-gray-500">
                          <p>No foods found for "{searchQuery}"</p>
                          <button
                            onClick={() => {
                              setCustomFoodName(searchQuery);
                              setSelectedFood(null);
                            }}
                            className="mt-2 text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Add as custom food
                          </button>
                        </div>
                      )}

                      {/* Category browser */}
                      {!searchQuery && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-2 block">Browse by Category</label>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {foodCategories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  activeCategory === cat
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>

                          {activeCategory && (
                            <div className="max-h-52 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
                              {categoryFoods.map(food => {
                                const hasFlagged = flaggedNutrients.some(f => food.nutrients[f.nutrientId]);
                                return (
                                  <button
                                    key={food.id}
                                    onClick={() => {
                                      setSelectedFood(food);
                                      setActiveCategory(null);
                                    }}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-teal-50 transition-colors group"
                                  >
                                    <Apple className="w-4 h-4 text-gray-400 group-hover:text-teal-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium text-gray-900">{food.name}</span>
                                      <span className="text-xs text-gray-400 ml-2">{food.calories} cal</span>
                                      {hasFlagged && (
                                        <AlertTriangle className="w-3 h-3 text-red-400 inline ml-1" />
                                      )}
                                    </div>
                                    <Plus className="w-4 h-4 text-gray-300 group-hover:text-teal-500" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Custom food entry */}
                      {customFoodName && (
                        <div className="space-y-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-amber-500" />
                            <span className="text-xs text-amber-700 font-medium">Custom food (no nutrient data)</span>
                          </div>
                          <input
                            type="text"
                            value={customFoodName}
                            onChange={(e) => setCustomFoodName(e.target.value)}
                            placeholder="Food name"
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <input
                            type="text"
                            value={foodNotes}
                            onChange={(e) => setFoodNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddFood}
                              disabled={isSaving || !customFoodName.trim()}
                              className="flex-1 py-2 bg-amber-500 text-white font-medium rounded-lg text-sm hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                              Add Custom Food
                            </button>
                            <button
                              onClick={() => setCustomFoodName('')}
                              className="px-4 py-2 bg-white text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-50 border border-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading food log...</span>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && logs.length === 0 && !showAddForm && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No foods logged</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start logging what you eat to track your nutrient intake for {formatDisplayDate(selectedDate).toLowerCase()}.
                </p>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Food
                </button>
              </div>
            )}

            {/* Food log list */}
            {!isLoading && logs.length > 0 && (
              <div className="space-y-2">
                {logs.map((log, idx) => {
                  const food = foodDatabase.find(f => f.name === log.food_name);
                  const hasNutrients = log.nutrients && Object.keys(log.nutrients).length > 0;
                  const flaggedInFood = hasNutrients
                    ? flaggedNutrients.filter(f => log.nutrients[f.nutrientId])
                    : [];

                  return (
                    <div
                      key={log.id}
                      className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Apple className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">{log.food_name}</span>
                            <span className="text-xs text-gray-400">{log.serving_size}</span>
                            {food && (
                              <span className="text-xs text-gray-400">{food.calories} cal</span>
                            )}
                          </div>

                          {/* Flagged nutrients in this food */}
                          {flaggedInFood.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {flaggedInFood.slice(0, 4).map(f => {
                                const amount = log.nutrients[f.nutrientId];
                                const nutrient = allNutrients.find(n => n.id === f.nutrientId);
                                return (
                                  <span
                                    key={f.nutrientId}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                      f.priority === 'critical' ? 'bg-red-50 text-red-600' :
                                      f.priority === 'moderate' ? 'bg-amber-50 text-amber-600' :
                                      'bg-blue-50 text-blue-500'
                                    }`}
                                  >
                                    {nutrient?.name}: +{Math.round(amount * 10) / 10}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Notes */}
                          {editingLogId === log.id ? (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                placeholder="Add a note..."
                                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateNotes(log.id);
                                  if (e.key === 'Escape') setEditingLogId(null);
                                }}
                              />
                              <button
                                onClick={() => handleUpdateNotes(log.id)}
                                className="p-1 rounded text-teal-600 hover:bg-teal-50"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingLogId(null)}
                                className="p-1 rounded text-gray-400 hover:bg-gray-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : log.notes ? (
                            <button
                              onClick={() => { setEditingLogId(log.id); setEditNotes(log.notes || ''); }}
                              className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 hover:text-gray-600"
                            >
                              <StickyNote className="w-3 h-3" />
                              {log.notes}
                            </button>
                          ) : null}

                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatTime(log.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!log.notes && editingLogId !== log.id && (
                            <button
                              onClick={() => { setEditingLogId(log.id); setEditNotes(''); }}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
                              title="Add note"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Nutrient Progress Tab ─────────────────────────────── */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-2">
              <button
                onClick={() => setProgressFilter('flagged')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  progressFilter === 'flagged'
                    ? 'bg-red-50 text-red-700 border border-red-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Flagged ({flaggedNutrients.length})
              </button>
              <button
                onClick={() => setProgressFilter('tracked')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  progressFilter === 'tracked'
                    ? 'bg-teal-50 text-teal-700 border border-teal-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Tracked ({Object.keys(dailyIntake).length})
              </button>
              <button
                onClick={() => setProgressFilter('all')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  progressFilter === 'all'
                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                All Nutrients
              </button>
            </div>

            {/* Info banner for flagged view */}
            {progressFilter === 'flagged' && flaggedNutrients.length > 0 && (
              <div className="p-3 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-100/50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      Tracking {flaggedNutrients.length} flagged deficiencies from your latest assessment
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Focus on eating foods rich in these nutrients to address your deficiency risks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress summary */}
            <NutrientProgressSummary
              dailyIntake={dailyIntake}
              flaggedNutrients={flaggedNutrients}
              filterMode={progressFilter}
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default DailyFoodTracker;
