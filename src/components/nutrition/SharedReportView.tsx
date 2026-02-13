import React, { useState, useEffect } from 'react';
import { supabase, safeInvoke } from '@/lib/supabase';

import { SavedNutrientResult } from '@/utils/reportStorage';
import {
  FileText, Calendar, ShieldAlert, Shield, ShieldCheck, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, TrendingDown, Apple, Lightbulb,
  Microscope, Globe, Clock, Eye, ArrowLeft, Share2, Lock, AlertCircle,
  FlaskConical, ExternalLink, Download, ClipboardList
} from 'lucide-react';

interface SharedReportData {
  date: string;
  yesCount: number;
  totalQuestions: number;
  results: SavedNutrientResult[];
  summary: {
    critical: number;
    moderate: number;
    low: number;
    total: number;
  };
}

interface SharedReportViewProps {
  linkId: string;
  onBack: () => void;
}

const SharedReportView: React.FC<SharedReportViewProps> = ({ linkId, onBack }) => {
  const [report, setReport] = useState<SharedReportData | null>(null);
  const [sharerName, setSharerName] = useState('');
  const [sharedAt, setSharedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  useEffect(() => {
    const fetchSharedReport = async () => {
      setLoading(true);
      setError(null);

      // Try edge function first, then fall back to direct query
      let success = false;

      // Attempt 1: Edge function (safeInvoke handles JSON parse errors gracefully)
      const { data, error: fnError } = await safeInvoke('get-shared-report', {
        body: { link_id: linkId },
      });

      if (!fnError && data && !data.error) {
        setReport(data.report);
        setSharerName(data.sharer_name || 'Anonymous');
        setSharedAt(data.shared_at || '');
        setExpiresAt(data.expires_at || null);
        setViewCount(data.view_count || 0);
        success = true;
      } else if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }


      // Attempt 2: Direct database query (fallback)
      if (!success) {
        try {
          const { data: linkData, error: queryError } = await supabase
            .from('share_links')
            .select('*')
            .eq('link_id', linkId)
            .single();

          if (queryError || !linkData) {
            setError('This shared link could not be found. It may have been deleted or the URL is incorrect.');
            setLoading(false);
            return;
          }

          // Check if link is active
          if (!linkData.is_active) {
            setError('This shared link has been revoked by the owner. The report is no longer accessible.');
            setLoading(false);
            return;
          }

          // Check if link has expired
          if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
            setError('This shared link has expired. The report is no longer accessible via this link.');
            setLoading(false);
            return;
          }

          // Set report data
          const reportData = linkData.report_data as SharedReportData;
          if (!reportData || !reportData.results) {
            setError('The report data associated with this link is unavailable or corrupted.');
            setLoading(false);
            return;
          }

          setReport(reportData);
          setSharedAt(linkData.created_at || '');
          setExpiresAt(linkData.expires_at || null);
          setViewCount((linkData.view_count || 0) + 1);

          // Increment view count (fire and forget)
          supabase
            .from('share_links')
            .update({ view_count: (linkData.view_count || 0) + 1 })
            .eq('id', linkData.id)
            .then(() => {});

          // Try to get sharer name from user_profiles
          if (linkData.user_id) {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('display_name')
              .eq('user_id', linkData.user_id)
              .single();

            if (profileData?.display_name) {
              setSharerName(profileData.display_name);
            }
          }

          success = true;
        } catch (err: any) {
          setError('Failed to load the shared report. Please check the link and try again.');
        }
      }

      setLoading(false);
    };

    if (linkId) {
      fetchSharedReport();
    } else {
      setError('No share link ID provided.');
      setLoading(false);
    }
  }, [linkId]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatExpiry = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return formatDate(iso);
    if (days > 1) return `${days} days from now`;
    if (days === 1) return 'Tomorrow';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours} hours from now`;
    return 'Expiring soon';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20 animate-pulse">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading shared report...</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Verifying link and fetching report data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            {error.includes('expired') ? (
              <Clock className="w-8 h-8 text-red-500" />
            ) : error.includes('revoked') ? (
              <Lock className="w-8 h-8 text-red-500" />
            ) : error.includes('not be found') ? (
              <Share2 className="w-8 h-8 text-red-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {error.includes('expired') ? 'Link Expired' :
             error.includes('revoked') ? 'Link Revoked' :
             error.includes('not be found') ? 'Link Not Found' :
             'Report Unavailable'}
          </h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all"
            >
              <FlaskConical className="w-4 h-4" />
              Go to NutriAnalysis
            </button>
            <p className="text-xs text-gray-400">
              Want to check your own nutrition? Start a free assessment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">NutriAnalysis</span>
              </div>
              <div className="w-px h-5 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-200" />
                <span className="text-sm font-medium text-teal-100">
                  Shared Report
                  {sharerName && sharerName !== 'Anonymous' && (
                    <span className="text-white"> by {sharerName}</span>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-teal-200">
              {sharedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Shared {formatDate(sharedAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {viewCount} view{viewCount !== 1 ? 's' : ''}
              </span>
              {expiresAt && (
                <span className="flex items-center gap-1 text-teal-300">
                  <Clock className="w-3 h-3" />
                  Expires {formatExpiry(expiresAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Go to NutriAnalysis
        </button>

        {/* Report header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="relative bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 px-6 sm:px-8 py-6">
            <div className="absolute top-3 right-3 w-20 h-20 rounded-full border border-white/10" />
            <div className="absolute -bottom-3 -left-3 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute top-6 right-8 w-12 h-12 rounded-full border border-white/5" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">Nutrition Assessment Report</h1>
                  <p className="text-white/70 text-sm mt-0.5">
                    Assessment taken on {formatDate(report.date)} at {formatTime(report.date)}
                  </p>
                </div>
              </div>
              {sharerName && sharerName !== 'Anonymous' && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] font-bold">
                    {sharerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white/90">Shared by {sharerName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary cards */}
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600">{report.summary.critical}</div>
                <div className="text-xs text-red-500 font-medium mt-1">Critical</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Shield className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-600">{report.summary.moderate}</div>
                <div className="text-xs text-amber-500 font-medium mt-1">Moderate</div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{report.summary.low}</div>
                <div className="text-xs text-blue-500 font-medium mt-1">Low Risk</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ClipboardList className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-700">{report.summary.total}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Total Gaps</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                {report.yesCount} symptoms reported
              </span>
              <span className="text-gray-300">|</span>
              <span>{report.results.length} deficiencies identified</span>
              <span className="text-gray-300">|</span>
              <span>{report.totalQuestions} questions answered</span>
            </div>
          </div>
        </div>

        {/* Results list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Detailed Results</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
              {report.results.length} nutrient{report.results.length !== 1 ? 's' : ''} flagged
            </span>
          </div>

          {report.results.map((result, i) => {
            const isExpanded = expandedIdx === i;
            const priorityConfig = {
              critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: ShieldAlert, barColor: 'bg-red-500', lightBg: 'bg-red-50' },
              moderate: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Shield, barColor: 'bg-amber-500', lightBg: 'bg-amber-50' },
              low: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: ShieldCheck, barColor: 'bg-blue-400', lightBg: 'bg-blue-50' },
            }[result.priority];
            const PIcon = priorityConfig.icon;

            return (
              <div key={result.nutrientId} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <span className={`text-lg font-bold w-7 text-center ${
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
                      {result.category && (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          {result.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${priorityConfig.barColor}`}
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
                    {result.functions && result.functions.length > 0 && (
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
                          {result.functions.length > 4 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
                              +{result.functions.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Food sources */}
                    {result.foodSources && result.foodSources.length > 0 && (
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
                    {result.rda && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Recommended Daily: <strong className="text-gray-700">{result.rda} {result.unit}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer disclaimer */}
        <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Important Disclaimer</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This report is generated by NutriAnalysis based on a self-reported symptom assessment. 
                It is not a medical diagnosis and should not replace professional medical advice. 
                Please consult with a healthcare professional for proper evaluation and treatment.
              </p>
              {expiresAt && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  This shared link expires on {formatDate(expiresAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-8 bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-4 right-4 w-24 h-24 rounded-full border border-white/10" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <FlaskConical className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Check Your Own Nutrition Status</h3>
            <p className="text-sm text-white/80 max-w-md mx-auto mb-6">
              Take our free symptom-based assessment to identify potential nutrient deficiencies 
              and get personalized dietary recommendations.
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-teal-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <FlaskConical className="w-4 h-4" />
              Start Your Free Assessment
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Powered by footer */}
        <div className="mt-8 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Powered by <strong className="text-gray-500">NutriAnalysis</strong> - Precision Nutrition Assessment</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedReportView;
