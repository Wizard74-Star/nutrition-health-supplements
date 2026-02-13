import React, { useState, useMemo } from 'react';
import {
  bloodMarkers, evaluateMarkerValue, getSeverityInfo,
  BloodMarker, SeverityLevel
} from '@/data/bloodMarkers';
import { supplementDatabase, SupplementInfo } from '@/data/supplementDatabase';
import { allNutrients } from '@/data/nutrients';
import { PendingSupplementAdd } from '@/context/AssessmentContext';
import {
  Pill, Plus, Check, ChevronDown, ChevronUp, Beaker, ArrowRight,
  AlertTriangle, AlertOctagon, Info, Sparkles, Zap, Clock,
  TrendingDown, Shield, Package, Tag, ExternalLink, CheckCircle2
} from 'lucide-react';

export interface StoredMarkerResult {
  markerId: string;
  value: number;
  unit: string;
}

interface SupplementSuggestion {
  recommendationText: string;
  matchedSupplement: SupplementInfo | null;
  priority: number; // 1-3
  sourceMarkers: string[];
  nutrientIds: string[];
  isLow: boolean;
  parsedDosage: string;
  parsedUnit: string;
  parsedTiming: string;
  parsedNotes: string;
}

interface BloodTestSupplementBridgeProps {
  markers: StoredMarkerResult[];
  existingSupplementNames: string[];
  onAddToStack: (data: PendingSupplementAdd) => void;
  addedSupplements: Set<string>; // Track which have been added in this session
  onMarkAdded: (name: string) => void;
}

// Parse dosage info from recommendation text like "Vitamin D3 (cholecalciferol) 2000-5000 IU daily"
function parseDosageFromText(text: string): { dosage: string; unit: string } {
  // Try to find patterns like "200-400 mg", "1000 mcg", "2000-5000 IU"
  const dosageMatch = text.match(/(\d[\d,]*(?:\s*-\s*\d[\d,]*)?)\s*(mg|mcg|g|IU|mcg\/day|mg\/day)/i);
  if (dosageMatch) {
    let dosage = dosageMatch[1].replace(/,/g, '');
    // If it's a range like "200-400", take the lower value as starting point
    if (dosage.includes('-')) {
      dosage = dosage.split('-')[0].trim();
    }
    return { dosage, unit: dosageMatch[2].replace(/\/day/i, '') };
  }
  return { dosage: '', unit: 'mg' };
}

// Parse timing from recommendation text
function parseTimingFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('bedtime') || lower.includes('evening') || lower.includes('night')) return 'evening';
  if (lower.includes('empty stomach') || lower.includes('morning')) return 'morning';
  if (lower.includes('with meal') || lower.includes('with food') || lower.includes('fatty meal')) return 'with-meals';
  if (lower.includes('afternoon')) return 'afternoon';
  return 'morning';
}

