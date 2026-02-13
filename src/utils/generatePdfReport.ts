import jsPDF from 'jspdf';
import { DeficiencyResult } from '@/context/AssessmentContext';
import { categoryInfo } from '@/data/nutrients';

export interface ReportData {
  results: DeficiencyResult[];
  yesCount: number;
  totalQuestions: number;
}


// Color constants
const COLORS = {
  primary: [13, 148, 136] as [number, number, number],       // teal-600
  primaryDark: [15, 118, 110] as [number, number, number],    // teal-700
  critical: [220, 38, 38] as [number, number, number],        // red-600
  criticalBg: [254, 242, 242] as [number, number, number],    // red-50
  moderate: [217, 119, 6] as [number, number, number],        // amber-600
  moderateBg: [255, 251, 235] as [number, number, number],    // amber-50
  low: [59, 130, 246] as [number, number, number],            // blue-500
  lowBg: [239, 246, 255] as [number, number, number],         // blue-50
  dark: [17, 24, 39] as [number, number, number],             // gray-900
  text: [55, 65, 81] as [number, number, number],             // gray-700
  textLight: [107, 114, 128] as [number, number, number],     // gray-500
  border: [229, 231, 235] as [number, number, number],        // gray-200
  white: [255, 255, 255] as [number, number, number],
  greenText: [21, 128, 61] as [number, number, number],       // green-700
  greenBg: [240, 253, 244] as [number, number, number],       // green-50
  tealBg: [240, 253, 250] as [number, number, number],        // teal-50
  tealText: [15, 118, 110] as [number, number, number],       // teal-700
  blueBg: [239, 246, 255] as [number, number, number],        // blue-50
  blueText: [29, 78, 216] as [number, number, number],        // blue-700
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - 25) {
    doc.addPage();
    // Add subtle page header line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 15, PAGE_WIDTH - MARGIN, 15);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.text('NutriAnalysis — Deficiency Risk Report', MARGIN, 12);
    doc.text(`Page ${doc.getNumberOfPages()}`, PAGE_WIDTH - MARGIN, 12, { align: 'right' });
    return 22;
  }
  return y;
}

function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fillColor: [number, number, number],
  borderColor?: [number, number, number]
) {
  doc.setFillColor(...fillColor);
  if (borderColor) {
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
  }
  // jsPDF roundedRect
  doc.roundedRect(x, y, w, h, r, r, borderColor ? 'FD' : 'F');
}

function drawScoreBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  score: number,
  priority: string
) {
  const barHeight = 4;
  // Background
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(x, y, width, barHeight, 2, 2, 'F');
  // Filled portion
  const fillWidth = (score / 100) * width;
  if (fillWidth > 0) {
    const color = priority === 'critical' ? COLORS.critical :
                  priority === 'moderate' ? COLORS.moderate : COLORS.low;
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(fillWidth, 4), barHeight, 2, 2, 'F');
  }
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}

