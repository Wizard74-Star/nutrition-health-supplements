import React from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { FlaskConical, Mail, MapPin, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  const {
    setCurrentView
  } = useAssessment();
  const handleNav = (view: 'home' | 'database' | 'assessment' | 'booking') => {
    setCurrentView(view);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  return <footer className="bg-gray-900 text-gray-400">
      {/* CTA Banner */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Ready to Optimize Your Health?
              </h3>
              <p className="text-gray-400">
                Start with a free assessment or book your comprehensive blood analysis today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => handleNav('assessment')} className="group flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:scale-105 transition-all">
                Free Assessment
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => handleNav('booking')} className="px-8 py-3.5 border border-gray-700 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all">
                Book Blood Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold">NutriAnalysis</div>
                <div className="text-[10px] uppercase tracking-widest text-teal-500">Precision Nutrition</div>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Science-based nutritional analysis and premium supplementation. 
              Discover what your body is missing and restore optimal health with precision.
            </p>
            <div className="space-y-2">
              <a href="mailto:info@noisiamosalute.com" className="flex items-center gap-2 text-sm hover:text-teal-400 transition-colors">
                <Mail className="w-4 h-4" /> info@noisiamosalute.com
              </a>



              <div className="flex items-start gap-2 text-sm"><MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" /><br />20136 Milano (MI) Italy</div>

            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[{
              label: 'Home',
              view: 'home' as const
            }, {
              label: 'Nutrient Database',
              view: 'database' as const
            }, {
              label: 'Free Assessment',
              view: 'assessment' as const
            }, {
              label: 'Book Blood Analysis',
              view: 'booking' as const
            }].map(link => <li key={link.view}>
                  <button onClick={() => handleNav(link.view)} className="text-sm hover:text-teal-400 transition-colors">
                    {link.label}
                  </button>
                </li>)}
            </ul>
          </div>

          {/* Nutrients */}
          <div>
            <h4 className="text-white font-semibold mb-4">Nutrient Categories</h4>
            <ul className="space-y-2.5">
              {[{
              label: 'Vitamins (13)',
              cat: 'vitamin'
            }, {
              label: 'Minerals (16)',
              cat: 'mineral'
            }, {
              label: 'Amino Acids (9)',
              cat: 'amino_acid'
            }, {
              label: 'Fatty Acids (6)',
              cat: 'fatty_acid'
            }].map(item => <li key={item.cat}>
                  <button onClick={() => {
                setCurrentView('database');
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }} className="text-sm hover:text-teal-400 transition-colors">
                    {item.label}
                  </button>
                </li>)}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {['How It Works', 'Common Deficiencies', 'FAQ', 'Scientific References', 'Privacy Policy', 'Terms of Service'].map(item => <li key={item}>
                  <button onClick={() => handleNav('home')} className="text-sm hover:text-teal-400 transition-colors">
                    {item}
                  </button>
                </li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600" data-mixed-content="true">
              &copy; {new Date().getFullYear()} NutriAnalysis. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              Disclaimer: This tool provides educational guidance, not medical advice. Consult a healthcare provider for diagnosis.
            </p>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;