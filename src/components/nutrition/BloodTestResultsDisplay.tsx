import React, { useState, useMemo } from 'react';
import {
  bloodMarkers, markerCategories, evaluateMarkerValue, getSeverityInfo,
  BloodMarker, SeverityLevel, MarkerCategory
} from '@/data/bloodMarkers';
import { allNutrients } from '@/data/nutrients';
import {
  CheckCircle2, AlertTriangle, AlertOctagon, Info, ChevronDown, ChevronUp,
  Pill, Salad, ArrowDown, ArrowUp, Minus, Shield, Beaker, Filter,
  TrendingDown, TrendingUp, Activity
} from 'lucide-react';

export interface StoredMarkerResult {
  markerId: string;
  value: number;
  unit: string;
}

interface BloodTestResultsDisplayProps {
  markers: StoredMarkerResult[];
  testDate: string;
  labName?: string;
  onViewTrend?: (markerId: string) => void;
}

const SeverityIcon: React.FC<{ severity: SeverityLevel; className?: string }> = ({ severity, className = 'w-4 h-4' }) => {
  const info = getSeverityInfo(severity);
  switch (info.icon) {
    case 'check': return <CheckCircle2 className={`${className} text-emerald-500`} />;
    case 'info': return <Info className={`${className} text-amber-500`} />;
    case 'warning': return <AlertTriangle className={`${className} text-orange-500`} />;
    case 'critical': return <AlertOctagon className={`${className} text-red-500`} />;
  }
};

const ValueIndicator: React.FC<{ severity: SeverityLevel }> = ({ severity }) => {
  if (severity === 'normal') return <Minus className="w-3 h-3 text-emerald-500" />;
  if (severity.includes('low')) return <ArrowDown className="w-3 h-3 text-blue-500" />;
  return <ArrowUp className="w-3 h-3 text-red-500" />;
};