// Try to match recommendation text to a supplement in the database
function matchToDatabase(text: string, nutrientIds: string[]): SupplementInfo | null {
  const lower = text.toLowerCase();

  // Direct name matching (best match)
  for (const supp of supplementDatabase) {
    const suppLower = supp.name.toLowerCase();
    // Check if the supplement name appears in the recommendation
    if (lower.includes(suppLower) || suppLower.includes(lower.split(' ')[0])) {
      return supp;
    }
  }

  // Keyword matching
  const keywordMap: Record<string, string[]> = {
    'iron bisglycinate': ['Iron (Ferrous Bisglycinate)', 'Iron + Vitamin C'],
    'iron supplement': ['Iron (Ferrous Bisglycinate)'],
    'iron': ['Iron (Ferrous Bisglycinate)'],
    'vitamin d3': ['Vitamin D3', 'Vitamin D3 + K2 Combo'],
    'vitamin d': ['Vitamin D3'],
    'vitamin k2': ['Vitamin K2 (MK-7)', 'Vitamin D3 + K2 Combo'],
    'methylcobalamin': ['Vitamin B12 (Methylcobalamin)'],
    'vitamin b12': ['Vitamin B12 (Methylcobalamin)'],
    'b12': ['Vitamin B12 (Methylcobalamin)'],
    'methylfolate': ['Vitamin B9 (Folate/Folic Acid)'],
    'folate': ['Vitamin B9 (Folate/Folic Acid)'],
    'folic acid': ['Vitamin B9 (Folate/Folic Acid)'],
    'vitamin c': ['Vitamin C'],
    'ascorbic acid': ['Vitamin C'],
    'magnesium glycinate': ['Magnesium Glycinate'],
    'magnesium threonate': ['Magnesium Threonate'],
    'magnesium': ['Magnesium Glycinate'],
    'zinc picolinate': ['Zinc Picolinate'],
    'zinc carnosine': ['Zinc Picolinate'],
    'zinc': ['Zinc Picolinate'],
    'selenium': ['Selenium'],
    'selenomethionine': ['Selenium'],
    'calcium citrate': ['Calcium'],
    'calcium': ['Calcium'],
    'omega-3': ['Fish Oil (EPA/DHA)'],
    'fish oil': ['Fish Oil (EPA/DHA)'],
    'epa': ['Fish Oil (EPA/DHA)', 'EPA (Omega-3)'],
    'dha': ['Fish Oil (EPA/DHA)', 'DHA (Omega-3)'],
    'b-complex': ['Vitamin B Complex'],
    'b complex': ['Vitamin B Complex'],
    'vitamin b6': ['Vitamin B6 (Pyridoxine)'],
    'p5p': ['Vitamin B6 (Pyridoxine)'],
    'pyridoxal': ['Vitamin B6 (Pyridoxine)'],
    'vitamin e': ['Vitamin E'],
    'tocopherol': ['Vitamin E'],
    'vitamin a': ['Vitamin A (Retinol)'],
    'beta-carotene': ['Vitamin A (Retinol)'],
    'chromium': ['Chromium Picolinate'],
    'iodine': ['Iodine'],
    'potassium': ['Potassium'],
    'copper': ['Copper'],
    'niacin': ['Vitamin B Complex'],
    'coq10': [],
    'curcumin': [],
    'berberine': [],
  };

  for (const [keyword, suppNames] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      for (const name of suppNames) {
        const found = supplementDatabase.find(s => s.name === name);
        if (found) return found;
      }
    }
  }

  // Fallback: match by nutrient IDs
  if (nutrientIds.length > 0) {
    const matches = supplementDatabase.filter(s =>
      s.nutrientIds.some(nId => nutrientIds.includes(nId))
    );
    // Prefer single-nutrient supplements over multis
    const singleMatch = matches.find(m => m.nutrientIds.length <= 2);
    if (singleMatch) return singleMatch;
    if (matches.length > 0) return matches[0];
  }

  return null;
}

