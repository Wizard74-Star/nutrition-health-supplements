import React, { useState } from 'react';
import { allNutrients, Nutrient } from '@/data/nutrients';
import { SavedNutrientResult } from '@/utils/reportStorage';
import {
  ShieldAlert, Shield, ShieldCheck, ChevronDown, ChevronUp,
  Target, TrendingUp, AlertTriangle, CheckCircle2, Info
} from 'lucide-react';

interface NutrientProgress {
  nutrient: Nutrient;
  intake: number;
  rda: number;
  percentage: number;
  isFlagged: boolean;
  flagPriority?: 'critical' | 'moderate' | 'low';
  flagScore?: number;
}

interface Props {
  /** Map of nutrient ID to total intake amount */
  dailyIntake: Record<string, number>;
  /** Flagged nutrients from the latest deficiency report */
  flaggedNutrients: SavedNutrientResult[];
  /** Filter mode */
  filterMode: 'all' | 'flagged' | 'tracked';
}

function parseRda(rda: string): number | null {
  // Handle ranges like '250-500' → take the lower bound
  const rangeMatch = rda.match(/^([\d.]+)\s*-/);
  if (rangeMatch) return parseFloat(rangeMatch[1]);
  // Handle simple numbers
  const num = parseFloat(rda);
  return isNaN(num) ? null : num;
}

