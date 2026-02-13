import React, { useState, useMemo } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { assessmentCategories } from '@/data/symptoms';
import { 
  Zap, Sparkles, Brain, Shield, Moon, Activity, Heart, Eye, 
  ChevronRight, ChevronLeft, CheckCircle2, Circle, ArrowRight,
  ClipboardCheck, AlertCircle
} from 'lucide-react';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Zap, Sparkles, Brain, Shield, Moon, Activity, Heart, Eye,
  Bone: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.3 5.7a2.5 2.5 0 0 1 0 3.5l-9.1 9.1a2.5 2.5 0 0 1-3.5 0 2.5 2.5 0 0 1 0-3.5l9.1-9.1a2.5 2.5 0 0 1 3.5 0Z"/>
      <path d="m19.7 7.1-1.4-1.4"/>
      <path d="M5.7 19.7l-1.4-1.4"/>
      <path d="m17.3 4.3 1 1"/>
      <path d="m4.3 17.3 1 1"/>
    </svg>
  ),
};

const SymptomAssessment: React.FC = () => {
  const { answers, setAnswer, calculateResults, setCurrentView, resetAssessment } = useAssessment();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  const currentCategory = assessmentCategories[currentCategoryIndex];
  const totalCategories = assessmentCategories.length;
  const progress = ((currentCategoryIndex) / totalCategories) * 100;

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const totalQuestions = useMemo(() => {
    return assessmentCategories.reduce((sum, cat) => sum + cat.questions.length, 0);
  }, []);

  const handleNext = () => {
    if (currentCategoryIndex < totalCategories - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = () => {
    calculateResults();
    setCurrentView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStart = () => {
    resetAssessment();
    setCurrentCategoryIndex(0);
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/25">
              <ClipboardCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              Nutritional Deficiency Assessment
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Answer questions across 9 health categories to identify potential nutrient gaps. 
              This takes about 5 minutes.
            </p>
          </div>

          {/* Category Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            {assessmentCategories.map((cat, i) => {
              const IconComp = iconMap[cat.icon] || Zap;
              return (
                <div key={cat.id} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{cat.name}</div>
                    <div className="text-xs text-gray-500">{cat.questions.length} questions</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">Important Disclaimer</p>
                <p className="text-sm text-amber-700">
                  This assessment provides educational guidance based on symptom patterns. It is not a medical diagnosis. 
                  For accurate results, professional blood analysis is recommended.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleStart}
              className="group inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-2xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all text-lg"
            >
              Begin Assessment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-gray-400 mt-4">{totalQuestions} questions across {totalCategories} categories</p>
          </div>
        </div>
      </section>
    );
  }

  const IconComp = iconMap[currentCategory.icon] || Zap;

  return (
    <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">
              Category {currentCategoryIndex + 1} of {totalCategories}
            </span>
            <span className="text-sm text-gray-500">
              {answeredCount} of {totalQuestions} answered
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Category dots */}
          <div className="flex gap-1.5 mt-3">
            {assessmentCategories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => setCurrentCategoryIndex(i)}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i === currentCategoryIndex
                    ? 'bg-teal-500'
                    : i < currentCategoryIndex
                      ? 'bg-teal-300'
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Category Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <IconComp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{currentCategory.name}</h3>
            <p className="text-sm text-gray-500">{currentCategory.description}</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {currentCategory.questions.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined;
            const isYes = answers[q.id] === true;
            const isNo = answers[q.id] === false;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isAnswered
                    ? isYes
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {isAnswered ? (
                      <CheckCircle2 className={`w-5 h-5 ${isYes ? 'text-amber-500' : 'text-green-500'}`} />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm lg:text-base text-gray-800 font-medium mb-3">
                      {q.question}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAnswer(q.id, true)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                          isYes
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setAnswer(q.id, false)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                          isNo
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                  {q.severity === 'high' && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-600 font-semibold flex-shrink-0">
                      HIGH IMPACT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={currentCategoryIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              currentCategoryIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {currentCategoryIndex === totalCategories - 1 ? (
            <button
              onClick={handleFinish}
              className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all"
            >
              Get My Results
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Next Category
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SymptomAssessment;
