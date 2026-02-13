import React from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { 
  ArrowRight, CheckCircle2, XCircle, Microscope, 
  TrendingUp, Clock, ShieldCheck
} from 'lucide-react';

const WhyBloodAnalysis: React.FC = () => {
  const { setCurrentView } = useAssessment();

  return (
    <section className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-3xl p-8 lg:p-12">
              <h3 className="text-white text-xl font-bold mb-8">Symptom Guessing vs. Blood Precision</h3>
              
              {/* Comparison */}
              <div className="space-y-4">
                {[
                  { label: 'Vitamin D Level', guess: 'Maybe low?', precise: '18 ng/mL (Deficient)', status: 'critical' },
                  { label: 'Magnesium', guess: 'Probably fine', precise: '1.4 mg/dL (Low)', status: 'moderate' },
                  { label: 'Iron (Ferritin)', guess: 'Could be low', precise: '8 ng/mL (Critical)', status: 'critical' },
                  { label: 'Omega-3 Index', guess: 'Unknown', precise: '3.2% (Very Low)', status: 'critical' },
                  { label: 'B12', guess: 'Seems okay', precise: '680 pg/mL (Optimal)', status: 'good' },
                ].map((item, i) => (
                  <div key={i} className="grid grid-cols-3 gap-3 items-center">
                    <div className="text-sm text-gray-400 font-medium">{item.label}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-gray-500">{item.guess}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                        item.status === 'good' ? 'text-green-400' : 
                        item.status === 'moderate' ? 'text-amber-400' : 'text-red-400'
                      }`} />
                      <span className={`font-medium ${
                        item.status === 'good' ? 'text-green-400' : 
                        item.status === 'moderate' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {item.precise}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-sm text-gray-400">
                    3 of 5 nutrients critically low — undetectable by symptoms alone
                  </span>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 lg:-right-8 bg-white rounded-2xl shadow-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Microscope className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">47+</div>
                  <div className="text-xs text-gray-500">Biomarkers tested</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Why Blood Analysis
              <br />
              <span className="text-teal-600">Changes Everything</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              Symptoms tell you something is wrong. Blood analysis tells you exactly what and how much. 
              The difference between guessing and knowing is the difference between slow recovery and rapid optimization.
            </p>

            <div className="space-y-5 mb-10">
              {[
                { icon: TrendingUp, title: 'Precise Measurements', desc: 'Know your exact levels for every essential nutrient, not just whether you\'re "low" or "normal."' },
                { icon: Clock, title: 'Faster Results', desc: 'Targeted supplementation based on blood data works 3-5x faster than generic multivitamins.' },
                { icon: ShieldCheck, title: 'Avoid Over-Supplementation', desc: 'Know what you actually need. Taking nutrients you don\'t need can cause imbalances and waste money.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setCurrentView('booking'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-2xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all"
            >
              Book Your Blood Analysis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyBloodAnalysis;
