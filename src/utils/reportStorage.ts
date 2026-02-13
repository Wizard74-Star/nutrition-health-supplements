import { DeficiencyResult } from '@/context/AssessmentContext';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'nutrianalysis_reports';

export interface SavedNutrientResult {
  nutrientId: string;
  nutrientName: string;
  category: string;
  score: number;
  priority: 'critical' | 'moderate' | 'low';
  triggeringSymptoms: string[];
  foodSources: string[];
  functions: string[];
  rda: string;
  unit: string;
  absorptionTips?: string;
}

export interface SavedReport {
  id: string;
  date: string; // ISO string
  yesCount: number;
  totalQuestions: number;
  answers: Record<string, boolean>;
  results: SavedNutrientResult[];
  summary: {
    critical: number;
    moderate: number;
    low: number;
    total: number;
  };
  synced?: boolean; // Whether this report has been synced to cloud
}

export function generateReportId(): string {
  return 'rpt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

// ─── Local Storage Functions ────────────────────────────────────────────

export function saveReport(
  results: DeficiencyResult[],
  answers: Record<string, boolean>,
  yesCount: number,
  totalQuestions: number
): SavedReport {
  const report: SavedReport = {
    id: generateReportId(),
    date: new Date().toISOString(),
    yesCount,
    totalQuestions,
    answers,
    results: results.map(r => ({
      nutrientId: r.nutrient.id,
      nutrientName: r.nutrient.name,
      category: r.nutrient.category,
      score: r.score,
      priority: r.priority,
      triggeringSymptoms: r.triggeringSymptoms,
      foodSources: r.nutrient.foodSources,
      functions: r.nutrient.functions,
      rda: r.nutrient.rda,
      unit: r.nutrient.unit,
      absorptionTips: r.nutrient.absorptionTips,
    })),
    summary: {
      critical: results.filter(r => r.priority === 'critical').length,
      moderate: results.filter(r => r.priority === 'moderate').length,
      low: results.filter(r => r.priority === 'low').length,
      total: results.length,
    },
    synced: false,
  };

  const existing = getAllReports();
  existing.unshift(report);
  
  // Keep max 50 reports
  const trimmed = existing.slice(0, 50);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save report to localStorage:', e);
  }

  return report;
}

export function getAllReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedReport[];
  } catch (e) {
    console.error('Failed to read reports from localStorage:', e);
    return [];
  }
}

export function getReportById(id: string): SavedReport | null {
  const reports = getAllReports();
  return reports.find(r => r.id === id) || null;
}

export function deleteReport(id: string): void {
  const reports = getAllReports();
  const filtered = reports.filter(r => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete report from localStorage:', e);
  }
}

export function clearAllReports(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear reports from localStorage:', e);
  }
}

function updateLocalReports(reports: SavedReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to update localStorage:', e);
  }
}

// ─── Cloud Sync Functions ───────────────────────────────────────────────

/**
 * Save a single report to the cloud for the authenticated user
 */
export async function saveReportToCloud(report: SavedReport, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_reports')
      .upsert({
        user_id: userId,
        report_id: report.id,
        report_date: report.date,
        yes_count: report.yesCount,
        total_questions: report.totalQuestions,
        answers: report.answers,
        results: report.results,
        summary: report.summary,
      }, {
        onConflict: 'report_id',
      });

    if (error) {
      // If upsert with onConflict fails (no unique constraint), try insert
      if (error.code === '42P10' || error.message.includes('unique')) {
        const { error: insertError } = await supabase
          .from('user_reports')
          .insert({
            user_id: userId,
            report_id: report.id,
            report_date: report.date,
            yes_count: report.yesCount,
            total_questions: report.totalQuestions,
            answers: report.answers,
            results: report.results,
            summary: report.summary,
          });
        if (insertError) {
          console.error('Failed to save report to cloud:', insertError);
          return false;
        }
      } else {
        console.error('Failed to save report to cloud:', error);
        return false;
      }
    }

    // Mark as synced in localStorage
    const localReports = getAllReports();
    const idx = localReports.findIndex(r => r.id === report.id);
    if (idx >= 0) {
      localReports[idx].synced = true;
      updateLocalReports(localReports);
    }

    return true;
  } catch (err) {
    console.error('Error saving report to cloud:', err);
    return false;
  }
}

