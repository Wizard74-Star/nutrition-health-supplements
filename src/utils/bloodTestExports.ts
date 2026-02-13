import jsPDF from 'jspdf';
import {
  bloodMarkers, markerCategories, evaluateMarkerValue, getSeverityInfo,
  BloodMarker, MarkerCategory, SeverityLevel
} from '@/data/bloodMarkers';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BloodTestExportData {
  id: string;
  test_date: string;
  lab_name: string | null;
  notes: string | null;
  markers: Array<{
    markerId: string;
    value: number;
    unit: string;
  }>;
}

interface EvaluatedMarker {
  markerId: string;
  value: number;
  unit: string;
  marker: BloodMarker;
  severity: SeverityLevel;
  severityLabel: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function evaluateTestMarkers(test: BloodTestExportData): EvaluatedMarker[] {
  return test.markers
    .map(m => {
      const marker = bloodMarkers.find(bm => bm.id === m.markerId);
      if (!marker) return null;
      const severity = evaluateMarkerValue(marker, m.value);
      const severityInfo = getSeverityInfo(severity);
      return { ...m, marker, severity, severityLabel: severityInfo.label };
    })
    .filter(Boolean) as EvaluatedMarker[];
}

function getTrendForMarker(markerId: string, currentTest: BloodTestExportData, allTests: BloodTestExportData[]): string | null {
  const sorted = [...allTests].sort((a, b) => a.test_date.localeCompare(b.test_date));
  const currentIdx = sorted.findIndex(t => t.id === currentTest.id);
  if (currentIdx <= 0) return null;
  
  const prevTest = sorted[currentIdx - 1];
  const prevMarker = prevTest.markers.find(m => m.markerId === markerId);
  const currMarker = currentTest.markers.find(m => m.markerId === markerId);
  
  if (!prevMarker || !currMarker) return null;
  
  const diff = currMarker.value - prevMarker.value;
  const pctChange = prevMarker.value !== 0 ? (diff / prevMarker.value) * 100 : 0;
  
  if (Math.abs(pctChange) < 2) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function getSupplementRecommendations(evaluatedMarkers: EvaluatedMarker[]): Array<{ name: string; reason: string; priority: string }> {
  const suppMap = new Map<string, { name: string; reasons: string[]; priorityNum: number }>();
  
  evaluatedMarkers.forEach(r => {
    if (r.severity === 'normal') return;
    const isLow = r.severity.includes('low');
    const isCritical = r.severity.includes('critical');
    const priorityNum = isCritical ? 3 : (r.severity === 'low' || r.severity === 'high') ? 2 : 1;
    
    const supps = isLow
      ? r.marker.supplementRecommendations.whenLow
      : r.marker.supplementRecommendations.whenHigh;
    
    supps.forEach(s => {
      const existing = suppMap.get(s);
      if (existing) {
        existing.reasons.push(r.marker.name);
        existing.priorityNum = Math.max(existing.priorityNum, priorityNum);
      } else {
        suppMap.set(s, { name: s, reasons: [r.marker.name], priorityNum });
      }
    });
  });
  
  return Array.from(suppMap.values())
    .sort((a, b) => b.priorityNum - a.priorityNum || b.reasons.length - a.reasons.length)
    .map(s => ({
      name: s.name,
      reason: s.reasons.join(', '),
      priority: s.priorityNum >= 3 ? 'critical' : s.priorityNum >= 2 ? 'high' : 'moderate',
    }));
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

export function generateCSV(tests: BloodTestExportData[]): string {
  if (tests.length === 0) return '';
  
  // Collect all unique marker IDs across all tests
  const allMarkerIds = new Set<string>();
  tests.forEach(t => t.markers.forEach(m => allMarkerIds.add(m.markerId)));
  const markerIds = Array.from(allMarkerIds);
  
  // Build header row
  const markerHeaders = markerIds.flatMap(id => {
    const marker = bloodMarkers.find(m => m.id === id);
    const name = marker ? marker.name : id;
    const unit = marker ? marker.referenceRange.unit : '';
    const refRange = marker ? `${marker.referenceRange.low}-${marker.referenceRange.high}` : '';
    return [`${name} (${unit})`, `${name} Status`, `${name} Ref Range`];
  });
  
  const headers = ['Test Date', 'Lab Name', 'Notes', 'Total Markers', 'Normal', 'Borderline', 'Abnormal', 'Critical', ...markerHeaders];
  
  // Build data rows
  const rows = tests.map(test => {
    const evaluated = evaluateTestMarkers(test);
    const normal = evaluated.filter(m => m.severity === 'normal').length;
    const borderline = evaluated.filter(m => m.severity.includes('borderline')).length;
    const abnormal = evaluated.filter(m => m.severity === 'low' || m.severity === 'high').length;
    const critical = evaluated.filter(m => m.severity.includes('critical')).length;
    
    const markerValues = markerIds.flatMap(id => {
      const m = test.markers.find(mk => mk.markerId === id);
      const marker = bloodMarkers.find(bm => bm.id === id);
      if (!m || !marker) return ['', '', ''];
      const severity = evaluateMarkerValue(marker, m.value);
      const severityInfo = getSeverityInfo(severity);
      return [
        String(m.value),
        severityInfo.label,
        `${marker.referenceRange.low}-${marker.referenceRange.high} ${marker.referenceRange.unit}`
      ];
    });
    
    return [
      test.test_date,
      test.lab_name || '',
      test.notes || '',
      String(test.markers.length),
      String(normal),
      String(borderline),
      String(abnormal),
      String(critical),
      ...markerValues,
    ];
  });
  
  // Escape CSV values
  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };
  
  const csvLines = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ];
  
  return csvLines.join('\n');
}

export function downloadCSV(tests: BloodTestExportData[]) {
  const csv = generateCSV(tests);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `blood_tests_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── HL7 FHIR JSON Export ────────────────────────────────────────────────────

export function generateFHIRBundle(tests: BloodTestExportData[], patientName?: string, patientEmail?: string): object {
  const patientId = `patient-${Date.now()}`;
  
  const patientResource = {
    resourceType: 'Patient',
    id: patientId,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
    name: patientName ? [{ use: 'official', text: patientName }] : undefined,
    telecom: patientEmail ? [{ system: 'email', value: patientEmail }] : undefined,
  };
  
  // LOINC code mapping for common blood markers
  const loincMap: Record<string, { code: string; display: string }> = {
    'hemoglobin': { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' },
    'hematocrit': { code: '4544-3', display: 'Hematocrit [Volume Fraction] of Blood by Automated count' },
    'rbc': { code: '789-8', display: 'Erythrocytes [#/volume] in Blood by Automated count' },
    'mcv': { code: '787-2', display: 'MCV [Entitic volume] by Automated count' },
    'wbc': { code: '6690-2', display: 'Leukocytes [#/volume] in Blood by Automated count' },
    'platelets': { code: '777-3', display: 'Platelets [#/volume] in Blood by Automated count' },
    'vitamin-d': { code: '1989-3', display: '25-Hydroxyvitamin D3 [Mass/volume] in Serum or Plasma' },
    'vitamin-b12': { code: '2132-9', display: 'Cobalamin (Vitamin B12) [Mass/volume] in Serum or Plasma' },
    'folate': { code: '2284-8', display: 'Folate [Mass/volume] in Serum or Plasma' },
    'magnesium': { code: '19123-9', display: 'Magnesium [Mass/volume] in Serum or Plasma' },
    'zinc': { code: '2601-3', display: 'Zinc [Mass/volume] in Serum or Plasma' },
    'calcium': { code: '17861-6', display: 'Calcium [Mass/volume] in Serum or Plasma' },
    'potassium': { code: '2823-3', display: 'Potassium [Moles/volume] in Serum or Plasma' },
    'sodium': { code: '2951-2', display: 'Sodium [Moles/volume] in Serum or Plasma' },
    'serum-iron': { code: '2498-4', display: 'Iron [Mass/volume] in Serum or Plasma' },
    'ferritin': { code: '2276-4', display: 'Ferritin [Mass/volume] in Serum or Plasma' },
    'tibc': { code: '2500-7', display: 'Iron binding capacity [Mass/volume] in Serum or Plasma' },
    'total-cholesterol': { code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma' },
    'ldl': { code: '2089-1', display: 'Cholesterol in LDL [Mass/volume] in Serum or Plasma' },
    'hdl': { code: '2085-9', display: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma' },
    'triglycerides': { code: '2571-8', display: 'Triglyceride [Mass/volume] in Serum or Plasma' },
    'glucose-fasting': { code: '1558-6', display: 'Fasting glucose [Mass/volume] in Serum or Plasma' },
    'hba1c': { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood' },
    'creatinine': { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma' },
    'alt': { code: '1742-6', display: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma' },
    'tsh': { code: '3016-3', display: 'Thyrotropin [Units/volume] in Serum or Plasma' },
    'free-t4': { code: '3024-7', display: 'Thyroxine (T4) free [Mass/volume] in Serum or Plasma' },
    'free-t3': { code: '3051-0', display: 'Triiodothyronine (T3) Free [Mass/volume] in Serum or Plasma' },
    'crp': { code: '30522-7', display: 'C reactive protein [Mass/volume] in Serum or Plasma by High sensitivity method' },
    'homocysteine': { code: '13965-9', display: 'Homocysteine [Moles/volume] in Serum or Plasma' },
    'esr': { code: '4537-7', display: 'Erythrocyte sedimentation rate by Westergren method' },
    'selenium': { code: '2823-9', display: 'Selenium [Mass/volume] in Serum or Plasma' },
    'vitamin-b6': { code: '2840-3', display: 'Pyridoxal phosphate [Mass/volume] in Plasma' },
    'vitamin-a': { code: '2923-7', display: 'Retinol [Mass/volume] in Serum or Plasma' },
    'vitamin-e': { code: '2926-0', display: 'Alpha tocopherol [Mass/volume] in Serum or Plasma' },
    'vitamin-c': { code: '2919-5', display: 'Ascorbate [Mass/volume] in Serum or Plasma' },
  };
  
  // UCUM unit mapping
  const ucumMap: Record<string, string> = {
    'g/dL': 'g/dL', '%': '%', 'M/uL': '10*6/uL', 'fL': 'fL', 'K/uL': '10*3/uL',
    'ng/mL': 'ng/mL', 'pg/mL': 'pg/mL', 'mg/dL': 'mg/dL', 'mcg/dL': 'ug/dL',
    'mcg/L': 'ug/L', 'mEq/L': 'meq/L', 'mg/L': 'mg/L', 'umol/L': 'umol/L',
    'mm/hr': 'mm/h', 'mIU/L': 'mIU/L', 'ng/dL': 'ng/dL', 'U/L': 'U/L',
  };
  
  const diagnosticReports: object[] = [];
  const observations: object[] = [];
  
  tests.forEach(test => {
    const reportId = `report-${test.id}`;
    const observationRefs: object[] = [];
    
    test.markers.forEach(m => {
      const marker = bloodMarkers.find(bm => bm.id === m.markerId);
      if (!marker) return;
      
      const obsId = `obs-${test.id}-${m.markerId}`;
      const severity = evaluateMarkerValue(marker, m.value);
      const loinc = loincMap[m.markerId];
      
      let interpretation = 'N';
      let interpretationDisplay = 'Normal';
      if (severity.includes('critical_low')) { interpretation = 'LL'; interpretationDisplay = 'Critical low'; }
      else if (severity.includes('critical_high')) { interpretation = 'HH'; interpretationDisplay = 'Critical high'; }
      else if (severity.includes('low') || severity === 'borderline_low') { interpretation = 'L'; interpretationDisplay = 'Low'; }
      else if (severity.includes('high') || severity === 'borderline_high') { interpretation = 'H'; interpretationDisplay = 'High'; }
      
      const observation: Record<string, any> = {
        resourceType: 'Observation',
        id: obsId,
        meta: {
          profile: ['http://hl7.org/fhir/StructureDefinition/Observation'],
        },
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory',
            display: 'Laboratory',
          }],
        }],
        code: {
          coding: loinc ? [{
            system: 'http://loinc.org',
            code: loinc.code,
            display: loinc.display,
          }] : [],
          text: marker.name,
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: `${test.test_date}T00:00:00Z`,
        valueQuantity: {
          value: m.value,
          unit: m.unit,
          system: 'http://unitsofmeasure.org',
          code: ucumMap[m.unit] || m.unit,
        },
        interpretation: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: interpretation,
            display: interpretationDisplay,
          }],
        }],
        referenceRange: [{
          low: {
            value: marker.referenceRange.low,
            unit: m.unit,
            system: 'http://unitsofmeasure.org',
            code: ucumMap[m.unit] || m.unit,
          },
          high: {
            value: marker.referenceRange.high,
            unit: m.unit,
            system: 'http://unitsofmeasure.org',
            code: ucumMap[m.unit] || m.unit,
          },
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/referencerange-meaning',
              code: 'normal',
              display: 'Normal Range',
            }],
          },
        }],
      };
      
      if (test.lab_name) {
        observation.performer = [{ display: test.lab_name }];
      }
      
      observations.push(observation);
      observationRefs.push({ reference: `Observation/${obsId}` });
    });
    
    const diagnosticReport: Record<string, any> = {
      resourceType: 'DiagnosticReport',
      id: reportId,
      meta: {
        profile: ['http://hl7.org/fhir/StructureDefinition/DiagnosticReport'],
      },
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'LAB',
          display: 'Laboratory',
        }],
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '58410-2',
          display: 'Complete blood count (CBC) panel - Blood by Automated count',
        }],
        text: 'Blood Test Panel',
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: `${test.test_date}T00:00:00Z`,
      issued: test.test_date + 'T00:00:00Z',
      result: observationRefs,
    };
    
    if (test.lab_name) {
      diagnosticReport.performer = [{ display: test.lab_name }];
    }
    if (test.notes) {
      diagnosticReport.conclusion = test.notes;
    }
    
    diagnosticReports.push(diagnosticReport);
  });
  
  const bundle = {
    resourceType: 'Bundle',
    id: `bundle-${Date.now()}`,
    meta: {
      lastUpdated: new Date().toISOString(),
    },
    type: 'collection',
    total: 1 + diagnosticReports.length + observations.length,
    entry: [
      { fullUrl: `urn:uuid:${patientId}`, resource: patientResource },
      ...diagnosticReports.map(r => ({
        fullUrl: `urn:uuid:${(r as any).id}`,
        resource: r,
      })),
      ...observations.map(o => ({
        fullUrl: `urn:uuid:${(o as any).id}`,
        resource: o,
      })),
    ],
  };
  
  return bundle;
}

export function downloadFHIR(tests: BloodTestExportData[], patientName?: string, patientEmail?: string) {
  const bundle = generateFHIRBundle(tests, patientName, patientEmail);
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/fhir+json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `blood_tests_fhir_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── PDF Report Generation ───────────────────────────────────────────────────

const COLORS = {
  primary: [225, 29, 72] as [number, number, number],       // rose-600
  primaryDark: [159, 18, 57] as [number, number, number],    // rose-800
  normal: [22, 163, 74] as [number, number, number],         // green-600
  normalBg: [240, 253, 244] as [number, number, number],     // green-50
  borderline: [217, 119, 6] as [number, number, number],     // amber-600
  borderlineBg: [255, 251, 235] as [number, number, number], // amber-50
  abnormal: [234, 88, 12] as [number, number, number],       // orange-600
  abnormalBg: [255, 247, 237] as [number, number, number],   // orange-50
  critical: [220, 38, 38] as [number, number, number],       // red-600
  criticalBg: [254, 242, 242] as [number, number, number],   // red-50
  dark: [17, 24, 39] as [number, number, number],
  text: [55, 65, 81] as [number, number, number],
  textLight: [107, 114, 128] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  tealBg: [240, 253, 250] as [number, number, number],
  tealText: [15, 118, 110] as [number, number, number],
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - 20) {
    doc.addPage();
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 12, PAGE_WIDTH - MARGIN, 12);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.text('NutriAnalysis — Blood Test Report', MARGIN, 10);
    doc.text(`Page ${doc.getNumberOfPages()}`, PAGE_WIDTH - MARGIN, 10, { align: 'right' });
    return 18;
  }
  return y;
}

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fill: [number, number, number], border?: [number, number, number]) {
  doc.setFillColor(...fill);
  if (border) {
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
  }
  doc.roundedRect(x, y, w, h, r, r, border ? 'FD' : 'F');
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}

