import React from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const deficiencies = [
  {
    nutrient: 'Vitamin D',
    percentage: '42%',
    description: 'of adults are deficient',
    detail: 'The most widespread deficiency globally. Critical for immunity, bones, mood, and hormone regulation.',
    symptoms: ['Fatigue', 'Depression', 'Bone pain', 'Frequent illness'],
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  {
    nutrient: 'Magnesium',
    percentage: '68%',
    description: 'don\'t meet daily needs',
    detail: 'Involved in 300+ enzymatic reactions. Modern soil depletion has made dietary intake insufficient.',
    symptoms: ['Muscle cramps', 'Insomnia', 'Anxiety', 'Migraines'],
    color: 'from-teal-500 to-cyan-500',
    bg: 'bg-teal-50',
    border: 'border-teal-200'
  },
  {
    nutrient: 'Iron',
    percentage: '25%',
    description: 'of women are deficient',
    detail: 'The #1 nutritional deficiency worldwide. Essential for oxygen transport and energy production.',
    symptoms: ['Extreme fatigue', 'Pale skin', 'Cold hands', 'Brittle nails'],
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
  {
    nutrient: 'Omega-3 (DHA/EPA)',
    percentage: '70%',
    description: 'have suboptimal levels',
    detail: 'DHA is the primary structural fat in your brain. EPA is the body\'s most potent anti-inflammatory.',
    symptoms: ['Brain fog', 'Joint pain', 'Dry skin', 'Depression'],
    color: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200'
  },
  {
    nutrient: 'Vitamin B12',
    percentage: '40%',
    description: 'of older adults are low',
    detail: 'Essential for nerve function and DNA synthesis. Absorption decreases with age and certain medications.',
    symptoms: ['Numbness/tingling', 'Memory issues', 'Fatigue', 'Mood changes'],
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200'
  },
  {
    nutrient: 'Zinc',
    percentage: '31%',
    description: 'globally are at risk',
    detail: 'Critical for immune defense, wound healing, and over 100 enzymatic processes in the body.',
    symptoms: ['Frequent colds', 'Slow healing', 'Hair loss', 'Loss of taste'],
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  }
];

const CommonDeficiencies: React.FC = () => {
  const { setCurrentView } = useAssessment();

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-red-600 text-sm font-medium">Critical Awareness</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Most Common Deficiencies
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Even in developed countries, nutrient deficiencies are epidemic. 
            You could be deficient right now without knowing it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {deficiencies.map((d, i) => (
            <div
              key={i}
              className={`rounded-2xl ${d.bg} border ${d.border} p-6 hover:shadow-lg transition-all`}
            >
              <div className={`text-4xl font-black bg-gradient-to-r ${d.color} bg-clip-text text-transparent mb-1`}>
                {d.percentage}
              </div>
              <div className="text-sm text-gray-500 mb-3">{d.description}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{d.nutrient}</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{d.detail}</p>
              <div className="flex flex-wrap gap-1.5">
                {d.symptoms.map((s, j) => (
                  <span key={j} className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 text-gray-600 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-6">
            Could you be one of these statistics? Find out in 5 minutes.
          </p>
          <button
            onClick={() => { setCurrentView('assessment'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all"
          >
            Check Your Deficiency Risk
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CommonDeficiencies;
