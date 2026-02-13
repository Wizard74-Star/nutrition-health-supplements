import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAssessment } from '@/context/AssessmentContext';
import { supabase, safeInvoke } from '@/lib/supabase';
import { useStripeMode } from '@/context/StripeModeContext';

import {
  Lock, Loader2, ArrowLeft, RefreshCw, ChevronDown, ChevronUp,
  Calendar, Mail, Phone, User, ClipboardCheck, AlertTriangle,
  CheckCircle2, Clock, XCircle, Search, BarChart3, Users, FileText,
  ArrowUpDown, Eye, MessageSquare, Pill, ShieldAlert, Shield, ShieldCheck,
  Settings, FlaskConical, Zap, CreditCard, Copy, CheckCheck, ExternalLink, Info,
  Gift, TrendingUp, ArrowRight
} from 'lucide-react';
const TestTube2 = FlaskConical;

interface BookingRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferred_date: string | null;
  diet_type: string;
  health_goals: string;
  current_supplements: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assessment_id: string | null;
  assessment_results: AssessmentRow | null;
}

interface AssessmentRow {
  id: string;
  session_id: string;
  answers: Record<string, boolean>;
  deficiency_scores: Array<{
    nutrient_id: string;
    nutrient_name: string;
    category: string;
    score: number;
    priority: string;
    triggering_symptoms: string[];
  }>;
  critical_count: number;
  moderate_count: number;
  low_count: number;
  total_questions_answered: number;
  total_yes_answers: number;
  top_deficiencies: string[];
  created_at: string;
}

interface TrialRow {
  id: string;
  user_id: string;
  email: string;
  trial_started_at: string;
  trial_ends_at: string;
  is_active: boolean;
  converted_to_paid: boolean;
  converted_at: string | null;
  created_at: string;
}

interface Stats {
  total_bookings: number;
  pending_bookings: number;
  total_assessments: number;
  total_payments: number;
  succeeded_payments: number;
  webhook_verified: number;
  pending_payments: number;
  failed_payments: number;
  total_webhook_events: number;
  processed_events: number;
  total_trials: number;
  active_trials: number;
  expired_trials: number;
  converted_trials: number;
}

type SortField = 'created_at' | 'name' | 'email' | 'status' | 'diet_type';
type SortDir = 'asc' | 'desc';