/**
 * Fetch all reports from the cloud for the authenticated user
 */
export async function getCloudReports(userId: string): Promise<SavedReport[]> {
  try {
    const { data, error } = await supabase
      .from('user_reports')
      .select('*')
      .eq('user_id', userId)
      .order('report_date', { ascending: false });

    if (error) {
      console.error('Failed to fetch cloud reports:', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.report_id,
      date: row.report_date,
      yesCount: row.yes_count,
      totalQuestions: row.total_questions,
      answers: row.answers || {},
      results: row.results || [],
      summary: row.summary || { critical: 0, moderate: 0, low: 0, total: 0 },
      synced: true,
    }));
  } catch (err) {
    console.error('Error fetching cloud reports:', err);
    return [];
  }
}

/**
 * Delete a report from the cloud
 */
export async function deleteCloudReport(reportId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_reports')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete cloud report:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting cloud report:', err);
    return false;
  }
}

/**
 * Delete all cloud reports for a user
 */
export async function clearCloudReports(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_reports')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to clear cloud reports:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error clearing cloud reports:', err);
    return false;
  }
}

/**
 * Sync local reports with cloud: merges both sets, deduplicates by report_id,
 * uploads any local-only reports to cloud, and returns the merged set.
 */
export async function syncReports(userId: string): Promise<SavedReport[]> {
  const localReports = getAllReports();
  const cloudReports = await getCloudReports(userId);

  // Create a map of all reports by ID, preferring cloud versions
  const reportMap = new Map<string, SavedReport>();

  // Add local reports first
  localReports.forEach(r => reportMap.set(r.id, { ...r, synced: false }));

  // Overlay cloud reports (they take precedence)
  cloudReports.forEach(r => reportMap.set(r.id, { ...r, synced: true }));

  // Find local-only reports that need to be uploaded
  const localOnlyReports = localReports.filter(
    lr => !cloudReports.some(cr => cr.id === lr.id)
  );

  // Upload local-only reports to cloud
  for (const report of localOnlyReports) {
    const success = await saveReportToCloud(report, userId);
    if (success) {
      const existing = reportMap.get(report.id);
      if (existing) {
        reportMap.set(report.id, { ...existing, synced: true });
      }
    }
  }

  // Convert map to sorted array
  const merged = Array.from(reportMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Update localStorage with merged data
  updateLocalReports(merged);

  return merged;
}


// ─── Comparison Functions ───────────────────────────────────────────────

export interface ComparisonDataPoint {
  date: string;
  score: number;
  priority: 'critical' | 'moderate' | 'low';
  reportId: string;
}

export interface NutrientTrend {
  nutrientId: string;
  nutrientName: string;
  category: string;
  dataPoints: ComparisonDataPoint[];
  latestScore: number;
  earliestScore: number;
  change: number; // positive = worsened, negative = improved
}

export function getComparisonData(reportIds?: string[]): NutrientTrend[] {
  let reports = getAllReports();
  
  if (reportIds && reportIds.length > 0) {
    reports = reports.filter(r => reportIds.includes(r.id));
  }

  // Sort by date ascending for chronological order
  reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (reports.length < 2) return [];

  // Collect all unique nutrients across all reports
  const nutrientMap = new Map<string, NutrientTrend>();

  reports.forEach(report => {
    report.results.forEach(result => {
      if (!nutrientMap.has(result.nutrientId)) {
        nutrientMap.set(result.nutrientId, {
          nutrientId: result.nutrientId,
          nutrientName: result.nutrientName,
          category: result.category,
          dataPoints: [],
          latestScore: 0,
          earliestScore: 0,
          change: 0,
        });
      }

      nutrientMap.get(result.nutrientId)!.dataPoints.push({
        date: report.date,
        score: result.score,
        priority: result.priority,
        reportId: report.id,
      });
    });
  });

  // Calculate change for each nutrient
  const trends: NutrientTrend[] = [];
  nutrientMap.forEach(trend => {
    if (trend.dataPoints.length >= 2) {
      trend.earliestScore = trend.dataPoints[0].score;
      trend.latestScore = trend.dataPoints[trend.dataPoints.length - 1].score;
      trend.change = trend.latestScore - trend.earliestScore;
      trends.push(trend);
    }
  });

  // Sort by absolute change (most significant changes first)
  trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return trends;
}
