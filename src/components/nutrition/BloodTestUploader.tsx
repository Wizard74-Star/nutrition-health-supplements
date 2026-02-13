import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  bloodMarkers, markerCategories, evaluateMarkerValue, getSeverityInfo,
  BloodMarker, MarkerCategory
} from '@/data/bloodMarkers';
import {
  FileText, Image as ImageIcon, X, Check, AlertTriangle,
  Loader2, Sparkles, Eye, Pencil, Trash2, Plus, ChevronDown,
  ChevronUp, RefreshCw, FileUp, Scan, Building2, Calendar,
  CheckCircle2, XCircle, Info, Search, ArrowRight, Zap,
  Files, Layers, Merge, BookOpen
} from 'lucide-react';

import { MarkerEntry } from './BloodTestEntryForm';

// ── Types ──────────────────────────────────────────────────────

interface ParsedMarker {
  marker_id: string;
  value: number;
  unit: string;
  original_text: string;
  isEditing?: boolean;
  editValue?: string;
  isNew?: boolean;
  pageSource: number;      // 1-indexed page/file number
  pageLabel: string;       // "Page 1", "Image 2 (photo.jpg)", etc.
  confidence: 'high' | 'medium' | 'low';
  /** When a marker was merged from multiple pages, track all sources */
  mergedFrom?: Array<{ page: number; label: string; value: number; confidence: 'high' | 'medium' | 'low' }>;
}

interface ParseResult {
  lab_name: string | null;
  test_date: string | null;
  markers: Array<{
    marker_id: string;
    value: number;
    unit: string;
    original_text: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
  marker_count: number;
}

interface PageInfo {
  index: number;       // 0-based
  label: string;       // "Page 1", "Image 2 (photo.jpg)"
  fileName: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  markerCount: number;
  error?: string;
}

interface BloodTestUploaderProps {
  onConfirm: (data: {
    testDate: string;
    labName: string;
    notes: string;
    markers: MarkerEntry[];
  }) => void;
  onCancel: () => void;
}

type UploadStep = 'upload' | 'parsing' | 'review' | 'error';

// ── Confidence ranking for merge priority ──────────────────────
const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

// ── PDF helpers ────────────────────────────────────────────────

/**
 * Extract text from a PDF, split by page.
 * Returns an array of strings, one per detected page.
 */
function extractPDFPages(arrayBuffer: ArrayBuffer): string[] {
  const bytes = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('latin1');
  const pdfStr = decoder.decode(bytes);

  // Split by page boundaries — look for /Type /Page or /Type/Page patterns
  // Each page object in a PDF usually starts with a new obj definition
  // We'll split by stream/endstream or by page markers
  const pageTexts: string[] = [];

  // Find all BT...ET text blocks and their byte positions
  const textBlocks: Array<{ pos: number; text: string }> = [];
  const textObjectRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = textObjectRegex.exec(pdfStr)) !== null) {
    let blockText = '';
    const block = match[1];

    // Tj operator
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      blockText += tjMatch[1] + ' ';
    }
    // TJ array operator
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const items = tjArrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = strRegex.exec(items)) !== null) {
        blockText += strMatch[1];
      }
      blockText += ' ';
    }

    if (blockText.trim()) {
      textBlocks.push({ pos: match.index, text: blockText });
    }
  }

  // Also extract lab-value patterns from the raw PDF
  const labValueRegex = /([A-Za-z][A-Za-z\s\-\.\/()]{2,40})\s+(\d+\.?\d*)\s*(mg\/dL|g\/dL|ng\/mL|pg\/mL|mcg\/dL|mcg\/L|mEq\/L|mIU\/L|ng\/dL|%|K\/uL|M\/uL|fL|U\/L|mm\/hr|umol\/L)/gi;
  let labMatch;
  while ((labMatch = labValueRegex.exec(pdfStr)) !== null) {
    textBlocks.push({
      pos: labMatch.index,
      text: `${labMatch[1].trim()} ${labMatch[2]} ${labMatch[3]}\n`
    });
  }

  // Sort by position
  textBlocks.sort((a, b) => a.pos - b.pos);

  // Try to detect page breaks using /Type /Page or /Page markers
  const pageBreakPositions: number[] = [0];
  const pageRegex = /\/Type\s*\/Page[^s]/g;
  let pageMatch;
  while ((pageMatch = pageRegex.exec(pdfStr)) !== null) {
    pageBreakPositions.push(pageMatch.index);
  }

  // If we found page markers, assign text blocks to pages
  if (pageBreakPositions.length > 1) {
    // Create page buckets
    const pageBuckets: string[][] = Array.from({ length: pageBreakPositions.length }, () => []);

    for (const block of textBlocks) {
      // Find which page this block belongs to
      let pageIdx = 0;
      for (let i = pageBreakPositions.length - 1; i >= 0; i--) {
        if (block.pos >= pageBreakPositions[i]) {
          pageIdx = i;
          break;
        }
      }
      pageBuckets[pageIdx].push(block.text);
    }

    for (const bucket of pageBuckets) {
      const pageText = cleanExtractedText(bucket.join(' '));
      if (pageText.length > 10) {
        pageTexts.push(pageText);
      }
    }
  }

  // Fallback: if page splitting didn't work well, return all text as one page
  if (pageTexts.length === 0) {
    const allText = cleanExtractedText(textBlocks.map(b => b.text).join(' '));
    if (allText.length > 10) {
      pageTexts.push(allText);
    }
  }

  return pageTexts;
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Image compression ──────────────────────────────────────────

