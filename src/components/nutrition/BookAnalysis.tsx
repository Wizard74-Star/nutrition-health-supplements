import React, { useState } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { 
  Microscope, CheckCircle2, Clock, Shield, Award, 
  ArrowRight, User, Mail, Phone, MessageSquare, Calendar,
  Beaker, Target, Sparkles, FileText, Loader2, AlertCircle
} from 'lucide-react';

const BookAnalysis: React.FC = () => {
  const { bookingSubmitted, results, setCurrentView, isSaving, saveError, submitBooking, lastAssessmentId } = useAssessment();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    healthGoals: '',
    currentSupplements: '',
    dietType: 'omnivore'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!form.healthGoals.trim()) newErrors.healthGoals = 'Please describe your health goals';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const success = await submitBooking(form);
    
    if (success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSubmitError('Failed to submit booking. Please try again.');
    }
    
    setSubmitting(false);
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  if (bookingSubmitted) {
    return (
      <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/25">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Booking Request Received!
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-4">
            Thank you, <strong className="text-gray-700">{form.name}</strong>. We'll contact you within 24 hours at{' '}
            <strong className="text-gray-700">{form.email}</strong> to confirm your blood analysis appointment.
          </p>

          {lastAssessmentId && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 mb-8">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span className="text-teal-700 text-sm font-medium">Assessment results linked to your booking</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4">What Happens Next:</h3>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Confirmation Call', desc: 'Our team will call to confirm your appointment and discuss preparation guidelines.' },
                { step: '2', title: 'Blood Analysis', desc: 'Comprehensive panel testing 47+ biomarkers including all vitamins, minerals, amino acids, and fatty acid profiles.' },
                { step: '3', title: 'Expert Review', desc: 'Your results are analyzed by our nutrition specialists to identify exact deficiency levels.' },
                { step: '4', title: 'Custom Protocol', desc: 'You receive a personalized supplementation protocol with premium, bioavailable formulations.' },
              ].map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-teal-700">{item.step}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setCurrentView('database'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              Explore Nutrient Database
            </button>
            <button
              onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Left - Info */}
          <div className="lg:col-span-2">
            <div className="sticky top-28">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 mb-6">
                <Microscope className="w-4 h-4 text-teal-600" />
                <span className="text-teal-700 text-sm font-medium">Professional Analysis</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Book Your Blood Analysis
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Get precise measurements of your nutrient levels through comprehensive blood testing. 
                Our experts will create a targeted supplementation protocol to restore optimal health fast.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Beaker, title: '47+ Biomarkers Tested', desc: 'Complete vitamin, mineral, amino acid, and fatty acid panel' },
                  { icon: Target, title: 'Precision Protocol', desc: 'Custom supplementation plan based on your exact levels' },
                  { icon: Sparkles, title: 'Premium Supplements', desc: 'Pharmaceutical-grade, highly bioavailable formulations' },
                  { icon: FileText, title: 'Detailed Report', desc: 'Comprehensive analysis with actionable recommendations' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { icon: Shield, label: 'HIPAA Compliant' },
                  { icon: Award, label: 'Certified Lab' },
                  { icon: Clock, label: 'Results in 5 Days' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                    <badge.icon className="w-3.5 h-3.5" />
                    {badge.label}
                  </div>
                ))}
              </div>

              {results.length > 0 && (
                <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 mb-2">From Your Assessment:</p>
                  <p className="text-sm text-amber-700">
                    {results.filter(r => r.priority === 'critical').length} critical and{' '}
                    {results.filter(r => r.priority === 'moderate').length} moderate deficiency risks detected. 
                    Blood analysis will confirm exact levels.
                  </p>
                  {lastAssessmentId && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Assessment saved &mdash; will be linked to your booking
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right - Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-black/5 p-6 lg:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Request Your Appointment</h3>
              
              {submitError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Submission Error</p>
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="John Smith"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'} text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'} text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+39 XXX XXX XXXX"

                    className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'} text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400`}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Preferred Date (optional)
                  </label>
                  <input
                    type="date"
                    value={form.preferredDate}
                    onChange={(e) => handleChange('preferredDate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Current Diet</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['omnivore', 'vegetarian', 'vegan', 'keto'].map(diet => (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => handleChange('dietType', diet)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          form.dietType === diet
                            ? 'bg-teal-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {diet.charAt(0).toUpperCase() + diet.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    Health Goals & Concerns
                  </label>
                  <textarea
                    value={form.healthGoals}
                    onChange={(e) => handleChange('healthGoals', e.target.value)}
                    placeholder="Describe your primary health goals, current symptoms, or concerns..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.healthGoals ? 'border-red-300 bg-red-50' : 'border-gray-200'} text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none`}
                  />
                  {errors.healthGoals && <p className="text-xs text-red-500 mt-1">{errors.healthGoals}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Current Supplements (optional)
                  </label>
                  <textarea
                    value={form.currentSupplements}
                    onChange={(e) => handleChange('currentSupplements', e.target.value)}
                    placeholder="List any supplements you're currently taking..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-2xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] transition-all text-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Request Blood Analysis Appointment
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  By submitting, you agree to be contacted regarding your appointment. 
                  Your information is kept strictly confidential.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookAnalysis;
