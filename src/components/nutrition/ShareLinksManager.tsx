import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Link2, Copy, CheckCircle2, Loader2, AlertCircle, Calendar,
  Clock, Globe, Shield, ExternalLink, Trash2, X, Eye, Share2,
  RefreshCw, ToggleLeft, ToggleRight, Search, CalendarDays,

  ChevronDown, ChevronUp
} from 'lucide-react';

interface ShareLink {
  id: string;
  link_id: string;
  report_id: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  report_data: {
    date: string;
    summary: {
      critical: number;
      moderate: number;
      low: number;
      total: number;
    };
  };
}

type FilterMode = 'all' | 'active' | 'revoked' | 'expired';
type SortMode = 'newest' | 'oldest' | 'most-viewed';

const ShareLinksManager: React.FC = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [revokeAllConfirm, setRevokeAllConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null);
  const [newExpiryOption, setNewExpiryOption] = useState<string>('never');
  const [newCustomDate, setNewCustomDate] = useState<string>('');
  const [updatingExpiry, setUpdatingExpiry] = useState(false);
  const [expandedLink, setExpandedLink] = useState<string | null>(null);

  const getShareUrl = (linkId: string) => {
    return `${window.location.origin}${window.location.pathname}#/share/${linkId}`;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate.toISOString().split('T')[0];
  };

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('share_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setLinks(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch share links');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCopyLink = async (linkId: string) => {
    const url = getShareUrl(linkId);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(linkId);
    setTimeout(() => setCopied(null), 3000);
  };

  const handleToggleActive = async (link: ShareLink) => {
    setActionLoading(link.id);
    try {
      const { error: updateError } = await supabase
        .from('share_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        await fetchLinks();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLink = async (id: string) => {
    setActionLoading(id);
    try {
      const { error: deleteError } = await supabase
        .from('share_links')
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(deleteError.message);
      } else {
        setDeleteConfirmId(null);
        await fetchLinks();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAll = async () => {
    setActionLoading('all');
    try {
      const { error: updateError } = await supabase
        .from('share_links')
        .update({ is_active: false })
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (updateError) {
        setError(updateError.message);
      } else {
        setRevokeAllConfirm(false);
        await fetchLinks();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateExpiry = async (linkId: string) => {
    setUpdatingExpiry(true);
    try {
      let expiresAt: string | null = null;
      if (newExpiryOption === 'custom' && newCustomDate) {
        const d = new Date(newCustomDate);
        d.setHours(23, 59, 59, 999);
        expiresAt = d.toISOString();
      } else if (newExpiryOption !== 'never') {
        const days = parseInt(newExpiryOption, 10);
        if (!isNaN(days)) {
          expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      const { error: updateError } = await supabase
        .from('share_links')
        .update({ expires_at: expiresAt })
        .eq('id', linkId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setEditingExpiry(null);
        await fetchLinks();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingExpiry(false);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getLinkStatus = (link: ShareLink): 'active' | 'revoked' | 'expired' => {
    if (!link.is_active) return 'revoked';
    if (isExpired(link.expires_at)) return 'expired';
    return 'active';
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never';
    const d = new Date(expiresAt);
    if (d < new Date()) return 'Expired';
    const diff = d.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 30) return formatDate(expiresAt);
    if (days > 0) return `${days}d left`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h left`;
    return 'Expiring soon';
  };

  const getStatusBadge = (link: ShareLink) => {
    const status = getLinkStatus(link);
    if (status === 'revoked') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Revoked</span>;
    }
    if (status === 'expired') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Expired</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">Active</span>;
  };

  // Filtered and sorted links
  const filteredLinks = useMemo(() => {
    let result = [...links];

    // Filter by status
    if (filterMode !== 'all') {
      result = result.filter(l => getLinkStatus(l) === filterMode);
    }

    // Search by report date or link ID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => {
        const reportDate = l.report_data?.date ? formatDate(l.report_data.date).toLowerCase() : '';
        return (
          l.link_id.toLowerCase().includes(q) ||
          reportDate.includes(q) ||
          formatDate(l.created_at).toLowerCase().includes(q)
        );
      });
    }

    // Sort
    if (sortMode === 'oldest') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortMode === 'most-viewed') {
      result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }
    // 'newest' is default from the query

    return result;
  }, [links, filterMode, searchQuery, sortMode]);

  const activeCount = links.filter(l => l.is_active && !isExpired(l.expires_at)).length;
  const totalViews = links.reduce((sum, l) => sum + (l.view_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{links.length}</div>
          <div className="text-xs text-gray-500">Total Links</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-green-600">{activeCount}</div>
          <div className="text-xs text-green-600">Active</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-indigo-600">{totalViews}</div>
          <div className="text-xs text-indigo-600">Total Views</div>
        </div>
      </div>

      {/* Search and filter bar */}
      {links.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by date or link ID..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
            </div>
            <button
              onClick={fetchLinks}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
              {([
                { label: 'All', value: 'all' as FilterMode, count: links.length },
                { label: 'Active', value: 'active' as FilterMode, count: activeCount },
                { label: 'Revoked', value: 'revoked' as FilterMode, count: links.filter(l => !l.is_active).length },
                { label: 'Expired', value: 'expired' as FilterMode, count: links.filter(l => l.is_active && isExpired(l.expires_at)).length },
              ]).map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setFilterMode(tab.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filterMode === tab.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 ${filterMode === tab.value ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort and bulk actions */}
            <div className="flex items-center gap-2">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="most-viewed">Most viewed</option>
              </select>
              {activeCount > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setRevokeAllConfirm(!revokeAllConfirm)}
                    disabled={actionLoading === 'all'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
                  >
                    {actionLoading === 'all' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Shield className="w-3 h-3" />
                    )}
                    Revoke All
                  </button>
                  {revokeAllConfirm && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-20">
                      <p className="text-xs text-gray-700 font-medium mb-2">
                        Revoke all {activeCount} active link{activeCount !== 1 ? 's' : ''}? They can be reactivated later.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRevokeAll}
                          className="flex-1 px-2 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Revoke All
                        </button>
                        <button
                          onClick={() => setRevokeAllConfirm(false)}
                          className="flex-1 px-2 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
        </div>
      )}

      {/* Links list */}
      {links.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Link2 className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No shared links yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Share a report from your My Reports page to create shareable links.
          </p>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="text-center py-6">
          <Search className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No links match your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLinks.map(link => {
            const reportDate = link.report_data?.date
              ? formatDate(link.report_data.date)
              : 'Unknown date';
            const summary = link.report_data?.summary;
            const status = getLinkStatus(link);
            const isActive = status === 'active';
            const isExpandedLink = expandedLink === link.id;

            return (
              <div
                key={link.id}
                className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  isActive ? 'border-gray-100 hover:shadow-sm' : 'border-gray-100 opacity-75'
                }`}
              >
                {/* Header row - always visible */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedLink(isExpandedLink ? null : link.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          Report from {reportDate}
                        </span>
                        {getStatusBadge(link)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {summary && (
                          <span>
                            {summary.total} deficiencies
                            {summary.critical > 0 && <span className="text-red-500 ml-1">({summary.critical} critical)</span>}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {link.view_count} view{link.view_count !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatExpiry(link.expires_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(link.link_id);
                          }}
                          className={`p-2 rounded-lg transition-all ${
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
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(link);
                        }}
                        disabled={actionLoading === link.id || isExpired(link.expires_at)}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                          link.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={link.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {actionLoading === link.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : link.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <div className="text-gray-400">
                        {isExpandedLink ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpandedLink && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                    {/* Link URL */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 min-w-0 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className={`text-xs font-mono truncate ${isActive ? 'text-gray-600' : 'text-gray-400 line-through'}`}>
                          {getShareUrl(link.link_id)}
                        </span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {formatDate(link.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires: {formatExpiry(link.expires_at)}
                      </span>
                    </div>

                    {/* Edit expiration */}
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
                                newExpiryOption === opt.value && !newCustomDate
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <div>
                          <label className="block text-xs text-indigo-700 mb-1">Or pick a specific date:</label>
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
                      {isActive && (
                        <a
                          href={getShareUrl(link.link_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Preview
                        </a>
                      )}
                      {editingExpiry !== link.id && (
                        <button
                          onClick={() => {
                            setEditingExpiry(link.id);
                            setNewExpiryOption(link.expires_at ? '7' : 'never');
                            setNewCustomDate('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <CalendarDays className="w-3 h-3" />
                          Edit Expiry
                        </button>
                      )}
                      <div className="flex-1" />
                      <div className="relative">
                        <button
                          onClick={() => setDeleteConfirmId(deleteConfirmId === link.id ? null : link.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirmId === link.id && (
                          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-20">
                            <p className="text-xs text-gray-700 font-medium mb-2">Delete this share link permanently?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteLink(link.id)}
                                disabled={actionLoading === link.id}
                                className="flex-1 px-2 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                              >
                                {actionLoading === link.id ? 'Deleting...' : 'Delete'}
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShareLinksManager;
