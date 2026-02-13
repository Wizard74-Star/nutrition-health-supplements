import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Download, FileText, FileSpreadsheet, FileJson, Share2, X, Mail,
  Loader2, CheckCircle2, AlertCircle, Send, User, Stethoscope,
  MessageSquare, Shield, ArrowRight, Clock, ChevronDown, ChevronUp,
  Heart, Activity, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Braces, Table2, FileDown, ExternalLink, Info, Copy, Check
} from 'lucide-react';
import { safeInvoke } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  BloodTestExportData,
  downloadCSV,
  downloadBloodTestPDF,
  downloadFHIR,
  prepareShareWithDoctorData,
  ShareWithDoctorData,
} from '@/utils/bloodTestExports';
import {
  bloodMarkers, evaluateMarkerValue, getSeverityInfo, markerCategories, MarkerCategory
} from '@/data/bloodMarkers';

interface BloodTestExportPanelProps {
  tests: BloodTestExportData[];
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'csv' | 'pdf' | 'fhir';
type ModalView = 'main' | 'share-doctor';
type ShareStep = 'form' | 'preparing' | 'sending' | 'success' | 'error';

const BloodTestExportPanel: React.FC<BloodTestExportPanelProps> = ({ tests, isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  // Export state
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportSuccess, setExportSuccess] = useState<ExportFormat | null>(null);

  // Modal view
  const [modalView, setModalView] = useState<ModalView>('main');

  // Share with Doctor state
  const [shareStep, setShareStep] = useState<ShareStep>('form');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [shareError, setShareError] = useState('');
  const [sentToEmail, setSentToEmail] = useState('');
  const [progressStage, setProgressStage] = useState(0);

  // FHIR preview
  const [showFhirPreview, setShowFhirPreview] = useState(false);
  const [fhirCopied, setFhirCopied] = useState(false);

  // Latest test summary
  const latestTest = tests[0];
  const summary = useMemo(() => {
    if (!latestTest) return null;
    const evaluated = latestTest.markers.map(m => {
      const marker = bloodMarkers.find(bm => bm.id === m.markerId);
      if (!marker) return null;
      return { severity: evaluateMarkerValue(marker, m.value) };
    }).filter(Boolean);

    return {
      total: evaluated.length,
      normal: evaluated.filter(m => m!.severity === 'normal').length,
      borderline: evaluated.filter(m => m!.severity.includes('borderline')).length,
      abnormal: evaluated.filter(m => m!.severity === 'low' || m!.severity === 'high').length,
      critical: evaluated.filter(m => m!.severity.includes('critical')).length,
    };
  }, [latestTest]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalView('main');
      setShareStep('form');
      setExporting(null);
      setExportSuccess(null);
      setDoctorEmail('');
      setDoctorName('');
      setPersonalMessage('');
      setEmailError('');
      setShareError('');
      setProgressStage(0);
      setShowFhirPreview(false);
      setFhirCopied(false);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && shareStep !== 'preparing' && shareStep !== 'sending') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, shareStep]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node) && shareStep !== 'preparing' && shareStep !== 'sending') {
      onClose();
    }
  }, [onClose, shareStep]);

  // ── Export handlers ──

  const handleExportCSV = useCallback(async () => {
    setExporting('csv');
    try {
      await new Promise(r => setTimeout(r, 300));
      downloadCSV(tests);
      setExportSuccess('csv');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setExporting(null);
    }
  }, [tests]);

  const handleExportPDF = useCallback(async () => {
    setExporting('pdf');
    try {
      await new Promise(r => setTimeout(r, 500));
      const patientName = profile?.display_name || user?.user_metadata?.full_name || undefined;
      downloadBloodTestPDF(tests, patientName);
      setExportSuccess('pdf');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(null);
    }
  }, [tests, profile, user]);

  const handleExportFHIR = useCallback(async () => {
    setExporting('fhir');
    try {
      await new Promise(r => setTimeout(r, 300));
      const patientName = profile?.display_name || user?.user_metadata?.full_name || undefined;
      downloadFHIR(tests, patientName, user?.email || undefined);
      setExportSuccess('fhir');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('FHIR export failed:', err);
    } finally {
      setExporting(null);
    }
  }, [tests, profile, user]);

  const handleCopyFHIR = useCallback(async () => {
    try {
      const patientName = profile?.display_name || user?.user_metadata?.full_name || undefined;
      const { generateFHIRBundle } = await import('@/utils/bloodTestExports');
      const bundle = generateFHIRBundle(tests, patientName, user?.email || undefined);
      await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
      setFhirCopied(true);
      setTimeout(() => setFhirCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy FHIR:', err);
    }
  }, [tests, profile, user]);

  // ── Share with Doctor ──

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) { setEmailError('Email address is required'); return false; }
    if (!emailRegex.test(value.trim())) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError('');
    return true;
  };

  const handleShareSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(doctorEmail)) return;

    setSentToEmail(doctorEmail.trim());
    setShareStep('preparing');
    setProgressStage(0);
    setShareError('');

    try {
      // Stage 1: Prepare data
      await new Promise(r => setTimeout(r, 500));
      setProgressStage(1);

      const patientName = profile?.display_name || user?.user_metadata?.full_name || undefined;
      const shareData = prepareShareWithDoctorData(tests, patientName);

      await new Promise(r => setTimeout(r, 400));
      setProgressStage(2);
      setShareStep('sending');

      // Stage 2: Send email
      const { data, error } = await safeInvoke('send-blood-report-email', {
        body: {
          recipientEmail: doctorEmail.trim(),
          recipientName: doctorName.trim() || undefined,
          senderName: patientName || undefined,
          personalMessage: personalMessage.trim() || undefined,
          pdfBase64: shareData.pdfBase64,
          testDate: shareData.testDate,
          labName: shareData.labName,
          summary: shareData.summary,
          abnormalMarkers: shareData.abnormalMarkers,
          supplements: shareData.supplements,
        },
      });

      if (error) {
        setShareError('Failed to send email. The email service may be temporarily unavailable.');
        setShareStep('error');
        return;
      }

      if (data?.error) {
        setShareError(data.error);
        setShareStep('error');
        return;
      }

      setProgressStage(3);
      await new Promise(r => setTimeout(r, 300));
      setShareStep('success');
    } catch (err) {
      console.error('Share error:', err);
      setShareError('An unexpected error occurred. Please try again.');
      setShareStep('error');
    }
  }, [doctorEmail, doctorName, personalMessage, tests, profile, user]);

  if (!isOpen) return null;

  const formatOptions = [
    {
      id: 'csv' as ExportFormat,
      icon: <FileSpreadsheet className="w-5 h-5" />,
      label: 'CSV Spreadsheet',
      desc: 'All markers, dates, values, and status in a spreadsheet format. Compatible with Excel, Google Sheets, and other tools.',
      color: 'emerald',
      details: [`${tests.length} test${tests.length !== 1 ? 's' : ''} with all marker data`, 'Includes reference ranges and status', 'Ready for data analysis'],
      handler: handleExportCSV,
    },
    {
      id: 'pdf' as ExportFormat,
      icon: <FileText className="w-5 h-5" />,
      label: 'PDF Report',
      desc: 'Professional report with summary cards, detailed results table, visual reference range charts, and supplement recommendations.',
      color: 'rose',
      details: ['Visual reference range indicators', 'Trend arrows for multi-test data', 'Supplement recommendations included'],
      handler: handleExportPDF,
    },
    {
      id: 'fhir' as ExportFormat,
      icon: <Braces className="w-5 h-5" />,
      label: 'HL7 FHIR JSON',
      desc: 'Standardized healthcare interoperability format with LOINC codes. Share with EHR systems and healthcare providers.',
      color: 'blue',
      details: ['FHIR R4 Bundle format', 'LOINC coded observations', 'Compatible with Epic, Cerner, etc.'],
      handler: handleExportFHIR,
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; ring: string; btnBg: string; btnHover: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', ring: 'ring-emerald-500/20', btnBg: 'bg-emerald-500', btnHover: 'hover:bg-emerald-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', ring: 'ring-rose-500/20', btnBg: 'bg-rose-500', btnHover: 'hover:bg-rose-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', ring: 'ring-blue-500/20', btnBg: 'bg-blue-500', btnHover: 'hover:bg-blue-600' },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 px-6 py-5 flex-shrink-0">
          <div className="absolute top-3 right-14 w-16 h-16 rounded-full border border-white/10" />
          <div className="absolute -bottom-2 -left-2 w-20 h-20 rounded-full bg-white/5" />
          <button
            onClick={onClose}
            disabled={shareStep === 'preparing' || shareStep === 'sending'}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50 z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              {modalView === 'share-doctor' ? <Mail className="w-5 h-5 text-white" /> : <Download className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {modalView === 'share-doctor' ? 'Share with Doctor' : 'Export Blood Test Data'}
              </h3>
              <p className="text-sm text-rose-100">
                {modalView === 'share-doctor'
                  ? 'Send a formatted summary to your healthcare provider'
                  : `${tests.length} test${tests.length !== 1 ? 's' : ''} available for export`}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ─── MAIN EXPORT VIEW ─── */}
          {modalView === 'main' && (
            <div className="space-y-4">
              {/* Quick summary */}
              {summary && (
                <div className="bg-gradient-to-r from-gray-50 to-rose-50/30 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Activity className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-semibold text-gray-700">Latest Test Summary</span>
                    <span className="text-[10px] text-gray-400 ml-auto">
                      {latestTest && new Date(latestTest.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: 'Total', value: summary.total, color: 'text-gray-700' },
                      { label: 'Normal', value: summary.normal, color: 'text-emerald-600' },
                      { label: 'Borderline', value: summary.borderline, color: 'text-amber-600' },
                      { label: 'Abnormal', value: summary.abnormal, color: 'text-orange-600' },
                      { label: 'Critical', value: summary.critical, color: 'text-red-600' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export format cards */}
              {formatOptions.map(opt => {
                const colors = colorMap[opt.color];
                const isExporting = exporting === opt.id;
                const isSuccess = exportSuccess === opt.id;

                return (
                  <div
                    key={opt.id}
                    className={`rounded-xl border transition-all ${colors.border} ${colors.bg}/30 hover:shadow-sm`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 ${colors.text}`}>
                          {opt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-gray-900">{opt.label}</h4>
                            {opt.id === 'fhir' && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-semibold">Healthcare Standard</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed mb-2">{opt.desc}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {opt.details.map((d, i) => (
                              <span key={i} className="flex items-center gap-1 text-[10px] text-gray-400">
                                <CheckCircle2 className="w-3 h-3 text-gray-300" />
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={opt.handler}
                            disabled={isExporting || tests.length === 0}
                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all disabled:opacity-50 ${colors.btnBg} ${colors.btnHover} shadow-sm hover:shadow-md`}
                          >
                            {isExporting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isSuccess ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            {isExporting ? 'Exporting...' : isSuccess ? 'Downloaded!' : 'Download'}
                          </button>
                          {opt.id === 'fhir' && (
                            <button
                              onClick={handleCopyFHIR}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200"
                            >
                              {fhirCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {fhirCopied ? 'Copied!' : 'Copy JSON'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Share with Doctor CTA */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Share with Your Doctor</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">
                      Send a professionally formatted PDF summary of your latest blood test results directly to your healthcare provider via email. Includes trend arrows, abnormal value highlights, and supplement recommendations.
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {['Formatted email with summary table', 'PDF report attached', 'Trend indicators & recommendations'].map((d, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] text-indigo-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setModalView('share-doctor')}
                    disabled={tests.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Share
                  </button>
                </div>
              </div>

              {/* Format info */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-500 leading-relaxed">
                    <strong className="text-gray-600">About HL7 FHIR:</strong> Fast Healthcare Interoperability Resources (FHIR) is the global standard for exchanging healthcare data electronically. Your export includes LOINC-coded observations compatible with major EHR systems like Epic, Cerner, and Allscripts.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── SHARE WITH DOCTOR VIEW ─── */}
          {modalView === 'share-doctor' && (
            <div>
              {/* Back button */}
              {shareStep === 'form' && (
                <button
                  onClick={() => setModalView('main')}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-4 transition-colors"
                >
                  <ArrowRight className="w-3 h-3 rotate-180" />
                  Back to Export Options
                </button>
              )}

              {/* ── FORM ── */}
              {shareStep === 'form' && (
                <form onSubmit={handleShareSubmit} className="space-y-5">
                  {/* Latest test preview */}
                  {summary && latestTest && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50/30 rounded-xl p-4 border border-indigo-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-gray-700">Report Being Shared</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>
                          <strong>Date:</strong> {new Date(latestTest.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        {latestTest.lab_name && <span><strong>Lab:</strong> {latestTest.lab_name}</span>}
                        <span><strong>Markers:</strong> {summary.total}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {[
                          { label: 'Total', value: summary.total, cls: 'text-gray-700' },
                          { label: 'Normal', value: summary.normal, cls: 'text-emerald-600' },
                          { label: 'Borderline', value: summary.borderline, cls: 'text-amber-600' },
                          { label: 'Abnormal', value: summary.abnormal, cls: 'text-orange-600' },
                          { label: 'Critical', value: summary.critical, cls: 'text-red-600' },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <div className={`text-lg font-bold ${s.cls}`}>{s.value}</div>
                            <div className="text-[10px] text-gray-500 font-medium">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doctor name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Doctor / Provider Name <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={doctorName}
                        onChange={e => setDoctorName(e.target.value)}
                        placeholder="Dr. Smith"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Doctor email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Doctor's Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={doctorEmail}
                        onChange={e => { setDoctorEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                        onBlur={() => doctorEmail && validateEmail(doctorEmail)}
                        placeholder="doctor@clinic.com"
                        required
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm ${
                          emailError ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400' : 'border-gray-200 focus:ring-indigo-500/30 focus:border-indigo-400'
                        }`}
                      />
                    </div>
                    {emailError && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{emailError}
                      </p>
                    )}
                  </div>

                  {/* Personal message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Personal Message <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        value={personalMessage}
                        onChange={e => setPersonalMessage(e.target.value)}
                        placeholder="Hi Dr. Smith, here are my latest blood test results for your review..."
                        rows={3}
                        maxLength={1000}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-sm resize-none"
                      />
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-gray-400">{personalMessage.length}/1000</span>
                    </div>
                  </div>

                  {/* What's included */}
                  <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 mb-2">The email will include:</p>
                    <div className="space-y-1.5">
                      {[
                        'Professionally formatted HTML summary with results table',
                        'Abnormal markers highlighted with severity badges',
                        'Trend arrows showing changes from previous tests',
                        'Supplement recommendations based on blood work analysis',
                        'Full PDF report with charts as an attachment',
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Privacy note */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <Shield className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Your report will be sent directly to your healthcare provider via secure email. We do not store provider email addresses or share your data with third parties.
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full group flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Send to Healthcare Provider
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </form>
              )}

              {/* ── PREPARING / SENDING ── */}
              {(shareStep === 'preparing' || shareStep === 'sending') && (
                <div className="py-6 space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {shareStep === 'preparing' ? 'Preparing Your Report' : 'Sending Email'}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Sending to <strong className="text-gray-700">{sentToEmail}</strong>
                    </p>
                  </div>

                  <div className="space-y-3 max-w-xs mx-auto">
                    {[
                      { label: 'Analyzing blood test data', completed: progressStage > 0, active: progressStage === 0 },
                      { label: 'Generating PDF report', completed: progressStage > 1, active: progressStage === 1 },
                      { label: 'Sending email', completed: progressStage > 2, active: progressStage === 2 },
                      { label: 'Delivered', completed: progressStage >= 3, active: false },
                    ].map((stage, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          stage.completed ? 'bg-green-100 text-green-600' : stage.active ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {stage.completed ? <CheckCircle2 className="w-4 h-4" /> : stage.active ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <span className={`text-sm font-medium ${stage.completed ? 'text-green-700' : stage.active ? 'text-indigo-700' : 'text-gray-400'}`}>
                          {stage.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${((progressStage + 1) / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ── SUCCESS ── */}
              {shareStep === 'success' && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Report Sent Successfully!</h4>
                    <p className="text-sm text-gray-500 mt-1">Your blood test report has been sent to</p>
                    <p className="text-sm font-semibold text-indigo-600 mt-1">{sentToEmail}</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4 text-left border border-green-100">
                    <p className="text-xs font-semibold text-green-800 mb-2">What was sent:</p>
                    <div className="space-y-1.5">
                      {[
                        'HTML-formatted blood test summary with results table',
                        'Abnormal markers highlighted with trend indicators',
                        'Supplement recommendations based on results',
                        'Full PDF report with charts as attachment',
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-green-700">
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs text-amber-700">
                      Ask your healthcare provider to check their inbox (and spam folder) for an email from NutriAnalysis Blood Tracker.
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* ── ERROR ── */}
              {shareStep === 'error' && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Failed to Send</h4>
                    <p className="text-sm text-gray-500 mt-1">{shareError || 'Something went wrong.'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Troubleshooting:</p>
                    <div className="space-y-1.5">
                      {[
                        'Check that the email address is correct',
                        'Ensure you have a stable internet connection',
                        'Try again in a few moments',
                        'You can also download the PDF and send it manually',
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
                      onClick={() => { setShareStep('form'); setShareError(''); setProgressStage(0); }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BloodTestExportPanel;
