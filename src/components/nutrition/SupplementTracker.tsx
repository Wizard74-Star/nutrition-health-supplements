import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAssessment, PendingSupplementAdd } from '@/context/AssessmentContext';

import { supabase } from '@/lib/supabase';
import { allNutrients } from '@/data/nutrients';
import { getAllReports, SavedReport } from '@/utils/reportStorage';
import {
  supplementDatabase, supplementCategories, timeOfDayOptions,
  frequencyOptions, dosageUnits, SupplementInfo
} from '@/data/supplementDatabase';
import {
  findInteractions,
  findInteractionsForSupplement,
  DetectedInteraction,
} from '@/data/supplementInteractions';
import SupplementCoverageAnalysis from './SupplementCoverageAnalysis';
import SupplementIntakeLog, { SupplementLog } from './SupplementIntakeLog';
import NotificationPreferences from './NotificationPreferences';
import InteractionChecker from './InteractionChecker';
import TimingOptimizer from './TimingOptimizer';
import {
  Pill, Plus, Search, X, Edit3, Trash2, ChevronDown, ChevronUp, ChevronRight,
  Clock, Bell, BellOff, BellRing, Sun, Moon, Sunset, Sunrise, UtensilsCrossed,
  Shield, ToggleLeft, ToggleRight, Save, AlertTriangle, Filter,
  Package, Tag, Info, Check, Loader2, RefreshCw, Archive, Zap, Sparkles,
  CalendarDays, ListChecks, CheckCircle2, XCircle, SkipForward,
  TrendingUp, Flame, Target, ShieldAlert, Beaker, ArrowRight
} from 'lucide-react';




const getNutrientName = (id: string): string => {
  const n = allNutrients.find(n => n.id === id);
  return n?.name || id;
};

interface SupplementRecord {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  dosage_unit: string;
  brand: string | null;
  time_of_day: string;
  frequency: string;
  notes: string | null;
  nutrient_ids: string[];
  active: boolean;
  reminder_enabled: boolean;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

interface FormState {
  name: string;
  dosage: string;
  dosage_unit: string;
  brand: string;
  time_of_day: string;
  frequency: string;
  notes: string;
  nutrient_ids: string[];
  reminder_enabled: boolean;
  reminder_time: string;
}

const emptyForm: FormState = {
  name: '',
  dosage: '',
  dosage_unit: 'mg',
  brand: '',
  time_of_day: 'morning',
  frequency: 'daily',
  notes: '',
  nutrient_ids: [],
  reminder_enabled: false,
  reminder_time: '08:00',
};

type TabView = 'stack' | 'coverage' | 'schedule' | 'adherence' | 'notifications' | 'interactions' | 'optimizer';




// Helper to get today's date key
const getTodayKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const SupplementTracker: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { setCurrentView, pendingSupplementAdd, setPendingSupplementAdd } = useAssessment();


  const [supplements, setSupplements] = useState<SupplementRecord[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabView>('stack');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [latestReport, setLatestReport] = useState<SavedReport | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bloodTestSource, setBloodTestSource] = useState<string | null>(null);


  const searchRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Load supplements from database
  const fetchSupplements = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('supplements')
        .select('*')
        .eq('user_id', user.id)
        .order('time_of_day', { ascending: true })
        .order('name', { ascending: true });

