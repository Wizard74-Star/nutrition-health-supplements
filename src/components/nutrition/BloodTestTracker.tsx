import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAssessment, PendingSupplementAdd } from '@/context/AssessmentContext';
import { supabase } from '@/lib/supabase';
import {
  bloodMarkers, markerCategories, evaluateMarkerValue, getSeverityInfo,
  BloodMarker, MarkerCategory
} from '@/data/bloodMarkers';
import BloodTestEntryForm, { MarkerEntry } from './BloodTestEntryForm';
import BloodTestResultsDisplay, { StoredMarkerResult } from './BloodTestResultsDisplay';
import BloodTestSupplementBridge from './BloodTestSupplementBridge';
import BloodTestUploader from './BloodTestUploader';
import BloodTestExportPanel from './BloodTestExportPanel';
import {
  Beaker, Plus, Calendar, ChevronDown, ChevronUp, Trash2, Edit3,
  Loader2, AlertTriangle, X, Activity, TrendingUp, TrendingDown,
  FileText, Clock, Building2, Eye, ArrowLeft, BarChart3, ListChecks, Pill,
  Upload, FileUp, Download, Share2
} from 'lucide-react';



interface BloodTest {
  id: string;
  user_id: string;
  test_date: string;
  lab_name: string | null;
  notes: string | null;
  created_at: string;
  markers: StoredMarkerResult[];
}

type TabView = 'history' | 'trends';