function buildPdfDocument({ results, yesCount, totalQuestions }: ReportData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const critical = results.filter(r => r.priority === 'critical');
  const moderate = results.filter(r => r.priority === 'moderate');
  const low = results.filter(r => r.priority === 'low');

  // ============================================
  // COVER / HEADER
  // ============================================
  doc.setFillColor(...COLORS.primaryDark);
  doc.rect(0, 0, PAGE_WIDTH, 52, 'F');
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 48, PAGE_WIDTH, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.white);
  doc.text('Deficiency Risk Report', MARGIN, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 230, 225);
  doc.text('NutriAnalysis — Precision Nutrition Assessment', MARGIN, 30);

  doc.setFontSize(9);
  doc.setTextColor(180, 215, 210);
  doc.text(`Generated: ${dateStr} at ${timeStr}`, MARGIN, 38);
  doc.text(`Assessment ID: ${Date.now().toString(36).toUpperCase()}`, MARGIN, 44);

  let y = 62;

  // ============================================
  // SUMMARY SECTION
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.dark);
  doc.text('Assessment Summary', MARGIN, y);
  y += 3;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + 50, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.text);
  doc.text(
    `Based on ${yesCount} reported symptoms out of ${totalQuestions} questions, we identified ${results.length} potential nutrient gap${results.length !== 1 ? 's' : ''}.`,
    MARGIN,
    y
  );
  y += 10;

  const cardWidth = (CONTENT_WIDTH - 8) / 3;
  const cardHeight = 28;

  drawRoundedRect(doc, MARGIN, y, cardWidth, cardHeight, 3, COLORS.criticalBg, [254, 202, 202]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.critical);
  doc.text(String(critical.length), MARGIN + cardWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text('CRITICAL', MARGIN + cardWidth / 2, y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 80, 80);
  doc.text('Immediate attention', MARGIN + cardWidth / 2, y + 23, { align: 'center' });

  const modX = MARGIN + cardWidth + 4;
  drawRoundedRect(doc, modX, y, cardWidth, cardHeight, 3, COLORS.moderateBg, [253, 230, 138]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.moderate);
  doc.text(String(moderate.length), modX + cardWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text('MODERATE', modX + cardWidth / 2, y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 130, 30);
  doc.text('Monitor closely', modX + cardWidth / 2, y + 23, { align: 'center' });

  const lowX = MARGIN + (cardWidth + 4) * 2;
  drawRoundedRect(doc, lowX, y, cardWidth, cardHeight, 3, COLORS.lowBg, [191, 219, 254]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.low);
  doc.text(String(low.length), lowX + cardWidth / 2, y + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text('LOW RISK', lowX + cardWidth / 2, y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 120, 200);
  doc.text('Worth watching', lowX + cardWidth / 2, y + 23, { align: 'center' });

  y += cardHeight + 14;

  // ============================================
  // DETAILED RESULTS
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.dark);
  doc.text('Detailed Nutrient Analysis', MARGIN, y);
  y += 3;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + 55, y);
  y += 10;

  results.forEach((result, index) => {
    const estimatedHeight = 75 + 
      (result.triggeringSymptoms.length * 4.5) + 
      (Math.ceil(result.nutrient.foodSources.length / 3) * 6) +
      (result.nutrient.absorptionTips ? 14 : 0);
    
    y = checkPageBreak(doc, y, Math.min(estimatedHeight, 120));

    const catInfo = categoryInfo[result.nutrient.category];
    const priorityColor = result.priority === 'critical' ? COLORS.critical :
                          result.priority === 'moderate' ? COLORS.moderate : COLORS.low;
    const priorityBg = result.priority === 'critical' ? COLORS.criticalBg :
                       result.priority === 'moderate' ? COLORS.moderateBg : COLORS.lowBg;

    drawRoundedRect(doc, MARGIN - 2, y - 4, CONTENT_WIDTH + 4, 6, 2, priorityBg);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...priorityColor);
    doc.text(String(index + 1), MARGIN + 2, y + 1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.dark);
    doc.text(result.nutrient.name, MARGIN + 14, y + 1);

    const badgeText = result.priority.charAt(0).toUpperCase() + result.priority.slice(1);
    const badgeWidth = doc.getTextWidth(badgeText) + 10;
    const badgeX = PAGE_WIDTH - MARGIN - badgeWidth;
    drawRoundedRect(doc, badgeX, y - 3.5, badgeWidth, 7, 3, priorityBg);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...priorityColor);
    doc.text(badgeText, badgeX + badgeWidth / 2, y + 1, { align: 'center' });

    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textLight);
    doc.text(`Category: ${catInfo.label}`, MARGIN + 14, y);
    doc.text(`Risk Score: ${result.score}%`, MARGIN + 70, y);
    y += 4;

    drawScoreBar(doc, MARGIN + 14, y, 80, result.score, result.priority);
    
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textLight);
    doc.text(`RDA: ${result.nutrient.rda} ${result.nutrient.unit}`, MARGIN + 110, y + 3);
    y += 10;

    y = checkPageBreak(doc, y, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.critical);
    doc.text('Why This Was Flagged', MARGIN + 4, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.text);
    result.triggeringSymptoms.forEach(symptom => {
      y = checkPageBreak(doc, y, 6);
      doc.setFillColor(...priorityColor);
      doc.circle(MARGIN + 7, y - 1, 1, 'F');
      const lines = wrapText(doc, symptom, CONTENT_WIDTH - 16);
      lines.forEach((line, li) => {
        doc.text(line, MARGIN + 11, y + (li * 3.5));
      });
      y += lines.length * 3.5 + 1.5;
    });
    y += 2;

    y = checkPageBreak(doc, y, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.tealText);
    doc.text('Why You Need It', MARGIN + 4, y);
    y += 5;

    let pillX = MARGIN + 4;
    const pillMaxX = PAGE_WIDTH - MARGIN - 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    result.nutrient.functions.slice(0, 5).forEach(fn => {
      const textW = doc.getTextWidth(fn);
      const pillW = textW + 6;
      if (pillX + pillW > pillMaxX) {
        pillX = MARGIN + 4;
        y += 7;
        y = checkPageBreak(doc, y, 8);
      }
      drawRoundedRect(doc, pillX, y - 3, pillW, 6, 2, COLORS.tealBg);
      doc.setTextColor(...COLORS.tealText);
      doc.text(fn, pillX + 3, y);
      pillX += pillW + 2;
    });
    y += 9;

    y = checkPageBreak(doc, y, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.greenText);
    doc.text('Increase Through Diet', MARGIN + 4, y);
    y += 5;

    pillX = MARGIN + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    result.nutrient.foodSources.forEach(food => {
      const textW = doc.getTextWidth(food);
      const pillW = textW + 6;
      if (pillX + pillW > pillMaxX) {
        pillX = MARGIN + 4;
        y += 7;
        y = checkPageBreak(doc, y, 8);
      }
      drawRoundedRect(doc, pillX, y - 3, pillW, 6, 2, COLORS.greenBg);
      doc.setTextColor(...COLORS.greenText);
      doc.text(food, pillX + 3, y);
      pillX += pillW + 2;
    });
    y += 9;

    if (result.nutrient.absorptionTips) {
      y = checkPageBreak(doc, y, 14);
      drawRoundedRect(doc, MARGIN + 2, y - 4, CONTENT_WIDTH - 4, 12, 2, COLORS.blueBg);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.blueText);
      doc.text('Tip:', MARGIN + 6, y);
      doc.setFont('helvetica', 'normal');
      const tipLines = wrapText(doc, result.nutrient.absorptionTips, CONTENT_WIDTH - 20);
      tipLines.forEach((line, li) => {
        doc.text(line, MARGIN + 15, y + (li * 3.5));
      });
      y += Math.max(12, tipLines.length * 3.5 + 4);
    }

    y += 2;
    if (index < results.length - 1) {
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.line(MARGIN + 10, y, PAGE_WIDTH - MARGIN - 10, y);
      y += 8;
    }
  });

  // ============================================
  // FOOTER / DISCLAIMER
  // ============================================
  y = checkPageBreak(doc, y, 40);
  y += 6;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  drawRoundedRect(doc, MARGIN, y, CONTENT_WIDTH, 30, 3, [240, 253, 250]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('Recommended Next Steps', MARGIN + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);
  const steps = [
    '1. Book a professional blood analysis to confirm these findings with precise measurements.',
    '2. Focus on dietary changes for your highest-priority deficiencies first.',
    '3. Consult a healthcare provider before starting any supplementation protocol.',
  ];
  steps.forEach((step, i) => {
    doc.text(step, MARGIN + 6, y + 14 + i * 5);
  });
  y += 38;

  y = checkPageBreak(doc, y, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text('Contact Us', MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.text);
  doc.text('Email: info@noisiamosalute.com', MARGIN, y);

  y += 4;
  doc.text('Via G. Matteotti, 8 ter, 23807 Merate (LC) Italy', MARGIN, y);
  y += 8;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textLight);
  const disclaimer = 'Disclaimer: This report provides educational guidance based on a symptom-based self-assessment. It is not a medical diagnosis. Results should be confirmed through professional blood analysis. Always consult a qualified healthcare provider before making changes to your diet or supplementation.';
  const disclaimerLines = wrapText(doc, disclaimer, CONTENT_WIDTH);
  disclaimerLines.forEach((line, i) => {
    doc.text(line, MARGIN, y + i * 3);
  });

  return doc;
}

export function generatePdfReport(data: ReportData): void {
  const doc = buildPdfDocument(data);
  const now = new Date();
  const filename = `NutriAnalysis_Report_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
  doc.save(filename);
}

export function generatePdfBase64(data: ReportData): string {
  const doc = buildPdfDocument(data);
  // output as base64 string (without the data:application/pdf;base64, prefix)
  return doc.output('datauristring').split(',')[1];
}
