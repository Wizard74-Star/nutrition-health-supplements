import React, { useState, useMemo } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { allNutrients } from '@/data/nutrients';
import { Search, ArrowRight, Zap } from 'lucide-react';

const commonSymptoms = [
  'Fatigue', 'Hair loss', 'Muscle cramps', 'Brain fog', 'Insomnia',
  'Anxiety', 'Depression', 'Dry skin', 'Brittle nails', 'Frequent colds',
  'Joint pain', 'Headaches', 'Poor memory', 'Slow healing', 'Numbness'
];

const QuickSymptomChecker: React.FC = () => {
  const { setCurrentView } = useAssessment();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const matchedNutrients = useMemo(() => {
    if (selectedSymptoms.length === 0) return [];
    
    const matches = allNutrients.filter(n => 
      n.deficiencySymptoms.some(ds => 
        selectedSymptoms.some(ss => 
          ds.toLowerCase().includes(ss.toLowerCase()) || 
          ss.toLowerCase().includes(ds.toLowerCase().split(' ')[0])
        )
      )
    );
    
    // Score and sort
    const scored = matches.map(n => ({
      nutrient: n,
      matchCount: n.deficiencySymptoms.filter(ds =>
        selectedSymptoms.some(ss =>
          ds.toLowerCase().includes(ss.toLowerCase()) ||
          ss.toLowerCase().includes(ds.toLowerCase().split(' ')[0])
        )
      ).length
    }));
    
    return scored.sort((a, b) => b.matchCount - a.matchCount).slice(0, 6);
  }, [selectedSymptoms]);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 mb-6">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700 text-sm font-medium">Quick Check</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            What Symptoms Are You Experiencing?
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Select your symptoms below for an instant preview of potential nutrient connections. 
            For a thorough analysis, take our full assessment.
          </p>
        </div>

        {/* Symptom Chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {commonSymptoms.map(s => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                selectedSymptoms.includes(s)
                  ? 'bg-gray-900 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results */}
        {matchedNutrients.length > 0 && (
          <div className="bg-gray-50 rounded-3xl border border-gray-200 p-6 lg:p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Potential Nutrient Connections
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {matchedNutrients.map(({ nutrient, matchCount }) => (
                <div
                  key={nutrient.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    matchCount >= 2 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {matchCount}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{nutrient.name}</div>
                    <div className="text-xs text-gray-500">
                      {matchCount} symptom{matchCount > 1 ? 's' : ''} match
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              This is a simplified preview. Take the full assessment for comprehensive analysis.
            </p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => { setCurrentView('assessment'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-all"
          >
            Take Full Assessment (45+ Questions)
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default QuickSymptomChecker;
