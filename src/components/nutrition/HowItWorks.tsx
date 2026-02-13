import React from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { ClipboardCheck, Microscope, FileBarChart, Pill, ArrowRight } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const { setCurrentView } = useAssessment();

  const steps = [
    {
      icon: ClipboardCheck,
      number: '01',
      title: 'Symptom Assessment',
      description: 'Complete our comprehensive 45+ question assessment across 9 health categories to identify potential nutrient gaps.',
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20'
    },
    {
      icon: Microscope,
      number: '02',
      title: 'Blood Analysis',
      description: 'Get precise measurements with our comprehensive 47+ biomarker panel testing all essential vitamins, minerals, and more.',
      color: 'from-teal-500 to-cyan-600',
      shadow: 'shadow-teal-500/20'
    },
    {
      icon: FileBarChart,
      number: '03',
      title: 'Expert Review',
      description: 'Our nutrition specialists analyze your results, identifying exact deficiency levels and creating your personalized protocol.',
      color: 'from-indigo-500 to-violet-600',
      shadow: 'shadow-indigo-500/20'
    },
    {
      icon: Pill,
      number: '04',
      title: 'Premium Supplementation',
      description: 'Receive pharmaceutical-grade, highly bioavailable supplements precisely dosed to restore your optimal nutrient levels fast.',
      color: 'from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/20'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            From symptom identification to precision supplementation — our 4-step process 
            ensures you get exactly what your body needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] right-[-calc(50%-40px)] w-[calc(100%-80px)] h-[2px] bg-gradient-to-r from-gray-200 to-gray-100 z-0" />
              )}
              
              <div className="relative z-10 text-center">
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6 shadow-2xl ${step.shadow} group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Step {step.number}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => { setCurrentView('assessment'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-2xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all text-lg"
          >
            Start Your Assessment Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
