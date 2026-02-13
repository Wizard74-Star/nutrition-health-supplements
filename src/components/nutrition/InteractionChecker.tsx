import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, AlertOctagon, Info, ChevronDown, ChevronUp,
  Clock, Shield, ShieldAlert, ShieldX, ArrowDownUp, TrendingDown,
  Swords, Pill, Zap, BookOpen, X, ChevronRight, ExternalLink
} from 'lucide-react';
import {
  DetectedInteraction,
  severityConfig,
  InteractionSeverity,
} from '@/data/supplementInteractions';

interface InteractionCheckerProps {
  interactions: DetectedInteraction[];
  /** Compact mode for inline display (e.g., in add form) */
  compact?: boolean;
  /** Show only interactions above this severity */
  minSeverity?: InteractionSeverity;
  /** Callback when user dismisses an interaction */
  onDismiss?: (interactionId: string) => void;
  /** Max interactions to show before "show more" */
  maxVisible?: number;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'absorption': return <ArrowDownUp className="w-4 h-4" />;
    case 'depletion': return <TrendingDown className="w-4 h-4" />;
    case 'antagonism': return <Swords className="w-4 h-4" />;
    case 'medication': return <Pill className="w-4 h-4" />;
    case 'toxicity': return <AlertOctagon className="w-4 h-4" />;
    default: return <Info className="w-4 h-4" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'absorption': return 'Absorption Competition';
    case 'depletion': return 'Nutrient Depletion';
    case 'antagonism': return 'Antagonistic Effect';
    case 'medication': return 'Medication Interaction';
    case 'toxicity': return 'Toxicity / Overlap Risk';
    default: return 'Interaction';
  }
};

const getSeverityIcon = (severity: InteractionSeverity) => {
  switch (severity) {
    case 'avoid': return <ShieldX className="w-5 h-5" />;
    case 'warning': return <ShieldAlert className="w-5 h-5" />;
    case 'caution': return <Shield className="w-5 h-5" />;
  }
};

