import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Marathon Runner',
    text: 'I had chronic fatigue for years. The blood analysis revealed severe B12 and iron deficiency. Within 6 weeks of targeted supplementation, my energy levels transformed completely.',
    avatar: 'SM',
    highlight: 'B12 & Iron',
    color: 'bg-amber-100 text-amber-700'
  },
  {
    name: 'Dr. James Chen',
    role: 'Physician',
    text: 'As a doctor, I was skeptical. But the comprehensive panel caught my vitamin D and magnesium deficiency that standard tests missed. The precision of the analysis is remarkable.',
    avatar: 'JC',
    highlight: 'Vitamin D & Magnesium',
    color: 'bg-teal-100 text-teal-700'
  },
  {
    name: 'Maria Rodriguez',
    role: 'Yoga Instructor',
    text: 'My brain fog and anxiety were linked to omega-3 and zinc deficiencies. The custom supplement protocol cleared my mind in just 4 weeks. I feel like a different person.',
    avatar: 'MR',
    highlight: 'Omega-3 & Zinc',
    color: 'bg-rose-100 text-rose-700'
  },
  {
    name: 'Thomas Wright',
    role: 'Software Engineer',
    text: 'Working long hours destroyed my sleep. Turns out I was severely deficient in magnesium and tryptophan. The targeted supplementation gave me the best sleep of my life.',
    avatar: 'TW',
    highlight: 'Magnesium & Tryptophan',
    color: 'bg-indigo-100 text-indigo-700'
  },
  {
    name: 'Lisa Park',
    role: 'Fitness Coach',
    text: 'My clients and I use this service regularly. The amino acid profiling alone is worth it — we optimized recovery times by 40% with precise leucine and BCAA supplementation.',
    avatar: 'LP',
    highlight: 'BCAAs & Amino Acids',
    color: 'bg-emerald-100 text-emerald-700'
  },
  {
    name: 'Robert Kim',
    role: 'Executive',
    text: 'Hair loss and brittle nails for 2 years. Blood analysis showed biotin, iron, and selenium were all critically low. 3 months later — full regrowth. Incredible results.',
    avatar: 'RK',
    highlight: 'Biotin & Selenium',
    color: 'bg-purple-100 text-purple-700'
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Real Results, Real People
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Thousands have discovered their hidden deficiencies and transformed their health 
            with precision nutrition analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl hover:shadow-black/5 hover:border-gray-200 transition-all"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-gray-200 mb-4" />
              
              {/* Text */}
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                "{t.text}"
              </p>

              {/* Deficiency tag */}
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${t.color} mb-5`}>
                Deficiency: {t.highlight}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
