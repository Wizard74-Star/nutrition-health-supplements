import React from 'react';
import { Nutrient, categoryInfo } from '@/data/nutrients';
import { X, AlertTriangle, Apple, Beaker, Lightbulb, FileText, ExternalLink } from 'lucide-react';

interface Props {
  nutrient: Nutrient;
  onClose: () => void;
}

const NutrientDetailModal: React.FC<Props> = ({ nutrient, onClose }) => {
  const catInfo = categoryInfo[nutrient.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${catInfo.bgColor} p-6 rounded-t-3xl border-b ${catInfo.borderColor}`}>
          <div className="flex items-start justify-between">
            <div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${catInfo.color}`}>
                {catInfo.label.slice(0, -1)}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{nutrient.name}</h2>
              {nutrient.alternateNames && (
                <p className="text-sm text-gray-500 mt-1">{nutrient.alternateNames.join(' / ')}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className={`px-4 py-2 rounded-xl ${catInfo.iconBg}`}>
              <span className={`text-lg font-bold ${catInfo.color}`}>{nutrient.rda}</span>
              <span className="text-xs text-gray-500 ml-1">{nutrient.unit}/day</span>
            </div>
            {nutrient.solubility && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-white text-gray-600 font-medium">
                {nutrient.solubility}
              </span>
            )}
            {nutrient.molecularFormula && (
              <span className="text-xs font-mono text-gray-400">{nutrient.molecularFormula}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600 leading-relaxed">{nutrient.description}</p>

          {/* Functions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Beaker className="w-4 h-4 text-teal-500" />
              <h3 className="font-semibold text-gray-900">Key Functions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nutrient.functions.map((fn, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className={`w-2 h-2 rounded-full ${catInfo.color.replace('text-', 'bg-')}`} />
                  {fn}
                </div>
              ))}
            </div>
          </div>

          {/* Deficiency */}
          <div className="bg-red-50 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-red-800">Deficiency Symptoms</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {nutrient.deficiencySymptoms.map((s, i) => (
                <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Food Sources */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Apple className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-gray-900">Top Food Sources</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {nutrient.foodSources.map((f, i) => (
                <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Absorption Tips */}
          {nutrient.absorptionTips && (
            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-blue-800">Absorption Tip</h3>
              </div>
              <p className="text-sm text-blue-700">{nutrient.absorptionTips}</p>
            </div>
          )}

          {/* Excess Risk */}
          {nutrient.excessRisk && (
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>Caution:</strong> {nutrient.excessRisk}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NutrientDetailModal;