      if (fetchError) {
        setError('Failed to load supplements.');
        console.error(fetchError);
      } else {
        setSupplements((data || []).map(d => ({
          ...d,
          nutrient_ids: d.nutrient_ids || [],
        })));
      }
    } catch (err) {
      setError('Failed to load supplements.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load supplement logs from database (last 90 days)
  const fetchLogs = useCallback(async () => {
    if (!user?.id) return;
    setLogsLoading(true);
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data, error: fetchError } = await supabase
        .from('supplement_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', ninetyDaysAgo.toISOString())
        .order('taken_at', { ascending: false });

      if (fetchError) {
        console.error('Failed to load supplement logs:', fetchError);
      } else {
        setSupplementLogs(data || []);
      }
    } catch (err) {
      console.error('Failed to load supplement logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSupplements();
      fetchLogs();
    } else {
      setLoading(false);
      setLogsLoading(false);
    }
  }, [isAuthenticated, fetchSupplements, fetchLogs]);

  // Load latest report for coverage analysis
  useEffect(() => {
    const reports = getAllReports();
    if (reports.length > 0) {
      setLatestReport(reports[0]);
    }
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ===== PENDING SUPPLEMENT FROM BLOOD TEST BRIDGE =====
  // Watch for pendingSupplementAdd changes and auto-fill the form
  useEffect(() => {
    if (!pendingSupplementAdd) return;

    // Consume the pending data: pre-fill the form
    const pending = pendingSupplementAdd;

    // Reset any existing form state first
    setEditingId(null);
    setShowSuggestions(false);

    // Pre-fill all form fields from the pending supplement data
    setForm({
      name: pending.name,
      dosage: pending.dosage || '',
      dosage_unit: pending.dosage_unit || 'mg',
      brand: '',
      time_of_day: pending.time_of_day || 'morning',
      frequency: pending.frequency || 'daily',
      notes: pending.notes || '',
      nutrient_ids: pending.nutrient_ids || [],
      reminder_enabled: false,
      reminder_time: '08:00',
    });

    // Set the search query to match the supplement name
    setSearchQuery(pending.name);

    // Store the source info for the purple banner
    setBloodTestSource(pending.source || 'Blood Test Results');

    // Switch to the stack tab and open the form
    setActiveTab('stack');
    setShowAddForm(true);

    // Clear the pending data from context so it doesn't re-trigger
    setPendingSupplementAdd(null);

    // Scroll to the form after a short delay to allow render
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, [pendingSupplementAdd, setPendingSupplementAdd]);


  // Supplement search suggestions
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return supplementDatabase;
    const q = searchQuery.toLowerCase();
    return supplementDatabase.filter(
      s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filter supplements for display
  const filteredSupplements = useMemo(() => {
    let result = [...supplements];
    if (filterActive === 'active') result = result.filter(s => s.active);
    if (filterActive === 'inactive') result = result.filter(s => !s.active);
    if (filterCategory !== 'all') {
      result = result.filter(s => {
        const dbMatch = supplementDatabase.find(
          db => db.name.toLowerCase() === s.name.toLowerCase()
        );
        return dbMatch?.category === filterCategory;
      });
    }
    return result;
  }, [supplements, filterActive, filterCategory]);

  // Group supplements by time of day
  const groupedByTime = useMemo(() => {
    const groups: Record<string, SupplementRecord[]> = {};
    timeOfDayOptions.forEach(t => { groups[t.value] = []; });
    supplements.filter(s => s.active).forEach(s => {
      if (groups[s.time_of_day]) {
        groups[s.time_of_day].push(s);
      } else {
        groups['morning'].push(s);
      }
    });
    return groups;
  }, [supplements]);

  // Today's log tracking
  const todayKey = useMemo(() => getTodayKey(), []);

  const todayLogs = useMemo(() => {
    return supplementLogs.filter(log => {
      const logDate = new Date(log.taken_at);
      const y = logDate.getFullYear();
      const m = String(logDate.getMonth() + 1).padStart(2, '0');
      const d = String(logDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}` === todayKey;
    });
  }, [supplementLogs, todayKey]);

  const todayTakenIds = useMemo(() => {
    const ids = new Set<string>();
    todayLogs.filter(l => !l.skipped).forEach(l => ids.add(l.supplement_id));
    return ids;
  }, [todayLogs]);

  const todaySkippedIds = useMemo(() => {
    const ids = new Set<string>();
    todayLogs.filter(l => l.skipped).forEach(l => ids.add(l.supplement_id));
    return ids;
  }, [todayLogs]);

  const activeSupplements = useMemo(() => supplements.filter(s => s.active), [supplements]);

  const todayProgress = useMemo(() => {
    const total = activeSupplements.length;
    const taken = todayTakenIds.size;
    const skipped = todaySkippedIds.size;
    const remaining = Math.max(0, total - taken - skipped);
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
    return { total, taken, skipped, remaining, percentage };
  }, [activeSupplements, todayTakenIds, todaySkippedIds]);

  // ===== INTERACTION DETECTION =====
  // Detect interactions across the entire active supplement stack
  const stackInteractions = useMemo(() => {
    const activeSupps = supplements.filter(s => s.active);
    if (activeSupps.length < 2) return [];
    return findInteractions(activeSupps.map(s => ({
      id: s.id,
      name: s.name,
      nutrient_ids: s.nutrient_ids || [],
    })));
  }, [supplements]);

  // Detect interactions for the supplement currently being added/edited
  const formInteractions = useMemo(() => {
    if (!form.name.trim() || supplements.length === 0) return [];
    const existingStack = supplements
      .filter(s => s.active && s.id !== editingId)
      .map(s => ({
        id: s.id,
        name: s.name,
        nutrient_ids: s.nutrient_ids || [],
      }));
    if (existingStack.length === 0) return [];
    return findInteractionsForSupplement(
      { id: 'new-form-supplement', name: form.name.trim(), nutrient_ids: form.nutrient_ids },
      existingStack
    );
  }, [form.name, form.nutrient_ids, supplements, editingId]);

  const interactionCount = stackInteractions.length;
  const hasAvoidInteractions = stackInteractions.some(d => d.interaction.severity === 'avoid');
  const hasWarningInteractions = stackInteractions.some(d => d.interaction.severity === 'warning');


  // Mark supplement as taken
  const markAsTaken = async (supplementId: string) => {
    if (!user?.id) return;
    setMarkingId(supplementId);
    try {
      const { data, error: insertError } = await supabase
        .from('supplement_logs')
        .insert({
          user_id: user.id,
          supplement_id: supplementId,
          taken_at: new Date().toISOString(),
          skipped: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        setSupplementLogs(prev => [data, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log supplement intake.');
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  };

  // Mark supplement as skipped
  const markAsSkipped = async (supplementId: string) => {
    if (!user?.id) return;
    setMarkingId(supplementId);
    try {
      const { data, error: insertError } = await supabase
        .from('supplement_logs')
        .insert({
          user_id: user.id,
          supplement_id: supplementId,
          taken_at: new Date().toISOString(),
          skipped: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) {
        setSupplementLogs(prev => [data, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to log skipped supplement.');
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  };

  // Undo a log entry (remove the most recent log for a supplement today)
  const undoLog = async (supplementId: string) => {
    if (!user?.id) return;
    setMarkingId(supplementId);
    try {
      // Find the most recent log for this supplement today
      const todayLog = todayLogs
        .filter(l => l.supplement_id === supplementId)
        .sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime())[0];

      if (!todayLog) return;

      const { error: deleteError } = await supabase
        .from('supplement_logs')
        .delete()
        .eq('id', todayLog.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      setSupplementLogs(prev => prev.filter(l => l.id !== todayLog.id));
    } catch (err: any) {
      setError(err.message || 'Failed to undo log entry.');
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  };

  const selectSuggestion = (supp: SupplementInfo) => {
    setForm(prev => ({
      ...prev,
      name: supp.name,
      dosage: supp.commonDosages[0] || '',
      dosage_unit: supp.defaultUnit,
      time_of_day: supp.bestTimeOfDay,
      nutrient_ids: supp.nutrientIds,
      notes: supp.tips || '',
    }));
    setSearchQuery(supp.name);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!user?.id || !form.name.trim() || !form.dosage.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        dosage_unit: form.dosage_unit,
        brand: form.brand.trim() || null,
        time_of_day: form.time_of_day,
        frequency: form.frequency,
        notes: form.notes.trim() || null,
        nutrient_ids: form.nutrient_ids,
        reminder_enabled: form.reminder_enabled,
        reminder_time: form.reminder_enabled ? form.reminder_time : null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('supplements')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('supplements')
          .insert({ ...payload, active: true });

        if (insertError) throw insertError;
      }

      await fetchSupplements();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save supplement.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    try {
      const { error: delError } = await supabase
        .from('supplements')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delError) throw delError;
      setSupplements(prev => prev.filter(s => s.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete supplement.');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    if (!user?.id) return;
    try {
      const { error: toggleError } = await supabase
        .from('supplements')
        .update({ active: !currentActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (toggleError) throw toggleError;
      setSupplements(prev =>
        prev.map(s => s.id === id ? { ...s, active: !currentActive } : s)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update supplement.');
    }
  };

  const toggleReminder = async (id: string, currentEnabled: boolean) => {
    if (!user?.id) return;
    try {
      const { error: toggleError } = await supabase
        .from('supplements')
        .update({
          reminder_enabled: !currentEnabled,
          reminder_time: !currentEnabled ? '08:00' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (toggleError) throw toggleError;
      setSupplements(prev =>
        prev.map(s => s.id === id ? {
          ...s,
          reminder_enabled: !currentEnabled,
          reminder_time: !currentEnabled ? '08:00' : null,
        } : s)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update reminder.');
    }
  };

  const startEdit = (supp: SupplementRecord) => {
    setForm({
      name: supp.name,
      dosage: supp.dosage,
      dosage_unit: supp.dosage_unit,
      brand: supp.brand || '',
      time_of_day: supp.time_of_day,
      frequency: supp.frequency,
      notes: supp.notes || '',
      nutrient_ids: supp.nutrient_ids || [],
      reminder_enabled: supp.reminder_enabled,
      reminder_time: supp.reminder_time || '08:00',
    });
    setSearchQuery(supp.name);
    setEditingId(supp.id);
    setShowAddForm(true);
    setActiveTab('stack');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setSearchQuery('');
    setEditingId(null);
    setShowAddForm(false);
    setShowSuggestions(false);
    setBloodTestSource(null);
  };


  const getTimeIcon = (time: string) => {
    switch (time) {
      case 'morning': return <Sunrise className="w-4 h-4 text-amber-500" />;
      case 'afternoon': return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'evening': return <Sunset className="w-4 h-4 text-orange-500" />;
      case 'bedtime': return <Moon className="w-4 h-4 text-indigo-500" />;
      case 'with-meals': return <UtensilsCrossed className="w-4 h-4 text-teal-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTimeLabel = (time: string) => {
    return timeOfDayOptions.find(t => t.value === time)?.label || time;
  };

  const getFrequencyLabel = (freq: string) => {
    return frequencyOptions.find(f => f.value === freq)?.label || freq;
  };

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center mx-auto mb-6">
            <Pill className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Supplement Tracker</h1>
          <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            Track your supplement stack, set reminders, and see how your supplements cover your nutrient deficiencies.
          </p>
          <button
            onClick={() => setCurrentView('home')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Sign in to get started
          </button>
        </div>
      </div>
    );
  }

  const activeCount = supplements.filter(s => s.active).length;
  const reminderCount = supplements.filter(s => s.reminder_enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Pill className="w-6 h-6 text-white" />
              </div>
              Supplement Tracker
            </h1>
            <p className="text-gray-500 mt-2 ml-[60px]">
              Manage your supplement stack and track deficiency coverage
            </p>
          </div>

          <div className="flex items-center gap-3 ml-[60px] md:ml-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
              <Pill className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{activeCount} active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{reminderCount} reminders</span>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddForm(true); setActiveTab('stack'); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Supplement
            </button>
          </div>
        </div>

        {/* Today's Progress Bar (shown when there are active supplements) */}
        {activeCount > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-semibold text-gray-800">Today's Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-gray-600">{todayProgress.taken} taken</span>
                </div>
                {todayProgress.skipped > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <SkipForward className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-gray-600">{todayProgress.skipped} skipped</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600">{todayProgress.remaining} remaining</span>
                </div>
              </div>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full flex">
                <div
                  className={`transition-all duration-500 ${
                    todayProgress.percentage >= 100 ? 'bg-emerald-500' :
                    todayProgress.percentage >= 80 ? 'bg-teal-500' :
                    todayProgress.percentage >= 50 ? 'bg-amber-500' : 'bg-orange-400'
                  }`}
                  style={{ width: `${todayProgress.total > 0 ? (todayProgress.taken / todayProgress.total) * 100 : 0}%` }}
                />
                {todayProgress.skipped > 0 && (
                  <div
                    className="bg-amber-300 transition-all duration-500"
                    style={{ width: `${(todayProgress.skipped / todayProgress.total) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-400">
                {todayProgress.percentage}% complete
              </span>
              {todayProgress.percentage >= 100 && (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  All supplements taken today!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit overflow-x-auto">
          {[
            { id: 'stack' as TabView, label: 'My Stack', icon: <ListChecks className="w-4 h-4" /> },
            { id: 'interactions' as TabView, label: 'Interactions', icon: <ShieldAlert className="w-4 h-4" />, badge: interactionCount > 0 ? interactionCount : undefined },
            { id: 'optimizer' as TabView, label: 'Optimizer', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'schedule' as TabView, label: 'Daily Schedule', icon: <CalendarDays className="w-4 h-4" /> },
            { id: 'adherence' as TabView, label: 'Adherence', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'notifications' as TabView, label: 'Notifications', icon: <BellRing className="w-4 h-4" /> },
            { id: 'coverage' as TabView, label: 'Coverage', icon: <Shield className="w-4 h-4" /> },
          ].map(tab => (

            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative ${
                activeTab === tab.id
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {'badge' in tab && tab.badge && (
                <span className={`ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold rounded-full ${
                  hasAvoidInteractions ? 'bg-red-500 text-white' :
                  hasWarningInteractions ? 'bg-orange-500 text-white' :
                  'bg-amber-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}

        </div>


        {/* Add/Edit Form */}
        {showAddForm && (
          <div ref={formRef} className="mb-8 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {editingId ? <Edit3 className="w-5 h-5 text-purple-600" /> : <Plus className="w-5 h-5 text-purple-600" />}
                  {editingId ? 'Edit Supplement' : 'Add New Supplement'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-white/60 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Blood Test Source Banner */}
              {bloodTestSource && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 rounded-xl border border-purple-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/20">
                    <Beaker className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-purple-900">Pre-filled from Blood Test Results</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold border border-purple-200 whitespace-nowrap">
                        Auto-filled
                      </span>
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      This supplement was recommended based on your blood work analysis. All fields below have been pre-filled with the optimal dosage, timing, and linked nutrients.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Beaker className="w-3 h-3 text-purple-500" />
                      <span className="text-[11px] font-semibold text-purple-600">
                        Source: {bloodTestSource}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setBloodTestSource(null)}
                    className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>
              )}

              {/* Supplement Name Search */}
              <div ref={searchRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplement Name *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setForm(prev => ({ ...prev, name: e.target.value }));
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search supplements or type a custom name..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && searchQuery.trim() && filteredSuggestions.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {filteredSuggestions.slice(0, 10).map((supp, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(supp)}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{supp.name}</p>
                            <p className="text-xs text-gray-500">{supp.category} · {supp.commonDosages[0]} {supp.defaultUnit}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">
                            {supp.nutrientIds.length} nutrient{supp.nutrientIds.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dosage + Unit + Brand */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dosage *</label>
                  <input
                    type="text"
                    value={form.dosage}
                    onChange={(e) => setForm(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 1000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                  <select
                    value={form.dosage_unit}
                    onChange={(e) => setForm(prev => ({ ...prev, dosage_unit: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    {dosageUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand (optional)</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g., Nature Made"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Time of Day + Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time of Day</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {timeOfDayOptions.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setForm(prev => ({ ...prev, time_of_day: t.value }))}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          form.time_of_day === t.value
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {getTimeIcon(t.value)}
                        <span className="truncate w-full text-center text-[10px]">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    {frequencyOptions.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reminder */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <button
                  onClick={() => setForm(prev => ({ ...prev, reminder_enabled: !prev.reminder_enabled }))}
                  className="flex items-center gap-2"
                >
                  {form.reminder_enabled ? (
                    <ToggleRight className="w-8 h-8 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {form.reminder_enabled ? 'Reminder On' : 'Set Reminder'}
                  </span>
                </button>
                {form.reminder_enabled && (
                  <input
                    type="time"
                    value={form.reminder_time}
                    onChange={(e) => setForm(prev => ({ ...prev, reminder_time: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Take with food, absorption tips..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>

              {/* Nutrient Tags */}
              {form.nutrient_ids.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Linked Nutrients</label>
                  <div className="flex flex-wrap gap-1.5">
                    {form.nutrient_ids.map(id => {
                      const nutrient = allNutrients.find(n => n.id === id);
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-lg border border-teal-100">
                          <Tag className="w-3 h-3" />
                          {nutrient?.name || id}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form-level Interaction Warnings */}

              {formInteractions.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-orange-700 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Interaction Warnings ({formInteractions.length})
                  </label>
                  <InteractionChecker
                    interactions={formInteractions}
                    compact
                    maxVisible={3}
                  />
                </div>
              )}

              {/* Actions */}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.dosage.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingId ? 'Update Supplement' : 'Add to Stack'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'stack' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                <span>Filter:</span>
              </div>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                {supplementCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={fetchSupplements}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Interaction Warning Banner on My Stack */}
            {interactionCount > 0 && (
              <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${
                hasAvoidInteractions ? 'bg-red-50 border-red-200' :
                hasWarningInteractions ? 'bg-orange-50 border-orange-200' :
                'bg-amber-50 border-amber-200'
              }`} onClick={() => setActiveTab('interactions')}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  hasAvoidInteractions ? 'bg-red-100' :
                  hasWarningInteractions ? 'bg-orange-100' :
                  'bg-amber-100'
                }`}>
                  <ShieldAlert className={`w-5 h-5 ${
                    hasAvoidInteractions ? 'text-red-600' :
                    hasWarningInteractions ? 'text-orange-600' :
                    'text-amber-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${
                    hasAvoidInteractions ? 'text-red-800' :
                    hasWarningInteractions ? 'text-orange-800' :
                    'text-amber-800'
                  }`}>
                    {interactionCount} Interaction{interactionCount !== 1 ? 's' : ''} Detected
                  </p>
                  <p className={`text-xs ${
                    hasAvoidInteractions ? 'text-red-600' :
                    hasWarningInteractions ? 'text-orange-600' :
                    'text-amber-600'
                  }`}>
                    {hasAvoidInteractions
                      ? 'Some supplements should not be combined. Click to review.'
                      : hasWarningInteractions
                      ? 'Some supplements may interact. Click to review timing recommendations.'
                      : 'Minor interactions found. Click to review timing tips.'}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                  hasAvoidInteractions ? 'text-red-400' :
                  hasWarningInteractions ? 'text-orange-400' :
                  'text-amber-400'
                }`} />
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : filteredSupplements.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {supplements.length === 0 ? 'No Supplements Yet' : 'No Matching Supplements'}
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  {supplements.length === 0
                    ? 'Start building your supplement stack by adding your first supplement.'
                    : 'Try adjusting your filters to see more results.'}
                </p>
                {supplements.length === 0 && (
                  <button
                    onClick={() => { resetForm(); setShowAddForm(true); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Supplement
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredSupplements.map(supp => {
                  const dbMatch = supplementDatabase.find(
                    s => s.name.toLowerCase() === supp.name.toLowerCase()
                  );
                  // Check if this specific supplement has interactions
                  const suppInteractions = stackInteractions.filter(
                    d => d.supplementAName === supp.name || d.supplementBName === supp.name ||
                         d.supplementAId === supp.id || d.supplementBId === supp.id
                  );
                  const hasInteraction = suppInteractions.length > 0;
                  const worstSeverity = hasInteraction
                    ? suppInteractions.some(d => d.interaction.severity === 'avoid') ? 'avoid'
                    : suppInteractions.some(d => d.interaction.severity === 'warning') ? 'warning'
                    : 'caution'
                    : null;

                  return (
                    <div
                      key={supp.id}
                      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                        supp.active
                          ? hasInteraction && worstSeverity === 'avoid' ? 'border-red-200 hover:border-red-300 hover:shadow-md'
                          : hasInteraction && worstSeverity === 'warning' ? 'border-orange-200 hover:border-orange-300 hover:shadow-md'
                          : hasInteraction ? 'border-amber-200 hover:border-amber-300 hover:shadow-md'
                          : 'border-gray-100 hover:border-purple-200 hover:shadow-md'
                          : 'border-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Time Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          supp.active ? 'bg-purple-50' : 'bg-gray-50'
                        }`}>
                          {getTimeIcon(supp.time_of_day)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{supp.name}</h4>
                            {!supp.active && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                                Paused
                              </span>
                            )}
                            {hasInteraction && supp.active && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                worstSeverity === 'avoid' ? 'bg-red-100 text-red-700' :
                                worstSeverity === 'warning' ? 'bg-orange-100 text-orange-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {suppInteractions.length} interaction{suppInteractions.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span className="font-medium text-gray-700">{supp.dosage} {supp.dosage_unit}</span>
                            {supp.brand && (
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {supp.brand}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeLabel(supp.time_of_day)}
                            </span>
                            <span>{getFrequencyLabel(supp.frequency)}</span>
                            {supp.reminder_enabled && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Bell className="w-3 h-3" />
                                {supp.reminder_time}
                              </span>
                            )}
                          </div>
                          {supp.notes && (
                            <p className="text-xs text-gray-400 mt-1 truncate flex items-center gap-1">
                              <Info className="w-3 h-3 flex-shrink-0" />
                              {supp.notes}
                            </p>
                          )}
                          {/* Nutrient tags */}
                          {(supp.nutrient_ids?.length > 0 || dbMatch) && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(supp.nutrient_ids?.length > 0 ? supp.nutrient_ids : dbMatch?.nutrientIds || []).slice(0, 4).map(id => (
                                <span key={id} className="text-[10px] px-1.5 py-0.5 bg-teal-50 text-teal-600 rounded font-medium">
                                  {getNutrientName(id)}
                                </span>
                              ))}
                              {((supp.nutrient_ids?.length || dbMatch?.nutrientIds?.length || 0) > 4) && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded font-medium">
                                  +{(supp.nutrient_ids?.length || dbMatch?.nutrientIds?.length || 0) - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleReminder(supp.id, supp.reminder_enabled)}
                            className={`p-2 rounded-lg transition-colors ${
                              supp.reminder_enabled
                                ? 'text-amber-500 hover:bg-amber-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={supp.reminder_enabled ? 'Disable reminder' : 'Enable reminder'}
                          >
                            {supp.reminder_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => toggleActive(supp.id, supp.active)}
                            className={`p-2 rounded-lg transition-colors ${
                              supp.active
                                ? 'text-green-500 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={supp.active ? 'Pause supplement' : 'Resume supplement'}
                          >
                            {supp.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => startEdit(supp)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {deleteConfirm === supp.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(supp.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Confirm delete"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(supp.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === 'interactions' && (
          <div>
            {supplements.filter(s => s.active).length < 2 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Need More Supplements</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Add at least 2 active supplements to your stack to check for interactions.
                </p>
              </div>
            ) : (
              <InteractionChecker interactions={stackInteractions} />
            )}
          </div>
        )}

        {/* Optimizer Tab */}
        {activeTab === 'optimizer' && (
          <TimingOptimizer
            supplements={supplements.map(s => ({
              id: s.id,
              name: s.name,
              dosage: s.dosage,
              dosage_unit: s.dosage_unit,
              time_of_day: s.time_of_day,
              nutrient_ids: s.nutrient_ids,
              active: s.active,
              reminder_time: s.reminder_time,
            }))}
            interactions={stackInteractions}

            onApplySchedule={async (updates) => {
              if (!user?.id) return;
              for (const update of updates) {
                await supabase
                  .from('supplement_stack')
                  .update({ time_of_day: update.time_of_day, updated_at: new Date().toISOString() })
                  .eq('id', update.id)
                  .eq('user_id', user.id);
              }
              // Refresh supplements
              const { data } = await supabase
                .from('supplement_stack')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
              if (data) setSupplements(data as SupplementRecord[]);
            }}
          />
        )}

        {activeTab === 'coverage' && (

          <SupplementCoverageAnalysis
            supplements={supplements.map(s => ({
              id: s.id,
              name: s.name,
              dosage: s.dosage,
              dosage_unit: s.dosage_unit,
              nutrient_ids: s.nutrient_ids || [],
              active: s.active,
            }))}
            latestReport={latestReport}
          />
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-600" />
                  Daily Supplement Schedule
                </h3>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Mark each supplement as taken or skipped to track your daily adherence
              </p>

              {activeSupplements.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No active supplements to schedule.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeOfDayOptions.map(time => {
                    const supps = groupedByTime[time.value] || [];
                    if (supps.length === 0) return null;

                    const timeGroupTaken = supps.filter(s => todayTakenIds.has(s.id)).length;
                    const timeGroupTotal = supps.length;
                    const allDone = timeGroupTaken === timeGroupTotal;

                    return (
                      <div key={time.value} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                          {getTimeIcon(time.value)}
                          <h4 className="text-sm font-semibold text-gray-800">{time.label}</h4>
                          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                            {supps.length} supplement{supps.length !== 1 ? 's' : ''}
                          </span>
                          <div className="flex-1" />
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${allDone ? 'bg-emerald-500' : 'bg-teal-400'}`}
                                style={{ width: `${(timeGroupTaken / timeGroupTotal) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {timeGroupTaken}/{timeGroupTotal}
                            </span>
                            {allDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {supps.map(supp => {
                            const isTaken = todayTakenIds.has(supp.id);
                            const isSkipped = todaySkippedIds.has(supp.id);
                            const isMarking = markingId === supp.id;
                            return (
                              <div key={supp.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${isTaken ? 'bg-emerald-50/50' : isSkipped ? 'bg-amber-50/50' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isTaken ? 'bg-emerald-100' : isSkipped ? 'bg-amber-100' : 'bg-purple-50'}`}>
                                  {isTaken ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : isSkipped ? <SkipForward className="w-4 h-4 text-amber-600" /> : <Pill className="w-4 h-4 text-purple-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isTaken ? 'text-emerald-800 line-through' : isSkipped ? 'text-amber-700 line-through' : 'text-gray-900'}`}>{supp.name}</p>
                                  <p className="text-xs text-gray-500">{supp.dosage} {supp.dosage_unit}{supp.brand && ` · ${supp.brand}`} · {getFrequencyLabel(supp.frequency)}</p>
                                </div>
                                {supp.reminder_enabled && (
                                  <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                                    <Bell className="w-3 h-3 text-amber-500" />
                                    <span className="text-xs text-amber-700 font-medium">{supp.reminder_time}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {isTaken || isSkipped ? (
                                    <button onClick={() => undoLog(supp.id)} disabled={isMarking} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50">
                                      {isMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Undo
                                    </button>
                                  ) : (
                                    <>
                                      <button onClick={() => markAsTaken(supp.id)} disabled={isMarking} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100">
                                        {isMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Taken
                                      </button>
                                      <button onClick={() => markAsSkipped(supp.id)} disabled={isMarking} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all disabled:opacity-50">
                                        {isMarking ? <Loader2 className="w-3 h-3 animate-spin" /> : <SkipForward className="w-3 h-3" />} Skip
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {timeOfDayOptions.slice(0, 4).map(time => {
                const count = (groupedByTime[time.value] || []).length;
                const takenCount = (groupedByTime[time.value] || []).filter(s => todayTakenIds.has(s.id)).length;
                return (
                  <div key={time.value} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-2">{getTimeIcon(time.value)}</div>
                    <p className="text-2xl font-bold text-gray-900">{takenCount}<span className="text-sm text-gray-400 font-normal">/{count}</span></p>
                    <p className="text-xs text-gray-500">{time.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'adherence' && (
          <div>
            {logsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : (
              <SupplementIntakeLog
                logs={supplementLogs}
                supplements={supplements.map(s => ({ id: s.id, name: s.name, dosage: s.dosage, dosage_unit: s.dosage_unit, time_of_day: s.time_of_day, frequency: s.frequency, active: s.active }))}
              />
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <NotificationPreferences
            supplements={supplements.map(s => ({ id: s.id, name: s.name, dosage: s.dosage, dosage_unit: s.dosage_unit, time_of_day: s.time_of_day, reminder_enabled: s.reminder_enabled, reminder_time: s.reminder_time, active: s.active }))}
          />
        )}
      </div>
    </div>
  );
};

export default SupplementTracker;
