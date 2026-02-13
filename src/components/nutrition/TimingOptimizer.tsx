import React, { useState, useMemo, useCallback } from 'react';
import {
  Clock, Zap, Sunrise, Sun, Sunset, Moon, UtensilsCrossed,
  AlertTriangle, CheckCircle2, ArrowRight, RotateCcw, Loader2,
  ChevronDown, ChevronUp, Shield, ShieldAlert, ShieldX,
  Sparkles, ArrowDownUp, Info, Calendar, Timer, MoveRight,
  Check, X, Coffee, Utensils, Salad, Pill, Lightbulb
} from 'lucide-react';
import {
  DetectedInteraction,
  InteractionSeverity,
  severityConfig,
} from '@/data/supplementInteractions';
import { timeOfDayOptions } from '@/data/supplementDatabase';

// ====== TYPES ======

interface SupplementInput {
  id: string;
  name: string;
  dosage: string;
  dosage_unit: string;
  time_of_day: string;
  nutrient_ids: string[];
  active: boolean;
  reminder_time?: string | null;
}

interface TimeSlot {
  id: string;
  label: string;
  time: string;        // e.g. "7:00 AM"
  hour: number;        // 0-23
  timeOfDay: string;   // maps to time_of_day field value
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface ScheduleAssignment {
  supplementId: string;
  supplementName: string;
  dosage: string;
  dosageUnit: string;
  originalSlotId: string;
  optimizedSlotId: string;
  changed: boolean;
  reason?: string;
}

interface ConflictEdge {
  suppAId: string;
  suppBId: string;
  suppAName: string;
  suppBName: string;
  severity: InteractionSeverity;
  separationHours: number;
  interactionTitle: string;
  timingRecommendation: string;
}

interface TimingOptimizerProps {
  supplements: SupplementInput[];
  interactions: DetectedInteraction[];
  onApplySchedule: (updates: { id: string; time_of_day: string }[]) => Promise<void>;
}

// ====== CONSTANTS ======

const TIME_SLOTS: TimeSlot[] = [
  {
    id: 'early-morning',
    label: 'Early Morning',
    time: '7:00 AM',
    hour: 7,
    timeOfDay: 'morning',
    icon: <Sunrise className="w-5 h-5" />,
    description: 'Empty stomach, before breakfast',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'breakfast',
    label: 'With Breakfast',
    time: '8:30 AM',
    hour: 8,
    timeOfDay: 'morning',
    icon: <Coffee className="w-5 h-5" />,
    description: 'With morning meal (fat-soluble vitamins)',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    id: 'midday',
    label: 'Midday',
    time: '12:00 PM',
    hour: 12,
    timeOfDay: 'afternoon',
    icon: <Sun className="w-5 h-5" />,
    description: 'With lunch',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    time: '3:00 PM',
    hour: 15,
    timeOfDay: 'afternoon',
    icon: <Salad className="w-5 h-5" />,
    description: 'Between meals or with snack',
    color: 'text-lime-600',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-200',
  },
  {
    id: 'dinner',
    label: 'With Dinner',
    time: '6:00 PM',
    hour: 18,
    timeOfDay: 'evening',
    icon: <Utensils className="w-5 h-5" />,
    description: 'With evening meal',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'bedtime',
    label: 'Bedtime',
    time: '10:00 PM',
    hour: 22,
    timeOfDay: 'bedtime',
    icon: <Moon className="w-5 h-5" />,
    description: 'Before sleep',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
];

// Map existing time_of_day values to preferred slot IDs
const TIME_OF_DAY_TO_SLOT: Record<string, string> = {
  'morning': 'breakfast',
  'afternoon': 'midday',
  'evening': 'dinner',
  'bedtime': 'bedtime',
  'with-meals': 'breakfast',
};

// Preferred slots for specific supplement types (by name pattern)
const SUPPLEMENT_SLOT_PREFERENCES: { patterns: string[]; preferredSlot: string; reason: string }[] = [
  { patterns: ['iron', 'ferrous'], preferredSlot: 'early-morning', reason: 'Iron absorbs best on an empty stomach' },
  { patterns: ['thyroid', 'levothyroxine'], preferredSlot: 'early-morning', reason: 'Thyroid meds need empty stomach, 30-60min before food' },
  { patterns: ['magnesium'], preferredSlot: 'bedtime', reason: 'Magnesium promotes relaxation and sleep' },
  { patterns: ['melatonin'], preferredSlot: 'bedtime', reason: 'Melatonin should be taken 30-60min before sleep' },
  { patterns: ['tryptophan', '5-htp', '5htp'], preferredSlot: 'bedtime', reason: 'Sleep precursors work best at bedtime' },
  { patterns: ['vitamin d', 'd3', 'cholecalciferol'], preferredSlot: 'breakfast', reason: 'Fat-soluble, take with morning meal' },
  { patterns: ['vitamin a', 'retinol'], preferredSlot: 'breakfast', reason: 'Fat-soluble, take with food containing fat' },
  { patterns: ['vitamin e', 'tocopherol'], preferredSlot: 'breakfast', reason: 'Fat-soluble, take with food containing fat' },
  { patterns: ['vitamin k', 'k2', 'mk-7'], preferredSlot: 'breakfast', reason: 'Fat-soluble, take with morning meal' },
  { patterns: ['fish oil', 'omega-3', 'omega 3', 'epa', 'dha', 'krill'], preferredSlot: 'breakfast', reason: 'Fat-soluble, take with food to reduce fishy burps' },
  { patterns: ['calcium'], preferredSlot: 'dinner', reason: 'Calcium absorbs well in evening, separate from iron' },
  { patterns: ['b complex', 'b12', 'b6', 'b1', 'thiamine', 'pyridoxine'], preferredSlot: 'breakfast', reason: 'B vitamins can be energizing, take in morning' },
  { patterns: ['vitamin c', 'ascorbic'], preferredSlot: 'early-morning', reason: 'Enhances iron absorption when taken together' },
  { patterns: ['zinc'], preferredSlot: 'midday', reason: 'Take with food to avoid nausea, separate from calcium/iron' },
  { patterns: ['probiotic'], preferredSlot: 'early-morning', reason: 'Best on empty stomach or 30min before meals' },
  { patterns: ['copper'], preferredSlot: 'dinner', reason: 'Separate from zinc, take with evening meal' },
];

// ====== ALGORITHM HELPERS ======

function extractSeparationHours(timingRecommendation: string): number {
  // Parse timing recommendations for separation hours
  const patterns = [
    /at least (\d+)\s*(?:-\s*\d+)?\s*hours?\s*apart/i,
    /separate.*?by\s*(?:at least\s*)?(\d+)\s*(?:-\s*\d+)?\s*hours?/i,
    /(\d+)\s*(?:-\s*\d+)?\s*hours?\s*(?:apart|before|after|separation)/i,
    /wait\s*(?:at least\s*)?(\d+)\s*(?:-\s*\d+)?\s*hours?/i,
  ];

  for (const pattern of patterns) {
    const match = timingRecommendation.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  // Default separations by interaction type keywords
  if (timingRecommendation.toLowerCase().includes('do not') ||
      timingRecommendation.toLowerCase().includes('avoid')) {
    return 24; // Effectively never combine
  }
  return 2; // Default 2 hour separation
}

function getPreferredSlot(supplement: SupplementInput): { slotId: string; reason: string } {
  const nameLower = supplement.name.toLowerCase();

  // Check specific supplement preferences first
  for (const pref of SUPPLEMENT_SLOT_PREFERENCES) {
    if (pref.patterns.some(p => nameLower.includes(p.toLowerCase()))) {
      return { slotId: pref.preferredSlot, reason: pref.reason };
    }
  }

  // Fall back to current time_of_day mapping
  const mappedSlot = TIME_OF_DAY_TO_SLOT[supplement.time_of_day] || 'breakfast';
  return { slotId: mappedSlot, reason: 'Based on current schedule' };
}

function hoursBetweenSlots(slotA: TimeSlot, slotB: TimeSlot): number {
  return Math.abs(slotA.hour - slotB.hour);
}

function buildConflictGraph(
  supplements: SupplementInput[],
  interactions: DetectedInteraction[]
): ConflictEdge[] {
  const edges: ConflictEdge[] = [];

  for (const detected of interactions) {
    const { interaction, supplementAName, supplementBName, supplementAId, supplementBId } = detected;

    const suppA = supplements.find(s => s.id === supplementAId || s.name === supplementAName);
    const suppB = supplements.find(s => s.id === supplementBId || s.name === supplementBName);

    if (suppA && suppB) {
      edges.push({
        suppAId: suppA.id,
        suppBId: suppB.id,
        suppAName: suppA.name,
        suppBName: suppB.name,
        severity: interaction.severity,
        separationHours: extractSeparationHours(interaction.timingRecommendation),
        interactionTitle: interaction.title,
        timingRecommendation: interaction.timingRecommendation,
      });
    }
  }

  return edges;
}

function optimizeSchedule(
  supplements: SupplementInput[],
  conflicts: ConflictEdge[]
): ScheduleAssignment[] {
  const activeSupps = supplements.filter(s => s.active);
  if (activeSupps.length === 0) return [];

  // Build adjacency list with weights
  const adjacency: Record<string, { neighborId: string; weight: number; separationHours: number }[]> = {};
  for (const supp of activeSupps) {
    adjacency[supp.id] = [];
  }

  for (const conflict of conflicts) {
    const severityWeight: Record<InteractionSeverity, number> = { avoid: 100, warning: 50, caution: 10 };
    const weight = severityWeight[conflict.severity];

    if (adjacency[conflict.suppAId]) {
      adjacency[conflict.suppAId].push({
        neighborId: conflict.suppBId,
        weight,
        separationHours: conflict.separationHours,
      });
    }
    if (adjacency[conflict.suppBId]) {
      adjacency[conflict.suppBId].push({
        neighborId: conflict.suppAId,
        weight,
        separationHours: conflict.separationHours,
      });
    }
  }

  // Sort supplements by constraint level (most constrained first)
  const sortedSupps = [...activeSupps].sort((a, b) => {
    const aWeight = (adjacency[a.id] || []).reduce((sum, e) => sum + e.weight, 0);
    const bWeight = (adjacency[b.id] || []).reduce((sum, e) => sum + e.weight, 0);
    return bWeight - aWeight; // Most constrained first
  });

  // Greedy assignment
  const assignments: Record<string, string> = {}; // suppId -> slotId
  const slotOccupants: Record<string, string[]> = {}; // slotId -> suppId[]
  for (const slot of TIME_SLOTS) {
    slotOccupants[slot.id] = [];
  }

  for (const supp of sortedSupps) {
    const preferred = getPreferredSlot(supp);
    const neighbors = adjacency[supp.id] || [];

    // Score each slot
    let bestSlotId = preferred.slotId;
    let bestScore = -Infinity;

    for (const slot of TIME_SLOTS) {
      let score = 0;

      // Preference bonus
      if (slot.id === preferred.slotId) score += 30;
      // Bonus for matching current time_of_day
      if (slot.timeOfDay === supp.time_of_day) score += 15;

      // Penalty for conflicts with already-assigned supplements in this or nearby slots
      for (const neighbor of neighbors) {
        if (assignments[neighbor.neighborId] !== undefined) {
          const neighborSlot = TIME_SLOTS.find(s => s.id === assignments[neighbor.neighborId]);
          if (neighborSlot) {
            const separation = hoursBetweenSlots(slot, neighborSlot);
            if (separation < neighbor.separationHours) {
              // Penalty proportional to how much we fall short
              const shortfall = neighbor.separationHours - separation;
              score -= shortfall * neighbor.weight;
            } else {
              // Bonus for meeting separation requirement
              score += neighbor.weight * 0.5;
            }
          }
        }
      }

      // Slight penalty for overcrowded slots (prefer spreading out)
      score -= slotOccupants[slot.id].length * 2;

      if (score > bestScore) {
        bestScore = score;
        bestSlotId = slot.id;
      }
    }

    assignments[supp.id] = bestSlotId;
    slotOccupants[bestSlotId].push(supp.id);
  }

  // Build result
  return activeSupps.map(supp => {
    const originalSlotId = TIME_OF_DAY_TO_SLOT[supp.time_of_day] || 'breakfast';
    const optimizedSlotId = assignments[supp.id];
    const optimizedSlot = TIME_SLOTS.find(s => s.id === optimizedSlotId);
    const pref = getPreferredSlot(supp);

    return {
      supplementId: supp.id,
      supplementName: supp.name,
      dosage: supp.dosage,
      dosageUnit: supp.dosage_unit,
      originalSlotId,
      optimizedSlotId,
      changed: originalSlotId !== optimizedSlotId,
      reason: optimizedSlotId === pref.slotId ? pref.reason : 'Separated from conflicting supplements',
    };
  });
}

function computeConflictScore(
  assignments: ScheduleAssignment[],
  conflicts: ConflictEdge[],
  useOptimized: boolean
): { resolved: number; unresolved: number; total: number; score: number } {
  let resolved = 0;
  let unresolved = 0;

  for (const conflict of conflicts) {
    const assignA = assignments.find(a => a.supplementId === conflict.suppAId);
    const assignB = assignments.find(a => a.supplementId === conflict.suppBId);
    if (!assignA || !assignB) continue;

    const slotIdA = useOptimized ? assignA.optimizedSlotId : assignA.originalSlotId;
    const slotIdB = useOptimized ? assignB.optimizedSlotId : assignB.originalSlotId;

    const slotA = TIME_SLOTS.find(s => s.id === slotIdA);
    const slotB = TIME_SLOTS.find(s => s.id === slotIdB);

    if (slotA && slotB) {
      const separation = hoursBetweenSlots(slotA, slotB);
      if (separation >= conflict.separationHours) {
        resolved++;
      } else {
        unresolved++;
      }
    }
  }

  const total = conflicts.length;
  const score = total > 0 ? Math.round((resolved / total) * 100) : 100;
  return { resolved, unresolved, total, score };
}

// ====== COMPONENT ======

const TimingOptimizer: React.FC<TimingOptimizerProps> = ({
  supplements,
  interactions,
  onApplySchedule,
}) => {
  const [isGenerated, setIsGenerated] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedConflicts, setExpandedConflicts] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'timeline' | 'changes'>('timeline');

  const activeSupplements = useMemo(
    () => supplements.filter(s => s.active),
    [supplements]
  );

  const conflicts = useMemo(
    () => buildConflictGraph(supplements, interactions),
    [supplements, interactions]
  );

  const schedule = useMemo(() => {
    if (!isGenerated) return [];
    return optimizeSchedule(supplements, conflicts);
  }, [isGenerated, supplements, conflicts]);

  const beforeScore = useMemo(
    () => computeConflictScore(schedule, conflicts, false),
    [schedule, conflicts]
  );

  const afterScore = useMemo(
    () => computeConflictScore(schedule, conflicts, true),
    [schedule, conflicts]
  );

  const changedCount = useMemo(
    () => schedule.filter(a => a.changed).length,
    [schedule]
  );

  // Group schedule by optimized slot for timeline view
  const timelineGroups = useMemo(() => {
    const groups: Record<string, ScheduleAssignment[]> = {};
    for (const slot of TIME_SLOTS) {
      groups[slot.id] = [];
    }
    for (const assignment of schedule) {
      const slotId = assignment.optimizedSlotId;
      if (groups[slotId]) {
        groups[slotId].push(assignment);
      }
    }
    return groups;
  }, [schedule]);

  // Group current schedule by slot for comparison
  const currentGroups = useMemo(() => {
    const groups: Record<string, SupplementInput[]> = {};
    for (const slot of TIME_SLOTS) {
      groups[slot.id] = [];
    }
    for (const supp of activeSupplements) {
      const slotId = TIME_OF_DAY_TO_SLOT[supp.time_of_day] || 'breakfast';
      if (groups[slotId]) {
        groups[slotId].push(supp);
      }
    }
    return groups;
  }, [activeSupplements]);

  const handleGenerate = useCallback(() => {
    setIsGenerated(true);
    setApplied(false);
  }, []);

  const handleApply = useCallback(async () => {
    if (schedule.length === 0) return;
    setIsApplying(true);
    try {
      const updates = schedule
        .filter(a => a.changed)
        .map(a => {
          const slot = TIME_SLOTS.find(s => s.id === a.optimizedSlotId);
          return {
            id: a.supplementId,
            time_of_day: slot?.timeOfDay || 'morning',
          };
        });
      await onApplySchedule(updates);
      setApplied(true);
    } catch (err) {
      console.error('Failed to apply schedule:', err);
    } finally {
      setIsApplying(false);
    }
  }, [schedule, onApplySchedule]);

  const handleReset = useCallback(() => {
    setIsGenerated(false);
    setApplied(false);
    setShowDetails(false);
    setExpandedConflicts(new Set());
  }, []);

  const toggleConflict = (idx: number) => {
    setExpandedConflicts(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ====== RENDER ======

  if (activeSupplements.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
          <Timer className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Need More Supplements</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Add at least 2 active supplements to your stack to use the timing optimizer.
          The optimizer analyzes interactions and creates an optimal daily schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-b border-purple-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Timing Optimizer</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  AI-powered schedule that minimizes supplement interactions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-lg border border-purple-100">
                <Pill className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">{activeSupplements.length} supplements</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-lg border border-purple-100">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">{conflicts.length} conflicts</span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        {!isGenerated && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  icon: <ArrowDownUp className="w-5 h-5 text-violet-500" />,
                  title: 'Analyzes Interactions',
                  desc: 'Maps all known conflicts between your supplements and required separation times',
                },
                {
                  icon: <Calendar className="w-5 h-5 text-purple-500" />,
                  title: 'Optimizes Timing',
                  desc: 'Uses constraint-based scheduling to find the best time slots for each supplement',
                },
                {
                  icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
                  title: 'Applies Schedule',
                  desc: 'Updates your supplement timing with one click to minimize negative interactions',
                },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Schedule Overview */}
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Current Schedule
              </h4>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gray-200" />
                <div className="space-y-1">
                  {TIME_SLOTS.map(slot => {
                    const supps = currentGroups[slot.id] || [];
                    if (supps.length === 0) return null;
                    return (
                      <div key={slot.id} className="flex items-start gap-4 relative">
                        <div className={`w-12 h-12 rounded-xl ${slot.bgColor} flex flex-col items-center justify-center flex-shrink-0 z-10 border ${slot.borderColor}`}>
                          <div className={slot.color}>{slot.icon}</div>
                        </div>
                        <div className="flex-1 py-1.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-700">{slot.time}</span>
                            <span className="text-xs text-gray-400">{slot.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {supps.map(s => (
                              <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                                <Pill className="w-3 h-3 text-purple-400" />
                                {s.name}
                                <span className="text-gray-400">{s.dosage}{s.dosage_unit}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detected Conflicts Summary */}
            {conflicts.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Timing Conflicts to Resolve
                </h4>
                <div className="space-y-2">
                  {conflicts.map((conflict, idx) => {
                    const isExpanded = expandedConflicts.has(idx);
                    const cfg = severityConfig[conflict.severity];
                    return (
                      <div key={idx} className={`rounded-xl border ${cfg.borderColor} overflow-hidden`}>
                        <button
                          onClick={() => toggleConflict(idx)}
                          className={`w-full flex items-center gap-3 p-3 ${cfg.bgColor} text-left transition-colors hover:brightness-[0.98]`}
                        >
                          <div className={cfg.iconColor}>
                            {conflict.severity === 'avoid' ? <ShieldX className="w-4 h-4" /> :
                             conflict.severity === 'warning' ? <ShieldAlert className="w-4 h-4" /> :
                             <Shield className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${cfg.color}`}>{conflict.interactionTitle}</p>
                            <p className="text-[11px] text-gray-500">
                              {conflict.suppAName} + {conflict.suppBName}
                              <span className="mx-1.5">·</span>
                              <span className="font-medium">Need {conflict.separationHours}h+ separation</span>
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                            {cfg.label}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                        {isExpanded && (
                          <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-2">
                            <p className="text-xs text-gray-600 leading-relaxed">{conflict.timingRecommendation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white text-base font-bold rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Generate Optimal Schedule
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Generated Schedule */}
        {isGenerated && (
          <div className="p-6">
            {/* Score Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Before Score */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Schedule</p>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-black ${
                    beforeScore.score >= 80 ? 'text-emerald-600' :
                    beforeScore.score >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>{beforeScore.score}%</span>
                  <span className="text-xs text-gray-400 mb-1">conflict-free</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] text-emerald-600 font-medium">{beforeScore.resolved} resolved</span>
                  <span className="text-[11px] text-red-500 font-medium">{beforeScore.unresolved} unresolved</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-gray-300 to-purple-400" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-purple-400 to-emerald-400" />
                </div>
              </div>

              {/* After Score */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Optimized Schedule</p>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-black ${
                    afterScore.score >= 80 ? 'text-emerald-600' :
                    afterScore.score >= 50 ? 'text-amber-600' : 'text-orange-600'
                  }`}>{afterScore.score}%</span>
                  <span className="text-xs text-gray-400 mb-1">conflict-free</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[11px] text-emerald-600 font-medium">{afterScore.resolved} resolved</span>
                  {afterScore.unresolved > 0 && (
                    <span className="text-[11px] text-orange-500 font-medium">{afterScore.unresolved} remaining</span>
                  )}
                </div>
                {afterScore.score > beforeScore.score && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    +{afterScore.score - beforeScore.score}% improvement
                  </p>
                )}
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'timeline' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Timeline View</span>
              </button>
              <button
                onClick={() => setViewMode('changes')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'changes' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center gap-1.5"><MoveRight className="w-3.5 h-3.5" /> Changes ({changedCount})</span>
              </button>
            </div>

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="relative mb-6">
                {/* Vertical timeline line */}
                <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-amber-300 via-purple-300 to-indigo-300" />

                <div className="space-y-2">
                  {TIME_SLOTS.map((slot, slotIdx) => {
                    const assignedSupps = timelineGroups[slot.id] || [];
                    const hasSupps = assignedSupps.length > 0;

                    return (
                      <div key={slot.id} className={`flex items-start gap-4 relative ${!hasSupps ? 'opacity-40' : ''}`}>
                        {/* Time marker */}
                        <div className="flex flex-col items-center flex-shrink-0 z-10">
                          <div className={`w-14 h-14 rounded-2xl ${hasSupps ? slot.bgColor : 'bg-gray-50'} flex flex-col items-center justify-center border ${hasSupps ? slot.borderColor : 'border-gray-200'} shadow-sm`}>
                            <div className={hasSupps ? slot.color : 'text-gray-400'}>{slot.icon}</div>
                            <span className={`text-[9px] font-bold mt-0.5 ${hasSupps ? slot.color : 'text-gray-400'}`}>
                              {slot.time.replace(' ', '')}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 py-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h5 className={`text-sm font-bold ${hasSupps ? 'text-gray-800' : 'text-gray-400'}`}>
                              {slot.label}
                            </h5>
                            <span className="text-[10px] text-gray-400">{slot.description}</span>
                          </div>

                          {hasSupps ? (
                            <div className="space-y-1.5">
                              {assignedSupps.map(assignment => {
                                const wasChanged = assignment.changed;
                                return (
                                  <div
                                    key={assignment.supplementId}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                                      wasChanged
                                        ? 'bg-purple-50 border-purple-200 shadow-sm'
                                        : 'bg-white border-gray-150 shadow-sm'
                                    }`}
                                  >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                      wasChanged ? 'bg-purple-100' : 'bg-gray-50'
                                    }`}>
                                      <Pill className={`w-4 h-4 ${wasChanged ? 'text-purple-500' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{assignment.supplementName}</p>
                                        <span className="text-xs text-gray-400">{assignment.dosage} {assignment.dosageUnit}</span>
                                      </div>
                                      {assignment.reason && (
                                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                          <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                          {assignment.reason}
                                        </p>
                                      )}
                                    </div>
                                    {wasChanged && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full flex-shrink-0 flex items-center gap-1">
                                        <MoveRight className="w-3 h-3" />
                                        Moved
                                      </span>
                                    )}
                                    {!wasChanged && (
                                      <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full flex-shrink-0">
                                        No change
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No supplements scheduled</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Changes View */}
            {viewMode === 'changes' && (
              <div className="mb-6 space-y-2">
                {changedCount === 0 ? (
                  <div className="text-center py-8 bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-800">Your schedule is already optimal!</p>
                    <p className="text-xs text-emerald-600 mt-1">No changes needed for your current supplement timing.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3">
                      {changedCount} supplement{changedCount !== 1 ? 's' : ''} will be rescheduled:
                    </p>
                    {schedule.filter(a => a.changed).map(assignment => {
                      const fromSlot = TIME_SLOTS.find(s => s.id === assignment.originalSlotId);
                      const toSlot = TIME_SLOTS.find(s => s.id === assignment.optimizedSlotId);
                      if (!fromSlot || !toSlot) return null;

                      return (
                        <div key={assignment.supplementId} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                            <Pill className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800">{assignment.supplementName}</p>
                            <p className="text-xs text-gray-400">{assignment.dosage} {assignment.dosageUnit}</p>
                          </div>
                          {/* From */}
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${fromSlot.bgColor} border ${fromSlot.borderColor}`}>
                            <div className={`${fromSlot.color} scale-75`}>{fromSlot.icon}</div>
                            <span className={`text-xs font-semibold ${fromSlot.color}`}>{fromSlot.time}</span>
                          </div>
                          {/* Arrow */}
                          <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          {/* To */}
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${toSlot.bgColor} border ${toSlot.borderColor} ring-2 ring-purple-200`}>
                            <div className={`${toSlot.color} scale-75`}>{toSlot.icon}</div>
                            <span className={`text-xs font-semibold ${toSlot.color}`}>{toSlot.time}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Unchanged supplements */}
                    {schedule.filter(a => !a.changed).length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowDetails(!showDetails)}
                          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-2"
                        >
                          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {schedule.filter(a => !a.changed).length} supplement{schedule.filter(a => !a.changed).length !== 1 ? 's' : ''} unchanged
                        </button>
                        {showDetails && (
                          <div className="space-y-1.5">
                            {schedule.filter(a => !a.changed).map(assignment => {
                              const slot = TIME_SLOTS.find(s => s.id === assignment.optimizedSlotId);
                              return (
                                <div key={assignment.supplementId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <Pill className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 flex-1">{assignment.supplementName}</span>
                                  <span className="text-xs text-gray-400">{slot?.time} · {slot?.label}</span>
                                  <Check className="w-4 h-4 text-emerald-500" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Conflict Resolution Details */}
            {conflicts.length > 0 && (
              <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Conflict Resolution Summary
                </h4>
                <div className="space-y-2">
                  {conflicts.map((conflict, idx) => {
                    const assignA = schedule.find(a => a.supplementId === conflict.suppAId);
                    const assignB = schedule.find(a => a.supplementId === conflict.suppBId);
                    if (!assignA || !assignB) return null;

                    const slotA = TIME_SLOTS.find(s => s.id === assignA.optimizedSlotId);
                    const slotB = TIME_SLOTS.find(s => s.id === assignB.optimizedSlotId);
                    if (!slotA || !slotB) return null;

                    const separation = hoursBetweenSlots(slotA, slotB);
                    const isResolved = separation >= conflict.separationHours;
                    const cfg = severityConfig[conflict.severity];

                    return (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isResolved ? 'bg-emerald-50 border-emerald-200' : `${cfg.bgColor} ${cfg.borderColor}`
                      }`}>
                        {isResolved ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${isResolved ? 'text-emerald-800' : cfg.color}`}>
                            {conflict.suppAName} + {conflict.suppBName}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {slotA.time} & {slotB.time} = <span className="font-bold">{separation}h separation</span>
                            <span className="mx-1">·</span>
                            Need {conflict.separationHours}h+
                          </p>
                        </div>
                        {isResolved ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Resolved</span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 ${cfg.badgeBg} ${cfg.badgeText} rounded-full`}>
                            {separation}h / {conflict.separationHours}h needed
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {changedCount > 0 && !applied && (
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApplying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  Apply Optimized Schedule ({changedCount} change{changedCount !== 1 ? 's' : ''})
                </button>
              )}
              {applied && (
                <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-sm font-bold rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                  Schedule Applied Successfully!
                </div>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tips Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-800 mb-2">Timing Tips for Better Absorption</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { tip: 'Iron absorbs best on an empty stomach with vitamin C', icon: <Sunrise className="w-3.5 h-3.5 text-amber-500" /> },
                { tip: 'Fat-soluble vitamins (A, D, E, K) need dietary fat', icon: <Utensils className="w-3.5 h-3.5 text-orange-500" /> },
                { tip: 'Calcium and iron should be separated by 2+ hours', icon: <Timer className="w-3.5 h-3.5 text-red-500" /> },
                { tip: 'Magnesium at bedtime promotes relaxation and sleep', icon: <Moon className="w-3.5 h-3.5 text-indigo-500" /> },
                { tip: 'B vitamins are energizing — take in the morning', icon: <Zap className="w-3.5 h-3.5 text-yellow-500" /> },
                { tip: 'Zinc with food reduces nausea, separate from calcium', icon: <Sun className="w-3.5 h-3.5 text-lime-500" /> },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-blue-700">
                  <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                  <span>{item.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-600">Disclaimer:</span> This optimizer provides general guidance based on published research about supplement interactions and absorption. 
          Individual responses may vary. Always consult your healthcare provider before making significant changes to your supplement regimen, 
          especially if you take prescription medications.
        </p>
      </div>
    </div>
  );
};

export default TimingOptimizer;
