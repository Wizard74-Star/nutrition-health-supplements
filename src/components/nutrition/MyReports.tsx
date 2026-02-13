import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { useAuth } from '@/context/AuthContext';
import { allNutrients } from '@/data/nutrients';
import { allQuestions } from '@/data/symptoms';
import {
  SavedReport, getAllReports, deleteReport, clearAllReports,
  syncReports, deleteCloudReport, clearCloudReports
} from '@/utils/reportStorage';
import { generatePdfReport } from '@/utils/generatePdfReport';
import ReportComparison from '@/components/nutrition/ReportComparison';
import ShareReportModal from '@/components/nutrition/ShareReportModal';
import EmailReportModal from '@/components/nutrition/EmailReportModal';
import {
  FileText, Calendar, Download, Trash2, Eye, ArrowRight,
  ShieldAlert, Shield, ShieldCheck, AlertTriangle, BarChart3,
  Loader2, CheckCircle2, ChevronDown, ChevronUp, ClipboardList,
  X, TrendingDown, Apple, Lightbulb, Microscope, RotateCcw,
  ArrowLeft, Clock, Cloud, CloudOff, RefreshCw, User, Share2, Mail
} from 'lucide-react';


const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const timeAgo = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

type TabView = 'list' | 'comparison' | 'detail';

