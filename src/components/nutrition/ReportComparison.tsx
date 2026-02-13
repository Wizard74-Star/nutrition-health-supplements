import React, { useMemo, useState } from 'react';
import { SavedReport, NutrientTrend, getComparisonData } from '@/utils/reportStorage';
import {
  TrendingUp, TrendingDown, Minus, ArrowLeft, Calendar,
  ChevronDown, ChevronUp, BarChart3, Activity
} from 'lucide-react';

interface ReportComparisonProps {
  reports: SavedReport[];
  onBack: () => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TrendIcon: React.FC<{ change: number }> = ({ change }) => {
  if (change > 5) return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (change < -5) return <TrendingDown className="w-4 h-4 text-green-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

const TrendBadge: React.FC<{ change: number }> = ({ change }) => {
  if (change > 5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
        <TrendingUp className="w-3 h-3" />
        +{change}% Worsened
      </span>
    );
  }
  if (change < -5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-100">
        <TrendingDown className="w-3 h-3" />
        {change}% Improved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-100">
      <Minus className="w-3 h-3" />
      Stable
    </span>
  );
};

const MiniTrendChart: React.FC<{ trend: NutrientTrend }> = ({ trend }) => {
  const maxScore = 100;
  const points = trend.dataPoints;
  if (points.length < 2) return null;

  const chartWidth = 200;
  const chartHeight = 50;
  const padding = 4;
  const usableWidth = chartWidth - padding * 2;
  const usableHeight = chartHeight - padding * 2;

  const pathPoints = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * usableWidth;
    const y = padding + usableHeight - (p.score / maxScore) * usableHeight;
    return { x, y };
  });

  const pathD = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill
  const areaD = pathD + ` L ${pathPoints[pathPoints.length - 1].x} ${chartHeight - padding} L ${pathPoints[0].x} ${chartHeight - padding} Z`;

  const lineColor = trend.change > 5 ? '#ef4444' : trend.change < -5 ? '#22c55e' : '#94a3b8';
  const fillColor = trend.change > 5 ? '#fef2f2' : trend.change < -5 ? '#f0fdf4' : '#f8fafc';

  return (
    <svg width={chartWidth} height={chartHeight} className="flex-shrink-0">
      <path d={areaD} fill={fillColor} />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pathPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={lineColor} strokeWidth="1.5" />
      ))}
    </svg>
  );
};

const NutrientTrendRow: React.FC<{ trend: NutrientTrend; isExpanded: boolean; onToggle: () => void }> = ({
  trend,
  isExpanded,
  onToggle,
}) => {
  const priorityColor = (p: string) =>
    p === 'critical' ? 'bg-red-500' : p === 'moderate' ? 'bg-amber-500' : 'bg-blue-400';

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:shadow-sm transition-shadow">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex-shrink-0">
          <TrendIcon change={trend.change} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{trend.nutrientName}</span>
            <TrendBadge change={trend.change} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>First: <strong className="text-gray-700">{trend.earliestScore}%</strong></span>
            <span className="text-gray-300">→</span>
            <span>Latest: <strong className="text-gray-700">{trend.latestScore}%</strong></span>
            <span className="text-gray-300">|</span>
            <span>{trend.dataPoints.length} assessments</span>
          </div>
        </div>
        <div className="hidden sm:block flex-shrink-0">
          <MiniTrendChart trend={trend} />
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          {/* Mobile chart */}
          <div className="sm:hidden flex justify-center py-3">
            <MiniTrendChart trend={trend} />
          </div>
          {/* Data points timeline */}
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Score History</p>
            <div className="space-y-1.5">
              {trend.dataPoints.map((dp, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 w-24 flex-shrink-0">
                    <Calendar className="w-3 h-3" />
                    {formatShortDate(dp.date)}
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${priorityColor(dp.priority)}`}
                      style={{ width: `${dp.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${
                    dp.priority === 'critical' ? 'text-red-600' :
                    dp.priority === 'moderate' ? 'text-amber-600' : 'text-blue-500'
                  }`}>
                    {dp.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportComparison: React.FC<ReportComparisonProps> = ({ reports, onBack }) => {
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>(
    reports.slice(0, 5).map(r => r.id)
  );
  const [expandedNutrient, setExpandedNutrient] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'improved' | 'worsened' | 'stable'>('all');

  const trends = useMemo(() => {
    return getComparisonData(selectedReportIds);
  }, [selectedReportIds]);

  const filteredTrends = useMemo(() => {
    switch (filterType) {
      case 'improved': return trends.filter(t => t.change < -5);
      case 'worsened': return trends.filter(t => t.change > 5);
      case 'stable': return trends.filter(t => Math.abs(t.change) <= 5);
      default: return trends;
    }
  }, [trends, filterType]);

  const summaryStats = useMemo(() => {
    const improved = trends.filter(t => t.change < -5).length;
    const worsened = trends.filter(t => t.change > 5).length;
    const stable = trends.filter(t => Math.abs(t.change) <= 5).length;
    return { improved, worsened, stable, total: trends.length };
  }, [trends]);

  const toggleReportSelection = (id: string) => {
    setSelectedReportIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(r => r !== id);
      }
      return [...prev, id];
    });
  };

  if (reports.length < 2) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Need More Data</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Complete at least 2 assessments to compare your nutrient risk scores over time and track your progress.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-500" />
              Progress Comparison
            </h3>
            <p className="text-sm text-gray-500">
              Tracking {trends.length} nutrients across {selectedReportIds.length} assessments
            </p>
          </div>
        </div>
      </div>

      {/* Report selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Assessments to Compare</p>
        <div className="flex flex-wrap gap-2">
          {reports.map(report => {
            const isSelected = selectedReportIds.includes(report.id);
            return (
              <button
                key={report.id}
                onClick={() => toggleReportSelection(report.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {formatDate(report.date)}
                <span className="text-gray-400">({report.summary.total})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary cards */}
      {trends.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
            <div className="text-2xl font-bold text-green-600">{summaryStats.improved}</div>
            <div className="text-xs text-green-500 font-medium mt-1">Improved</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
            <div className="text-2xl font-bold text-gray-600">{summaryStats.stable}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Stable</div>
          </div>
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
            <div className="text-2xl font-bold text-red-600">{summaryStats.worsened}</div>
            <div className="text-xs text-red-500 font-medium mt-1">Worsened</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {trends.length > 0 && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { key: 'all', label: `All (${summaryStats.total})` },
            { key: 'improved', label: `Improved (${summaryStats.improved})` },
            { key: 'worsened', label: `Worsened (${summaryStats.worsened})` },
            { key: 'stable', label: `Stable (${summaryStats.stable})` },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filterType === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Trend list */}
      {filteredTrends.length > 0 ? (
        <div className="space-y-2">
          {filteredTrends.map(trend => (
            <NutrientTrendRow
              key={trend.nutrientId}
              trend={trend}
              isExpanded={expandedNutrient === trend.nutrientId}
              onToggle={() => setExpandedNutrient(
                expandedNutrient === trend.nutrientId ? null : trend.nutrientId
              )}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-sm text-gray-500">
            {trends.length === 0
              ? 'Select at least 2 assessments with overlapping nutrients to see trends.'
              : 'No nutrients match the selected filter.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportComparison;