function compressImage(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.8
): Promise<{ base64: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, type: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ── Merge markers across pages ─────────────────────────────────

function mergeMarkers(allMarkers: ParsedMarker[]): ParsedMarker[] {
  const byId = new Map<string, ParsedMarker[]>();

  for (const m of allMarkers) {
    const existing = byId.get(m.marker_id) || [];
    existing.push(m);
    byId.set(m.marker_id, existing);
  }

  const merged: ParsedMarker[] = [];

  for (const [, candidates] of byId) {
    if (candidates.length === 1) {
      merged.push({ ...candidates[0] });
      continue;
    }

    // Sort by confidence (desc), then by value (prefer non-zero)
    candidates.sort((a, b) => {
      const confDiff = (CONFIDENCE_RANK[b.confidence] || 0) - (CONFIDENCE_RANK[a.confidence] || 0);
      if (confDiff !== 0) return confDiff;
      // Prefer non-zero values
      if (a.value === 0 && b.value !== 0) return 1;
      if (b.value === 0 && a.value !== 0) return -1;
      return 0;
    });

    const best = { ...candidates[0] };
    best.mergedFrom = candidates.map(c => ({
      page: c.pageSource,
      label: c.pageLabel,
      value: c.value,
      confidence: c.confidence,
    }));
    merged.push(best);
  }

  return merged;
}

// ════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════

const BloodTestUploader: React.FC<BloodTestUploaderProps> = ({ onConfirm, onCancel }) => {
  // ── State ──
  const [step, setStep] = useState<UploadStep>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [parsedMarkers, setParsedMarkers] = useState<ParsedMarker[]>([]);
  const [labName, setLabName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [addMarkerSearch, setAddMarkerSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium');

  // Multi-page state
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [mergeStats, setMergeStats] = useState<{ totalRaw: number; merged: number; duplicatesRemoved: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & Drop ──
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  // ── Process multiple files ──
  const processFiles = useCallback(async (selectedFiles: File[]) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const validFiles = selectedFiles.filter(f => validTypes.includes(f.type) && f.size <= 20 * 1024 * 1024);

    if (validFiles.length === 0) {
      setErrorMessage('Please upload PDF, JPG, or PNG files (max 20MB each).');
      setStep('error');
      return;
    }

    setFiles(validFiles);

    // Generate previews for images
    const previews: string[] = [];
    for (const f of validFiles) {
      if (f.type.startsWith('image/')) {
        const url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(f);
        });
        previews.push(url);
      } else {
        previews.push('');
      }
    }
    setFilePreviews(previews);

    // ── Build page list ──
    // For PDFs: try to split into pages. For images: each file = 1 page.
    const pageList: PageInfo[] = [];
    const pagePayloads: Array<{ type: 'text'; text: string } | { type: 'image'; file: File }> = [];
    let pageCounter = 0;

    for (let fi = 0; fi < validFiles.length; fi++) {
      const file = validFiles[fi];

      if (file.type === 'application/pdf') {
        // Extract pages from PDF
        const arrayBuffer = await file.arrayBuffer();
        const pdfPages = extractPDFPages(arrayBuffer);

        if (pdfPages.length === 0) {
          setErrorMessage(
            `The PDF "${file.name}" appears to be a scanned document with limited extractable text. ` +
            'For best results, take photos or screenshots of each page and upload them as images.'
          );
          setStep('error');
          return;
        }

        for (let pi = 0; pi < pdfPages.length; pi++) {
          pageCounter++;
          const label = pdfPages.length > 1
            ? `PDF Page ${pi + 1} (${file.name})`
            : `PDF (${file.name})`;
          pageList.push({
            index: pageCounter,
            label,
            fileName: file.name,
            status: 'pending',
            markerCount: 0,
          });
          pagePayloads.push({ type: 'text', text: pdfPages[pi] });
        }
      } else {
        // Image file = 1 page
        pageCounter++;
        const label = validFiles.length > 1
          ? `Image ${fi + 1} (${file.name})`
          : `Image (${file.name})`;
        pageList.push({
          index: pageCounter,
          label,
          fileName: file.name,
          status: 'pending',
          markerCount: 0,
        });
        pagePayloads.push({ type: 'image', file });
      }
    }

    setPages(pageList);
    setTotalPages(pageList.length);
    setStep('parsing');
    setOverallProgress(0);
    setCurrentPageIdx(0);

    // ── Sequential processing ──
    const allRawMarkers: ParsedMarker[] = [];
    let detectedLabName: string | null = null;
    let detectedTestDate: string | null = null;
    let detectedNotes: string[] = [];
    let worstConfidence: 'high' | 'medium' | 'low' = 'high';

    for (let pi = 0; pi < pageList.length; pi++) {
      setCurrentPageIdx(pi);
      const pct = Math.round(((pi) / pageList.length) * 100);
      setOverallProgress(pct);

      // Update page status
      setPages(prev => prev.map((p, i) => i === pi ? { ...p, status: 'processing' } : p));

      try {
        let requestBody: any = {};
        const payload = pagePayloads[pi];

        if (payload.type === 'text') {
          requestBody = { textContent: payload.text };
        } else {
          const { base64, type } = await compressImage(payload.file);
          requestBody = { imageBase64: base64, imageType: type };
        }

        const { data, error } = await supabase.functions.invoke('parse-blood-test', {
          body: requestBody,
        });

        if (error) throw new Error(error.message || 'Parse failed');
        if (data?.error) throw new Error(data.error);

        const result = data as ParseResult;

        // Collect markers with page source
        const pageMarkers: ParsedMarker[] = (result.markers || []).map(m => ({
          ...m,
          isEditing: false,
          pageSource: pi + 1,
          pageLabel: pageList[pi].label,
          confidence: result.confidence || 'medium',
        }));

        allRawMarkers.push(...pageMarkers);

        // Collect metadata (first non-null wins)
        if (!detectedLabName && result.lab_name) detectedLabName = result.lab_name;
        if (!detectedTestDate && result.test_date) detectedTestDate = result.test_date;
        if (result.notes) detectedNotes.push(result.notes);

        // Track worst confidence
        const conf = result.confidence || 'medium';
        if ((CONFIDENCE_RANK[conf] || 0) < (CONFIDENCE_RANK[worstConfidence] || 0)) {
          worstConfidence = conf;
        }

        // Update page status
        setPages(prev => prev.map((p, i) =>
          i === pi ? { ...p, status: 'done', markerCount: pageMarkers.length } : p
        ));
      } catch (err: any) {
        console.error(`Error parsing page ${pi + 1}:`, err);
        setPages(prev => prev.map((p, i) =>
          i === pi ? { ...p, status: 'error', error: err.message } : p
        ));
        // Continue to next page — don't abort the whole batch
      }
    }

    setOverallProgress(100);

    // ── Check if we got anything ──
    if (allRawMarkers.length === 0) {
      setErrorMessage(
        'No blood test markers could be detected across any of the uploaded pages. ' +
        'Please ensure the documents are clear lab reports with visible test results.'
      );
      setStep('error');
      return;
    }

    // ── Merge markers across pages ──
    const merged = mergeMarkers(allRawMarkers);
    const duplicatesRemoved = allRawMarkers.length - merged.length;

    setMergeStats({
      totalRaw: allRawMarkers.length,
      merged: merged.length,
      duplicatesRemoved,
    });

    setParsedMarkers(merged);
    setConfidence(worstConfidence);

    if (detectedLabName) setLabName(detectedLabName);
    if (detectedTestDate) setTestDate(detectedTestDate);

    const notesParts = [`AI-parsed from ${pageList.length} page${pageList.length > 1 ? 's' : ''}`];
    if (detectedNotes.length > 0) notesParts.push(detectedNotes[0]);
    setNotes(notesParts.join('. '));

    setTimeout(() => setStep('review'), 400);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) processFiles(droppedFiles);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) processFiles(selected);
  }, [processFiles]);

  // ── Marker editing ──
  const toggleEditMarker = (index: number) => {
    setParsedMarkers(prev => prev.map((m, i) => {
      if (i === index) {
        return m.isEditing
          ? { ...m, isEditing: false, value: parseFloat(m.editValue || String(m.value)) || m.value }
          : { ...m, isEditing: true, editValue: String(m.value) };
      }
      return m;
    }));
  };

  const updateEditValue = (index: number, val: string) => {
    setParsedMarkers(prev => prev.map((m, i) => i === index ? { ...m, editValue: val } : m));
  };

  const removeMarker = (index: number) => {
    setParsedMarkers(prev => prev.filter((_, i) => i !== index));
  };

  const addManualMarker = (markerId: string) => {
    if (parsedMarkers.some(m => m.marker_id === markerId)) return;
    const marker = bloodMarkers.find(m => m.id === markerId);
    if (!marker) return;
    setParsedMarkers(prev => [...prev, {
      marker_id: markerId,
      value: 0,
      unit: marker.referenceRange.unit,
      original_text: 'Manually added',
      isEditing: true,
      editValue: '',
      isNew: true,
      pageSource: 0,
      pageLabel: 'Manual',
      confidence: 'high',
    }]);
    setShowAddMarker(false);
    setAddMarkerSearch('');
  };

  // ── Confirm ──
  const handleConfirm = () => {
    const validMarkers = parsedMarkers
      .filter(m => {
        const v = m.isEditing ? parseFloat(m.editValue || '0') : m.value;
        return !isNaN(v) && v > 0;
      })
      .map(m => ({
        markerId: m.marker_id,
        value: String(m.isEditing ? (parseFloat(m.editValue || '0') || m.value) : m.value),
      }));

    if (validMarkers.length === 0) {
      setErrorMessage('Please ensure at least one marker has a valid value.');
      return;
    }

    onConfirm({ testDate, labName, notes, markers: validMarkers });
  };

  // ── Retry ──
  const handleRetry = () => {
    setStep('upload');
    setFiles([]);
    setFilePreviews([]);
    setParsedMarkers([]);
    setPages([]);
    setErrorMessage('');
    setOverallProgress(0);
    setMergeStats(null);
    setCurrentPageIdx(0);
    setTotalPages(0);
  };

  // ── Helpers ──
  const getMarkerInfo = (markerId: string): BloodMarker | undefined =>
    bloodMarkers.find(m => m.id === markerId);

  const getConfidenceBadge = () => {
    switch (confidence) {
      case 'high':
        return { label: 'High Confidence', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
      case 'medium':
        return { label: 'Medium Confidence', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Info className="w-3.5 h-3.5" /> };
      case 'low':
        return { label: 'Low Confidence', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
    }
  };

  const groupedMarkers = parsedMarkers.reduce<Record<string, ParsedMarker[]>>((acc, m) => {
    const marker = getMarkerInfo(m.marker_id);
    const cat = marker?.category || 'unknown';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  const addedMarkerIds = new Set(parsedMarkers.map(m => m.marker_id));

  const filteredAddMarkers = addMarkerSearch.trim()
    ? bloodMarkers.filter(m =>
        !addedMarkerIds.has(m.id) && (
          m.name.toLowerCase().includes(addMarkerSearch.toLowerCase()) ||
          m.abbreviation.toLowerCase().includes(addMarkerSearch.toLowerCase())
        )
      )
    : bloodMarkers.filter(m => !addedMarkerIds.has(m.id));

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const getPageSourceBadgeColor = (pageNum: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-violet-100 text-violet-700 border-violet-200',
      'bg-teal-100 text-teal-700 border-teal-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    ];
    if (pageNum === 0) return 'bg-gray-100 text-gray-600 border-gray-200'; // Manual
    return colors[(pageNum - 1) % colors.length];
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: Upload Step
  // ════════════════════════════════════════════════════════════

  if (step === 'upload') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <FileUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Upload Lab Report</h3>
                <p className="text-sm text-gray-500">AI-powered extraction — supports multi-page reports</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-white/60 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragActive
                ? 'border-violet-400 bg-violet-50 scale-[1.01]'
                : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all ${
              dragActive ? 'bg-violet-100' : 'bg-gray-100'
            }`}>
              <Files className={`w-8 h-8 transition-colors ${dragActive ? 'text-violet-600' : 'text-gray-400'}`} />
            </div>

            <h4 className="text-lg font-semibold text-gray-800 mb-1">
              {dragActive ? 'Drop your files here' : 'Drag & drop your lab report pages'}
            </h4>
            <p className="text-sm text-gray-500 mb-2">
              or click to browse files
            </p>
            <p className="text-xs text-violet-600 font-medium mb-4">
              Upload multiple images for multi-page reports, or a single multi-page PDF
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
                <FileText className="w-3.5 h-3.5" /> PDF (multi-page)
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
                <ImageIcon className="w-3.5 h-3.5" /> JPG
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
                <ImageIcon className="w-3.5 h-3.5" /> PNG
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-full text-violet-500">
                <Layers className="w-3.5 h-3.5" /> Multiple files
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">Maximum 20MB per file</p>
          </div>

          {/* Supported Labs */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              Supported Lab Report Formats
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'Quest Diagnostics', 'LabCorp', 'BioReference', 'Sonic Healthcare',
                'Clinical Pathology Labs', 'ARUP Laboratories', 'Mayo Clinic Labs', 'Any standard format'
              ].map(lab => (
                <div key={lab} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  {lab}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <strong>Multi-page tips:</strong>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  <li>For multi-page reports, upload all pages as separate images or a single PDF</li>
                  <li>Each page is analyzed independently, then results are merged automatically</li>
                  <li>Duplicate markers across pages are deduplicated (highest confidence kept)</li>
                  <li>Photos work better than scanned PDFs for image-based reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Parsing Step (multi-page progress)
  // ════════════════════════════════════════════════════════════

  if (step === 'parsing') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Scan className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Analyzing Lab Report</h3>
              <p className="text-sm text-gray-500">
                Processing {totalPages} page{totalPages !== 1 ? 's' : ''} sequentially...
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-lg mx-auto">
            {/* Overall progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-violet-600">{overallProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Per-page status */}
            <div className="space-y-2">
              {pages.map((page, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    page.status === 'processing'
                      ? 'bg-violet-50 border-violet-200 shadow-sm'
                      : page.status === 'done'
                      ? 'bg-emerald-50/50 border-emerald-100'
                      : page.status === 'error'
                      ? 'bg-red-50/50 border-red-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  {/* Status icon */}
                  {page.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : page.status === 'processing' ? (
                    <Loader2 className="w-5 h-5 text-violet-500 animate-spin flex-shrink-0" />
                  ) : page.status === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                  )}

                  {/* Page info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getPageSourceBadgeColor(i + 1)} border`}>
                        P{i + 1}
                      </span>
                      <span className={`text-sm font-medium truncate ${
                        page.status === 'processing' ? 'text-violet-700' :
                        page.status === 'done' ? 'text-gray-700' :
                        page.status === 'error' ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {page.label}
                      </span>
                    </div>
                    {page.status === 'error' && page.error && (
                      <p className="text-[10px] text-red-500 mt-0.5 truncate">{page.error}</p>
                    )}
                  </div>

                  {/* Marker count */}
                  {page.status === 'done' && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {page.markerCount} marker{page.markerCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {page.status === 'processing' && (
                    <span className="text-[10px] text-violet-500 font-medium">Analyzing...</span>
                  )}
                </div>
              ))}
            </div>

            {/* File thumbnails */}
            {filePreviews.some(p => p) && (
              <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
                {filePreviews.map((preview, i) => preview ? (
                  <img
                    key={i}
                    src={preview}
                    alt={`Page ${i + 1}`}
                    className={`w-14 h-14 rounded-lg object-cover border-2 flex-shrink-0 transition-all ${
                      i === currentPageIdx ? 'border-violet-400 shadow-md' : 'border-gray-200 opacity-60'
                    }`}
                  />
                ) : (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-lg bg-red-50 flex items-center justify-center border-2 flex-shrink-0 ${
                      i === currentPageIdx ? 'border-violet-400' : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <FileText className="w-6 h-6 text-red-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Error Step
  // ════════════════════════════════════════════════════════════

  if (step === 'error') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Parsing Issue</h3>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-white/60 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 text-center">
          <div className="max-w-md mx-auto">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-sm text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Enter Manually
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Review Step (with page source indicators)
  // ════════════════════════════════════════════════════════════

  const confBadge = getConfidenceBadge();
  const validMarkerCount = parsedMarkers.filter(m => {
    const val = m.isEditing ? parseFloat(m.editValue || '0') : m.value;
    return !isNaN(val) && val > 0;
  }).length;

  const pagesWithResults = pages.filter(p => p.status === 'done' && p.markerCount > 0);
  const pagesWithErrors = pages.filter(p => p.status === 'error');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Review Detected Values</h3>
              <p className="text-sm text-gray-500">
                {parsedMarkers.length} marker{parsedMarkers.length !== 1 ? 's' : ''} detected
                {totalPages > 1 ? ` across ${totalPages} pages` : ''} — verify before saving
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/60 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${confBadge.bg} ${confBadge.color} ${confBadge.border}`}>
            {confBadge.icon}
            {confBadge.label}
          </span>

          {totalPages > 1 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              <Layers className="w-3 h-3" />
              {totalPages} pages processed
            </span>
          )}

          {mergeStats && mergeStats.duplicatesRemoved > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Merge className="w-3 h-3" />
              {mergeStats.duplicatesRemoved} duplicate{mergeStats.duplicatesRemoved !== 1 ? 's' : ''} merged
            </span>
          )}

          {files.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
              <Files className="w-3 h-3" />
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
          )}

          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-violet-600 hover:bg-violet-50 border border-violet-200 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Re-upload
          </button>
        </div>

        {/* Multi-page summary */}
        {totalPages > 1 && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-violet-800 mb-2">Multi-Page Report Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pages.map((page, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPageSourceBadgeColor(i + 1)}`}>
                        P{i + 1}
                      </span>
                      {page.status === 'done' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span className="text-xs text-gray-700 truncate">{page.label}</span>
                          <span className="text-[10px] text-emerald-600 font-medium ml-auto">
                            {page.markerCount} marker{page.markerCount !== 1 ? 's' : ''}
                          </span>
                        </>
                      ) : page.status === 'error' ? (
                        <>
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-600 truncate">{page.label}</span>
                          <span className="text-[10px] text-red-500 ml-auto">Failed</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 truncate">{page.label}</span>
                      )}
                    </div>
                  ))}
                </div>
                {mergeStats && mergeStats.duplicatesRemoved > 0 && (
                  <p className="text-[11px] text-violet-600 mt-2 pt-2 border-t border-violet-100">
                    <Merge className="w-3 h-3 inline mr-1" />
                    {mergeStats.totalRaw} total detections merged into {mergeStats.merged} unique markers
                    ({mergeStats.duplicatesRemoved} duplicate{mergeStats.duplicatesRemoved !== 1 ? 's' : ''} resolved — highest confidence values kept)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Page errors warning */}
        {pagesWithErrors.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <strong>{pagesWithErrors.length} page{pagesWithErrors.length !== 1 ? 's' : ''} had parsing errors</strong> and may be missing markers.
              {pagesWithErrors.map((p, i) => (
                <span key={i} className="block mt-0.5 text-amber-600">
                  {p.label}: {p.error || 'Unknown error'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Notice */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
          <Zap className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-violet-800">
            <strong className="font-semibold">AI-Extracted Values</strong> — These values were automatically detected from your uploaded report
            {totalPages > 1 ? ` (${totalPages} pages)` : ''}.
            Please carefully review each value and correct any that appear incorrect before saving.
            {confidence === 'low' && (
              <span className="block mt-1 text-red-600 font-medium">
                Low confidence detection — extra verification recommended.
              </span>
            )}
          </div>
        </div>

        {/* Test Info Fields */}
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
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
              placeholder="e.g., Annual checkup"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </div>

        {/* Detected Markers by Category */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">
              Detected Markers ({parsedMarkers.length})
            </h4>
            <button
              onClick={() => setShowAddMarker(!showAddMarker)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-lg border border-violet-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Missing Marker
            </button>
          </div>

          {/* Page source legend (for multi-page) */}
          {totalPages > 1 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Page Source Legend</p>
              <div className="flex flex-wrap gap-1.5">
                {pages.filter(p => p.status === 'done').map((page, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${getPageSourceBadgeColor(page.index)}`}
                  >
                    P{page.index}
                    <span className="font-normal opacity-75 max-w-[120px] truncate">{page.label}</span>
                  </span>
                ))}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${getPageSourceBadgeColor(0)}`}>
                  <Plus className="w-2.5 h-2.5" /> Manual
                </span>
              </div>
            </div>
          )}

          {/* Add Marker Dropdown */}
          {showAddMarker && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={addMarkerSearch}
                  onChange={(e) => setAddMarkerSearch(e.target.value)}
                  placeholder="Search for a marker..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredAddMarkers.slice(0, 20).map(marker => {
                  const catInfo = markerCategories[marker.category];
                  return (
                    <button
                      key={marker.id}
                      onClick={() => addManualMarker(marker.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-violet-50 transition-colors text-left"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-800">{marker.name}</span>
                        <span className="text-xs text-gray-400 ml-1">({marker.abbreviation})</span>
                        <span className={`text-[10px] ml-2 ${catInfo.color}`}>{catInfo.label}</span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-violet-500" />
                    </button>
                  );
                })}
                {filteredAddMarkers.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-3">No matching markers found</p>
                )}
              </div>
            </div>
          )}

          {/* Marker Groups */}
          <div className="space-y-4">
            {Object.entries(groupedMarkers).map(([cat, markers]) => {
              const catInfo = markerCategories[cat as MarkerCategory];
              if (!catInfo) return null;
              const isExpanded = expandedCategories.has(cat) || Object.keys(groupedMarkers).length <= 3;

              return (
                <div key={cat} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className={`w-full flex items-center justify-between px-4 py-3 ${catInfo.bgColor} transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full bg-current ${catInfo.color}`} />
                      <span className={`text-sm font-semibold ${catInfo.color}`}>{catInfo.label}</span>
                      <span className="text-xs text-gray-400">({markers.length} marker{markers.length !== 1 ? 's' : ''})</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-gray-50">
                      {markers.map((pm) => {
                        const markerInfo = getMarkerInfo(pm.marker_id);
                        if (!markerInfo) return null;
                        const currentValue = pm.isEditing ? parseFloat(pm.editValue || '0') || 0 : pm.value;
                        const severity = currentValue > 0 ? evaluateMarkerValue(markerInfo, currentValue) : 'normal';
                        const sevInfo = getSeverityInfo(severity);
                        const globalIdx = parsedMarkers.indexOf(pm);
                        const hasMerge = pm.mergedFrom && pm.mergedFrom.length > 1;

                        return (
                          <div key={pm.marker_id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              {/* Page source badge */}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${getPageSourceBadgeColor(pm.pageSource)}`}
                                title={pm.pageLabel}
                              >
                                {pm.pageSource === 0 ? 'M' : `P${pm.pageSource}`}
                              </span>

                              {/* Marker Name */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {markerInfo.name}
                                    <span className="text-gray-400 ml-1 text-xs">({markerInfo.abbreviation})</span>
                                  </p>
                                  {pm.isNew && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded font-medium">NEW</span>
                                  )}
                                  {hasMerge && (
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium cursor-help"
                                      title={`Detected on ${pm.mergedFrom!.length} pages: ${pm.mergedFrom!.map(mf => `${mf.label} (${mf.value})`).join(', ')}`}
                                    >
                                      <Merge className="w-2.5 h-2.5 inline mr-0.5" />
                                      {pm.mergedFrom!.length} pages
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-gray-400">
                                    Normal: {markerInfo.referenceRange.low}-{markerInfo.referenceRange.high} {markerInfo.referenceRange.unit}
                                  </span>
                                  {pm.original_text && pm.original_text !== 'Manually added' && (
                                    <span className="text-[10px] text-gray-300 truncate max-w-[150px]" title={pm.original_text}>
                                      Source: &quot;{pm.original_text}&quot;
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Value */}
                              <div className="flex items-center gap-2">
                                {pm.isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      value={pm.editValue || ''}
                                      onChange={(e) => updateEditValue(globalIdx, e.target.value)}
                                      className="w-24 px-3 py-1.5 border border-violet-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-violet-500 bg-violet-50"
                                      autoFocus={pm.isNew}
                                    />
                                    <span className="text-xs text-gray-500 w-14 truncate">{pm.unit}</span>
                                    <button
                                      onClick={() => toggleEditMarker(globalIdx)}
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Save"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                                      {pm.value}
                                    </span>
                                    <span className="text-xs text-gray-500 w-14 truncate">{pm.unit}</span>
                                    {currentValue > 0 && (
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${sevInfo.bgColor} ${sevInfo.color}`}>
                                        {sevInfo.label}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Actions */}
                                {!pm.isEditing && (
                                  <button
                                    onClick={() => toggleEditMarker(globalIdx)}
                                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                    title="Edit value"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => removeMarker(globalIdx)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Merge details (expandable) */}
                            {hasMerge && (
                              <div className="mt-2 ml-8 pl-3 border-l-2 border-blue-100">
                                <p className="text-[10px] text-blue-600 font-medium mb-1">
                                  Detected on multiple pages — highest confidence value selected:
                                </p>
                                <div className="space-y-0.5">
                                  {pm.mergedFrom!.map((mf, mi) => {
                                    const isSelected = mf.page === pm.pageSource && mf.value === pm.value;
                                    return (
                                      <div key={mi} className={`flex items-center gap-2 text-[10px] ${isSelected ? 'text-blue-700 font-semibold' : 'text-gray-400'}`}>
                                        <span className={`px-1 py-0.5 rounded border ${getPageSourceBadgeColor(mf.page)} font-bold`}>
                                          P{mf.page}
                                        </span>
                                        <span>{mf.value}</span>
                                        <span className="text-[9px]">({mf.confidence} confidence)</span>
                                        {isSelected && (
                                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                        )}
                                      </div>
                                    );
                                  })}
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
            })}
          </div>
        </div>

        {/* Image Previews */}
        {filePreviews.some(p => p) && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
              <Eye className="w-4 h-4" />
              View uploaded images ({filePreviews.filter(p => p).length})
              <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filePreviews.map((preview, i) => preview ? (
                <div key={i} className="rounded-xl overflow-hidden border border-gray-200">
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPageSourceBadgeColor(i + 1)}`}>
                      P{i + 1}
                    </span>
                    <span className="text-xs text-gray-500 truncate">{files[i]?.name}</span>
                  </div>
                  <img src={preview} alt={`Page ${i + 1}`} className="w-full max-h-64 object-contain bg-gray-50" />
                </div>
              ) : null)}
            </div>
          </details>
        )}

        {/* Validation Warning */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {validMarkerCount} of {parsedMarkers.length} markers have valid values
            {totalPages > 1 && ` (from ${pagesWithResults.length} page${pagesWithResults.length !== 1 ? 's' : ''})`}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={validMarkerCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Confirm & Save ({validMarkerCount} marker{validMarkerCount !== 1 ? 's' : ''})
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodTestUploader;
