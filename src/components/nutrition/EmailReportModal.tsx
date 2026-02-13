import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  X, Mail, Loader2, CheckCircle2, AlertCircle, Send, 
  User, Shield, ArrowRight, Stethoscope, UserCircle, MessageSquare,
  FileText, ShieldAlert, AlertTriangle, Clock, Sparkles
} from 'lucide-react';
import { safeInvoke } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { generatePdfBase64, ReportData } from '@/utils/generatePdfReport';
import { DeficiencyResult } from '@/context/AssessmentContext';
import { SavedReport, SavedNutrientResult } from '@/utils/reportStorage';
import { allNutrients } from '@/data/nutrients';

// Support both live results and saved reports
interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Mode 1: Live results from ResultsDashboard
  results?: DeficiencyResult[];
  yesCount?: number;
  totalQuestions?: number;
  // Mode 2: Saved report from MyReports
  savedReport?: SavedReport;
}

type RecipientType = 'self' | 'provider' | 'other';
type ModalStep = 'form' | 'preparing' | 'sending' | 'success' | 'error';

interface ProgressStage {
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
}

const EmailReportModal: React.FC<EmailReportModalProps> = ({
  isOpen,
  onClose,
  results,
  yesCount,
  totalQuestions,
  savedReport,
}) => {
  const { user, profile } = useAuth();
  const [recipientType, setRecipientType] = useState<RecipientType>('self');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [modalStep, setModalStep] = useState<ModalStep>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [progressStageIdx, setProgressStageIdx] = useState(0);
  const [sentToEmail, setSentToEmail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Derive the actual results data from either mode
  const reportData = useMemo(() => {
    if (results && yesCount !== undefined && totalQuestions !== undefined) {
      return {
        deficiencyResults: results,
        yesCount,
        totalQuestions,
        reportDate: new Date().toISOString(),
      };
    }
    if (savedReport) {
      // Convert SavedNutrientResult[] back to DeficiencyResult[] for PDF generation
      const deficiencyResults: DeficiencyResult[] = savedReport.results.map((r: SavedNutrientResult) => {
        const nutrient = allNutrients.find(n => n.id === r.nutrientId);
        return {
          nutrient: nutrient || {
            id: r.nutrientId,
            name: r.nutrientName,
            category: r.category as any,
            rda: r.rda,
            unit: r.unit,
            description: '',
            functions: r.functions,
            deficiencySymptoms: [],
            foodSources: r.foodSources,
            criticalFor: [],
            absorptionTips: r.absorptionTips,
          },
          score: r.score,
          priority: r.priority,
          triggeringSymptoms: r.triggeringSymptoms,
        };
      });
      return {
        deficiencyResults,
        yesCount: savedReport.yesCount,
        totalQuestions: savedReport.totalQuestions,
        reportDate: savedReport.date,
      };
    }
    return null;
  }, [results, yesCount, totalQuestions, savedReport]);

  // Summary stats
  const summary = useMemo(() => {
    if (!reportData) return null;
    const r = reportData.deficiencyResults;
    return {
      critical: r.filter(d => d.priority === 'critical').length,
      moderate: r.filter(d => d.priority === 'moderate').length,
      low: r.filter(d => d.priority === 'low').length,
      total: r.length,
      topDeficiencies: r.slice(0, 5).map(d => ({
        name: d.nutrient.name,
        score: d.score,
        priority: d.priority,
      })),
    };
  }, [reportData]);

  // Auto-fill email for "self" mode
  useEffect(() => {
    if (recipientType === 'self' && user?.email) {
      setRecipientEmail(user.email);
      setRecipientName(profile?.display_name || user.user_metadata?.full_name || '');
    } else if (recipientType === 'provider') {
      setRecipientEmail('');
      setRecipientName('');
    } else if (recipientType === 'other') {
      setRecipientEmail('');
      setRecipientName('');
    }
  }, [recipientType, user, profile]);

  // Focus email input when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalStep('form');
      setErrorMessage('');
      setEmailError('');
      setProgressStageIdx(0);
      setPersonalMessage('');
      setRecipientType('self');
      if (user?.email) {
        setRecipientEmail(user.email);
        setRecipientName(profile?.display_name || user.user_metadata?.full_name || '');
      }
    }
  }, [isOpen, user, profile]);

  // Focus input for non-self modes
  useEffect(() => {
    if (isOpen && recipientType !== 'self' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, recipientType]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && modalStep !== 'preparing' && modalStep !== 'sending') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, modalStep]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node) && modalStep !== 'preparing' && modalStep !== 'sending') {
      onClose();
    }
  }, [onClose, modalStep]);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    if (!emailRegex.test(value.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipientEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(recipientEmail)) return;
    if (!reportData) {
      setErrorMessage('No report data available.');
      setModalStep('error');
      return;
    }

    setSentToEmail(recipientEmail.trim());
    setModalStep('preparing');
    setProgressStageIdx(0);
    setErrorMessage('');

    try {
      // Stage 1: Preparing report summary
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgressStageIdx(1);

      // Stage 2: Generating PDF
      const pdfReportData: ReportData = {
        results: reportData.deficiencyResults,
        yesCount: reportData.yesCount,
        totalQuestions: reportData.totalQuestions,
      };
      const pdfBase64 = generatePdfBase64(pdfReportData);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      setProgressStageIdx(2);
      setModalStep('sending');

      // Build the HTML summary data for the edge function
      const critical = reportData.deficiencyResults.filter(r => r.priority === 'critical');
      const moderate = reportData.deficiencyResults.filter(r => r.priority === 'moderate');
      const low = reportData.deficiencyResults.filter(r => r.priority === 'low');
      const topDeficiencies = reportData.deficiencyResults.slice(0, 5).map(r => r.nutrient.name);

      // Build detailed results for HTML email
      const detailedResults = reportData.deficiencyResults.slice(0, 10).map(r => ({
        name: r.nutrient.name,
        score: r.score,
        priority: r.priority,
        category: r.nutrient.category,
        triggeringSymptoms: r.triggeringSymptoms.slice(0, 3),
        foodSources: r.nutrient.foodSources.slice(0, 5),
        rda: r.nutrient.rda,
        unit: r.nutrient.unit,
        functions: r.nutrient.functions.slice(0, 3),
        absorptionTips: r.nutrient.absorptionTips || null,
      }));

      // Stage 3: Sending email via edge function
      const { data, error } = await safeInvoke('send-report-email', {
        body: {
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim() || undefined,
          senderName: profile?.display_name || user?.user_metadata?.full_name || undefined,
          personalMessage: personalMessage.trim() || undefined,
          recipientType,
          pdfBase64,
          reportDate: reportData.reportDate,
          reportSummary: {
            totalDeficiencies: reportData.deficiencyResults.length,
            criticalCount: critical.length,
            moderateCount: moderate.length,
            lowCount: low.length,
            topDeficiencies,
            yesCount: reportData.yesCount,
            totalQuestions: reportData.totalQuestions,
          },
          detailedResults,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        setErrorMessage('Failed to send email. The email service may be temporarily unavailable. Please try again.');
        setModalStep('error');
        return;
      }

      if (data?.error) {
        setErrorMessage(data.error);
        setModalStep('error');
        return;
      }

      setProgressStageIdx(3);
      await new Promise(resolve => setTimeout(resolve, 300));
      setModalStep('success');
    } catch (err) {
      console.error('Email send error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setModalStep('error');
    }
  }, [recipientEmail, recipientName, personalMessage, recipientType, reportData, user, profile]);

  const handleRetry = () => {
    setModalStep('form');
    setErrorMessage('');
    setProgressStageIdx(0);
  };

  const handleClose = () => {
    if (modalStep !== 'preparing' && modalStep !== 'sending') {
      onClose();
      setTimeout(() => {
        setRecipientEmail('');
        setRecipientName('');
        setPersonalMessage('');
        setModalStep('form');
        setErrorMessage('');
        setEmailError('');
        setProgressStageIdx(0);
        setRecipientType('self');
      }, 300);
    }
  };

  if (!isOpen) return null;

  const progressStages: ProgressStage[] = [
    {
      label: 'Preparing report summary',
      icon: <FileText className="w-4 h-4" />,
      completed: progressStageIdx > 0,
      active: progressStageIdx === 0,
    },
    {
      label: 'Generating PDF attachment',
      icon: <FileText className="w-4 h-4" />,
      completed: progressStageIdx > 1,
      active: progressStageIdx === 1,
    },
    {
      label: 'Sending email',
      icon: <Send className="w-4 h-4" />,
      completed: progressStageIdx > 2,
      active: progressStageIdx === 2,
    },
    {
      label: 'Delivered',
      icon: <CheckCircle2 className="w-4 h-4" />,
      completed: progressStageIdx >= 3,
      active: false,
    },
  ];

  const recipientTypeOptions = [
    {
      value: 'self' as RecipientType,
      label: 'Send to Myself',
      icon: UserCircle,
      desc: 'Receive a copy in your inbox',
      color: 'teal',
    },
    {
      value: 'provider' as RecipientType,
      label: 'Healthcare Provider',
      icon: Stethoscope,
      desc: 'Share with your doctor or nutritionist',
      color: 'blue',
    },
    {
      value: 'other' as RecipientType,
      label: 'Other Recipient',
      icon: User,
      desc: 'Send to anyone via email',
      color: 'purple',
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 px-6 py-5 flex-shrink-0">
          <div className="absolute top-3 right-14 w-16 h-16 rounded-full border border-white/10" />
          <div className="absolute -bottom-2 -left-2 w-20 h-20 rounded-full bg-white/5" />
          <button
            onClick={handleClose}
            disabled={modalStep === 'preparing' || modalStep === 'sending'}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50 z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Email Your Report</h3>
              <p className="text-sm text-teal-100">
                {savedReport 
                  ? `Report from ${new Date(savedReport.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Send a formatted summary with PDF attachment'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ─── FORM STATE ─── */}
          {modalStep === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Report preview mini-card */}
              {summary && (
                <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sparkles className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-semibold text-gray-700">Report Summary</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{summary.critical}</div>
                      <div className="text-[10px] text-red-500 font-medium">Critical</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-600">{summary.moderate}</div>
                      <div className="text-[10px] text-amber-500 font-medium">Moderate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{summary.low}</div>
                      <div className="text-[10px] text-blue-500 font-medium">Low Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-700">{summary.total}</div>
                      <div className="text-[10px] text-gray-500 font-medium">Total</div>
                    </div>
                  </div>
                  {summary.topDeficiencies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {summary.topDeficiencies.map((d, i) => (
                        <span
                          key={i}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            d.priority === 'critical' ? 'bg-red-100 text-red-600' :
                            d.priority === 'moderate' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {d.name} ({d.score}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recipient type selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Who should receive this report?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {recipientTypeOptions.map(opt => {
                    const Icon = opt.icon;
                    const isActive = recipientType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRecipientType(opt.value)}
                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center transition-all ${
                          isActive
                            ? opt.color === 'teal'
                              ? 'bg-teal-50 border-2 border-teal-400 text-teal-700 shadow-sm shadow-teal-500/10'
                              : opt.color === 'blue'
                              ? 'bg-blue-50 border-2 border-blue-400 text-blue-700 shadow-sm shadow-blue-500/10'
                              : 'bg-purple-50 border-2 border-purple-400 text-purple-700 shadow-sm shadow-purple-500/10'
                            : 'bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[11px] font-semibold leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient name (for provider/other) */}
              {recipientType !== 'self' && (
                <div>
                  <label htmlFor="recipient-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Recipient Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="recipient-name"
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={recipientType === 'provider' ? "Dr. Smith" : "Recipient's name"}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {recipientType === 'self' ? 'Your Email Address' : 
                   recipientType === 'provider' ? "Provider's Email Address" : 
                   "Recipient's Email Address"} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    id="email-address"
                    type="email"
                    value={recipientEmail}
                    onChange={handleEmailChange}
                    onBlur={() => recipientEmail && validateEmail(recipientEmail)}
                    placeholder={recipientType === 'provider' ? "doctor@clinic.com" : "email@example.com"}
                    required
                    readOnly={recipientType === 'self'}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm ${
                      recipientType === 'self' ? 'cursor-default' : ''
                    } ${
                      emailError 
                        ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400' 
                        : 'border-gray-200 focus:ring-teal-500/30 focus:border-teal-400'
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Personal message */}
              <div>
                <label htmlFor="personal-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Personal Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    id="personal-message"
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder={
                      recipientType === 'provider'
                        ? "Hi Dr. Smith, here are my latest nutrition assessment results for your review..."
                        : recipientType === 'other'
                        ? "I wanted to share my nutrition assessment results with you..."
                        : "Add a note to include in the email..."
                    }
                    rows={3}
                    maxLength={1000}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all text-sm resize-none"
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400">
                    {recipientType === 'provider' && 'Your message will appear at the top of the email'}
                  </span>
                  <span className="text-[10px] text-gray-400">{personalMessage.length}/1000</span>
                </div>
              </div>

              {/* What's included */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">The email will include:</p>
                <div className="space-y-1.5">
                  {[
                    'Professionally formatted HTML summary of all deficiency results',
                    'Priority levels (Critical, Moderate, Low) with risk scores',
                    'Triggering symptoms for each flagged nutrient',
                    'Recommended dietary sources and absorption tips',
                    'Full PDF report as an attachment',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-50/50 border border-teal-100">
                <Shield className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  {recipientType === 'provider' 
                    ? 'Your report will be sent directly to your healthcare provider. We do not store or share email addresses with third parties.'
                    : 'Your email will only be used to send this report. We respect your privacy and will not share your information.'
                  }
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full group flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Send className="w-4 h-4" />
                {recipientType === 'self' ? 'Send Report to My Email' :
                 recipientType === 'provider' ? 'Send to Healthcare Provider' :
                 'Send Report'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          )}

          {/* ─── PREPARING / SENDING STATE ─── */}
          {(modalStep === 'preparing' || modalStep === 'sending') && (
            <div className="py-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">
                  {modalStep === 'preparing' ? 'Preparing Your Report' : 'Sending Email'}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Sending to <strong className="text-gray-700">{sentToEmail}</strong>
                </p>
              </div>

              {/* Progress steps */}
              <div className="space-y-3 max-w-xs mx-auto">
                {progressStages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      stage.completed
                        ? 'bg-green-100 text-green-600'
                        : stage.active
                        ? 'bg-teal-100 text-teal-600 animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {stage.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : stage.active ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        stage.icon
                      )}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${
                      stage.completed
                        ? 'text-green-700'
                        : stage.active
                        ? 'text-teal-700'
                        : 'text-gray-400'
                    }`}>
                      {stage.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${((progressStageIdx + 1) / progressStages.length) * 100}%` }}
                />
              </div>

              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <Clock className="w-3 h-3" />
                This may take a few seconds
              </p>
            </div>
          )}

          {/* ─── SUCCESS STATE ─── */}
          {modalStep === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Report Sent Successfully!</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Your nutrition assessment report has been sent to
                </p>
                <p className="text-sm font-semibold text-teal-600 mt-1">{sentToEmail}</p>
              </div>

              {/* What was sent */}
              <div className="bg-green-50 rounded-xl p-4 text-left border border-green-100">
                <p className="text-xs font-semibold text-green-800 mb-2">What was sent:</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span>HTML-formatted deficiency summary</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span>PDF report attachment</span>
                  </div>
                  {personalMessage.trim() && (
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>Your personal message</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span>Priority levels and recommended actions</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-700">
                  Check {recipientType === 'self' ? 'your' : 'the recipient\'s'} inbox (and spam folder) for an email from NutriAnalysis.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* ─── ERROR STATE ─── */}
          {modalStep === 'error' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Failed to Send</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {errorMessage || 'Something went wrong while sending your report.'}
                </p>
              </div>

              {/* Troubleshooting tips */}
              <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Troubleshooting:</p>
                <div className="space-y-1.5">
                  {[
                    'Check that the email address is correct',
                    'Ensure you have a stable internet connection',
                    'Try again in a few moments',
                    'If the issue persists, download the PDF instead',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailReportModal;
