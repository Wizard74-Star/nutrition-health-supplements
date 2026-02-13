import React, { useMemo } from 'react';
import { allNutrients, categoryInfo, NutrientCategory } from '@/data/nutrients';
import { supplementDatabase, findSupplementsForNutrient } from '@/data/supplementDatabase';
import { SavedReport } from '@/utils/reportStorage';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Lightbulb, Pill, TrendingUp
} from 'lucide-react';

interface UserSupplement {
  id: string;
  name: string;
  dosage: string;
  dosage_unit: string;
  nutrient_ids: string[];
  active: boolean;
}

interface SupplementCoverageAnalysisProps {
  supplements: UserSupplement[];
  latestReport: SavedReport | null;
}

const SupplementCoverageAnalysis: React.FC<SupplementCoverageAnalysisProps> = ({
  supplements,
  latestReport,
}) => {
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = React.useState(true);

  const activeSupplements = supplements.filter(s => s.active);

  // Get all nutrient IDs covered by active supplements
  const coveredNutrientIds = useMemo(() => {
    const covered = new Set<string>();
    activeSupplements.forEach(supp => {
      // Check custom nutrient_ids from the supplement record
      if (supp.nutrient_ids && Array.isArray(supp.nutrient_ids)) {
        supp.nutrient_ids.forEach(id => covered.add(id));
      }
      // Also check the supplement database for name matches
      const dbMatch = supplementDatabase.find(
        s => s.name.toLowerCase() === supp.name.toLowerCase()
      );
      if (dbMatch) {
        dbMatch.nutrientIds.forEach(id => covered.add(id));
      }
    });
    return covered;
  }, [activeSupplements]);

  // Get flagged deficiencies from the latest report
  const flaggedDeficiencies = useMemo(() => {
    if (!latestReport) return [];
    return latestReport.results.map(r => ({
      nutrientId: r.nutrientId,
      nutrientName: r.nutrientName,
      category: r.category as NutrientCategory,
      score: r.score,
      priority: r.priority,
      isCovered: coveredNutrientIds.has(r.nutrientId),
    }));
  }, [latestReport, coveredNutrientIds]);

  const coveredCount = flaggedDeficiencies.filter(d => d.isCovered).length;
  const uncoveredCount = flaggedDeficiencies.filter(d => !d.isCovered).length;
  const criticalUncovered = flaggedDeficiencies.filter(d => !d.isCovered && d.priority === 'critical');
  const moderateUncovered = flaggedDeficiencies.filter(d => !d.isCovered && d.priority === 'moderate');

  const coveragePercentage = flaggedDeficiencies.length > 0
    ? Math.round((coveredCount / flaggedDeficiencies.length) * 100)
    : 0;

  // Group flagged deficiencies by category
  const groupedDeficiencies = useMemo(() => {
    const groups: Record<string, typeof flaggedDeficiencies> = {};
    flaggedDeficiencies.forEach(d => {
      const cat = d.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(d);
    });
    return groups;
  }, [flaggedDeficiencies]);

  // Suggestions for uncovered deficiencies
  const suggestions = useMemo(() => {
    return flaggedDeficiencies
      .filter(d => !d.isCovered)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(d => {
        const matchingSupps = findSupplementsForNutrient(d.nutrientId);
        return {
          ...d,
          suggestedSupplements: matchingSupps.slice(0, 3),
        };
      });
  }, [flaggedDeficiencies]);

  if (!latestReport) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Assessment Report Found</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Complete a nutrient deficiency assessment first to see how your supplement stack covers your specific deficiencies.
        </p>
      </div>
    );
  }

  if (flaggedDeficiencies.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center border border-green-100">
        <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">No Deficiencies Detected</h3>
        <p className="text-sm text-green-600">
          Your latest assessment didn't flag any nutrient deficiencies. Keep up the great work!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Coverage Overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-600" />
                Deficiency Coverage Analysis
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Based on your latest assessment ({new Date(latestReport.date).toLocaleDateString()})
              </p>
            </div>
          </div>

          {/* Coverage Ring */}
          <div className="flex items-center gap-8 mb-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke={coveragePercentage >= 80 ? '#10b981' : coveragePercentage >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${coveragePercentage * 3.14} ${314 - coveragePercentage * 3.14}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{coveragePercentage}%</span>
                <span className="text-xs text-gray-500">Covered</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Covered</span>
                </div>
                <p className="text-2xl font-bold text-green-800">{coveredCount}</p>
                <p className="text-xs text-green-600">deficiencies addressed</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700">Uncovered</span>
                </div>
                <p className="text-2xl font-bold text-red-800">{uncoveredCount}</p>
                <p className="text-xs text-red-600">gaps remaining</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">Critical Gaps</span>
                </div>
                <p className="text-2xl font-bold text-amber-800">{criticalUncovered.length}</p>
                <p className="text-xs text-amber-600">high priority</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Active Supps</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">{activeSupplements.length}</p>
                <p className="text-xs text-blue-600">in your stack</p>
              </div>
            </div>
          </div>

          {/* Deficiency Breakdown by Category */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Breakdown by Category</h4>
            {Object.entries(groupedDeficiencies).map(([category, deficiencies]) => {
              const catInfo = categoryInfo[category as NutrientCategory];
              const catCovered = deficiencies.filter(d => d.isCovered).length;
              const isExpanded = expandedCategory === category;

              return (
                <div key={category} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${catInfo?.iconBg || 'bg-gray-100'} flex items-center justify-center`}>
                        <span className={`text-xs font-bold ${catInfo?.color || 'text-gray-600'}`}>
                          {catInfo?.label?.[0] || 'N'}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{catInfo?.label || category}</p>
                        <p className="text-xs text-gray-500">
                          {catCovered}/{deficiencies.length} covered
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            catCovered === deficiencies.length ? 'bg-green-500' :
                            catCovered > 0 ? 'bg-amber-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${(catCovered / deficiencies.length) * 100}%` }}
                        />
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1.5">
                      {deficiencies
                        .sort((a, b) => b.score - a.score)
                        .map(d => (
                        <div
                          key={d.nutrientId}
                          className={`flex items-center justify-between p-2.5 rounded-lg ${
                            d.isCovered ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {d.isCovered ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <div>
                              <p className={`text-sm font-medium ${d.isCovered ? 'text-green-800' : 'text-red-800'}`}>
                                {d.nutrientName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  d.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                  d.priority === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {d.priority}
                                </span>
                                <span className="text-[10px] text-gray-500">Score: {d.score}</span>
                              </div>
                            </div>
                          </div>
                          {d.isCovered && (
                            <span className="text-[10px] text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">
                              Addressed
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Supplement Suggestions for Uncovered Deficiencies */}
      {suggestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Supplement Suggestions</h3>
                <p className="text-sm text-gray-500">
                  {suggestions.length} uncovered {suggestions.length === 1 ? 'deficiency' : 'deficiencies'} could be addressed
                </p>
              </div>
            </div>
            {showSuggestions ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showSuggestions && (
            <div className="px-6 pb-6 space-y-4">
              {suggestions.map(s => (
                <div key={s.nutrientId} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldX className="w-4 h-4 text-red-500" />
                        <h4 className="text-sm font-semibold text-gray-900">{s.nutrientName}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          s.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          s.priority === 'moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {s.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      Score: {s.score}
                    </div>
                  </div>

                  {s.suggestedSupplements.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Recommended supplements:</p>
                      {s.suggestedSupplements.map((supp, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-teal-50 rounded-lg">
                          <Pill className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-teal-800 truncate">{supp.name}</p>
                            <p className="text-[10px] text-teal-600">
                              {supp.commonDosages[0]} {supp.defaultUnit} · Best: {supp.bestTimeOfDay}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      Consider consulting a healthcare provider for supplement recommendations.
                    </p>
                  )}
                </div>
              ))}

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">Important Disclaimer</p>
                    <p className="text-xs text-amber-700 mt-1">
                      These suggestions are based on your symptom assessment and are not medical advice.
                      Always consult with a healthcare professional before starting any new supplement regimen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplementCoverageAnalysis;
