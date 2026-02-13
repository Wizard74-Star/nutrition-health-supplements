import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  bloodMarkers, markerCategories, getMarkersByCategory, getMarkerCategories,
  BloodMarker, MarkerCategory
} from '@/data/bloodMarkers';
import {
  Search, Plus, X, ChevronDown, ChevronUp, Check, Beaker,
  Calendar, Building2, FileText, Trash2, AlertCircle
} from 'lucide-react';

export interface MarkerEntry {
  markerId: string;
  value: string;
}

interface BloodTestEntryFormProps {
  onSubmit: (data: {
    testDate: string;
    labName: string;
    notes: string;
    markers: MarkerEntry[];
  }) => void;
  onCancel: () => void;
  saving: boolean;
  initialData?: {
    testDate: string;
    labName: string;
    notes: string;
    markers: MarkerEntry[];
  };
  isEditing?: boolean;
}

const BloodTestEntryForm: React.FC<BloodTestEntryFormProps> = ({
  onSubmit, onCancel, saving, initialData, isEditing
}) => {
  const [testDate, setTestDate] = useState(initialData?.testDate || new Date().toISOString().split('T')[0]);
  const [labName, setLabName] = useState(initialData?.labName || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [markers, setMarkers] = useState<MarkerEntry[]>(initialData?.markers || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<MarkerCategory | null>(null);
  const [showMarkerPicker, setShowMarkerPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMarkerPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addedMarkerIds = useMemo(() => new Set(markers.map(m => m.markerId)), [markers]);

  const filteredMarkers = useMemo(() => {
    if (!searchQuery.trim()) return bloodMarkers;
    const q = searchQuery.toLowerCase();
    return bloodMarkers.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.abbreviation.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const addMarker = (marker: BloodMarker) => {
    if (addedMarkerIds.has(marker.id)) return;
    setMarkers(prev => [...prev, { markerId: marker.id, value: '' }]);
    setShowMarkerPicker(false);
    setSearchQuery('');
  };

  const removeMarker = (markerId: string) => {
    setMarkers(prev => prev.filter(m => m.markerId !== markerId));
  };

  const updateMarkerValue = (markerId: string, value: string) => {
    setMarkers(prev => prev.map(m => m.markerId === markerId ? { ...m, value } : m));
  };

  const addCategoryMarkers = (category: MarkerCategory) => {
    const categoryMarkers = getMarkersByCategory(category);
    const newMarkers = categoryMarkers.filter(m => !addedMarkerIds.has(m.id));
    setMarkers(prev => [...prev, ...newMarkers.map(m => ({ markerId: m.id, value: '' }))]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMarkers = markers.filter(m => m.value.trim() !== '');
    if (validMarkers.length === 0) return;
    onSubmit({ testDate, labName, notes, markers: validMarkers });
  };

  const validCount = markers.filter(m => m.value.trim() !== '').length;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-rose-600" />
            {isEditing ? 'Edit Blood Test' : 'Enter Blood Test Results'}
          </h3>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-white/60 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Test Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Test Date *
            </label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Building2 className="w-3.5 h-3.5 inline mr-1" />
              Lab / Provider
            </label>
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g., Quest Diagnostics"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Annual physical"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
        </div>

        {/* Quick Add Category Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Add Panel</label>
          <div className="flex flex-wrap gap-2">
            {getMarkerCategories().map(cat => {
              const info = markerCategories[cat];
              const catMarkers = getMarkersByCategory(cat);
              const addedCount = catMarkers.filter(m => addedMarkerIds.has(m.id)).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => addCategoryMarkers(cat)}
                  disabled={addedCount === catMarkers.length}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    addedCount === catMarkers.length
                      ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                      : `${info.bgColor} ${info.color} ${info.borderColor} hover:shadow-sm`
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  {info.label}
                  {addedCount > 0 && (
                    <span className="text-[10px] opacity-70">({addedCount}/{catMarkers.length})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual Marker Search */}
        <div ref={pickerRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Add Individual Marker</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowMarkerPicker(true); }}
              onFocus={() => setShowMarkerPicker(true)}
              placeholder="Search markers (e.g., Vitamin D, Hemoglobin, TSH...)"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          {showMarkerPicker && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
              {searchQuery.trim() ? (
                filteredMarkers.length > 0 ? (
                  filteredMarkers.slice(0, 15).map(marker => {
                    const added = addedMarkerIds.has(marker.id);
                    const catInfo = markerCategories[marker.category];
                    return (
                      <button
                        key={marker.id}
                        type="button"
                        onClick={() => !added && addMarker(marker)}
                        disabled={added}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                          added ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-rose-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {marker.name}
                              <span className="text-gray-400 ml-1">({marker.abbreviation})</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {catInfo.label} · Range: {marker.referenceRange.low}-{marker.referenceRange.high} {marker.referenceRange.unit}
                            </p>
                          </div>
                          {added ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Plus className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">No markers found</div>
                )
              ) : (
                // Show categories
                getMarkerCategories().map(cat => {
                  const info = markerCategories[cat];
                  const catMarkers = getMarkersByCategory(cat);
                  const isExpanded = expandedCategory === cat;
                  return (
                    <div key={cat}>
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${info.bgColor.replace('bg-', 'bg-').replace('-50', '-400')}`} style={{backgroundColor: info.color.replace('text-', '').includes('red') ? '#dc2626' : info.color.includes('blue') ? '#2563eb' : info.color.includes('amber') ? '#d97706' : info.color.includes('teal') ? '#0d9488' : info.color.includes('purple') ? '#9333ea' : info.color.includes('indigo') ? '#4f46e5' : info.color.includes('orange') ? '#ea580c' : '#e11d48'}} />
                          <span className="text-sm font-medium text-gray-800">{info.label}</span>
                          <span className="text-xs text-gray-400">({catMarkers.length} markers)</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                      {isExpanded && catMarkers.map(marker => {
                        const added = addedMarkerIds.has(marker.id);
                        return (
                          <button
                            key={marker.id}
                            type="button"
                            onClick={() => !added && addMarker(marker)}
                            disabled={added}
                            className={`w-full text-left pl-8 pr-4 py-2.5 border-b border-gray-50 transition-colors ${
                              added ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-rose-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{marker.name} <span className="text-gray-400">({marker.abbreviation})</span></span>
                              {added ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Plus className="w-3.5 h-3.5 text-rose-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Marker Value Entries */}
        {markers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Enter Values ({markers.length} marker{markers.length !== 1 ? 's' : ''})
              </label>
              {markers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMarkers([])}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Group by category */}
            {getMarkerCategories().map(cat => {
              const catEntries = markers.filter(m => {
                const marker = bloodMarkers.find(bm => bm.id === m.markerId);
                return marker?.category === cat;
              });
              if (catEntries.length === 0) return null;
              const info = markerCategories[cat];

              return (
                <div key={cat} className="mb-4">
                  <div className={`text-xs font-semibold ${info.color} mb-2 flex items-center gap-1.5`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
                    {info.label}
                  </div>
                  <div className="space-y-2">
                    {catEntries.map(entry => {
                      const marker = bloodMarkers.find(m => m.id === entry.markerId);
                      if (!marker) return null;
                      return (
                        <div key={entry.markerId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {marker.name}
                              <span className="text-gray-400 ml-1 text-xs">({marker.abbreviation})</span>
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Normal: {marker.referenceRange.low}-{marker.referenceRange.high} {marker.referenceRange.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="any"
                              value={entry.value}
                              onChange={(e) => updateMarkerValue(entry.markerId, e.target.value)}
                              placeholder="Value"
                              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                            <span className="text-xs text-gray-500 w-16 truncate">{marker.referenceRange.unit}</span>
                            <button
                              type="button"
                              onClick={() => removeMarker(entry.markerId)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        {/* Empty state */}
        {markers.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Beaker className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-1">No markers added yet</p>
            <p className="text-xs text-gray-400">Use the quick add buttons above or search for specific markers</p>
          </div>
        )}

        {/* Validation */}
        {markers.length > 0 && validCount === 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">Enter values for at least one marker to save your blood test.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || validCount === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isEditing ? 'Update Blood Test' : `Save Blood Test (${validCount} marker${validCount !== 1 ? 's' : ''})`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default BloodTestEntryForm;
