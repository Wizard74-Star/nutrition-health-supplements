import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { SavedReport } from '@/utils/reportStorage';
import {
  X, Link2, Copy, CheckCircle2, Loader2, AlertCircle,
  Calendar, Clock, Globe, Shield, ExternalLink, Share2,
  Trash2, ToggleLeft, ToggleRight, CalendarDays, Infinity
} from 'lucide-react';

interface ShareReportModalProps {
  report: SavedReport;
  isOpen: boolean;
  onClose: () => void;
}

interface ExistingShareLink {
  id: string;
  link_id: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
}

function generateLinkId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const ShareReportModal: React.FC<ShareReportModalProps> = ({ report, isOpen, onClose }) => {
  const { user } = useAuth();
  const [existingLinks, setExistingLinks] = useState<ExistingShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLinks, setFetchingLinks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expirationOption, setExpirationOption] = useState<string>('never'); // 'never', '1', '7', '30', 'custom'
  const [customDate, setCustomDate] = useState<string>('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null);
  const [newExpiryOption, setNewExpiryOption] = useState<string>('never');
  const [newCustomDate, setNewCustomDate] = useState<string>('');
  const [updatingExpiry, setUpdatingExpiry] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getShareUrl = (linkId: string) => {
    return `${window.location.origin}${window.location.pathname}#/share/${linkId}`;
  };

  // Get minimum date for custom picker (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get max date for custom picker (1 year from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  // Fetch existing share links for this report
  const fetchExistingLinks = useCallback(async () => {
    if (!user) return;
    setFetchingLinks(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('share_links')
        .select('id, link_id, created_at, expires_at, is_active, view_count')
        .eq('report_id', report.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching share links:', fetchError);
      } else {
        setExistingLinks(data || []);
      }
    } catch (err) {
      console.error('Error fetching share links:', err);
    } finally {
      setFetchingLinks(false);
    }
  }, [user, report.id]);

  useEffect(() => {
    if (isOpen) {
      fetchExistingLinks();
      setError(null);
      setExpirationOption('never');
      setCustomDate('');
      setEditingExpiry(null);
      setDeleteConfirmId(null);
    }
  }, [isOpen, fetchExistingLinks]);

  const computeExpiresAt = (option: string, custom: string): string | null => {
    if (option === 'never') return null;
    if (option === 'custom' && custom) {
      const d = new Date(custom);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    }
    const days = parseInt(option, 10);
    if (isNaN(days)) return null;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  };

  const handleCreateLink = async () => {
    if (!user) return;
    setCreatingLink(true);
    setError(null);

    try {
      const linkId = generateLinkId();
      const expiresAt = computeExpiresAt(expirationOption, customDate);

      const { error: insertError } = await supabase
        .from('share_links')
        .insert({
          link_id: linkId,
          report_id: report.id,
          user_id: user.id,
          report_data: {
            date: report.date,
            yesCount: report.yesCount,
            totalQuestions: report.totalQuestions,
            results: report.results,
            summary: report.summary,
          },
          expires_at: expiresAt,
          is_active: true,
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        await fetchExistingLinks();
        handleCopyLink(linkId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create share link');
    } finally {
      setCreatingLink(false);
    }
  };

  const handleCopyLink = async (linkId: string) => {
    const url = getShareUrl(linkId);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(linkId);
      setTimeout(() => setCopied(null), 3000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(linkId);
      setTimeout(() => setCopied(null), 3000);
    }
  };

  const handleToggleActive = async (link: ExistingShareLink) => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('share_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        await fetchExistingLinks();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update link');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('share_links')
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(deleteError.message);
      } else {
        setDeleteConfirmId(null);
        await fetchExistingLinks();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete link');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpiry = async (linkId: string) => {
    setUpdatingExpiry(true);
    try {
      const expiresAt = computeExpiresAt(newExpiryOption, newCustomDate);
      const { error: updateError } = await supabase
        .from('share_links')
        .update({ expires_at: expiresAt })
        .eq('id', linkId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setEditingExpiry(null);
        await fetchExistingLinks();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update expiration');
    } finally {
      setUpdatingExpiry(false);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never expires';
    const d = new Date(expiresAt);
    if (d < new Date()) return 'Expired';
    const diff = d.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 30) {
      return `Expires ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (days > 0) return `Expires in ${days}d ${hours}h`;
    if (hours > 0) return `Expires in ${hours}h`;
    return 'Expires soon';
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  const activeLinks = existingLinks.filter(l => l.is_active && !isExpired(l.expires_at));
  const inactiveLinks = existingLinks.filter(l => !l.is_active || isExpired(l.expires_at));

  const expirationOptions = [
    { label: 'Never', value: 'never', icon: Infinity, desc: 'Link stays active forever' },
    { label: '24 hours', value: '1', icon: Clock, desc: 'Expires tomorrow' },
    { label: '7 days', value: '7', icon: Calendar, desc: 'Expires in a week' },
    { label: '30 days', value: '30', icon: CalendarDays, desc: 'Expires in a month' },
    { label: 'Custom date', value: 'custom', icon: CalendarDays, desc: 'Pick a specific date' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 px-6 py-5">
          <div className="absolute top-3 right-3 w-16 h-16 rounded-full border border-white/10" />
          <div className="absolute -bottom-2 -left-2 w-20 h-20 rounded-full bg-white/5" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Share Report</h2>
                <p className="text-white/70 text-xs mt-0.5">
                  {new Date(report.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {' '}&middot;{' '}
                  {report.summary.total} deficiencies found
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Create new link section */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Generate New Share Link</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Link Expiration</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {expirationOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setExpirationOption(opt.value);
                      if (opt.value !== 'custom') setCustomDate('');
                    }}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      expirationOption === opt.value
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700'
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date picker */}
            {expirationOption === 'custom' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Select expiration date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
                {customDate && (
                  <p className="text-xs text-gray-500">
                    Link will expire on {new Date(customDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at 11:59 PM
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleCreateLink}
              disabled={creatingLink || (expirationOption === 'custom' && !customDate)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:hover:scale-100 text-sm"
            >
              {creatingLink ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Link...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Generate Shareable Link
                </>
              )}
            </button>

            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Globe className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>Anyone with the link can view a read-only version of this report. No sign-in required.</span>
            </div>
          </div>

          {/* Loading state */}
          {fetchingLinks && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          )}

          {/* Active links */}
          {!fetchingLinks && activeLinks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Active Links ({activeLinks.length})
              </h3>
              {activeLinks.map(link => (
                <div key={link.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                  {/* Link URL */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs font-mono text-gray-600 truncate">
                          {getShareUrl(link.link_id)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyLink(link.link_id)}
                      className={`flex-shrink-0 p-2.5 rounded-lg transition-all ${
                        copied === link.link_id
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                      title="Copy link"
                    >
                      {copied === link.link_id ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(link.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatExpiry(link.expires_at)}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Globe className="w-3 h-3" />
                      {link.view_count} view{link.view_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Edit expiration inline */}
                  {editingExpiry === link.id && (
                    <div className="bg-indigo-50 rounded-lg p-3 space-y-3 border border-indigo-100">
                      <p className="text-xs font-semibold text-indigo-800">Update Expiration</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { label: 'Never', value: 'never' },
                          { label: '+24h', value: '1' },
                          { label: '+7d', value: '7' },
                          { label: '+30d', value: '30' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setNewExpiryOption(opt.value);
                              setNewCustomDate('');
                            }}
                            className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                              newExpiryOption === opt.value
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <div>
                        <label className="block text-xs text-indigo-700 mb-1">Or pick a date:</label>
                        <input
                          type="date"
                          value={newCustomDate}
                          onChange={(e) => {
                            setNewCustomDate(e.target.value);
                            setNewExpiryOption('custom');
                          }}
                          min={getMinDate()}
                          max={getMaxDate()}
                          className="w-full px-2.5 py-1.5 rounded border border-indigo-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateExpiry(link.id)}
                          disabled={updatingExpiry || (newExpiryOption === 'custom' && !newCustomDate)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-60"
                        >
                          {updatingExpiry ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingExpiry(null)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                    <a
                      href={getShareUrl(link.link_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Preview
                    </a>
                    {editingExpiry !== link.id && (
                      <button
                        onClick={() => {
                          setEditingExpiry(link.id);
                          setNewExpiryOption(link.expires_at ? '7' : 'never');
                          setNewCustomDate('');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        Edit Expiry
                      </button>
                    )}
                    <div className="flex-1" />
                    <button
                      onClick={() => handleToggleActive(link)}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                    >
                      <Shield className="w-3 h-3" />
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inactive / expired links */}
          {!fetchingLinks && inactiveLinks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                Inactive Links ({inactiveLinks.length})
              </h3>
              {inactiveLinks.map(link => (
                <div key={link.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 opacity-70 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2">
                        <Link2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-xs font-mono text-gray-400 truncate line-through">
                          {getShareUrl(link.link_id)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(link.created_at)}
                      </span>
                      <span className={`flex items-center gap-1 ${isExpired(link.expires_at) ? 'text-red-400' : ''}`}>
                        {isExpired(link.expires_at) ? 'Expired' : 'Revoked'}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {link.view_count} view{link.view_count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    {!link.is_active && !isExpired(link.expires_at) && (
                      <button
                        onClick={() => handleToggleActive(link)}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-60"
                      >
                        <ToggleRight className="w-3.5 h-3.5" />
                        Reactivate
                      </button>
                    )}
                    <div className="flex-1" />
                    <div className="relative">
                      <button
                        onClick={() => setDeleteConfirmId(deleteConfirmId === link.id ? null : link.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                      {deleteConfirmId === link.id && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-20">
                          <p className="text-xs text-gray-700 font-medium mb-2">Delete this share link permanently?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              disabled={loading}
                              className="flex-1 px-2 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
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
              ))}
            </div>
          )}

          {/* No links yet */}
          {!fetchingLinks && existingLinks.length === 0 && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Link2 className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No share links yet for this report.</p>
              <p className="text-xs text-gray-400 mt-1">Generate a link above to share your results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareReportModal;
