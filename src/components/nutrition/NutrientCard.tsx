import React, { useState } from 'react';
import { Nutrient, categoryInfo } from '@/data/nutrients';
import { ChevronDown, ChevronUp, AlertTriangle, Apple, Beaker, Info, Lightbulb } from 'lucide-react';

interface NutrientCardProps {
  nutrient: Nutrient;
  onSelect?: (n: Nutrient) => void;
}

const NutrientCard: React.FC<NutrientCardProps> = ({ nutrient, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const catInfo = categoryInfo[nutrient.category];

  return (
    <div
      className={`group rounded-2xl border ${catInfo.borderColor} ${catInfo.bgColor} overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-black/5 ${expanded ? 'shadow-lg' : ''}`}
    >
      {/* Header */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${catInfo.color}`}>
                {catInfo.label.slice(0, -1)}
              </span>
              {nutrient.solubility && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-gray-500 font-medium">
                  {nutrient.solubility}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
              {nutrient.name}
            </h3>
            {nutrient.alternateNames && (
              <p className="text-xs text-gray-500 mt-0.5">
                {nutrient.alternateNames.join(' / ')}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`px-3 py-1.5 rounded-xl ${catInfo.iconBg} text-center`}>
              <div className={`text-sm font-bold ${catInfo.color}`}>{nutrient.rda}</div>
              <div className="text-[10px] text-gray-500">{nutrient.unit}/day</div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {nutrient.criticalFor.map(tag => (
            <span
              key={tag}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 text-gray-600 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Brief description */}
        {!expanded && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">
            {nutrient.description}
          </p>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/50">
          {/* Description */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Overview</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{nutrient.description}</p>
            {nutrient.molecularFormula && (
              <p className="text-xs text-gray-400 mt-2 font-mono">{nutrient.molecularFormula}</p>
            )}
          </div>

          {/* Functions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Key Functions</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {nutrient.functions.map((fn, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${catInfo.color.replace('text-', 'bg-')}`} />
                  {fn}
                </div>
              ))}
            </div>
          </div>

          {/* Deficiency Symptoms */}
          <div className="bg-red-50/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-700">Deficiency Signs</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {nutrient.deficiencySymptoms.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Food Sources */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Apple className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Top Food Sources</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {nutrient.foodSources.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-white text-gray-600 font-medium border border-gray-200">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Absorption Tips */}
          {nutrient.absorptionTips && (
            <div className="bg-blue-50/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-700">Absorption Tip</span>
              </div>
              <p className="text-sm text-blue-600">{nutrient.absorptionTips}</p>
            </div>
          )}

          {/* Excess Risk */}
          {nutrient.excessRisk && (
            <div className="text-xs text-gray-500 italic">
              Caution: {nutrient.excessRisk}
            </div>
          )}

          {/* CTA */}
          {onSelect && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(nutrient); }}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${catInfo.bgColor} ${catInfo.color} hover:opacity-80 border ${catInfo.borderColor}`}
            >
              Check if you're deficient
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NutrientCard;