const BloodTestSupplementBridge: React.FC<BloodTestSupplementBridgeProps> = ({
  markers, existingSupplementNames, onAddToStack, addedSupplements, onMarkAdded
}) => {
  const [expandedSection, setExpandedSection] = useState<'suggestions' | 'all' | null>('suggestions');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Evaluate all markers and build supplement suggestions
  const suggestions = useMemo(() => {
    const suggMap = new Map<string, SupplementSuggestion>();

    markers.forEach(m => {
      const marker = bloodMarkers.find(bm => bm.id === m.markerId);
      if (!marker) return;

      const severity = evaluateMarkerValue(marker, m.value);
      if (severity === 'normal') return;

      const isLow = severity.includes('low');
      const isCritical = severity.includes('critical');
      const priority = isCritical ? 3 : (severity === 'low' || severity === 'high') ? 2 : 1;

      const supps = isLow ? marker.supplementRecommendations.whenLow : marker.supplementRecommendations.whenHigh;

      supps.forEach(recText => {
        const existing = suggMap.get(recText);
        if (existing) {
          existing.sourceMarkers.push(marker.name);
          existing.priority = Math.max(existing.priority, priority);
          marker.nutrientIds.forEach(nId => {
            if (!existing.nutrientIds.includes(nId)) existing.nutrientIds.push(nId);
          });
        } else {
          const matched = matchToDatabase(recText, marker.nutrientIds);
          const { dosage, unit } = parseDosageFromText(recText);
          const timing = matched?.bestTimeOfDay || parseTimingFromText(recText);

          suggMap.set(recText, {
            recommendationText: recText,
            matchedSupplement: matched,
            priority,
            sourceMarkers: [marker.name],
            nutrientIds: [...marker.nutrientIds],
            isLow,
            parsedDosage: matched?.commonDosages[0] || dosage,
            parsedUnit: matched?.defaultUnit || unit,
            parsedTiming: timing,
            parsedNotes: matched?.tips || `Recommended based on blood test results. ${recText}`,
          });
        }
      });
    });

    return Array.from(suggMap.values())
      .sort((a, b) => b.priority - a.priority || b.sourceMarkers.length - a.sourceMarkers.length);
  }, [markers]);

  // Separate into actionable (matched to DB) and informational
  const actionableSuggestions = suggestions.filter(s => s.matchedSupplement);
  const informationalSuggestions = suggestions.filter(s => !s.matchedSupplement);

  // Check which are already in stack
  const existingNamesLower = existingSupplementNames.map(n => n.toLowerCase());

  const isInStack = (sugg: SupplementSuggestion): boolean => {
    if (!sugg.matchedSupplement) return false;
    return existingNamesLower.includes(sugg.matchedSupplement.name.toLowerCase());
  };

  const isJustAdded = (sugg: SupplementSuggestion): boolean => {
    if (!sugg.matchedSupplement) return false;
    return addedSupplements.has(sugg.matchedSupplement.name);
  };

  const handleAddToStack = (sugg: SupplementSuggestion) => {
    if (!sugg.matchedSupplement) return;
    const data: PendingSupplementAdd = {
      name: sugg.matchedSupplement.name,
      dosage: sugg.parsedDosage,
      dosage_unit: sugg.parsedUnit,
      time_of_day: sugg.parsedTiming,
      frequency: 'daily',
      nutrient_ids: sugg.matchedSupplement.nutrientIds,
      notes: sugg.parsedNotes,
      source: `Blood test: ${sugg.sourceMarkers.join(', ')}`,
    };
    onAddToStack(data);
    onMarkAdded(sugg.matchedSupplement.name);
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold border border-red-200">
        <AlertOctagon className="w-3 h-3" />
        Critical
      </span>
    );
    if (priority >= 2) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold border border-orange-200">
        <AlertTriangle className="w-3 h-3" />
        Important
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200">
        <Info className="w-3 h-3" />
        Suggested
      </span>
    );
  };

  if (suggestions.length === 0) return null;

  const visibleSuggestions = showAllSuggestions ? actionableSuggestions : actionableSuggestions.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-b border-purple-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Smart Supplement Suggestions
                <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-bold border border-violet-200">
                  {actionableSuggestions.length} matched
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Based on your blood test deficiencies — add directly to your supplement stack
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpandedSection(expandedSection === 'suggestions' ? null : 'suggestions')}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors"
          >
            {expandedSection === 'suggestions' ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {expandedSection === 'suggestions' && (
        <div className="p-5 space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100 p-3 text-center">
              <p className="text-xl font-bold text-red-700">{suggestions.filter(s => s.priority >= 3).length}</p>
              <p className="text-[10px] text-red-600 font-medium">Critical Priority</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 p-3 text-center">
              <p className="text-xl font-bold text-orange-700">{suggestions.filter(s => s.priority === 2).length}</p>
              <p className="text-[10px] text-orange-600 font-medium">Important</p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-3 text-center">
              <p className="text-xl font-bold text-violet-700">{actionableSuggestions.filter(s => isInStack(s)).length}</p>
              <p className="text-[10px] text-violet-600 font-medium">Already in Stack</p>
            </div>
          </div>

          {/* Actionable suggestions (matched to supplement database) */}
          {actionableSuggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-3">
                <Pill className="w-4 h-4 text-purple-500" />
                Recommended Supplements ({actionableSuggestions.length})
              </h4>

              <div className="space-y-2">
                {visibleSuggestions.map((sugg, idx) => {
                  const inStack = isInStack(sugg);
                  const justAdded = isJustAdded(sugg);
                  const supp = sugg.matchedSupplement!;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border transition-all ${
                        justAdded ? 'bg-emerald-50 border-emerald-200' :
                        inStack ? 'bg-gray-50 border-gray-200' :
                        sugg.priority >= 3 ? 'bg-red-50/50 border-red-200 hover:border-red-300 hover:shadow-sm' :
                        sugg.priority >= 2 ? 'bg-orange-50/30 border-orange-200 hover:border-orange-300 hover:shadow-sm' :
                        'bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        {/* Priority number */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          justAdded ? 'bg-emerald-200 text-emerald-700' :
                          inStack ? 'bg-gray-200 text-gray-500' :
                          sugg.priority >= 3 ? 'bg-red-200 text-red-700' :
                          sugg.priority >= 2 ? 'bg-orange-200 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {justAdded ? <CheckCircle2 className="w-4 h-4" /> :
                           inStack ? <Check className="w-4 h-4" /> :
                           idx + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-gray-900">{supp.name}</span>
                            {getPriorityBadge(sugg.priority)}
                            {inStack && !justAdded && (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium border border-gray-200">
                                Already in stack
                              </span>
                            )}
                            {justAdded && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold border border-emerald-200">
                                Added!
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mb-2">{sugg.recommendationText}</p>

                          {/* Pre-filled details preview */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {sugg.parsedDosage && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium">
                                <Package className="w-3 h-3" />
                                {sugg.parsedDosage} {sugg.parsedUnit}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 font-medium">
                              <Clock className="w-3 h-3" />
                              {sugg.parsedTiming === 'morning' ? 'Morning' :
                               sugg.parsedTiming === 'evening' ? 'Evening' :
                               sugg.parsedTiming === 'with-meals' ? 'With Meals' :
                               sugg.parsedTiming === 'afternoon' ? 'Afternoon' :
                               sugg.parsedTiming === 'bedtime' ? 'Bedtime' : sugg.parsedTiming}
                            </span>
                            {supp.nutrientIds.slice(0, 3).map(nId => {
                              const nutrient = allNutrients.find(n => n.id === nId);
                              return nutrient ? (
                                <span key={nId} className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 font-medium">
                                  {nutrient.name}
                                </span>
                              ) : null;
                            })}
                            {supp.nutrientIds.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{supp.nutrientIds.length - 3} more</span>
                            )}
                          </div>

                          {/* Source markers */}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Beaker className="w-3 h-3" />
                            Based on: {sugg.sourceMarkers.join(', ')}
                          </div>
                        </div>

                        {/* Add button */}
                        <div className="flex-shrink-0">
                          {justAdded ? (
                            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                              <CheckCircle2 className="w-4 h-4" />
                              Added
                            </div>
                          ) : inStack ? (
                            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-xl border border-gray-200">
                              <Check className="w-4 h-4" />
                              In Stack
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToStack(sugg)}
                              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all ${
                                sugg.priority >= 3
                                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/20'
                                  : sugg.priority >= 2
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-500/20'
                                  : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-violet-500/20'
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                              Add to Stack
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {actionableSuggestions.length > 6 && (
                <button
                  onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                  className="w-full py-2.5 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  {showAllSuggestions ? (
                    <>Show Less <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Show {actionableSuggestions.length - 6} More <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Informational suggestions (no DB match) */}
          {informationalSuggestions.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedSection(expandedSection === 'all' ? 'suggestions' : 'all')}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-600 mb-2 hover:text-gray-800 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                  Additional Recommendations ({informationalSuggestions.length})
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${expandedSection === 'all' ? 'rotate-180' : ''}`} />
              </button>

              {expandedSection === 'all' && (
                <div className="space-y-1.5">
                  {informationalSuggestions.map((sugg, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Pill className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700">{sugg.recommendationText}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Based on: {sugg.sourceMarkers.join(', ')}
                        </p>
                      </div>
                      {getPriorityBadge(sugg.priority)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add All button */}
          {actionableSuggestions.filter(s => !isInStack(s) && !isJustAdded(s)).length > 1 && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  actionableSuggestions
                    .filter(s => !isInStack(s) && !isJustAdded(s))
                    .forEach(sugg => handleAddToStack(sugg));
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.01] transition-all"
              >
                <Zap className="w-4 h-4" />
                Add All {actionableSuggestions.filter(s => !isInStack(s) && !isJustAdded(s)).length} Recommended Supplements to Stack
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-[10px] text-amber-700 leading-relaxed flex items-start gap-1.5">
              <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> These suggestions are based on your blood test results and should be discussed with your healthcare provider before starting. Dosages shown are common starting points and may need adjustment based on your individual needs.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BloodTestSupplementBridge;
