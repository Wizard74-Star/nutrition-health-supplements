import React, { useMemo } from 'react';
import {
  CalendarDays, Flame, TrendingUp, CheckCircle2, XCircle,
  BarChart3, Clock, Pill, Award, Target, ArrowRight, Zap
} from 'lucide-react';

export interface SupplementLog {
  id: string;
  user_id: string;
  supplement_id: string;
  taken_at: string;
  skipped: boolean;
  notes: string | null;
  created_at: string;
}

interface SupplementRecord {
  id: string;
  name: string;
  dosage: string;
  dosage_unit: string;
  time_of_day: string;
  frequency: string;
  active: boolean;
}

interface SupplementIntakeLogProps {
  logs: SupplementLog[];
  supplements: SupplementRecord[];
}

// Helper: get date string in YYYY-MM-DD format (local timezone)
const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toDateKeyFromStr = (dateStr: string): string => {
  const d = new Date(dateStr);
  return toDateKey(d);
};

// Get the start of today (local)
const getToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const DAY_MS = 86400000;

const SupplementIntakeLog: React.FC<SupplementIntakeLogProps> = ({ logs, supplements }) => {
  const today = useMemo(() => getToday(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const activeSupplements = useMemo(() => supplements.filter(s => s.active), [supplements]);

  // Build a map of date -> { taken: Set<suppId>, skipped: Set<suppId> }
  const dailyMap = useMemo(() => {
    const map: Record<string, { taken: Set<string>; skipped: Set<string> }> = {};
    logs.forEach(log => {
      const key = toDateKeyFromStr(log.taken_at);
      if (!map[key]) map[key] = { taken: new Set(), skipped: new Set() };
      if (log.skipped) {
        map[key].skipped.add(log.supplement_id);
      } else {
        map[key].taken.add(log.supplement_id);
      }
    });
    return map;
  }, [logs]);

  // Today's stats
  const todayStats = useMemo(() => {
    const entry = dailyMap[todayKey];
    const totalActive = activeSupplements.length;
    const taken = entry ? entry.taken.size : 0;
    const skipped = entry ? entry.skipped.size : 0;
    const remaining = Math.max(0, totalActive - taken - skipped);
    const percentage = totalActive > 0 ? Math.round((taken / totalActive) * 100) : 0;
    return { totalActive, taken, skipped, remaining, percentage };
  }, [dailyMap, todayKey, activeSupplements]);

  // Calculate daily completion percentages for streak calculation
  const dailyCompletionMap = useMemo(() => {
    const map: Record<string, number> = {};
    const totalActive = activeSupplements.length;
    if (totalActive === 0) return map;

    Object.entries(dailyMap).forEach(([dateKey, entry]) => {
      map[dateKey] = Math.round((entry.taken.size / totalActive) * 100);
    });
    return map;
  }, [dailyMap, activeSupplements]);

  // Streak calculation
  const streaks = useMemo(() => {
    if (activeSupplements.length === 0) return { current: 0, best: 0 };

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Check from today backwards
    const checkDate = new Date(today);
    
    // First check if today has any logs - if not, start from yesterday
    const todayEntry = dailyMap[todayKey];
    const todayHasLogs = todayEntry && (todayEntry.taken.size > 0);
    
    if (!todayHasLogs) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate current streak (consecutive days with >= 80% completion)
    for (let i = 0; i < 365; i++) {
      const key = toDateKey(checkDate);
      const completion = dailyCompletionMap[key] || 0;
      if (completion >= 80) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate best streak over the last 90 days
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 90);
    tempStreak = 0;

    for (let i = 0; i <= 90; i++) {
      const d = new Date(startDate.getTime() + i * DAY_MS);
      const key = toDateKey(d);
      const completion = dailyCompletionMap[key] || 0;
      if (completion >= 80) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    bestStreak = Math.max(bestStreak, currentStreak);

    return { current: currentStreak, best: bestStreak };
  }, [dailyMap, dailyCompletionMap, today, todayKey, activeSupplements]);

  // Weekly adherence (last 7 days)
  const weeklyAdherence = useMemo(() => {
    if (activeSupplements.length === 0) return 0;
    let totalTaken = 0;
    let totalExpected = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() - i * DAY_MS);
      const key = toDateKey(d);
      const entry = dailyMap[key];
      totalTaken += entry ? entry.taken.size : 0;
      totalExpected += activeSupplements.length;
    }
    return totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;
  }, [dailyMap, today, activeSupplements]);

  // Calendar heatmap data (last 12 weeks = 84 days)
  const heatmapData = useMemo(() => {
    const weeks: { date: Date; key: string; percentage: number; taken: number; total: number }[][] = [];
    const totalActive = activeSupplements.length;

    // Start from 83 days ago (12 weeks)
    const startDate = new Date(today.getTime() - 83 * DAY_MS);
    // Adjust to start on Monday
    const startDay = startDate.getDay();
    const adjustedStart = new Date(startDate.getTime() - ((startDay === 0 ? 6 : startDay - 1) * DAY_MS));

    let currentWeek: typeof weeks[0] = [];
    const endDate = new Date(today.getTime() + DAY_MS);

    for (let d = new Date(adjustedStart); d < endDate; d = new Date(d.getTime() + DAY_MS)) {
      const key = toDateKey(d);
      const entry = dailyMap[key];
      const taken = entry ? entry.taken.size : 0;
      const percentage = totalActive > 0 ? Math.round((taken / totalActive) * 100) : 0;

      currentWeek.push({
        date: new Date(d),
        key,
        percentage,
        taken,
        total: totalActive,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [dailyMap, today, activeSupplements]);

  // Month labels for heatmap
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    heatmapData.forEach((week, weekIdx) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
            weekIndex: weekIdx,
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [heatmapData]);

  // Recent activity (last 10 logs)
  const recentLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime())
      .slice(0, 10)
      .map(log => {
        const supp = supplements.find(s => s.id === log.supplement_id);
        return { ...log, supplementName: supp?.name || 'Unknown Supplement' };
      });
  }, [logs, supplements]);

  const getHeatmapColor = (percentage: number, isToday: boolean): string => {
    if (isToday) {
      if (percentage >= 100) return 'bg-emerald-500 ring-2 ring-emerald-300';
      if (percentage >= 80) return 'bg-emerald-400 ring-2 ring-emerald-200';
      if (percentage >= 50) return 'bg-amber-400 ring-2 ring-amber-200';
      if (percentage > 0) return 'bg-orange-400 ring-2 ring-orange-200';
      return 'bg-gray-200 ring-2 ring-purple-300';
    }
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 80) return 'bg-emerald-400';
    if (percentage >= 50) return 'bg-amber-400';
    if (percentage > 0) return 'bg-orange-300';
    return 'bg-gray-100';
  };

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = getToday();
    const diff = now.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (diff < DAY_MS) return 'Today';
    if (diff < 2 * DAY_MS) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Today's Completion */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
              <Target className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Today</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-gray-900">{todayStats.percentage}</span>
            <span className="text-sm text-gray-400 mb-1">%</span>
          </div>
          <div className="mt-2 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                todayStats.percentage >= 100 ? 'bg-emerald-500' :
                todayStats.percentage >= 80 ? 'bg-teal-500' :
                todayStats.percentage >= 50 ? 'bg-amber-500' : 'bg-orange-400'
              }`}
              style={{ width: `${Math.min(todayStats.percentage, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            {todayStats.taken}/{todayStats.totalActive} taken
            {todayStats.skipped > 0 && ` · ${todayStats.skipped} skipped`}
          </p>
        </div>

        {/* Current Streak */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Streak</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-gray-900">{streaks.current}</span>
            <span className="text-sm text-gray-400 mb-1">days</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">
            Best: {streaks.best} days
          </p>
        </div>

        {/* Weekly Adherence */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">7-Day Avg</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-gray-900">{weeklyAdherence}</span>
            <span className="text-sm text-gray-400 mb-1">%</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">
            Weekly adherence rate
          </p>
        </div>

        {/* Best Streak */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Best Streak</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-gray-900">{streaks.best}</span>
            <span className="text-sm text-gray-400 mb-1">days</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">
            Personal record
          </p>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-600" />
              Adherence Heatmap
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Last 12 weeks of supplement intake</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100" />
            <div className="w-3 h-3 rounded-sm bg-orange-300" />
            <div className="w-3 h-3 rounded-sm bg-amber-400" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>More</span>
          </div>
        </div>

        {/* Month labels */}
        <div className="ml-8 flex mb-1">
          {monthLabels.map((ml, idx) => (
            <div
              key={idx}
              className="text-[10px] text-gray-400 font-medium"
              style={{
                position: 'relative',
                left: `${ml.weekIndex * 18}px`,
                marginRight: idx < monthLabels.length - 1
                  ? `${((monthLabels[idx + 1]?.weekIndex || 0) - ml.weekIndex) * 18 - 30}px`
                  : '0',
              }}
            >
              {ml.label}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1 pt-0.5">
            {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((label, idx) => (
              <div key={idx} className="h-[14px] flex items-center">
                <span className="text-[9px] text-gray-400 w-6 text-right">{label}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex gap-0.5 overflow-x-auto">
            {heatmapData.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {week.map((day, dayIdx) => {
                  const isToday = day.key === todayKey;
                  const isFuture = day.date > today;
                  
                  return (
                    <div
                      key={dayIdx}
                      className={`w-[14px] h-[14px] rounded-sm transition-colors group relative ${
                        isFuture ? 'bg-gray-50' : getHeatmapColor(day.percentage, isToday)
                      }`}
                      title={`${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${day.taken}/${day.total} taken (${day.percentage}%)`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                        <div className="bg-gray-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                          <p className="font-medium">
                            {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-gray-300">
                            {day.taken}/{day.total} taken ({day.percentage}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Recent Activity
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Your latest supplement intake logs</p>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center">
            <Pill className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No intake logged yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Use "Mark as Taken" in your Daily Schedule to start tracking.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  log.skipped ? 'bg-red-50' : 'bg-emerald-50'
                }`}>
                  {log.skipped ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {log.supplementName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{formatDate(log.taken_at)}</span>
                    <span>at {formatTime(log.taken_at)}</span>
                    {log.notes && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="truncate">{log.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  log.skipped
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {log.skipped ? 'Skipped' : 'Taken'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivational Banner */}
      {streaks.current >= 3 && (
        <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold">
                {streaks.current >= 30 ? 'Incredible Consistency!' :
                 streaks.current >= 14 ? 'Amazing Streak!' :
                 streaks.current >= 7 ? 'One Week Strong!' :
                 'Great Momentum!'}
              </h4>
              <p className="text-sm text-purple-100 mt-0.5">
                You've maintained your supplement routine for {streaks.current} consecutive days.
                {streaks.current < streaks.best && ` Your best is ${streaks.best} days — keep going!`}
                {streaks.current >= streaks.best && streaks.current > 3 && ' This is your personal best!'}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-1 text-purple-200">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="text-lg font-bold text-white">{streaks.current}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplementIntakeLog;
