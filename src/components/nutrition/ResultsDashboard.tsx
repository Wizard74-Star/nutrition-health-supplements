import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useAssessment, DeficiencyResult } from '@/context/AssessmentContext';
import { useAuth } from '@/context/AuthContext';
import { categoryInfo } from '@/data/nutrients';
import { allQuestions } from '@/data/symptoms';
import { generatePdfReport } from '@/utils/generatePdfReport';
import { saveReport, getAllReports, saveReportToCloud, SavedReport } from '@/utils/reportStorage';
import EmailReportModal from '@/components/nutrition/EmailReportModal';
import { 
  AlertTriangle, TrendingDown, ArrowRight, RotateCcw, 
  ShieldAlert, ShieldCheck, Shield, ChevronDown, ChevronUp,
  Microscope, Apple, Lightbulb, FileText, Loader2, CheckCircle2, AlertCircle,
  Download, Mail, Save, FolderOpen, Cloud, CloudOff
} from 'lucide-react';



const PriorityBadge: React.FC<{ priority: 'critical' | 'moderate' | 'low' }> = ({ priority }) => {
  const config = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: ShieldAlert },
    moderate: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Shield },
    low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: ShieldCheck },
  };
  const c = config[priority];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const ScoreBar: React.FC<{ score: number; priority: string }> = ({ score, priority }) => {
  const color = priority === 'critical' ? 'bg-red-500' : priority === 'moderate' ? 'bg-amber-500' : 'bg-blue-400';
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
};