const BloodTestResultsDisplay: React.FC<BloodTestResultsDisplayProps> = ({
  markers, testDate, labName, onViewTrend
}) => {
  const [expandedMarker, setExpandedMarker] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'abnormal' | 'critical'>('all');
  const [showRecommendations, setShowRecommendations] = useState(true);

  const evaluatedMarkers = useMemo(() => {
    return markers.map(m => {
      const marker = bloodMarkers.find(bm => bm.id === m.markerId);
      if (!marker) return null;
      const severity = evaluateMarkerValue(marker, m.value);
      const severityInfo = getSeverityInfo(severity);
      return { ...m, marker, severity, severityInfo };
    }).filter(Boolean) as Array<{
      markerId: string; value: number; unit: string;
      marker: BloodMarker; severity: SeverityLevel; severityInfo: ReturnType<typeof getSeverityInfo>;
    }>;
  }, [markers]);

  const filteredResults = useMemo(() => {
    if (filterSeverity === 'all') return evaluatedMarkers;
    if (filterSeverity === 'abnormal') return evaluatedMarkers.filter(m => m.severity !== 'normal');
    return evaluatedMarkers.filter(m => m.severity.includes('critical') || m.severity === 'low' || m.severity === 'high');
  }, [evaluatedMarkers, filterSeverity]);

  // Group by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof filteredResults> = {};
    filteredResults.forEach(r => {
      const cat = r.marker.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    return groups;
  }, [filteredResults]);

  // Summary stats
  const summary = useMemo(() => {
    const normal = evaluatedMarkers.filter(m => m.severity === 'normal').length;
    const borderline = evaluatedMarkers.filter(m => m.severity.includes('borderline')).length;
    const abnormal = evaluatedMarkers.filter(m => m.severity === 'low' || m.severity === 'high').length;
    const critical = evaluatedMarkers.filter(m => m.severity.includes('critical')).length;
    return { normal, borderline, abnormal, critical, total: evaluatedMarkers.length };
  }, [evaluatedMarkers]);

  // Aggregate supplement recommendations from all abnormal markers
  const recommendations = useMemo(() => {
    const suppMap = new Map<string, { supplement: string; reasons: string[]; priority: number }>();
    const dietMap = new Map<string, { tip: string; reasons: string[] }>();

    evaluatedMarkers.forEach(r => {
      if (r.severity === 'normal') return;
      const isLow = r.severity.includes('low');
      const isHigh = r.severity.includes('high');
      const isCritical = r.severity.includes('critical');
      const priority = isCritical ? 3 : (r.severity === 'low' || r.severity === 'high') ? 2 : 1;

      const supps = isLow ? r.marker.supplementRecommendations.whenLow : r.marker.supplementRecommendations.whenHigh;
      supps.forEach(s => {
        const existing = suppMap.get(s);
        if (existing) {
          existing.reasons.push(r.marker.name);
          existing.priority = Math.max(existing.priority, priority);
        } else {
          suppMap.set(s, { supplement: s, reasons: [r.marker.name], priority });
        }
      });

      const tips = isLow ? r.marker.dietaryTips.whenLow : r.marker.dietaryTips.whenHigh;
      tips.forEach(t => {
        const existing = dietMap.get(t);
        if (existing) {
          existing.reasons.push(r.marker.name);
        } else {
          dietMap.set(t, { tip: t, reasons: [r.marker.name] });
        }
      });
    });

    const supplements = Array.from(suppMap.values()).sort((a, b) => b.priority - a.priority || b.reasons.length - a.reasons.length);
    const dietary = Array.from(dietMap.values()).sort((a, b) => b.reasons.length - a.reasons.length);
    return { supplements, dietary };
  }, [evaluatedMarkers]);

  // Linked nutrients
  const deficientNutrients = useMemo(() => {
    const nutrientMap = new Map<string, { nutrientId: string; markers: string[]; worstSeverity: number }>();
    evaluatedMarkers.forEach(r => {
      if (r.severity === 'normal' || r.severity.includes('high')) return;
      const priority = r.severity.includes('critical') ? 3 : r.severity === 'low' ? 2 : 1;
      r.marker.nutrientIds.forEach(nId => {
        const existing = nutrientMap.get(nId);
        if (existing) {
          existing.markers.push(r.marker.abbreviation);
          existing.worstSeverity = Math.max(existing.worstSeverity, priority);
        } else {
          nutrientMap.set(nId, { nutrientId: nId, markers: [r.marker.abbreviation], worstSeverity: priority });
        }
      });
    });
    return Array.from(nutrientMap.values())
      .sort((a, b) => b.worstSeverity - a.worstSeverity || b.markers.length - a.markers.length);
  }, [evaluatedMarkers]);

  const getRangeBarPosition = (value: number, marker: BloodMarker) => {
    const range = marker.referenceRange;
    const totalMin = (range.criticalLow ?? range.borderlineLow ?? range.low) * 0.7;
    const totalMax = (range.criticalHigh ?? range.borderlineHigh ?? range.high) * 1.3;
    const totalRange = totalMax - totalMin;
    if (totalRange === 0) return 50;
    return Math.max(2, Math.min(98, ((value - totalMin) / totalRange) * 100));
  };

  if (evaluatedMarkers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <Beaker className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No marker results to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
          <p className="text-xs text-gray-500">Total Markers</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{summary.normal}</p>
          <p className="text-xs text-emerald-600">Normal</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{summary.borderline}</p>
          <p className="text-xs text-amber-600">Borderline</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-100 p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">{summary.abnormal}</p>
          <p className="text-xs text-orange-600">Abnormal</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{summary.critical}</p>
          <p className="text-xs text-red-600">Critical</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Show:</span>
        {(['all', 'abnormal', 'critical'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterSeverity(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterSeverity === f
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
            }`}
          >
            {f === 'all' ? `All (${summary.total})` : f === 'abnormal' ? `Abnormal (${summary.borderline + summary.abnormal + summary.critical})` : `Critical (${summary.critical})`}
          </button>
        ))}
      </div>

      {/* Results by Category */}
      {Object.entries(groupedResults).map(([cat, results]) => {
        const catInfo = markerCategories[cat as MarkerCategory];
        return (
          <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`px-5 py-3 ${catInfo.bgColor} border-b ${catInfo.borderColor}`}>
              <h4 className={`text-sm font-bold ${catInfo.color}`}>{catInfo.label}</h4>
              <p className="text-xs text-gray-500">{catInfo.description}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {results.map(r => {
                const isExpanded = expandedMarker === r.markerId;
                const range = r.marker.referenceRange;
                const barPos = getRangeBarPosition(r.value, r.marker);

                return (
                  <div key={r.markerId}>
                    <button
                      onClick={() => setExpandedMarker(isExpanded ? null : r.markerId)}
                      className="w-full text-left px-5 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <SeverityIcon severity={r.severity} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{r.marker.name}</span>
                            <span className="text-xs text-gray-400">({r.marker.abbreviation})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.severityInfo.bgColor} ${r.severityInfo.color} border ${r.severityInfo.borderColor}`}>
                              {r.severityInfo.label}
                            </span>
                          </div>
                          {/* Range bar */}
                          <div className="relative h-2 bg-gray-100 rounded-full overflow-visible mt-2 mb-1">
                            {/* Normal range highlight */}
                            <div
                              className="absolute h-full bg-emerald-100 rounded-full"
                              style={{
                                left: `${getRangeBarPosition(range.low, r.marker)}%`,
                                width: `${getRangeBarPosition(range.high, r.marker) - getRangeBarPosition(range.low, r.marker)}%`
                              }}
                            />
                            {/* Value indicator */}
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md ${
                                r.severity === 'normal' ? 'bg-emerald-500' :
                                r.severity.includes('borderline') ? 'bg-amber-500' :
                                r.severity.includes('critical') ? 'bg-red-500' : 'bg-orange-500'
                              }`}
                              style={{ left: `${barPos}%`, transform: 'translate(-50%, -50%)' }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>{range.criticalLow ?? range.borderlineLow ?? range.low}</span>
                            <span>Normal: {range.low}-{range.high} {range.unit}</span>
                            <span>{range.criticalHigh ?? range.borderlineHigh ?? range.high}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="flex items-center gap-1 justify-end">
                            <ValueIndicator severity={r.severity} />
                            <span className={`text-lg font-bold ${
                              r.severity === 'normal' ? 'text-gray-900' :
                              r.severity.includes('critical') ? 'text-red-600' :
                              r.severity.includes('borderline') ? 'text-amber-600' : 'text-orange-600'
                            }`}>
                              {r.value}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{r.unit}</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 bg-gray-50/50">
                        <p className="text-sm text-gray-600">{r.marker.description}</p>

                        {/* What this means */}
                        <div className={`p-3 rounded-xl border ${r.severityInfo.bgColor} ${r.severityInfo.borderColor}`}>
                          <p className={`text-xs font-semibold ${r.severityInfo.color} mb-1`}>What This Means</p>
                          <p className="text-xs text-gray-700">
                            {r.severity.includes('low') ? r.marker.lowMeaning : r.severity.includes('high') ? r.marker.highMeaning : 'Your value is within the normal reference range.'}
                          </p>
                        </div>

                        {/* Supplement recommendations for this marker */}
                        {r.severity !== 'normal' && (
                          <>
                            {(r.severity.includes('low') ? r.marker.supplementRecommendations.whenLow : r.marker.supplementRecommendations.whenHigh).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                  <Pill className="w-3.5 h-3.5 text-purple-500" />
                                  Supplement Recommendations
                                </p>
                                <div className="space-y-1">
                                  {(r.severity.includes('low') ? r.marker.supplementRecommendations.whenLow : r.marker.supplementRecommendations.whenHigh).map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                                      <Pill className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                                      {s}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(r.severity.includes('low') ? r.marker.dietaryTips.whenLow : r.marker.dietaryTips.whenHigh).length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                  <Salad className="w-3.5 h-3.5 text-emerald-500" />
                                  Dietary Tips
                                </p>
                                <div className="space-y-1">
                                  {(r.severity.includes('low') ? r.marker.dietaryTips.whenLow : r.marker.dietaryTips.whenHigh).map((t, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                                      <Salad className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                      {t}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Linked nutrients */}
                        {r.marker.nutrientIds.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">Linked Nutrients</p>
                            <div className="flex flex-wrap gap-1.5">
                              {r.marker.nutrientIds.map(nId => {
                                const nutrient = allNutrients.find(n => n.id === nId);
                                return nutrient ? (
                                  <span key={nId} className="text-[10px] px-2 py-1 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 font-medium">
                                    {nutrient.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {/* View trend button */}
                        {onViewTrend && (
                          <button
                            onClick={() => onViewTrend(r.markerId)}
                            className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            View Historical Trend
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Aggregated Recommendations Panel */}
      {(recommendations.supplements.length > 0 || recommendations.dietary.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-50 to-rose-50 border-b border-purple-100"
          >
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Personalized Recommendations Based on Your Results
            </h4>
            {showRecommendations ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showRecommendations && (
            <div className="p-5 space-y-6">
              {/* Deficient Nutrients */}
              {deficientNutrients.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-orange-500" />
                    Nutrient Deficiencies Detected ({deficientNutrients.length})
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {deficientNutrients.map(n => {
                      const nutrient = allNutrients.find(nut => nut.id === n.nutrientId);
                      if (!nutrient) return null;
                      return (
                        <div key={n.nutrientId} className={`flex items-center gap-3 p-3 rounded-xl border ${
                          n.worstSeverity >= 3 ? 'bg-red-50 border-red-200' :
                          n.worstSeverity >= 2 ? 'bg-orange-50 border-orange-200' :
                          'bg-amber-50 border-amber-200'
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            n.worstSeverity >= 3 ? 'bg-red-100' :
                            n.worstSeverity >= 2 ? 'bg-orange-100' : 'bg-amber-100'
                          }`}>
                            {n.worstSeverity >= 3 ? <AlertOctagon className="w-4 h-4 text-red-600" /> :
                             n.worstSeverity >= 2 ? <AlertTriangle className="w-4 h-4 text-orange-600" /> :
                             <Info className="w-4 h-4 text-amber-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{nutrient.name}</p>
                            <p className="text-[10px] text-gray-500">Flagged by: {n.markers.join(', ')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Supplement Recommendations */}
              {recommendations.supplements.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-purple-500" />
                    Recommended Supplements ({recommendations.supplements.length})
                  </h5>
                  <div className="space-y-2">
                    {recommendations.supplements.slice(0, 10).map((rec, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                        rec.priority >= 3 ? 'bg-red-50 border-red-200' :
                        rec.priority >= 2 ? 'bg-purple-50 border-purple-200' :
                        'bg-gray-50 border-gray-100'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          rec.priority >= 3 ? 'bg-red-200 text-red-700' :
                          rec.priority >= 2 ? 'bg-purple-200 text-purple-700' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{rec.supplement}</p>
                          <p className="text-[10px] text-gray-500">Based on: {rec.reasons.join(', ')}</p>
                        </div>
                        {rec.priority >= 3 && (
                          <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold flex-shrink-0">Priority</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Tips */}
              {recommendations.dietary.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Salad className="w-4 h-4 text-emerald-500" />
                    Dietary Recommendations
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {recommendations.dietary.slice(0, 8).map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <Salad className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-700">{tip.tip}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">For: {tip.reasons.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  <strong>Disclaimer:</strong> These recommendations are for informational purposes only and should not replace professional medical advice. Always consult with your healthcare provider before starting or changing any supplement regimen, especially if you have existing health conditions or take medications.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BloodTestResultsDisplay;
