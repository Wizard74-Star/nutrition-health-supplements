import React, { useState, useEffect } from 'react';
import { usePayment } from '@/context/PaymentContext';
import { useAuth } from '@/context/AuthContext';
import { Clock, Zap, X, Gift, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';

const TRIAL_DURATION_DAYS = 7;

const TrialBanner: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    trial,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
    trialHoursRemaining,
    trialMinutesRemaining,
    trialEndsAt,
    hasPaid,
    trialLoading,
    trialBannerDismissed,
    dismissTrialBanner,
    setShowPaywall,
  } = usePayment();

  const [liveMinutes, setLiveMinutes] = useState(trialMinutesRemaining);
  const [liveHours, setLiveHours] = useState(trialHoursRemaining);
  const [liveDays, setLiveDays] = useState(trialDaysRemaining);
  const [liveSeconds, setLiveSeconds] = useState(0);

  // Live countdown every second for the last 24 hours
  useEffect(() => {
    if (!trialEndsAt || !isTrialActive) return;

    const updateLive = () => {
      const now = new Date();
      const msRemaining = Math.max(0, trialEndsAt.getTime() - now.getTime());
      const d = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
      const h = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((msRemaining % (1000 * 60)) / 1000);
      setLiveDays(d);
      setLiveHours(h);
      setLiveMinutes(m);
      setLiveSeconds(s);
    };

    updateLive();
    const interval = setInterval(updateLive, 1000);
    return () => clearInterval(interval);
  }, [trialEndsAt, isTrialActive]);

  // Don't show if: not authenticated, already paid, no trial, loading, or dismissed
  if (!isAuthenticated || hasPaid || !trial || trialLoading) return null;
  if (trialBannerDismissed && isTrialActive) return null;

  // Calculate progress percentage (how much trial time has elapsed)
  const totalMs = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const trialStartedAt = trial.trial_started_at ? new Date(trial.trial_started_at) : new Date();
  const elapsed = Math.max(0, new Date().getTime() - trialStartedAt.getTime());
  const progressPct = Math.min(100, (elapsed / totalMs) * 100);

  // Urgency levels
  const isUrgent = liveDays === 0 && liveHours < 24; // Last 24 hours
  const isCritical = liveDays === 0 && liveHours < 6; // Last 6 hours
  const isLastDay = liveDays === 0;

  // Trial expired state
  if (isTrialExpired || trial.converted_to_paid) {
    if (trial.converted_to_paid) return null; // Already paid

    return (
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white shadow-lg shadow-red-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">Your free trial has expired</p>
                <p className="text-xs text-red-100 hidden sm:block">
                  Upgrade to NutriCheck Pro to continue accessing all premium features
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2 bg-white text-red-600 font-bold text-sm rounded-full hover:bg-red-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Zap className="w-4 h-4" />
              Upgrade Now — €5.49
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active trial banner
  return (
    <div className={`relative overflow-hidden transition-all duration-500 ${
      isCritical
        ? 'bg-gradient-to-r from-red-500 via-orange-500 to-amber-500'
        : isUrgent
          ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500'
          : isLastDay
            ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400'
            : 'bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500'
    } text-white shadow-lg ${
      isCritical ? 'shadow-red-200/50' : isUrgent ? 'shadow-orange-200/50' : 'shadow-purple-200/50'
    }`}>
      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical ? 'bg-red-300' : isUrgent ? 'bg-orange-300' : 'bg-white/40'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 gap-3">
          {/* Left: Trial info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isCritical ? 'bg-red-400/30 animate-pulse' : isUrgent ? 'bg-orange-400/30' : 'bg-white/15'
            }`}>
              {isCritical ? (
                <AlertTriangle className="w-4 h-4" />
              ) : liveDays >= 5 ? (
                <Gift className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold truncate">
                  {isCritical
                    ? 'Trial ending soon!'
                    : isLastDay
                      ? 'Last day of your free trial'
                      : liveDays >= 5
                        ? 'Enjoying your free trial'
                        : `${liveDays} day${liveDays !== 1 ? 's' : ''} left in your trial`
                  }
                </p>
                {liveDays >= 5 && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Pro Access
                  </span>
                )}
              </div>
              <p className="text-xs opacity-80 hidden sm:block">
                {isCritical
                  ? 'Upgrade now to keep all your data and premium features'
                  : isLastDay
                    ? 'Your trial expires today — upgrade to keep full access'
                    : `Full access to all premium features until ${trialEndsAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                }
              </p>
            </div>
          </div>

          {/* Center: Countdown */}
          <div className="hidden md:flex items-center gap-1.5">
            <CountdownUnit value={liveDays} label="days" urgent={isCritical} />
            <span className="text-white/50 font-bold text-lg">:</span>
            <CountdownUnit value={liveHours} label="hrs" urgent={isCritical} />
            <span className="text-white/50 font-bold text-lg">:</span>
            <CountdownUnit value={liveMinutes} label="min" urgent={isCritical} />
            {isLastDay && (
              <>
                <span className="text-white/50 font-bold text-lg">:</span>
                <CountdownUnit value={liveSeconds} label="sec" urgent={isCritical} />
              </>
            )}
          </div>

          {/* Mobile countdown */}
          <div className="flex md:hidden items-center gap-1 text-xs font-mono font-bold bg-black/15 px-2.5 py-1 rounded-lg">
            <Clock className="w-3 h-3 opacity-70" />
            {liveDays > 0 && <span>{liveDays}d</span>}
            <span>{String(liveHours).padStart(2, '0')}h</span>
            <span>{String(liveMinutes).padStart(2, '0')}m</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowPaywall(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 font-bold text-xs rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                isCritical
                  ? 'bg-white text-red-600 hover:bg-red-50'
                  : isUrgent
                    ? 'bg-white text-orange-600 hover:bg-orange-50'
                    : 'bg-white text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upgrade — €5.49</span>
              <span className="sm:hidden">Upgrade</span>
            </button>
            {!isLastDay && (
              <button
                onClick={dismissTrialBanner}
                className="p-1 rounded-full hover:bg-white/15 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4 opacity-70" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Countdown unit component
function CountdownUnit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div className={`flex flex-col items-center min-w-[40px] px-2 py-1 rounded-lg ${
      urgent ? 'bg-red-600/30' : 'bg-black/15'
    }`}>
      <span className={`text-lg font-bold font-mono leading-none tabular-nums ${
        urgent ? 'animate-pulse' : ''
      }`}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] uppercase tracking-wider opacity-70 font-semibold">{label}</span>
    </div>
  );
}

export default TrialBanner;
