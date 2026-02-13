import React from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import MoleculeAnimation from './MoleculeAnimation';
import { ArrowRight, Microscope, BookOpen, ShieldCheck, TrendingUp } from 'lucide-react';

const Hero: React.FC = () => {
  const { setCurrentView } = useAssessment();

  const stats = [
    { value: '47+', label: 'Essential Nutrients', icon: BookOpen },
    { value: '45+', label: 'Symptom Markers', icon: Microscope },
    { value: '9', label: 'Health Categories', icon: ShieldCheck },
    { value: '100%', label: 'Personalized', icon: TrendingUp },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900" />
      <div className="absolute inset-0 bg-gradient-to-r from-teal-900/30 via-transparent to-emerald-900/20" />
      <MoleculeAnimation />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-300 text-sm font-medium">Science-Based Nutritional Analysis</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6">
              Discover What
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Your Body
              </span>
              <br />
              Is Missing
            </h1>

            <p className="text-lg lg:text-xl text-gray-400 leading-relaxed mb-10 max-w-xl">
              Comprehensive analysis of 47+ essential nutrients. Identify deficiencies through symptom mapping, 
              then get precise blood analysis and premium supplementation to restore optimal health.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={() => setCurrentView('assessment')}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-2xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all"
              >
                Start Free Assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setCurrentView('database')}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all"
              >
                Explore Nutrients
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Feature Cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { title: 'Vitamins', count: '13', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', text: 'text-amber-400', desc: 'A, B-complex, C, D, E, K' },
              { title: 'Minerals', count: '16', color: 'from-teal-500/20 to-teal-600/10', border: 'border-teal-500/20', text: 'text-teal-400', desc: 'Iron, Magnesium, Zinc, Selenium...' },
              { title: 'Amino Acids', count: '9', color: 'from-rose-500/20 to-rose-600/10', border: 'border-rose-500/20', text: 'text-rose-400', desc: 'Essential BCAAs, Tryptophan...' },
              { title: 'Fatty Acids', count: '6', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400', desc: 'Omega-3, 6, 9 essentials' },
            ].map((card, i) => (
              <button
                key={i}
                onClick={() => setCurrentView('database')}
                className={`group p-6 rounded-2xl bg-gradient-to-br ${card.color} border ${card.border} backdrop-blur-sm hover:scale-105 transition-all text-left`}
              >
                <div className={`text-4xl font-bold ${card.text} mb-1`}>{card.count}</div>
                <div className="text-white font-semibold mb-2">{card.title}</div>
                <div className="text-gray-500 text-sm">{card.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default Hero;
