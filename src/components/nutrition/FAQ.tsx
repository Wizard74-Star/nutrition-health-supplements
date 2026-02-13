import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'How accurate is the symptom-based assessment?',
    a: 'Our assessment cross-references your symptoms against established clinical deficiency patterns. While it provides valuable directional guidance (approximately 75-85% alignment with blood results), it cannot replace blood analysis for precise measurements. Think of it as a highly educated screening tool.'
  },
  {
    q: 'What does the blood analysis test for?',
    a: 'Our comprehensive panel tests 47+ biomarkers including all 13 essential vitamins, 16 minerals, 9 essential amino acids, omega-3/6/9 fatty acid profiles, inflammatory markers, thyroid function, and metabolic indicators. It\'s one of the most thorough nutritional panels available.'
  },
  {
    q: 'How long does it take to get results?',
    a: 'Blood draw takes approximately 15 minutes. Results are typically available within 5 business days. Your personalized report and supplementation protocol are delivered within 7 days of the blood draw.'
  },
  {
    q: 'Are the supplements pharmaceutical-grade?',
    a: 'Yes. We exclusively use pharmaceutical-grade, third-party tested supplements in their most bioavailable forms. For example, we use methylcobalamin (not cyanocobalamin) for B12, magnesium glycinate (not oxide) for magnesium, and triglyceride-form fish oil for omega-3s.'
  },
  {
    q: 'How quickly will I see results from supplementation?',
    a: 'Most clients report noticeable improvements within 2-4 weeks for water-soluble nutrients (B vitamins, vitamin C). Fat-soluble nutrients (vitamin D, omega-3s) typically take 4-8 weeks. Minerals like iron may take 8-12 weeks to fully replenish stores.'
  },
  {
    q: 'Can I take the assessment if I\'m already on supplements?',
    a: 'Absolutely. The assessment evaluates your current symptom status regardless of supplementation. In fact, if you\'re supplementing and still experiencing symptoms, it may indicate absorption issues, incorrect forms, or insufficient dosing — all things our blood analysis can identify.'
  },
  {
    q: 'Is this suitable for vegetarians/vegans?',
    a: 'Yes, and it\'s especially important. Vegetarians and vegans are at higher risk for B12, iron, zinc, omega-3 (DHA/EPA), and certain amino acid deficiencies. Our protocols include plant-based supplement options where available.'
  },
  {
    q: 'Do you offer follow-up testing?',
    a: 'Yes. We recommend follow-up blood analysis at 3 months and 6 months to track progress and adjust your protocol. Many clients transition to annual testing once optimal levels are achieved.'
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 mb-6">
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 text-sm font-medium">Common Questions</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`rounded-2xl border transition-all ${
                openIndex === i ? 'bg-white border-gray-200 shadow-lg shadow-black/5' : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className={`text-sm lg:text-base font-semibold pr-4 ${openIndex === i ? 'text-gray-900' : 'text-gray-700'}`}>
                  {faq.q}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