const NutrientProgressSummary: React.FC<Props> = ({ dailyIntake, flaggedNutrients, filterMode }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('flagged');

  // Build progress data
  const flaggedIds = new Set(flaggedNutrients.map(f => f.nutrientId));
  const trackedIds = new Set(Object.keys(dailyIntake).filter(id => dailyIntake[id] > 0));

  const allProgress: NutrientProgress[] = allNutrients
    .map(nutrient => {
      const rda = parseRda(nutrient.rda);
      if (!rda) return null;

      const intake = dailyIntake[nutrient.id] || 0;
      const percentage = Math.min(200, (intake / rda) * 100);
      const flagged = flaggedNutrients.find(f => f.nutrientId === nutrient.id);

      return {
        nutrient,
        intake,
        rda,
        percentage,
        isFlagged: !!flagged,
        flagPriority: flagged?.priority,
        flagScore: flagged?.score,
      };
    })
    .filter(Boolean) as NutrientProgress[];

  // Apply filter
  let filtered: NutrientProgress[];
  if (filterMode === 'flagged') {
    filtered = allProgress.filter(p => p.isFlagged);
  } else if (filterMode === 'tracked') {
    filtered = allProgress.filter(p => trackedIds.has(p.nutrient.id));
  } else {
    filtered = allProgress;
  }

  // Group by category
  const flaggedItems = filtered.filter(p => p.isFlagged).sort((a, b) => (b.flagScore || 0) - (a.flagScore || 0));
  const vitaminItems = filtered.filter(p => !p.isFlagged && p.nutrient.category === 'vitamin');
  const mineralItems = filtered.filter(p => !p.isFlagged && p.nutrient.category === 'mineral');
  const aminoItems = filtered.filter(p => !p.isFlagged && p.nutrient.category === 'amino_acid');
  const fattyItems = filtered.filter(p => !p.isFlagged && p.nutrient.category === 'fatty_acid');

  const groups = [
    { key: 'flagged', label: 'Flagged Deficiencies', items: flaggedItems, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { key: 'vitamin', label: 'Vitamins', items: vitaminItems, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { key: 'mineral', label: 'Minerals', items: mineralItems, icon: Target, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
    { key: 'amino', label: 'Amino Acids', items: aminoItems, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { key: 'fatty', label: 'Fatty Acids', items: fattyItems, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ].filter(g => g.items.length > 0);

  // Summary stats
  const totalTracked = filtered.filter(p => p.intake > 0).length;
  const metRda = filtered.filter(p => p.percentage >= 100).length;
  const flaggedMet = flaggedItems.filter(p => p.percentage >= 100).length;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8">
        <Info className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          {filterMode === 'flagged'
            ? 'No flagged deficiencies found. Complete an assessment first.'
            : filterMode === 'tracked'
            ? 'No nutrients tracked yet. Log some food to see progress.'
            : 'No nutrient data available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
          <div className="text-xl font-bold text-blue-600">{totalTracked}</div>
          <div className="text-[10px] text-blue-500 font-medium mt-0.5">Nutrients Tracked</div>
        </div>
        <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-center">
          <div className="text-xl font-bold text-green-600">{metRda}</div>
          <div className="text-[10px] text-green-500 font-medium mt-0.5">RDA Met</div>
        </div>
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
          <div className="text-xl font-bold text-red-600">
            {flaggedItems.length > 0 ? `${flaggedMet}/${flaggedItems.length}` : '—'}
          </div>
          <div className="text-[10px] text-red-500 font-medium mt-0.5">Flagged Met</div>
        </div>
      </div>

      {/* Nutrient groups */}
      {groups.map(group => {
        const GIcon = group.icon;
        const isExpanded = expandedCategory === group.key;

        return (
          <div key={group.key} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : group.key)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg ${group.bg} flex items-center justify-center`}>
                <GIcon className={`w-4 h-4 ${group.color}`} />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-gray-900 text-sm">{group.label}</span>
                <span className="text-xs text-gray-400 ml-2">({group.items.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {group.items.filter(i => i.percentage >= 100).length > 0 && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                    {group.items.filter(i => i.percentage >= 100).length} met
                  </span>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {group.items.map(item => (
                  <NutrientProgressBar key={item.nutrient.id} item={item} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const NutrientProgressBar: React.FC<{ item: NutrientProgress }> = ({ item }) => {
  const { nutrient, intake, rda, percentage, isFlagged, flagPriority } = item;

  const getBarColor = () => {
    if (percentage >= 100) return 'bg-green-500';
    if (isFlagged) {
      if (flagPriority === 'critical') return 'bg-red-500';
      if (flagPriority === 'moderate') return 'bg-amber-500';
      return 'bg-blue-400';
    }
    if (percentage >= 75) return 'bg-teal-500';
    if (percentage >= 50) return 'bg-amber-400';
    return 'bg-gray-300';
  };

  const getBarBg = () => {
    if (isFlagged) {
      if (flagPriority === 'critical') return 'bg-red-100';
      if (flagPriority === 'moderate') return 'bg-amber-100';
      return 'bg-blue-100';
    }
    return 'bg-gray-100';
  };

  const PriorityIcon = flagPriority === 'critical' ? ShieldAlert
    : flagPriority === 'moderate' ? Shield
    : flagPriority === 'low' ? ShieldCheck
    : null;

  // Format intake display
  const formatAmount = (val: number, unit: string) => {
    if (unit === 'g' || unit === 'mg' || unit === 'mcg' || unit === 'IU') {
      return val < 1 ? val.toFixed(2) : val < 10 ? val.toFixed(1) : Math.round(val).toString();
    }
    // For mg/kg/day amino acids, just show mg
    return val < 1 ? val.toFixed(2) : val < 10 ? val.toFixed(1) : Math.round(val).toString();
  };

  return (
    <div className={`p-3 rounded-lg ${isFlagged ? 'bg-gradient-to-r from-red-50/50 to-transparent border border-red-100/50' : ''}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {PriorityIcon && (
            <PriorityIcon className={`w-3.5 h-3.5 ${
              flagPriority === 'critical' ? 'text-red-500' :
              flagPriority === 'moderate' ? 'text-amber-500' : 'text-blue-400'
            }`} />
          )}
          <span className="text-sm font-medium text-gray-800">{nutrient.name}</span>
          {percentage >= 100 && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${percentage >= 100 ? 'text-green-600' : 'text-gray-700'}`}>
            {formatAmount(intake, nutrient.unit)}
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{rda} {nutrient.unit}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${getBarBg()}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${getBarColor()}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <span className={`text-xs font-bold w-12 text-right ${
          percentage >= 100 ? 'text-green-600' :
          percentage >= 75 ? 'text-teal-600' :
          percentage >= 50 ? 'text-amber-600' :
          isFlagged ? 'text-red-500' : 'text-gray-400'
        }`}>
          {Math.round(percentage)}%
        </span>
      </div>
      {isFlagged && percentage < 50 && (
        <div className="mt-1.5 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-amber-600">
            Top sources: {nutrient.foodSources.slice(0, 3).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default NutrientProgressSummary;