const InteractionCard: React.FC<{
  detected: DetectedInteraction;
  compact?: boolean;
  onDismiss?: (id: string) => void;
}> = ({ detected, compact, onDismiss }) => {
  const [expanded, setExpanded] = useState(false);
  const { interaction } = detected;
  const config = severityConfig[interaction.severity];

  if (compact) {
    return (
      <div className={`flex items-start gap-3 p-3 rounded-xl border ${config.bgColor} ${config.borderColor}`}>
        <div className={`mt-0.5 flex-shrink-0 ${config.iconColor}`}>
          {getSeverityIcon(interaction.severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}>
              {config.label}
            </span>
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              {getCategoryIcon(interaction.category)}
              {getCategoryLabel(interaction.category)}
            </span>
          </div>
          <p className={`text-sm font-semibold ${config.color}`}>{interaction.title}</p>
          <p className="text-xs text-gray-600 mt-1">
            <span className="font-medium">{detected.supplementAName}</span>
            {' + '}
            <span className="font-medium">{detected.supplementBName}</span>
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-gray-700 mt-1.5 flex items-center gap-1 transition-colors"
          >
            {expanded ? 'Hide details' : 'Show details'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2 animate-in slide-in-from-top-1">
              <p className="text-xs text-gray-600 leading-relaxed">{interaction.explanation}</p>
              <div className="flex items-start gap-2 p-2 bg-white/70 rounded-lg border border-white">
                <Clock className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-teal-800 font-medium leading-relaxed">{interaction.timingRecommendation}</p>
              </div>
              {interaction.source && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {interaction.source}
                </p>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(interaction.id)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Full-size card
  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${config.borderColor} ${
      expanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-4 p-4 ${config.bgColor} transition-colors hover:brightness-[0.98]`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.badgeBg}`}>
          <div className={config.iconColor}>
            {getSeverityIcon(interaction.severity)}
          </div>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText} uppercase tracking-wide`}>
              {config.label}
            </span>
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              {getCategoryIcon(interaction.category)}
              {getCategoryLabel(interaction.category)}
            </span>
          </div>
          <p className={`text-sm font-bold ${config.color}`}>{interaction.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-medium text-gray-700 bg-white/60 px-2 py-0.5 rounded-md">
              {detected.supplementAName}
            </span>
            <Zap className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-700 bg-white/60 px-2 py-0.5 rounded-md">
              {detected.supplementBName}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-5 bg-white space-y-4 animate-in slide-in-from-top-2">
          {/* Explanation */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              What happens
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">{interaction.explanation}</p>
          </div>

          {/* Timing Recommendation */}
          <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
            <h4 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Timing Recommendation
            </h4>
            <p className="text-sm text-teal-800 leading-relaxed font-medium">{interaction.timingRecommendation}</p>
          </div>

          {/* Severity Description */}
          <div className={`p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
            <p className={`text-xs ${config.color} flex items-center gap-1.5`}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">{config.description}</span>
            </p>
          </div>

          {/* Source */}
          {interaction.source && (
            <div className="flex items-center gap-2 pt-1">
              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs text-gray-400 italic">{interaction.source}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InteractionChecker: React.FC<InteractionCheckerProps> = ({
  interactions,
  compact = false,
  minSeverity,
  onDismiss,
  maxVisible = 10,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<InteractionSeverity | 'all'>('all');

  const filteredInteractions = useMemo(() => {
    let result = interactions.filter(d => !dismissedIds.has(d.interaction.id));

    if (minSeverity) {
      const severityOrder: Record<InteractionSeverity, number> = { avoid: 0, warning: 1, caution: 2 };
      const minLevel = severityOrder[minSeverity];
      result = result.filter(d => severityOrder[d.interaction.severity] <= minLevel);
    }

    if (filterSeverity !== 'all') {
      result = result.filter(d => d.interaction.severity === filterSeverity);
    }

    return result;
  }, [interactions, dismissedIds, minSeverity, filterSeverity]);

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    onDismiss?.(id);
  };

  const severityCounts = useMemo(() => {
    const counts = { avoid: 0, warning: 0, caution: 0 };
    interactions.filter(d => !dismissedIds.has(d.interaction.id)).forEach(d => {
      counts[d.interaction.severity]++;
    });
    return counts;
  }, [interactions, dismissedIds]);

  const totalActive = severityCounts.avoid + severityCounts.warning + severityCounts.caution;

  if (totalActive === 0) {
    if (compact) return null;
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-emerald-800 mb-1">No Interactions Detected</h3>
        <p className="text-sm text-emerald-600">
          Your current supplement stack has no known negative interactions. Great job!
        </p>
      </div>
    );
  }

  const visibleInteractions = showAll ? filteredInteractions : filteredInteractions.slice(0, maxVisible);
  const hasMore = filteredInteractions.length > maxVisible;

  if (compact) {
    return (
      <div className="space-y-2">
        {visibleInteractions.map((detected, idx) => (
          <InteractionCard
            key={`${detected.interaction.id}-${idx}`}
            detected={detected}
            compact
            onDismiss={handleDismiss}
          />
        ))}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-2 transition-colors flex items-center justify-center gap-1"
          >
            Show {filteredInteractions.length - maxVisible} more interactions
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Interaction Checker</h3>
                <p className="text-sm text-gray-500">
                  {totalActive} interaction{totalActive !== 1 ? 's' : ''} detected in your stack
                </p>
              </div>
            </div>

            {/* Severity Summary Badges */}
            <div className="flex items-center gap-2">
              {severityCounts.avoid > 0 && (
                <button
                  onClick={() => setFilterSeverity(filterSeverity === 'avoid' ? 'all' : 'avoid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterSeverity === 'avoid'
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  <ShieldX className="w-3.5 h-3.5" />
                  {severityCounts.avoid} Avoid
                </button>
              )}
              {severityCounts.warning > 0 && (
                <button
                  onClick={() => setFilterSeverity(filterSeverity === 'warning' ? 'all' : 'warning')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterSeverity === 'warning'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {severityCounts.warning} Warning
                </button>
              )}
              {severityCounts.caution > 0 && (
                <button
                  onClick={() => setFilterSeverity(filterSeverity === 'caution' ? 'all' : 'caution')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterSeverity === 'caution'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {severityCounts.caution} Caution
                </button>
              )}
              {filterSeverity !== 'all' && (
                <button
                  onClick={() => setFilterSeverity('all')}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 transition-colors"
                >
                  Show all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Severity Legend */}
        <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-4">
          {(['avoid', 'warning', 'caution'] as const).map(sev => {
            const cfg = severityConfig[sev];
            return (
              <div key={sev} className="flex items-center gap-1.5 text-xs">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  sev === 'avoid' ? 'bg-red-500' :
                  sev === 'warning' ? 'bg-orange-500' : 'bg-amber-500'
                }`} />
                <span className="font-semibold text-gray-700">{cfg.label}:</span>
                <span className="text-gray-500">{cfg.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interaction Cards */}
      <div className="space-y-3">
        {visibleInteractions.map((detected, idx) => (
          <InteractionCard
            key={`${detected.interaction.id}-${idx}`}
            detected={detected}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {/* Show More */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
        >
          Show {filteredInteractions.length - maxVisible} more interaction{filteredInteractions.length - maxVisible !== 1 ? 's' : ''}
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-blue-800 font-semibold mb-1">Important Disclaimer</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            This interaction checker provides general guidance based on published research. It is not a substitute for professional medical advice. 
            Always consult your healthcare provider or pharmacist about potential supplement-drug interactions, especially if you take prescription medications.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractionChecker;