function getSeverityColor(severity: SeverityLevel): [number, number, number] {
  if (severity === 'normal') return COLORS.normal;
  if (severity.includes('critical')) return COLORS.critical;
  if (severity.includes('borderline')) return COLORS.borderline;
  return COLORS.abnormal;
}

function getSeverityBgColor(severity: SeverityLevel): [number, number, number] {
  if (severity === 'normal') return COLORS.normalBg;
  if (severity.includes('critical')) return COLORS.criticalBg;
  if (severity.includes('borderline')) return COLORS.borderlineBg;
  return COLORS.abnormalBg;
}

export function generateBloodTestPDF(tests: BloodTestExportData[], patientName?: string): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  // Latest test for the main report
  const latestTest = tests[0]; // Already sorted by date desc
  if (!latestTest) return doc;
  
  const evaluated = evaluateTestMarkers(latestTest);
  const normal = evaluated.filter(m => m.severity === 'normal').length;
  const borderline = evaluated.filter(m => m.severity.includes('borderline')).length;
  const abnormal = evaluated.filter(m => m.severity === 'low' || m.severity === 'high').length;
  const critical = evaluated.filter(m => m.severity.includes('critical')).length;
  
  // ── Header ──
  doc.setFillColor(...COLORS.primaryDark);
  doc.rect(0, 0, PAGE_WIDTH, 50, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 46, PAGE_WIDTH, 4, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.white);
  doc.text('Blood Test Report', MARGIN, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 200, 200);
  doc.text(`NutriAnalysis — Comprehensive Blood Work Analysis`, MARGIN, 28);
  
  doc.setFontSize(9);
  doc.setTextColor(255, 180, 180);
  if (patientName) doc.text(`Patient: ${patientName}`, MARGIN, 36);
  doc.text(`Generated: ${dateStr} at ${timeStr}`, patientName ? MARGIN + 80 : MARGIN, 36);
  doc.text(`Test Date: ${new Date(latestTest.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, MARGIN, 42);
  if (latestTest.lab_name) doc.text(`Lab: ${latestTest.lab_name}`, MARGIN + 80, 42);
  
  let y = 58;
  
  // ── Summary Cards ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.dark);
  doc.text('Results Summary', MARGIN, y);
  y += 3;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + 40, y);
  y += 8;
  
  const cardW = (CONTENT_WIDTH - 12) / 5;
  const cardH = 22;
  
  const summaryCards = [
    { label: 'TOTAL', value: evaluated.length, bg: [249, 250, 251] as [number, number, number], color: COLORS.dark, border: COLORS.border },
    { label: 'NORMAL', value: normal, bg: COLORS.normalBg, color: COLORS.normal, border: [187, 247, 208] as [number, number, number] },
    { label: 'BORDERLINE', value: borderline, bg: COLORS.borderlineBg, color: COLORS.borderline, border: [253, 230, 138] as [number, number, number] },
    { label: 'ABNORMAL', value: abnormal, bg: COLORS.abnormalBg, color: COLORS.abnormal, border: [254, 215, 170] as [number, number, number] },
    { label: 'CRITICAL', value: critical, bg: COLORS.criticalBg, color: COLORS.critical, border: [254, 202, 202] as [number, number, number] },
  ];
  
  summaryCards.forEach((card, i) => {
    const cx = MARGIN + i * (cardW + 3);
    drawRoundedRect(doc, cx, y, cardW, cardH, 3, card.bg, card.border);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...card.color);
    doc.text(String(card.value), cx + cardW / 2, y + 10, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text(card.label, cx + cardW / 2, y + 16, { align: 'center' });
  });
  
  y += cardH + 12;
  
  // ── Detailed Results Table ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.dark);
  doc.text('Detailed Marker Results', MARGIN, y);
  y += 3;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + 50, y);
  y += 8;
  
  // Group by category
  const grouped: Record<string, EvaluatedMarker[]> = {};
  evaluated.forEach(m => {
    if (!grouped[m.marker.category]) grouped[m.marker.category] = [];
    grouped[m.marker.category].push(m);
  });
  
  Object.entries(grouped).forEach(([cat, markers]) => {
    const catInfo = markerCategories[cat as MarkerCategory];
    
    y = checkPageBreak(doc, y, 20 + markers.length * 10);
    
    // Category header
    drawRoundedRect(doc, MARGIN, y, CONTENT_WIDTH, 8, 2, [245, 245, 250] as [number, number, number]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.text(catInfo.label, MARGIN + 4, y + 5.5);
    y += 12;
    
    // Table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Marker', MARGIN + 2, y);
    doc.text('Value', MARGIN + 80, y, { align: 'right' });
    doc.text('Unit', MARGIN + 95, y);
    doc.text('Reference', MARGIN + 125, y);
    doc.text('Status', MARGIN + 160, y);
    
    const trendCol = MARGIN + CONTENT_WIDTH - 4;
    if (tests.length > 1) doc.text('Trend', trendCol, y, { align: 'right' });
    
    y += 2;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 4;
    
    markers.forEach(m => {
      y = checkPageBreak(doc, y, 8);
      
      const sevColor = getSeverityColor(m.severity);
      const sevBg = getSeverityBgColor(m.severity);
      
      // Marker name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.dark);
      doc.text(m.marker.name, MARGIN + 2, y);
      
      // Abbreviation
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.textLight);
      doc.text(`(${m.marker.abbreviation})`, MARGIN + 2 + doc.getTextWidth(m.marker.name) + 2, y);
      
      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...(m.severity === 'normal' ? COLORS.dark : sevColor));
      doc.text(String(m.value), MARGIN + 80, y, { align: 'right' });
      
      // Unit
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.textLight);
      doc.text(m.unit, MARGIN + 95, y);
      
      // Reference range
      doc.setFontSize(7);
      doc.text(`${m.marker.referenceRange.low} - ${m.marker.referenceRange.high}`, MARGIN + 125, y);
      
      // Status badge
      const statusText = m.severityLabel;
      const badgeW = doc.getTextWidth(statusText) + 6;
      drawRoundedRect(doc, MARGIN + 156, y - 3, badgeW, 5.5, 2, sevBg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(...sevColor);
      doc.text(statusText, MARGIN + 156 + 3, y);
      
      // Trend arrow
      if (tests.length > 1) {
        const trend = getTrendForMarker(m.markerId, latestTest, tests);
        if (trend) {
          doc.setFontSize(8);
          const trendSymbol = trend === 'up' ? '\u25B2' : trend === 'down' ? '\u25BC' : '\u25B6';
          const trendColor: [number, number, number] = trend === 'up' ? [220, 38, 38] : trend === 'down' ? [37, 99, 235] : [107, 114, 128];
          doc.setTextColor(...trendColor);
          doc.text(trendSymbol, trendCol, y, { align: 'right' });
        }
      }
      
      y += 7;
    });
    
    y += 4;
  });
  
  // ── Reference Range Charts (for abnormal markers) ──
  const abnormalMarkers = evaluated.filter(m => m.severity !== 'normal');
  if (abnormalMarkers.length > 0) {
    y = checkPageBreak(doc, y, 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.dark);
    doc.text('Flagged Markers — Visual Reference', MARGIN, y);
    y += 3;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y, MARGIN + 60, y);
    y += 10;
    
    abnormalMarkers.forEach(m => {
      y = checkPageBreak(doc, y, 18);
      
      const range = m.marker.referenceRange;
      const totalMin = (range.criticalLow ?? range.borderlineLow ?? range.low) * 0.7;
      const totalMax = (range.criticalHigh ?? range.borderlineHigh ?? range.high) * 1.3;
      const totalRange = totalMax - totalMin || 1;
      
      const barX = MARGIN + 55;
      const barW = CONTENT_WIDTH - 60;
      const barH = 5;
      
      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.dark);
      doc.text(`${m.marker.abbreviation}`, MARGIN + 2, y + 3);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...getSeverityColor(m.severity));
      doc.text(`${m.value} ${m.unit}`, MARGIN + 2, y + 8);
      
      // Background bar
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(barX, y, barW, barH, 2, 2, 'F');
      
      // Normal range highlight
      const normalStart = ((range.low - totalMin) / totalRange) * barW;
      const normalEnd = ((range.high - totalMin) / totalRange) * barW;
      doc.setFillColor(187, 247, 208);
      doc.rect(barX + normalStart, y, normalEnd - normalStart, barH, 'F');
      
      // Value indicator
      const valuePos = Math.max(0, Math.min(barW, ((m.value - totalMin) / totalRange) * barW));
      const sevColor = getSeverityColor(m.severity);
      doc.setFillColor(...sevColor);
      doc.circle(barX + valuePos, y + barH / 2, 2.5, 'F');
      doc.setFillColor(...COLORS.white);
      doc.circle(barX + valuePos, y + barH / 2, 1.2, 'F');
      
      // Range labels
      doc.setFontSize(5.5);
      doc.setTextColor(...COLORS.textLight);
      doc.text(String(range.low), barX + normalStart, y + barH + 4);
      doc.text(String(range.high), barX + normalEnd, y + barH + 4, { align: 'right' });
      doc.text('Normal', barX + (normalStart + normalEnd) / 2, y + barH + 4, { align: 'center' });
      
      y += 14;
    });
  }
  
  // ── Supplement Recommendations ──
  const supplements = getSupplementRecommendations(evaluated);
  if (supplements.length > 0) {
    y = checkPageBreak(doc, y, 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.dark);
    doc.text('Supplement Recommendations', MARGIN, y);
    y += 3;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y, MARGIN + 55, y);
    y += 8;
    
    supplements.slice(0, 12).forEach((supp, i) => {
      y = checkPageBreak(doc, y, 10);
      
      const bgColor: [number, number, number] = supp.priority === 'critical' ? COLORS.criticalBg : supp.priority === 'high' ? COLORS.abnormalBg : COLORS.normalBg;
      const numColor: [number, number, number] = supp.priority === 'critical' ? COLORS.critical : supp.priority === 'high' ? COLORS.abnormal : COLORS.normal;
      
      drawRoundedRect(doc, MARGIN, y, CONTENT_WIDTH, 9, 2, bgColor);
      
      // Number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...numColor);
      doc.text(String(i + 1), MARGIN + 5, y + 5.5, { align: 'center' });
      
      // Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.dark);
      doc.text(supp.name, MARGIN + 10, y + 4);
      
      // Reason
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.textLight);
      doc.text(`Based on: ${supp.reason}`, MARGIN + 10, y + 7.5);
      
      y += 11;
    });
  }
  
  // ── Historical Comparison (if multiple tests) ──
  if (tests.length > 1) {
    y = checkPageBreak(doc, y, 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.dark);
    doc.text('Historical Test Comparison', MARGIN, y);
    y += 3;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(MARGIN, y, MARGIN + 55, y);
    y += 8;
    
    // Table header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.text('Test Date', MARGIN + 2, y);
    doc.text('Lab', MARGIN + 40, y);
    doc.text('Markers', MARGIN + 80, y);
    doc.text('Normal', MARGIN + 100, y);
    doc.text('Issues', MARGIN + 120, y);
    doc.text('Critical', MARGIN + 140, y);
    y += 2;
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 4;
    
    tests.slice(0, 10).forEach(test => {
      y = checkPageBreak(doc, y, 7);
      
      const ev = evaluateTestMarkers(test);
      const n = ev.filter(m => m.severity === 'normal').length;
      const issues = ev.filter(m => m.severity !== 'normal').length;
      const crit = ev.filter(m => m.severity.includes('critical')).length;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.dark);
      doc.text(new Date(test.test_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), MARGIN + 2, y);
      doc.setTextColor(...COLORS.textLight);
      doc.text(test.lab_name || '—', MARGIN + 40, y);
      doc.text(String(ev.length), MARGIN + 80, y);
      doc.setTextColor(...COLORS.normal);
      doc.text(String(n), MARGIN + 100, y);
      doc.setTextColor(...COLORS.abnormal);
      doc.text(String(issues), MARGIN + 120, y);
      doc.setTextColor(crit > 0 ? COLORS.critical[0] : COLORS.textLight[0], crit > 0 ? COLORS.critical[1] : COLORS.textLight[1], crit > 0 ? COLORS.critical[2] : COLORS.textLight[2]);
      doc.text(String(crit), MARGIN + 140, y);
      
      y += 6;
    });
  }
  
  // ── Disclaimer ──
  y = checkPageBreak(doc, y, 30);
  y += 6;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textLight);
  const disclaimer = 'Disclaimer: This report is generated from self-reported blood test data. Values should be verified against original lab reports. Supplement recommendations are for informational purposes only. Always consult a qualified healthcare provider before making changes to your supplementation or treatment plan.';
  const disclaimerLines = wrapText(doc, disclaimer, CONTENT_WIDTH);
  disclaimerLines.forEach((line, i) => {
    doc.text(line, MARGIN, y + i * 3);
  });
  
  return doc;
}

export function downloadBloodTestPDF(tests: BloodTestExportData[], patientName?: string) {
  const doc = generateBloodTestPDF(tests, patientName);
  const testDate = tests[0]?.test_date || new Date().toISOString().slice(0, 10);
  doc.save(`Blood_Test_Report_${testDate}.pdf`);
}

export function generateBloodTestPDFBase64(tests: BloodTestExportData[], patientName?: string): string {
  const doc = generateBloodTestPDF(tests, patientName);
  return doc.output('datauristring').split(',')[1];
}

// ── Share with Doctor helpers ──

export interface ShareWithDoctorData {
  pdfBase64: string;
  testDate: string;
  labName: string | null;
  summary: {
    total: number;
    normal: number;
    borderline: number;
    abnormal: number;
    critical: number;
  };
  abnormalMarkers: Array<{
    name: string;
    abbreviation: string;
    value: number;
    unit: string;
    status: string;
    statusColor: string;
    referenceRange: string;
    trend?: string;
    category: string;
  }>;
  supplements: Array<{
    name: string;
    reason: string;
    priority: string;
  }>;
}

export function prepareShareWithDoctorData(tests: BloodTestExportData[], patientName?: string): ShareWithDoctorData {
  const latestTest = tests[0];
  if (!latestTest) throw new Error('No tests to share');
  
  const evaluated = evaluateTestMarkers(latestTest);
  const normal = evaluated.filter(m => m.severity === 'normal').length;
  const borderline = evaluated.filter(m => m.severity.includes('borderline')).length;
  const abnormal = evaluated.filter(m => m.severity === 'low' || m.severity === 'high').length;
  const critical = evaluated.filter(m => m.severity.includes('critical')).length;
  
  const abnormalMarkers = evaluated
    .filter(m => m.severity !== 'normal')
    .map(m => {
      const trend = tests.length > 1 ? getTrendForMarker(m.markerId, latestTest, tests) : undefined;
      const catInfo = markerCategories[m.marker.category];
      return {
        name: m.marker.name,
        abbreviation: m.marker.abbreviation,
        value: m.value,
        unit: m.unit,
        status: m.severityLabel,
        statusColor: m.severity.includes('critical') ? 'red' : m.severity.includes('borderline') ? 'amber' : 'orange',
        referenceRange: `${m.marker.referenceRange.low}-${m.marker.referenceRange.high} ${m.unit}`,
        trend: trend || undefined,
        category: catInfo.label,
      };
    });
  
  const supplements = getSupplementRecommendations(evaluated).slice(0, 10);
  
  const pdfBase64 = generateBloodTestPDFBase64(tests, patientName);
  
  return {
    pdfBase64,
    testDate: latestTest.test_date,
    labName: latestTest.lab_name,
    summary: { total: evaluated.length, normal, borderline, abnormal, critical },
    abnormalMarkers,
    supplements,
  };
}