const ResultCard: React.FC<{ result: DeficiencyResult; index: number }> = ({ result, index }) => {
  const [expanded, setExpanded] = React.useState(index < 3);
  const catInfo = categoryInfo[result.nutrient.category];

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      result.priority === 'critical' ? 'border-red-200 bg-white' :
      result.priority === 'moderate' ? 'border-amber-200 bg-white' :
      'border-gray-200 bg-white'
    }`}>
      <div
        className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-10 text-center">
            <span className={`text-2xl font-bold ${
              result.priority === 'critical' ? 'text-red-500' :
              result.priority === 'moderate' ? 'text-amber-500' : 'text-blue-400'
            }`}>
              {index + 1}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-lg font-bold text-gray-900">{result.nutrient.name}</h4>
              <PriorityBadge priority={result.priority} />
              <span className={`text-xs px-2 py-0.5 rounded-full ${catInfo.bgColor} ${catInfo.color} font-medium`}>
                {catInfo.label.slice(0, -1)}
              </span>
            </div>
            <div className="mt-2">
              <ScoreBar score={result.score} priority={result.priority} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-500">Deficiency risk score</span>
              <span className={`text-sm font-bold ${
                result.priority === 'critical' ? 'text-red-600' :
                result.priority === 'moderate' ? 'text-amber-600' : 'text-blue-500'
              }`}>
                {result.score}%
              </span>
            </div>
          </div>
          <button className="text-gray-400 flex-shrink-0">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          {/* Why flagged */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-700">Why This Was Flagged</span>
            </div>
            <div className="space-y-1.5">
              {result.triggeringSymptoms.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key functions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Microscope className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700">Why You Need It</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.nutrient.functions.slice(0, 4).map((fn, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-medium">
                  {fn}
                </span>
              ))}
            </div>
          </div>

          {/* Food sources */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Apple className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-gray-700">Increase Through Diet</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.nutrient.foodSources.map((f, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Absorption tip */}
          {result.nutrient.absorptionTips && (
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">{result.nutrient.absorptionTips}</p>
              </div>
            </div>
          )}

          {/* RDA */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>Recommended Daily: <strong className="text-gray-700">{result.nutrient.rda} {result.nutrient.unit}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultsDashboard: React.FC = () => {
  const { results, setCurrentView, resetAssessment, answers, isSaving, saveError, lastAssessmentId } = useAssessment();
  const { user, isAuthenticated } = useAuth();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [savedToLocal, setSavedToLocal] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const hasSavedRef = useRef(false);
  const savedReportRef = useRef<SavedReport | null>(null);

  const summary = useMemo(() => {
    const critical = results.filter(r => r.priority === 'critical');
    const moderate = results.filter(r => r.priority === 'moderate');
    const low = results.filter(r => r.priority === 'low');
    const yesCount = Object.values(answers).filter(v => v).length;
    return { critical, moderate, low, yesCount, total: results.length };
  }, [results, answers]);

  // Auto-save to localStorage when results are available
  useEffect(() => {
    if (results.length > 0 && !hasSavedRef.current) {
      hasSavedRef.current = true;
      try {
        const report = saveReport(
          results,
          answers,
          summary.yesCount,
          allQuestions.length
        );
        savedReportRef.current = report;
        setSavedToLocal(true);
      } catch (err) {
        console.error('Failed to save report to localStorage:', err);
      }
    }
  }, [results, answers, summary.yesCount]);

  // Auto-sync to cloud when authenticated
  useEffect(() => {
    if (savedToLocal && isAuthenticated && user && savedReportRef.current && cloudSyncStatus === 'idle') {
      const syncToCloud = async () => {
        setCloudSyncStatus('syncing');
        try {
          const success = await saveReportToCloud(savedReportRef.current!, user.id);
          setCloudSyncStatus(success ? 'synced' : 'error');
        } catch {
          setCloudSyncStatus('error');
        }
      };
      syncToCloud();
    }
  }, [savedToLocal, isAuthenticated, user, cloudSyncStatus]);

  const handleDownloadReport = useCallback(async () => {
    setIsGeneratingPdf(true);
    setPdfSuccess(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      generatePdfReport({
        results,
        yesCount: summary.yesCount,
        totalQuestions: allQuestions.length,
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [results, summary.yesCount]);

  const handleRetake = () => {
    resetAssessment();
    setCurrentView('assessment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (results.length === 0) {
    return (
      <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/25">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Excellent! No Deficiencies Detected
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Based on your responses, you don't show significant signs of nutrient deficiencies. 
            However, a professional blood analysis can reveal subclinical deficiencies not detectable through symptoms alone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentView('booking')}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-lg hover:scale-105 transition-all"
            >
              Book Blood Analysis Anyway
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleRetake}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Assessment
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Your Deficiency Risk Report
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-5">
            Based on your {summary.yesCount} reported symptoms, we identified {summary.total} potential nutrient gaps.
          </p>
          
          {/* Action buttons row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Download PDF button */}
            <button
              onClick={handleDownloadReport}
              disabled={isGeneratingPdf}
              className="group inline-flex items-center gap-2.5 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating PDF...
                </>
              ) : pdfSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-700">Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4.5 h-4.5 group-hover:translate-y-0.5 transition-transform" />
                  Download Report as PDF
                </>
              )}
            </button>

            {/* Email Report button */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="group inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Mail className="w-4.5 h-4.5" />
              Email Report
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>


        {/* Save Status */}
        {isSaving && (
          <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-700 font-medium">Saving your results...</span>
          </div>
        )}
        {!isSaving && lastAssessmentId && (
          <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-green-50 border border-green-100">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700 font-medium">Results saved successfully</span>
          </div>
        )}
        {!isSaving && saveError && (
          <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-700 font-medium">{saveError}</span>
          </div>
        )}

        {/* Saved to My Reports banner */}
        {savedToLocal && (
          <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-teal-50 border border-teal-100">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-teal-500" />
              <span className="text-sm text-teal-700 font-medium">Report saved to My Reports</span>
              {/* Cloud sync status */}
              {isAuthenticated && (
                <span className="flex items-center gap-1 ml-2">
                  {cloudSyncStatus === 'syncing' && (
                    <span className="flex items-center gap-1 text-xs text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Syncing...
                    </span>
                  )}
                  {cloudSyncStatus === 'synced' && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Cloud className="w-3 h-3" />
                      Synced to cloud
                    </span>
                  )}
                  {cloudSyncStatus === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <CloudOff className="w-3 h-3" />
                      Cloud sync failed
                    </span>
                  )}
                </span>
              )}
            </div>
            <button
              onClick={() => { setCurrentView('reports'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              View All Reports
            </button>
          </div>
        )}



        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div className="p-5 rounded-2xl bg-red-50 border border-red-100 text-center">
            <div className="text-3xl font-bold text-red-600">{summary.critical.length}</div>
            <div className="text-sm text-red-500 font-medium mt-1">Critical</div>
            <div className="text-xs text-red-400 mt-0.5">Immediate attention</div>
          </div>
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 text-center">
            <div className="text-3xl font-bold text-amber-600">{summary.moderate.length}</div>
            <div className="text-sm text-amber-500 font-medium mt-1">Moderate</div>
            <div className="text-xs text-amber-400 mt-0.5">Monitor closely</div>
          </div>
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100 text-center">
            <div className="text-3xl font-bold text-blue-600">{summary.low.length}</div>
            <div className="text-sm text-blue-500 font-medium mt-1">Low Risk</div>
            <div className="text-xs text-blue-400 mt-0.5">Worth watching</div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-2xl p-6 lg:p-8 mb-10 text-center">
          <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">
            Want Precise Numbers? Get Your Blood Analyzed.
          </h3>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Symptom-based assessment gives direction. Blood analysis gives precision. 
            Let us measure your exact nutrient levels and create a targeted supplementation protocol.
          </p>
          <button
            onClick={() => { setCurrentView('booking'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-2xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all"
          >
            Book Professional Blood Analysis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {results.map((result, i) => (
            <ResultCard key={result.nutrient.id} result={result} index={i} />
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-8 border-t border-gray-200">
          <button
            onClick={handleRetake}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Assessment
          </button>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Download PDF */}
            <button
              onClick={handleDownloadReport}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </button>
            {/* Email Report */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all"
            >
              <Mail className="w-4 h-4" />
              Email Report
            </button>
            {/* Book Analysis */}
            <button
              onClick={() => { setCurrentView('booking'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:scale-105 transition-all"
            >
              Book Blood Analysis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        results={results}
        yesCount={summary.yesCount}
        totalQuestions={allQuestions.length}
      />
    </section>
  );
};

export default ResultsDashboard;