// ─── Developer Settings Panel ────────────────────────────────────────────────
const DeveloperSettings: React.FC = () => {
  const { 
    isTestMode, testPublishableKey, livePublishableKey, connectedAccountId,
    toggleMode, setTestPublishableKey 
  } = useStripeMode();
  
  const [localTestKey, setLocalTestKey] = useState(testPublishableKey);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { setLocalTestKey(testPublishableKey); }, [testPublishableKey]);

  const handleSaveTestKey = () => {
    setTestPublishableKey(localTestKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const isTestKeyValid = localTestKey.startsWith('pk_test_');
  const isTestKeyEmpty = !localTestKey.trim();

  return (
    <div className="space-y-6">
      {/* Mode Toggle Card */}
      <div className={`rounded-2xl border-2 p-6 transition-all duration-300 ${
        isTestMode ? 'bg-amber-50 border-amber-300 shadow-lg shadow-amber-100' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isTestMode ? 'bg-amber-200' : 'bg-gray-100'}`}>
              {isTestMode ? <TestTube2 className="w-6 h-6 text-amber-700" /> : <Zap className="w-6 h-6 text-gray-600" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Stripe Environment</h3>
              <p className="text-sm text-gray-500 mt-1">
                {isTestMode ? 'Currently in TEST mode — payments use sandbox' : 'Currently in LIVE mode — real payments'}
              </p>
            </div>
          </div>
          <button onClick={toggleMode}
            className={`relative inline-flex h-8 w-[120px] items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 flex-shrink-0 ${
              isTestMode ? 'bg-amber-500 focus:ring-amber-500' : 'bg-emerald-600 focus:ring-emerald-500'
            }`}>
            <span className={`absolute left-1 text-[10px] font-bold uppercase tracking-wider transition-opacity ${isTestMode ? 'opacity-0' : 'opacity-100 text-white ml-2'}`}>Live</span>
            <span className={`absolute right-1 text-[10px] font-bold uppercase tracking-wider transition-opacity ${isTestMode ? 'opacity-100 text-white mr-2' : 'opacity-0'}`}>Test</span>
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${isTestMode ? 'translate-x-[90px]' : 'translate-x-1'}`} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isTestMode ? 'bg-amber-100 text-amber-800' : 'bg-gray-50 text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isTestMode ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="font-medium">Test Mode</span>
            {isTestMode && <span className="text-xs ml-auto font-semibold">ACTIVE</span>}
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${!isTestMode ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full ${!isTestMode ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="font-medium">Live Mode</span>
            {!isTestMode && <span className="text-xs ml-auto font-semibold">ACTIVE</span>}
          </div>
        </div>
      </div>

      {/* Test Key Configuration */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-500" /> Stripe Test Publishable Key
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Enter your Stripe test publishable key (starts with <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">pk_test_</code>). 
          Find it in your <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5">Stripe Dashboard <ExternalLink className="w-3 h-3" /></a>
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input type="text" value={localTestKey} onChange={(e) => setLocalTestKey(e.target.value)}
              placeholder="pk_test_51OJhJBHdGQpsHqIn..."
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono placeholder:text-gray-300 focus:outline-none focus:ring-2 transition-colors ${
                isTestKeyEmpty ? 'border-gray-200 focus:ring-gray-200 focus:border-gray-400'
                  : isTestKeyValid ? 'border-green-300 focus:ring-green-200 focus:border-green-400 bg-green-50/50'
                    : 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50/50'
              }`} />
            {!isTestKeyEmpty && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isTestKeyValid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
              </div>
            )}
          </div>
          <button onClick={handleSaveTestKey} className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            {saved ? <span className="flex items-center gap-1"><CheckCheck className="w-4 h-4" /> Saved</span> : 'Save'}
          </button>
        </div>
        {!isTestKeyEmpty && !isTestKeyValid && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Test keys must start with "pk_test_"</p>
        )}
      </div>

      {/* Current Config */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-gray-500" /> Current Configuration</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Active Publishable Key</div>
              <code className="text-xs font-mono text-gray-700">
                {isTestMode ? (testPublishableKey ? `${testPublishableKey.slice(0, 20)}...${testPublishableKey.slice(-8)}` : 'Not configured') : `${livePublishableKey.slice(0, 20)}...${livePublishableKey.slice(-8)}`}
              </code>
            </div>
            <button onClick={() => handleCopy(isTestMode ? testPublishableKey : livePublishableKey, 'active-key')} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
              {copied === 'active-key' ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Connected Account ID</div>
              <code className="text-xs font-mono text-gray-700">{connectedAccountId}</code>
            </div>
            <button onClick={() => handleCopy(connectedAccountId, 'account-id')} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
              {copied === 'account-id' ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Environment</div>
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${isTestMode ? 'text-amber-700' : 'text-emerald-700'}`}>
              <div className={`w-2 h-2 rounded-full ${isTestMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isTestMode ? 'Test / Sandbox' : 'Live / Production'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2"><TestTube2 className="w-4 h-4 text-gray-500" /> Stripe Test Card Numbers</h4>
        <p className="text-xs text-gray-500 mb-4">Use these in test mode. Any future expiry, any CVC, any postal code.</p>
        <div className="space-y-2">
          {[
            { number: '4242 4242 4242 4242', label: 'Visa — Succeeds', color: 'bg-green-50 text-green-700 border-green-200' },
            { number: '5555 5555 5555 4444', label: 'Mastercard — Succeeds', color: 'bg-green-50 text-green-700 border-green-200' },
            { number: '4000 0000 0000 3220', label: '3D Secure 2', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { number: '4000 0000 0000 9995', label: 'Insufficient funds', color: 'bg-red-50 text-red-700 border-red-200' },
            { number: '4000 0000 0000 0002', label: 'Generic decline', color: 'bg-red-50 text-red-700 border-red-200' },
          ].map((card, idx) => (
            <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg border ${card.color}`}>
              <div className="flex items-center gap-3">
                <code className="text-xs font-mono font-semibold">{card.number}</code>
                <span className="text-[11px] font-medium">{card.label}</span>
              </div>
              <button onClick={() => handleCopy(card.number.replace(/\s/g, ''), `card-${idx}`)} className="p-1.5 rounded hover:bg-white/50 transition-colors">
                {copied === `card-${idx}` ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-2">Important Notes</h4>
            <ul className="space-y-1.5 text-xs text-blue-800 leading-relaxed">
              <li className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />Test payments use IDs prefixed with <code className="bg-blue-100 px-1 rounded">pi_test_</code>.</li>
              <li className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />Remember to switch back to Live mode for production.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Trials Panel ────────────────────────────────────────────────────────────
const TrialsPanel: React.FC<{ trials: TrialRow[]; stats: Stats; formatDate: (d: string) => string }> = ({ trials, stats, formatDate }) => {
  const conversionRate = stats.total_trials > 0 ? ((stats.converted_trials / stats.total_trials) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Trial Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_trials}</div>
          <div className="text-xs text-gray-500 font-medium">Total Trials</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.active_trials}</div>
          <div className="text-xs text-gray-500 font-medium">Active Trials</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.expired_trials}</div>
          <div className="text-xs text-gray-500 font-medium">Expired Trials</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.converted_trials}</div>
          <div className="text-xs text-gray-500 font-medium">Converted to Paid</div>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-purple-900">Trial Conversion Rate</h4>
            <p className="text-xs text-purple-600 mt-0.5">{stats.converted_trials} of {stats.total_trials} trials converted to paid</p>
          </div>
          <div className="text-3xl font-bold text-purple-700">{conversionRate}%</div>
        </div>
        <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${conversionRate}%` }} />
        </div>
      </div>

      {/* Trial List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Started</div>
          <div className="col-span-2">Ends</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Time Left</div>
          <div className="col-span-1">Converted</div>
        </div>

        {trials.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Gift className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No trials found</p>
          </div>
        ) : (
          trials.map(trial => {
            const now = new Date();
            const endsAt = new Date(trial.trial_ends_at);
            const isExpired = now >= endsAt;
            const msRemaining = Math.max(0, endsAt.getTime() - now.getTime());
            const daysLeft = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor(msRemaining / (1000 * 60 * 60));

            return (
              <div key={trial.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 items-center">
                <div className="lg:col-span-3 text-sm text-gray-700 truncate font-medium">{trial.email || 'N/A'}</div>
                <div className="lg:col-span-2 text-xs text-gray-500">{formatDate(trial.trial_started_at)}</div>
                <div className="lg:col-span-2 text-xs text-gray-500">{formatDate(trial.trial_ends_at)}</div>
                <div className="lg:col-span-2">
                  {trial.converted_to_paid ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      <CreditCard className="w-3 h-3" /> Paid
                    </span>
                  ) : isExpired ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                      <XCircle className="w-3 h-3" /> Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                      <Clock className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div className="lg:col-span-2 text-xs text-gray-600">
                  {trial.converted_to_paid ? (
                    <span className="text-emerald-600 font-medium">Converted</span>
                  ) : isExpired ? (
                    <span className="text-red-500">Expired</span>
                  ) : (
                    <span className="font-medium">
                      {daysLeft > 0 ? `${daysLeft}d ${hoursLeft % 24}h` : `${hoursLeft}h`}
                    </span>
                  )}
                </div>
                <div className="lg:col-span-1">
                  {trial.converted_to_paid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ── Main Admin Dashboard ────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { setCurrentView } = useAssessment();
  const { isTestMode } = useStripeMode();
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [trials, setTrials] = useState<TrialRow[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_bookings: 0, pending_bookings: 0, total_assessments: 0,
    total_payments: 0, succeeded_payments: 0, webhook_verified: 0,
    pending_payments: 0, failed_payments: 0, total_webhook_events: 0,
    processed_events: 0, total_trials: 0, active_trials: 0,
    expired_trials: 0, converted_trials: 0,
  });
  const [activeTab, setActiveTab] = useState<'bookings' | 'assessments' | 'trials' | 'developer'>('bookings');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const authenticate = async () => {
    if (!adminKey.trim()) { setAuthError('Please enter the admin key'); return; }
    setLoading(true);
    setAuthError('');
    try {
      const { data, error } = await safeInvoke('admin-data', { body: { action: 'get_stats', admin_key: adminKey } });
      if (error || data?.error) { setAuthError(data?.error || 'Authentication failed'); setLoading(false); return; }
      setStats(data.stats);
      setAuthenticated(true);
      await fetchData();
    } catch { setAuthError('Failed to connect.'); }
    setLoading(false);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, assessmentsRes, trialsRes] = await Promise.all([
        safeInvoke('admin-data', { body: { action: 'get_bookings', admin_key: adminKey } }),
        safeInvoke('admin-data', { body: { action: 'get_assessments', admin_key: adminKey } }),
        safeInvoke('admin-data', { body: { action: 'get_trials', admin_key: adminKey } }),
      ]);
      if (bookingsRes.data?.bookings) setBookings(bookingsRes.data.bookings);
      if (assessmentsRes.data?.assessments) setAssessments(assessmentsRes.data.assessments);
      if (trialsRes.data?.trials) setTrials(trialsRes.data.trials);

      const statsRes = await safeInvoke('admin-data', { body: { action: 'get_stats', admin_key: adminKey } });
      if (statsRes.data?.stats) setStats(statsRes.data.stats);
    } catch (err) { console.error('Failed to fetch data:', err); }
    setLoading(false);
  }, [adminKey]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      const { data } = await safeInvoke('admin-data', { body: { action: 'update_booking', admin_key: adminKey, booking_id: bookingId, status: newStatus } });
      if (data?.booking) setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus, updated_at: data.booking.updated_at } : b));
    } catch (err) { console.error('Failed to update status:', err); }
    setUpdatingStatus(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) { setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortDir('desc'); }
  };

  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b => b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || b.phone.includes(q) || b.health_goals.toLowerCase().includes(q) || b.status.toLowerCase().includes(q));
    }
    filtered.sort((a, b) => { const aVal = a[sortField] || ''; const bVal = b[sortField] || ''; const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0; return sortDir === 'asc' ? cmp : -cmp; });
    return filtered;
  }, [bookings, searchQuery, sortField, sortDir]);

  const filteredAssessments = useMemo(() => {
    let filtered = [...assessments];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a => a.session_id.toLowerCase().includes(q) || a.top_deficiencies.some(d => d.toLowerCase().includes(q)));
    }
    filtered.sort((a, b) => { const cmp = a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0; return sortDir === 'asc' ? cmp : -cmp; });
    return filtered;
  }, [assessments, searchQuery, sortDir]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusConfig: Record<string, { bg: string; text: string; icon: React.FC<{ className?: string }> }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle2 },
    completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  };

  if (!authenticated) {
    return (
      <section className="py-20 lg:py-28 bg-gray-50 min-h-screen">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
              <p className="text-sm text-gray-500 mt-2">Enter your admin key to access the dashboard</p>
            </div>
            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {authError}
              </div>
            )}
            <div className="space-y-4">
              <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && authenticate()} placeholder="Enter admin key..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400" />
              <button onClick={authenticate} disabled={loading}
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Authenticating...' : 'Access Dashboard'}
              </button>
              <button onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h2>
              {isTestMode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-300">
                  <TestTube2 className="w-3.5 h-3.5" /> Test Mode
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Manage bookings, assessments, trials, and developer settings</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={() => { setAuthenticated(false); setAdminKey(''); }}
              className="px-4 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 text-sm transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="w-6 h-6 text-blue-600" /></div>
            <div><div className="text-2xl font-bold text-gray-900">{stats.total_bookings}</div><div className="text-sm text-gray-500">Bookings</div></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center"><BarChart3 className="w-6 h-6 text-teal-600" /></div>
            <div><div className="text-2xl font-bold text-gray-900">{stats.total_assessments}</div><div className="text-sm text-gray-500">Assessments</div></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center"><Gift className="w-6 h-6 text-purple-600" /></div>
            <div><div className="text-2xl font-bold text-gray-900">{stats.active_trials}</div><div className="text-sm text-gray-500">Active Trials</div></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center"><CreditCard className="w-6 h-6 text-emerald-600" /></div>
            <div><div className="text-2xl font-bold text-gray-900">{stats.succeeded_payments}</div><div className="text-sm text-gray-500">Payments</div></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['bookings', 'assessments', 'trials', 'developer'] as const).map(tab => {
            const labels: Record<string, string> = {
              bookings: `Bookings (${bookings.length})`,
              assessments: `Assessments (${assessments.length})`,
              trials: `Trials (${trials.length})`,
              developer: 'Developer Settings',
            };
            const icons: Record<string, React.ReactNode> = {
              trials: <Gift className="w-4 h-4" />,
              developer: <Settings className="w-4 h-4" />,
            };
            const isActive = activeTab === tab;
            const isTrialTab = tab === 'trials';
            const isDevTab = tab === 'developer';

            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? (isDevTab && isTestMode ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                      : isTrialTab ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                        : 'bg-gray-900 text-white shadow-lg')
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {icons[tab]}
                {labels[tab]}
                {isDevTab && isTestMode && !isActive && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                {isTrialTab && stats.active_trials > 0 && !isActive && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Search */}
        {(activeTab === 'bookings' || activeTab === 'assessments') && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'bookings' ? 'Search by name, email, phone, status...' : 'Search by session ID, deficiencies...'}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm" />
          </div>
        )}

        {activeTab === 'developer' && <DeveloperSettings />}
        {activeTab === 'trials' && <TrialsPanel trials={trials} stats={stats} formatDate={formatDate} />}

        {/* Bookings Table */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleSort('name')} className="col-span-2 flex items-center gap-1 hover:text-gray-700">Name <ArrowUpDown className="w-3 h-3" /></button>
              <button onClick={() => handleSort('email')} className="col-span-2 flex items-center gap-1 hover:text-gray-700">Email <ArrowUpDown className="w-3 h-3" /></button>
              <div className="col-span-1">Phone</div>
              <button onClick={() => handleSort('diet_type')} className="col-span-1 flex items-center gap-1 hover:text-gray-700">Diet <ArrowUpDown className="w-3 h-3" /></button>
              <button onClick={() => handleSort('status')} className="col-span-1 flex items-center gap-1 hover:text-gray-700">Status <ArrowUpDown className="w-3 h-3" /></button>
              <div className="col-span-1">Assessment</div>
              <button onClick={() => handleSort('created_at')} className="col-span-2 flex items-center gap-1 hover:text-gray-700">Date <ArrowUpDown className="w-3 h-3" /></button>
              <div className="col-span-2">Actions</div>
            </div>
            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><FileText className="w-10 h-10 mx-auto mb-3 opacity-50" /><p className="font-medium">No booking requests found</p></div>
            ) : (
              filteredBookings.map(booking => {
                const sc = statusConfig[booking.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                const isExpanded = expandedRow === booking.id;
                return (
                  <div key={booking.id} className="border-b border-gray-100 last:border-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 px-6 py-4 hover:bg-gray-50/50 cursor-pointer transition-colors items-center" onClick={() => setExpandedRow(isExpanded ? null : booking.id)}>
                      <div className="lg:col-span-2 flex items-center gap-2"><User className="w-4 h-4 text-gray-400 hidden lg:block" /><span className="font-semibold text-gray-900 text-sm">{booking.name}</span></div>
                      <div className="lg:col-span-2 text-sm text-gray-600 truncate">{booking.email}</div>
                      <div className="lg:col-span-1 text-sm text-gray-600 hidden lg:block">{booking.phone}</div>
                      <div className="lg:col-span-1 hidden lg:block"><span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">{booking.diet_type}</span></div>
                      <div className="lg:col-span-1"><span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${sc.bg} ${sc.text}`}><StatusIcon className="w-3 h-3" />{booking.status}</span></div>
                      <div className="lg:col-span-1 hidden lg:block">{booking.assessment_id ? <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-700 font-medium">Linked</span> : <span className="text-xs text-gray-400">None</span>}</div>
                      <div className="lg:col-span-2 text-xs text-gray-500 hidden lg:block">{formatDate(booking.created_at)}</div>
                      <div className="lg:col-span-2 flex items-center gap-2">
                        <select value={booking.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateBookingStatus(booking.id, e.target.value)} disabled={updatingStatus === booking.id}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300">
                          <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                        </select>
                        <button onClick={(e) => { e.stopPropagation(); setExpandedRow(isExpanded ? null : booking.id); }} className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-6 pb-5 bg-gray-50/50 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                          <div className="space-y-4">
                            <div><div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-1"><Mail className="w-3.5 h-3.5" /> Contact</div><p className="text-sm text-gray-700">{booking.email}</p><p className="text-sm text-gray-700">{booking.phone}</p>{booking.preferred_date && <p className="text-sm text-gray-700 flex items-center gap-1 mt-1"><Calendar className="w-3.5 h-3.5 text-gray-400" />Preferred: {new Date(booking.preferred_date).toLocaleDateString()}</p>}</div>
                            <div><div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-1"><MessageSquare className="w-3.5 h-3.5" /> Health Goals</div><p className="text-sm text-gray-700 leading-relaxed">{booking.health_goals}</p></div>
                            {booking.current_supplements && <div><div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-1"><Pill className="w-3.5 h-3.5" /> Current Supplements</div><p className="text-sm text-gray-700">{booking.current_supplements}</p></div>}
                          </div>
                          {booking.assessment_results && (
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase mb-3"><ClipboardCheck className="w-3.5 h-3.5" /> Linked Assessment</div>
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="text-center p-2 rounded-lg bg-red-50"><div className="text-lg font-bold text-red-600">{booking.assessment_results.critical_count}</div><div className="text-[10px] text-red-500">Critical</div></div>
                                <div className="text-center p-2 rounded-lg bg-amber-50"><div className="text-lg font-bold text-amber-600">{booking.assessment_results.moderate_count}</div><div className="text-[10px] text-amber-500">Moderate</div></div>
                                <div className="text-center p-2 rounded-lg bg-blue-50"><div className="text-lg font-bold text-blue-600">{booking.assessment_results.low_count}</div><div className="text-[10px] text-blue-500">Low</div></div>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">{booking.assessment_results.total_yes_answers} of {booking.assessment_results.total_questions_answered} answered "Yes"</div>
                              {booking.assessment_results.top_deficiencies.length > 0 && (
                                <div><div className="text-xs font-semibold text-gray-600 mb-1">Top Deficiencies:</div><div className="flex flex-wrap gap-1">{booking.assessment_results.top_deficiencies.map((d, i) => <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">{d}</span>)}</div></div>
                              )}
                              <div className="text-[10px] text-gray-400 mt-2">Assessed: {formatDate(booking.assessment_results.created_at)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Assessments Table */}
        {activeTab === 'assessments' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="hidden lg:grid grid-cols-10 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Session ID</div><div className="col-span-1">Questions</div><div className="col-span-1">Critical</div><div className="col-span-1">Moderate</div><div className="col-span-1">Low</div><div className="col-span-2">Top Deficiencies</div><div className="col-span-2">Date</div>
            </div>
            {filteredAssessments.length === 0 ? (
              <div className="p-12 text-center text-gray-400"><BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" /><p className="font-medium">No assessment results found</p></div>
            ) : (
              filteredAssessments.map(assessment => {
                const isExpanded = expandedRow === assessment.id;
                return (
                  <div key={assessment.id} className="border-b border-gray-100 last:border-0">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-2 lg:gap-4 px-6 py-4 hover:bg-gray-50/50 cursor-pointer transition-colors items-center" onClick={() => setExpandedRow(isExpanded ? null : assessment.id)}>
                      <div className="lg:col-span-2 text-sm font-mono text-gray-600 truncate">{assessment.session_id}</div>
                      <div className="lg:col-span-1 text-sm text-gray-600">{assessment.total_yes_answers}/{assessment.total_questions_answered}</div>
                      <div className="lg:col-span-1"><span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 font-bold"><ShieldAlert className="w-3 h-3" /> {assessment.critical_count}</span></div>
                      <div className="lg:col-span-1"><span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold"><Shield className="w-3 h-3" /> {assessment.moderate_count}</span></div>
                      <div className="lg:col-span-1"><span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold"><ShieldCheck className="w-3 h-3" /> {assessment.low_count}</span></div>
                      <div className="lg:col-span-2 flex flex-wrap gap-1">{assessment.top_deficiencies.slice(0, 3).map((d, i) => <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{d}</span>)}</div>
                      <div className="lg:col-span-2 flex items-center justify-between"><span className="text-xs text-gray-500">{formatDate(assessment.created_at)}</span>{isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</div>
                    </div>
                    {isExpanded && (
                      <div className="px-6 pb-5 bg-gray-50/50 border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">All Deficiency Scores</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {assessment.deficiency_scores.map((ds, i) => (
                            <div key={i} className={`p-3 rounded-xl border ${ds.priority === 'critical' ? 'bg-red-50 border-red-100' : ds.priority === 'moderate' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                              <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold text-gray-900">{ds.nutrient_name}</span><span className={`text-xs font-bold ${ds.priority === 'critical' ? 'text-red-600' : ds.priority === 'moderate' ? 'text-amber-600' : 'text-blue-600'}`}>{ds.score}%</span></div>
                              <div className="h-1.5 bg-white/50 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ds.priority === 'critical' ? 'bg-red-500' : ds.priority === 'moderate' ? 'bg-amber-500' : 'bg-blue-400'}`} style={{ width: `${ds.score}%` }} /></div>
                              <div className="text-[10px] text-gray-500 mt-1 capitalize">{ds.category.replace('_', ' ')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminDashboard;