const BloodTestTracker: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { setCurrentView, setPendingSupplementAdd } = useAssessment();

  const [tests, setTests] = useState<BloodTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabView>('history');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [viewingTestId, setViewingTestId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [trendMarkerId, setTrendMarkerId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);


  // Supplement integration state
  const [existingSupplementNames, setExistingSupplementNames] = useState<string[]>([]);
  const [addedSupplements, setAddedSupplements] = useState<Set<string>>(new Set());

  // Fetch existing supplement names for the bridge component
  const fetchExistingSupplements = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('supplements')
        .select('name')
        .eq('user_id', user.id);
      if (data) {
        setExistingSupplementNames(data.map(d => d.name));
      }
    } catch (err) {
      console.error('Failed to fetch existing supplements:', err);
    }
  }, [user?.id]);


  // Fetch blood tests
  const fetchTests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: testsData, error: testErr } = await supabase
        .from('blood_tests')
        .select('*')
        .eq('user_id', user.id)
        .order('test_date', { ascending: false });

      if (testErr) throw testErr;

      if (!testsData || testsData.length === 0) {
        setTests([]);
        setLoading(false);
        return;
      }

      const testIds = testsData.map(t => t.id);
      const { data: markersData, error: markErr } = await supabase
        .from('blood_test_markers')
        .select('*')
        .eq('user_id', user.id)
        .in('blood_test_id', testIds);

      if (markErr) throw markErr;

      const testsWithMarkers: BloodTest[] = testsData.map(t => ({
        ...t,
        markers: (markersData || [])
          .filter(m => m.blood_test_id === t.id)
          .map(m => ({
            markerId: m.marker_id,
            value: Number(m.value),
            unit: m.unit,
          })),
      }));

      setTests(testsWithMarkers);
    } catch (err: any) {
      setError(err.message || 'Failed to load blood tests.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTests();
      fetchExistingSupplements();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchTests, fetchExistingSupplements]);

  // Handle adding supplement from blood test recommendations
  const handleAddToStack = (data: PendingSupplementAdd) => {
    setPendingSupplementAdd(data);
    setCurrentView('supplements');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle uploader confirm - save parsed data as a new blood test
  const handleUploaderConfirm = async (data: {
    testDate: string;
    labName: string;
    notes: string;
    markers: MarkerEntry[];
  }) => {
    setShowUploader(false);
    await handleSaveTest(data);
  };



  // Save blood test
  const handleSaveTest = async (data: {
    testDate: string;
    labName: string;
    notes: string;
    markers: MarkerEntry[];
  }) => {
    if (!user?.id) return;
    setSaving(true);
    setError(null);

    try {
      if (editingTestId) {
        // Update existing test
        const { error: updateErr } = await supabase
          .from('blood_tests')
          .update({
            test_date: data.testDate,
            lab_name: data.labName || null,
            notes: data.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTestId)
          .eq('user_id', user.id);

        if (updateErr) throw updateErr;

        // Delete old markers
        await supabase
          .from('blood_test_markers')
          .delete()
          .eq('blood_test_id', editingTestId)
          .eq('user_id', user.id);

        // Insert new markers
        const markerRows = data.markers.map(m => {
          const marker = bloodMarkers.find(bm => bm.id === m.markerId);
          return {
            blood_test_id: editingTestId,
            user_id: user.id,
            marker_id: m.markerId,
            value: parseFloat(m.value),
            unit: marker?.referenceRange.unit || '',
          };
        });

        const { error: insertErr } = await supabase
          .from('blood_test_markers')
          .insert(markerRows);

        if (insertErr) throw insertErr;
      } else {
        // Create new test
        const { data: newTest, error: insertErr } = await supabase
          .from('blood_tests')
          .insert({
            user_id: user.id,
            test_date: data.testDate,
            lab_name: data.labName || null,
            notes: data.notes || null,
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        if (!newTest) throw new Error('Failed to create blood test');

        // Insert markers
        const markerRows = data.markers.map(m => {
          const marker = bloodMarkers.find(bm => bm.id === m.markerId);
          return {
            blood_test_id: newTest.id,
            user_id: user.id,
            marker_id: m.markerId,
            value: parseFloat(m.value),
            unit: marker?.referenceRange.unit || '',
          };
        });

        const { error: markerErr } = await supabase
          .from('blood_test_markers')
          .insert(markerRows);

        if (markerErr) throw markerErr;
      }

      await fetchTests();
      setShowEntryForm(false);
      setEditingTestId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save blood test.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Delete test
  const handleDeleteTest = async (testId: string) => {
    if (!user?.id) return;
    try {
      await supabase.from('blood_test_markers').delete().eq('blood_test_id', testId).eq('user_id', user.id);
      const { error: delErr } = await supabase.from('blood_tests').delete().eq('id', testId).eq('user_id', user.id);
      if (delErr) throw delErr;
      setTests(prev => prev.filter(t => t.id !== testId));
      setDeleteConfirm(null);
      if (viewingTestId === testId) setViewingTestId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete blood test.');
    }
  };

  // Start editing
  const startEdit = (test: BloodTest) => {
    setEditingTestId(test.id);
    setShowEntryForm(true);
    setViewingTestId(null);
  };

  // Get summary for a test
  const getTestSummary = (test: BloodTest) => {
    let normal = 0, borderline = 0, abnormal = 0, critical = 0;
    test.markers.forEach(m => {
      const marker = bloodMarkers.find(bm => bm.id === m.markerId);
      if (!marker) return;
      const severity = evaluateMarkerValue(marker, m.value);
      if (severity === 'normal') normal++;
      else if (severity.includes('borderline')) borderline++;
      else if (severity.includes('critical')) critical++;
      else abnormal++;
    });
    return { normal, borderline, abnormal, critical, total: test.markers.length };
  };

  // Trend data for a specific marker
  const trendData = useMemo(() => {
    if (!trendMarkerId) return [];
    return tests
      .map(t => {
        const m = t.markers.find(mk => mk.markerId === trendMarkerId);
        if (!m) return null;
        return { date: t.test_date, value: m.value, testId: t.id };
      })
      .filter(Boolean)
      .reverse() as Array<{ date: string; value: number; testId: string }>;
  }, [trendMarkerId, tests]);

  const trendMarker = trendMarkerId ? bloodMarkers.find(m => m.id === trendMarkerId) : null;

  // All unique markers across all tests for trend selection
  const allTestedMarkerIds = useMemo(() => {
    const ids = new Set<string>();
    tests.forEach(t => t.markers.forEach(m => ids.add(m.markerId)));
    return Array.from(ids);
  }, [tests]);

  // Viewing test
  const viewingTest = viewingTestId ? tests.find(t => t.id === viewingTestId) : null;

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
            <Beaker className="w-10 h-10 text-rose-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Blood Test Tracker</h1>
          <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            Upload your blood work results, track trends over time, and get personalized supplement recommendations.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                <Beaker className="w-6 h-6 text-white" />
              </div>
              Blood Test Tracker
            </h1>
            <p className="text-gray-500 mt-2 ml-[60px]">
              Track your blood work, monitor trends, and get personalized recommendations
            </p>
          </div>
          <div className="flex items-center gap-2 ml-[60px] md:ml-0 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
              <FileText className="w-4 h-4 text-rose-600" />
              <span className="text-sm font-medium text-rose-700">{tests.length} test{tests.length !== 1 ? 's' : ''}</span>
            </div>
            {tests.length > 0 && (
              <button
                onClick={() => setShowExportPanel(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all"
              >
                <Download className="w-4 h-4" />
                Export & Share
              </button>
            )}
            <button
              onClick={() => { setShowUploader(true); setShowEntryForm(false); setEditingTestId(null); setViewingTestId(null); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Report
            </button>
            <button
              onClick={() => { setShowEntryForm(true); setShowUploader(false); setEditingTestId(null); setViewingTestId(null); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" />
              Enter Manually
            </button>
          </div>

        </div>

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

        {/* Entry Form */}
        {showEntryForm && (
          <div className="mb-8">
            <BloodTestEntryForm
              onSubmit={handleSaveTest}
              onCancel={() => { setShowEntryForm(false); setEditingTestId(null); }}
              saving={saving}
              isEditing={!!editingTestId}
              initialData={editingTestId ? (() => {
                const test = tests.find(t => t.id === editingTestId);
                if (!test) return undefined;
                return {
                  testDate: test.test_date,
                  labName: test.lab_name || '',
                  notes: test.notes || '',
                  markers: test.markers.map(m => ({ markerId: m.markerId, value: String(m.value) })),
                };
              })() : undefined}
            />
          </div>
        )}

        {/* Upload Report */}
        {showUploader && !showEntryForm && (
          <div className="mb-8">
            <BloodTestUploader
              onConfirm={handleUploaderConfirm}
              onCancel={() => setShowUploader(false)}
            />
          </div>
        )}


        {/* Viewing specific test results */}
        {viewingTest && !showEntryForm && (
          <div className="mb-8">
            <button
              onClick={() => setViewingTestId(null)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to History
            </button>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Blood Test — {new Date(viewingTest.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  {viewingTest.lab_name && (
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{viewingTest.lab_name}</span>
                  )}
                  {viewingTest.notes && (
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{viewingTest.notes}</span>
                  )}
                  <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{viewingTest.markers.length} markers</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportPanel(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export & Share
                </button>
                <button
                  onClick={() => startEdit(viewingTest)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-lg border border-gray-200 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

            </div>

            {/* Smart Supplement Bridge - Add to Stack integration */}
            <div className="mb-6">
              <BloodTestSupplementBridge
                markers={viewingTest.markers}
                existingSupplementNames={existingSupplementNames}
                onAddToStack={handleAddToStack}
                addedSupplements={addedSupplements}
                onMarkAdded={(name) => setAddedSupplements(prev => new Set([...prev, name]))}
              />
            </div>

            <BloodTestResultsDisplay
              markers={viewingTest.markers}
              testDate={viewingTest.test_date}
              labName={viewingTest.lab_name || undefined}
              onViewTrend={(markerId) => {
                setTrendMarkerId(markerId);
                setViewingTestId(null);
                setActiveTab('trends');
              }}
            />
          </div>
        )}


        {/* Main content (when not viewing a specific test or form/uploader) */}
        {!viewingTest && !showEntryForm && !showUploader && (

          <>
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
              {[
                { id: 'history' as TabView, label: 'Test History', icon: <ListChecks className="w-4 h-4" /> },
                { id: 'trends' as TabView, label: 'Trends', icon: <BarChart3 className="w-4 h-4" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-rose-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                  </div>
                ) : tests.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <Beaker className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Blood Tests Yet</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                      Add your first blood test to start tracking your health markers and get personalized recommendations.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => { setShowUploader(true); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Lab Report
                      </button>
                      <span className="text-xs text-gray-400">or</span>
                      <button
                        onClick={() => { setShowEntryForm(true); setEditingTestId(null); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Enter Manually
                      </button>
                    </div>
                  </div>

                ) : (
                  <div className="space-y-3">
                    {tests.map(test => {
                      const summary = getTestSummary(test);
                      const hasIssues = summary.abnormal + summary.critical > 0;

                      return (
                        <div
                          key={test.id}
                          className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                            hasIssues ? 'border-orange-200 hover:border-orange-300' : 'border-gray-100 hover:border-rose-200'
                          }`}
                        >
                          <div className="flex items-center gap-4 p-4">
                            {/* Date icon */}
                            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                              hasIssues ? 'bg-orange-50' : 'bg-rose-50'
                            }`}>
                              <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                                {new Date(test.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                              </span>
                              <span className={`text-xl font-bold leading-tight ${hasIssues ? 'text-orange-600' : 'text-rose-600'}`}>
                                {new Date(test.test_date + 'T00:00:00').getDate()}
                              </span>
                              <span className="text-[10px] text-gray-400 leading-none">
                                {new Date(test.test_date + 'T00:00:00').getFullYear()}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  Blood Test — {new Date(test.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </h4>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                {test.lab_name && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {test.lab_name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  {summary.total} markers
                                </span>
                                {test.notes && (
                                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                                    <FileText className="w-3 h-3" />
                                    {test.notes}
                                  </span>
                                )}
                              </div>
                              {/* Mini severity badges */}
                              <div className="flex items-center gap-1.5 mt-2">
                                {summary.normal > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium border border-emerald-100">
                                    {summary.normal} normal
                                  </span>
                                )}
                                {summary.borderline > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium border border-amber-100">
                                    {summary.borderline} borderline
                                  </span>
                                )}
                                {summary.abnormal > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full font-medium border border-orange-100">
                                    {summary.abnormal} abnormal
                                  </span>
                                )}
                                {summary.critical > 0 && (
                                  <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-bold border border-red-100">
                                    {summary.critical} critical
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => { setViewingTestId(test.id); setActiveTab('history'); }}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                              <button
                                onClick={() => startEdit(test)}
                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {deleteConfirm === test.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteTest(test.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(test.id)}
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

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                {/* Marker selector */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-rose-600" />
                    Historical Trends
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select a marker to view how your values have changed across blood tests over time.
                  </p>

                  {allTestedMarkerIds.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Add at least one blood test to view trends.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {allTestedMarkerIds.map(mId => {
                        const marker = bloodMarkers.find(m => m.id === mId);
                        if (!marker) return null;
                        const catInfo = markerCategories[marker.category];
                        const isSelected = trendMarkerId === mId;
                        const testCount = tests.filter(t => t.markers.some(mk => mk.markerId === mId)).length;
                        return (
                          <button
                            key={mId}
                            onClick={() => setTrendMarkerId(isSelected ? null : mId)}
                            className={`text-left p-3 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-rose-50 border-rose-300 shadow-sm'
                                : 'bg-gray-50 border-gray-100 hover:border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <p className={`text-xs font-semibold truncate ${isSelected ? 'text-rose-700' : 'text-gray-800'}`}>
                              {marker.abbreviation}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">{marker.name}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{testCount} test{testCount !== 1 ? 's' : ''}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Trend Chart */}
                {trendMarker && trendData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{trendMarker.name} ({trendMarker.abbreviation})</h4>
                        <p className="text-xs text-gray-500">
                          Normal range: {trendMarker.referenceRange.low}-{trendMarker.referenceRange.high} {trendMarker.referenceRange.unit}
                        </p>
                      </div>
                      {trendData.length >= 2 && (
                        <div className="flex items-center gap-1.5">
                          {trendData[trendData.length - 1].value > trendData[trendData.length - 2].value ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-medium text-blue-600">Increasing</span>
                            </>
                          ) : trendData[trendData.length - 1].value < trendData[trendData.length - 2].value ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-orange-500" />
                              <span className="text-xs font-medium text-orange-600">Decreasing</span>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-gray-500">Stable</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* SVG Chart */}
                    <TrendChart
                      data={trendData}
                      marker={trendMarker}
                    />

                    {/* Data table */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                            <th className="text-right py-2 px-3 text-gray-500 font-medium">Value</th>
                            <th className="text-right py-2 px-3 text-gray-500 font-medium">Status</th>
                            <th className="text-right py-2 px-3 text-gray-500 font-medium">Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendData.map((d, i) => {
                            const severity = evaluateMarkerValue(trendMarker, d.value);
                            const sevInfo = getSeverityInfo(severity);
                            const prevValue = i > 0 ? trendData[i - 1].value : null;
                            const change = prevValue !== null ? d.value - prevValue : null;
                            return (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-2 px-3 text-gray-700">
                                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="py-2 px-3 text-right font-semibold text-gray-900">
                                  {d.value} {trendMarker.referenceRange.unit}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${sevInfo.bgColor} ${sevInfo.color}`}>
                                    {sevInfo.label}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {change !== null ? (
                                    <span className={`font-medium ${change > 0 ? 'text-blue-600' : change < 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                      {change > 0 ? '+' : ''}{change.toFixed(1)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {trendMarkerId && trendData.length === 0 && (
                  <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
                    <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No data available for this marker yet.</p>
                  </div>
                )}
              </div>
            )}
          </>

        )}

        {/* Export Panel Modal */}
        <BloodTestExportPanel
          tests={tests.map(t => ({
            id: t.id,
            test_date: t.test_date,
            lab_name: t.lab_name,
            notes: t.notes,
            markers: t.markers.map(m => ({
              markerId: m.markerId,
              value: m.value,
              unit: m.unit,
            })),
          }))}
          isOpen={showExportPanel}
          onClose={() => setShowExportPanel(false)}
        />
      </div>
    </div>
  );
};


// === Trend Chart Component (inline) ===
const TrendChart: React.FC<{
  data: Array<{ date: string; value: number; testId: string }>;
  marker: BloodMarker;
}> = ({ data, marker }) => {
  const width = 700;
  const height = 250;
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const range = marker.referenceRange;
  const allValues = data.map(d => d.value);
  const minVal = Math.min(...allValues, range.low * 0.8, range.criticalLow ?? range.low * 0.8);
  const maxVal = Math.max(...allValues, range.high * 1.2, range.criticalHigh ?? range.high * 1.2);
  const valRange = maxVal - minVal || 1;

  const getY = (v: number) => padding.top + chartH - ((v - minVal) / valRange) * chartH;
  const getX = (i: number) => padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);

  const normalLowY = getY(range.low);
  const normalHighY = getY(range.high);

  // Build line path
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[700px] mx-auto" style={{ minWidth: 400 }}>
        {/* Normal range band */}
        <rect
          x={padding.left}
          y={normalHighY}
          width={chartW}
          height={normalLowY - normalHighY}
          fill="#10b98120"
          rx={4}
        />

        {/* Normal range labels */}
        <text x={padding.left - 5} y={normalHighY + 4} textAnchor="end" className="text-[10px] fill-emerald-500 font-medium">{range.high}</text>
        <text x={padding.left - 5} y={normalLowY + 4} textAnchor="end" className="text-[10px] fill-emerald-500 font-medium">{range.low}</text>

        {/* Normal range lines */}
        <line x1={padding.left} y1={normalHighY} x2={padding.left + chartW} y2={normalHighY} stroke="#10b981" strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
        <line x1={padding.left} y1={normalLowY} x2={padding.left + chartW} y2={normalLowY} stroke="#10b981" strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + pct * chartH;
          const val = maxVal - pct * valRange;
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
              <text x={padding.left - 5} y={y + 4} textAnchor="end" className="text-[9px] fill-gray-400">{val.toFixed(1)}</text>
            </g>
          );
        })}

        {/* Line */}
        <path d={linePath} fill="none" stroke="#e11d48" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Area under line */}
        <path
          d={`${linePath} L ${getX(data.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`}
          fill="url(#trendGradient)"
        />
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Data points */}
        {data.map((d, i) => {
          const severity = evaluateMarkerValue(marker, d.value);
          const isNormal = severity === 'normal';
          const isCritical = severity.includes('critical');
          const cx = getX(i);
          const cy = getY(d.value);
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={5} fill={isNormal ? '#10b981' : isCritical ? '#dc2626' : '#f59e0b'} stroke="white" strokeWidth={2} />
              <text x={cx} y={cy - 10} textAnchor="middle" className="text-[10px] fill-gray-700 font-semibold">{d.value}</text>
              {/* Date label */}
              <text x={cx} y={height - 8} textAnchor="middle" className="text-[9px] fill-gray-400">
                {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            </g>
          );
        })}

        {/* "Normal" label */}
        <text x={padding.left + chartW + 5} y={(normalHighY + normalLowY) / 2 + 4} className="text-[9px] fill-emerald-600 font-medium">Normal</text>
      </svg>
    </div>
  );
};

export default BloodTestTracker;
