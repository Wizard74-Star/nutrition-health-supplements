import React from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { categoryInfo, vitamins, minerals, aminoAcids, fattyAcids } from '@/data/nutrients';
import { ArrowRight, Beaker, Gem, Dna, Droplets } from 'lucide-react';

const categoryIcons = {
  vitamin: Beaker,
  mineral: Gem,
  amino_acid: Dna,
  fatty_acid: Droplets,
};

const NutrientOverview: React.FC = () => {
  const { setCurrentView, setActiveCategory } = useAssessment();

  const categories = [
    { key: 'vitamin' as const, nutrients: vitamins, highlights: ['Vitamin D — Most deficient globally', 'B12 — Critical for vegans/vegetarians', 'Vitamin C — Cannot be stored by body'] },
    { key: 'mineral' as const, nutrients: minerals, highlights: ['Magnesium — 300+ enzyme reactions', 'Iron — #1 deficiency worldwide', 'Zinc — Immune system cornerstone'] },
    { key: 'amino_acid' as const, nutrients: aminoAcids, highlights: ['Leucine — Muscle protein synthesis trigger', 'Tryptophan — Serotonin precursor', 'Lysine — Collagen building block'] },
    { key: 'fatty_acid' as const, nutrients: fattyAcids, highlights: ['DHA — Primary brain structural fat', 'EPA — Powerful anti-inflammatory', 'Omega-3:6 ratio is critical'] },
  ];

  const handleExplore = (category: string) => {
    setActiveCategory(category);
    setCurrentView('database');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Essential Nutrients Your Body Needs
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            47+ essential nutrients work together to keep you alive and thriving. 
            A single deficiency can cascade into dozens of symptoms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map(cat => {
            const info = categoryInfo[cat.key];
            const Icon = categoryIcons[cat.key];
            return (
              <div
                key={cat.key}
                className={`group rounded-3xl border ${info.borderColor} ${info.bgColor} p-6 lg:p-8 hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer`}
                onClick={() => handleExplore(cat.key)}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${info.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${info.color}`} />
                  </div>
                  <div className={`text-3xl font-bold ${info.color}`}>{cat.nutrients.length}</div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{info.label}</h3>
                <p className="text-sm text-gray-500 mb-5">{info.description}</p>

                {/* Highlights */}
                <div className="space-y-2 mb-6">
                  {cat.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${info.color.replace('text-', 'bg-')}`} />
                      {h}
                    </div>
                  ))}
                </div>

                {/* Nutrient pills */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {cat.nutrients.slice(0, 6).map(n => (
                    <span key={n.id} className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 text-gray-600 font-medium">
                      {n.name}
                    </span>
                  ))}
                  {cat.nutrients.length > 6 && (
                    <span className={`text-[11px] px-2.5 py-1 rounded-full ${info.iconBg} ${info.color} font-semibold`}>
                      +{cat.nutrients.length - 6} more
                    </span>
                  )}
                </div>

                <div className={`flex items-center gap-2 text-sm font-semibold ${info.color} group-hover:gap-3 transition-all`}>
                  Explore All {info.label}
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NutrientOverview;