// ─── Report Detail View ────────────────────────────────────────────────
const ReportDetailView: React.FC<{
  report: SavedReport;
  onBack: () => void;
  onDownload: (report: SavedReport) => void;
  onShare?: (report: SavedReport) => void;
  onEmail?: (report: SavedReport) => void;
  isDownloading: boolean;
  isAuthenticated: boolean;
}> = ({ report, onBack, onDownload, onShare, onEmail, isDownloading, isAuthenticated }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);


  return (
    <div className="space-y-6">
      {/* Detail header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Assessment Report</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(report.date)} at {formatTime(report.date)}
              {report.synced && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3" />
                  Synced
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && onShare && (
            <button
              onClick={() => onShare(report)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium rounded-xl hover:bg-indigo-100 hover:border-indigo-200 transition-all text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share Report
            </button>
          )}
          {onEmail && (
            <button
              onClick={() => onEmail(report)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] transition-all text-sm"
            >
              <Mail className="w-4 h-4" />
              Email Report
            </button>
          )}

          <button
            onClick={() => onDownload(report)}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all text-sm disabled:opacity-60"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>


      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
          <div className="text-2xl font-bold text-red-600">{report.summary.critical}</div>
          <div className="text-xs text-red-500 font-medium mt-1">Critical</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
          <div className="text-2xl font-bold text-amber-600">{report.summary.moderate}</div>
          <div className="text-xs text-amber-500 font-medium mt-1">Moderate</div>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
          <div className="text-2xl font-bold text-blue-600">{report.summary.low}</div>
          <div className="text-xs text-blue-500 font-medium mt-1">Low Risk</div>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
        <span className="flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          {report.yesCount} symptoms reported
        </span>
        <span className="text-gray-300">|</span>
        <span>{report.results.length} deficiencies identified</span>
      </div>

      {/* Results list */}
      <div className="space-y-2">
        {report.results.map((result, i) => {
          const isExpanded = expandedIdx === i;
          const priorityConfig = {
            critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: ShieldAlert, barColor: 'bg-red-500' },
            moderate: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Shield, barColor: 'bg-amber-500' },
            low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: ShieldCheck, barColor: 'bg-blue-400' },
          }[result.priority];
          const PIcon = priorityConfig.icon;

          return (
            <div key={result.nutrientId} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className={`text-lg font-bold ${
                  result.priority === 'critical' ? 'text-red-500' :
                  result.priority === 'moderate' ? 'text-amber-500' : 'text-blue-400'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{result.nutrientName}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${priorityConfig.bg} ${priorityConfig.text} border ${priorityConfig.border}`}>
                      <PIcon className="w-3 h-3" />
                      {result.priority.charAt(0).toUpperCase() + result.priority.slice(1)}
                    </span>
                  </div>
                  <div className="mt-1.5 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${priorityConfig.barColor}`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">Risk score</span>
                    <span className={`text-xs font-bold ${
                      result.priority === 'critical' ? 'text-red-600' :
                      result.priority === 'moderate' ? 'text-amber-600' : 'text-blue-500'
                    }`}>{result.score}%</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-gray-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                  {/* Triggering symptoms */}
                  <div className="pt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-gray-600">Why This Was Flagged</span>
                    </div>
                    <div className="space-y-1">
                      {result.triggeringSymptoms.map((s, si) => (
                        <div key={si} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <TrendingDown className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Functions */}
                  {result.functions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Microscope className="w-3.5 h-3.5 text-teal-500" />
                        <span className="text-xs font-semibold text-gray-600">Why You Need It</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.functions.slice(0, 4).map((fn, fi) => (
                          <span key={fi} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">
                            {fn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Food sources */}
                  {result.foodSources.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Apple className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs font-semibold text-gray-600">Increase Through Diet</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {result.foodSources.map((f, fi) => (
                          <span key={fi} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Absorption tips */}
                  {result.absorptionTips && (
                    <div className="bg-blue-50 rounded-lg p-2.5">
                      <div className="flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">{result.absorptionTips}</p>
                      </div>
                    </div>
                  )}

                  {/* RDA */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Recommended Daily: <strong className="text-gray-700">{result.rda} {result.unit}</strong></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main MyReports Component ──────────────────────────────────────────
const MyReports: React.FC = () => {
  const { setCurrentView } = useAssessment();
  const { user, isAuthenticated } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [activeTab, setActiveTab] = useState<TabView>('list');
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<SavedReport | null>(null);
  const [emailTarget, setEmailTarget] = useState<SavedReport | null>(null);


  // Load reports (from localStorage, and sync with cloud if authenticated)
  useEffect(() => {
    const loadReports = async () => {
      if (isAuthenticated && user) {
        setIsSyncing(true);
        setSyncMessage(null);
        try {
          const merged = await syncReports(user.id);
          setReports(merged);
          setSyncMessage('Reports synced with cloud');
          setTimeout(() => setSyncMessage(null), 3000);
        } catch (err) {
          console.error('Sync failed:', err);
          setReports(getAllReports());
          setSyncMessage('Cloud sync failed, showing local reports');
          setTimeout(() => setSyncMessage(null), 5000);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setReports(getAllReports());
      }
    };
    loadReports();
  }, [isAuthenticated, user]);

  const handleManualSync = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const merged = await syncReports(user.id);
      setReports(merged);
      setSyncMessage('Reports synced successfully');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err) {
      console.error('Manual sync failed:', err);
      setSyncMessage('Sync failed. Please try again.');
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, user]);

  const handleViewReport = useCallback((report: SavedReport) => {
    setSelectedReport(report);
    setActiveTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDownloadReport = useCallback(async (report: SavedReport) => {
    setIsDownloading(true);
    setDownloadSuccess(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const deficiencyResults = report.results.map(r => {
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

      generatePdfReport({
        results: deficiencyResults,
        yesCount: report.yesCount,
        totalQuestions: report.totalQuestions,
      });

      setDownloadSuccess(report.id);
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const handleDeleteReport = useCallback(async (id: string) => {
    // Delete from localStorage
    deleteReport(id);

    // Delete from cloud if authenticated
    if (isAuthenticated && user) {
      await deleteCloudReport(id, user.id);
    }

    setReports(getAllReports());
    setDeleteConfirmId(null);
    if (selectedReport?.id === id) {
      setSelectedReport(null);
      setActiveTab('list');
    }
  }, [selectedReport, isAuthenticated, user]);

  const handleClearAll = useCallback(async () => {
    clearAllReports();

    // Clear from cloud if authenticated
    if (isAuthenticated && user) {
      await clearCloudReports(user.id);
    }

    setReports([]);
    setClearConfirm(false);
    setSelectedReport(null);
    setActiveTab('list');
  }, [isAuthenticated, user]);

  const handleBackToList = useCallback(() => {
    setActiveTab('list');
    setSelectedReport(null);
  }, []);

  // ─── Empty State ──────────────────────────────────────────────────
  if (reports.length === 0 && activeTab === 'list' && !isSyncing) {
    return (
      <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FileText className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            No Reports Yet
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-4">
            Complete your first symptom assessment to generate a deficiency risk report.
            All your reports will be saved here automatically for future reference.
          </p>
          {!isAuthenticated && (
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-8">
              <User className="w-4 h-4 inline mr-1" />
              Sign in to sync your reports across devices and never lose your data.
            </p>
          )}
          <button
            onClick={() => {
              setCurrentView('assessment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-105 transition-all"
          >
            Start Your First Assessment
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        {activeTab === 'list' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                My Reports
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                View your assessment history, track progress over time, and re-download any past report.
              </p>
            </div>

            {/* Sync status banner */}
            {isAuthenticated && (
              <div className="mb-6">
                {isSyncing ? (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-sm text-blue-700 font-medium">Syncing reports with cloud...</span>
                  </div>
                ) : syncMessage ? (
                  <div className={`flex items-center justify-center gap-2 p-3 rounded-xl ${
                    syncMessage.includes('failed')
                      ? 'bg-amber-50 border border-amber-100'
                      : 'bg-green-50 border border-green-100'
                  }`}>
                    {syncMessage.includes('failed') ? (
                      <CloudOff className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Cloud className="w-4 h-4 text-green-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      syncMessage.includes('failed') ? 'text-amber-700' : 'text-green-700'
                    }`}>{syncMessage}</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Not signed in banner */}
            {!isAuthenticated && reports.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Cloud className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Sync your reports across devices</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sign in to save your reports to the cloud. Access them from any device, anytime.
                      Your local reports will be automatically synced.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'list'
                    ? 'bg-white text-gray-900 shadow-md border border-gray-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Report History
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'comparison'
                    ? 'bg-white text-gray-900 shadow-md border border-gray-100'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Compare Progress
                {reports.length >= 2 && (
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                )}
              </button>
            </div>
          </>
        )}

        {/* ─── List View ──────────────────────────────────────────── */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            {/* Stats bar */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {reports.length} report{reports.length !== 1 ? 's' : ''} saved
                {isAuthenticated && (
                  <span className="inline-flex items-center gap-1 ml-2 text-xs text-green-600">
                    <Cloud className="w-3 h-3" />
                    Cloud synced
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setCurrentView('assessment');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  New Assessment
                </button>
                {reports.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setClearConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </button>
                    {clearConfirm && (
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-20">
                        <p className="text-sm text-gray-700 font-medium mb-3">
                          Delete all {reports.length} reports? This cannot be undone.
                          {isAuthenticated && (
                            <span className="block text-xs text-gray-500 mt-1">
                              This will also remove them from the cloud.
                            </span>
                          )}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleClearAll}
                            className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Delete All
                          </button>
                          <button
                            onClick={() => setClearConfirm(false)}
                            className="flex-1 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Report cards */}
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Date and time */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                          <Calendar className="w-4 h-4 text-teal-500" />
                          {formatDate(report.date)}
                        </div>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(report.date)}
                        </span>
                        {report.synced && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                            <Cloud className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      {/* Summary badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {report.summary.critical > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                            <ShieldAlert className="w-3 h-3" />
                            {report.summary.critical} Critical
                          </span>
                        )}
                        {report.summary.moderate > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                            <Shield className="w-3 h-3" />
                            {report.summary.moderate} Moderate
                          </span>
                        )}
                        {report.summary.low > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                            <ShieldCheck className="w-3 h-3" />
                            {report.summary.low} Low
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {report.yesCount} symptoms / {report.results.length} deficiencies
                        </span>
                      </div>

                      {/* Top deficiencies preview */}
                      <div className="flex flex-wrap gap-1">
                        {report.results.slice(0, 5).map(r => (
                          <span
                            key={r.nutrientId}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              r.priority === 'critical'
                                ? 'bg-red-50 text-red-600'
                                : r.priority === 'moderate'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-blue-50 text-blue-500'
                            }`}
                          >
                            {r.nutrientName} ({r.score}%)
                          </span>
                        ))}
                        {report.results.length > 5 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 font-medium">
                            +{report.results.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score circle */}
                    <div className="flex-shrink-0 text-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${
                        report.summary.critical > 0
                          ? 'bg-red-50 text-red-600'
                          : report.summary.moderate > 0
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {report.summary.total}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">gaps</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-all disabled:opacity-60"
                    >
                      {downloadSuccess === report.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-green-600">Downloaded!</span>
                        </>
                      ) : isDownloading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Download PDF
                        </>
                      )}
                    </button>
                    {isAuthenticated && (
                      <button
                        onClick={() => setShareTarget(report)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                    )}
                    {isAuthenticated && (
                      <button
                        onClick={() => setEmailTarget(report)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-teal-700 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-lg hover:from-teal-100 hover:to-emerald-100 transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </button>
                    )}

                    <div className="flex-1" />

                    <div className="relative">
                      <button
                        onClick={() => setDeleteConfirmId(deleteConfirmId === report.id ? null : report.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === report.id && (
                        <div className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-20">
                          <p className="text-xs text-gray-700 font-medium mb-2">
                            Delete this report?
                            {isAuthenticated && (
                              <span className="block text-gray-400 mt-0.5">Also removes from cloud.</span>
                            )}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="flex-1 px-2 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 px-2 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Comparison View ────────────────────────────────────── */}
        {activeTab === 'comparison' && (
          <ReportComparison
            reports={reports}
            onBack={handleBackToList}
          />
        )}

        {/* ─── Detail View ────────────────────────────────────────── */}
        {activeTab === 'detail' && selectedReport && (
          <ReportDetailView
            report={selectedReport}
            onBack={handleBackToList}
            onDownload={handleDownloadReport}
            onShare={(report) => setShareTarget(report)}
            onEmail={(report) => setEmailTarget(report)}
            isDownloading={isDownloading}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>

      {/* Share Report Modal */}
      {shareTarget && (
        <ShareReportModal
          report={shareTarget}
          isOpen={!!shareTarget}
          onClose={() => setShareTarget(null)}
        />
      )}

      {/* Email Report Modal */}
      <EmailReportModal
        isOpen={!!emailTarget}
        onClose={() => setEmailTarget(null)}
        savedReport={emailTarget || undefined}
      />
    </section>
  );

};

export default MyReports;
