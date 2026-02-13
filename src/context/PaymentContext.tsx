import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface PaymentRecord {
  id: string;
  status: string;
  webhook_verified: boolean;
  webhook_verified_at: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
}

interface TrialInfo {
  id: string;
  user_id: string;
  email: string;
  trial_started_at: string;
  trial_ends_at: string;
  is_active: boolean;
  converted_to_paid: boolean;
  converted_at: string | null;
  is_expired?: boolean;
  days_remaining?: number;
  hours_remaining?: number;
  minutes_remaining?: number;
  ms_remaining?: number;
}

interface PaymentState {
  hasPaid: boolean;
  loading: boolean;
  paymentError: string | null;
  showPaywall: boolean;
  webhookVerified: boolean;
  lastPayment: PaymentRecord | null;
  // Trial state
  trial: TrialInfo | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  trialHoursRemaining: number;
  trialMinutesRemaining: number;
  trialEndsAt: Date | null;
  trialLoading: boolean;
  hasFullAccess: boolean; // true if paid OR trial active
  // Actions
  setShowPaywall: (show: boolean) => void;
  checkPaymentStatus: () => Promise<void>;
  recordPayment: (paymentIntentId: string, customerId: string) => Promise<void>;
  verifyPaymentServerSide: (paymentIntentId: string) => Promise<boolean>;
  startTrial: () => Promise<boolean>;
  checkTrialStatus: () => Promise<void>;
  dismissTrialBanner: () => void;
  trialBannerDismissed: boolean;
}

const PaymentContext = createContext<PaymentState | undefined>(undefined);

const TRIAL_DURATION_DAYS = 7;

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [webhookVerified, setWebhookVerified] = useState(false);
  const [lastPayment, setLastPayment] = useState<PaymentRecord | null>(null);

  // Trial state
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [trialCountdown, setTrialCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const trialStartedRef = useRef(false);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Computed trial state
  const trialEndsAt = trial?.trial_ends_at ? new Date(trial.trial_ends_at) : null;
  const isTrialExpired = trial ? (trialEndsAt ? new Date() >= trialEndsAt : true) : false;
  const isTrialActive = trial ? (trial.is_active && !isTrialExpired && !trial.converted_to_paid) : false;
  const hasFullAccess = hasPaid || isTrialActive;

  // Update countdown timer
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!trialEndsAt || !isTrialActive) {
      setTrialCountdown({ days: 0, hours: 0, minutes: 0 });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const msRemaining = Math.max(0, trialEndsAt.getTime() - now.getTime());

      if (msRemaining <= 0) {
        setTrialCountdown({ days: 0, hours: 0, minutes: 0 });
        // Trial just expired - trigger paywall
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        // Refresh trial status
        checkTrialStatus();
        return;
      }

      const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

      setTrialCountdown({ days, hours, minutes });
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 60000); // Update every minute

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [trialEndsAt, isTrialActive]);

  const checkPaymentStatus = useCallback(async () => {
    if (!user?.id) {
      setHasPaid(false);
      setWebhookVerified(false);
      setLastPayment(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_payments')
        .select('id, status, webhook_verified, webhook_verified_at, stripe_payment_intent_id, paid_at')
        .eq('user_id', user.id)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking payment status:', error);
        setPaymentError('Could not verify payment status');
        setHasPaid(false);
      } else if (data && data.length > 0) {
        setHasPaid(true);
        setWebhookVerified(data[0].webhook_verified || false);
        setLastPayment(data[0] as PaymentRecord);
      } else {
        // Check for webhook-verified payments
        const { data: pendingData } = await supabase
          .from('user_payments')
          .select('id, status, webhook_verified, webhook_verified_at, stripe_payment_intent_id, paid_at')
          .eq('user_id', user.id)
          .eq('webhook_verified', true)
          .eq('status', 'succeeded')
          .order('created_at', { ascending: false })
          .limit(1);

        if (pendingData && pendingData.length > 0) {
          setHasPaid(true);
          setWebhookVerified(true);
          setLastPayment(pendingData[0] as PaymentRecord);
          console.log('[PaymentContext] Payment found via webhook verification safety net');
        } else {
          setHasPaid(false);
          setWebhookVerified(false);
          setLastPayment(null);
        }
      }
    } catch (err) {
      console.error('Error checking payment:', err);
      setHasPaid(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const checkTrialStatus = useCallback(async () => {
    if (!user?.id) {
      setTrial(null);
      return;
    }

    try {
      setTrialLoading(true);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          action: 'check-trial',
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error checking trial status:', error);
        // Fallback: check directly from database
        const { data: trialData } = await supabase
          .from('user_trials')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (trialData) {
          const now = new Date();
          const endsAt = new Date(trialData.trial_ends_at);
          const expired = now >= endsAt;
          setTrial({
            ...trialData,
            is_expired: expired,
            days_remaining: expired ? 0 : Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            hours_remaining: expired ? 0 : Math.floor((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60)),
          } as TrialInfo);
        }
        return;
      }

      if (data?.trial) {
        setTrial(data.trial as TrialInfo);
      } else {
        setTrial(null);
      }
    } catch (err) {
      console.error('Error checking trial:', err);
    } finally {
      setTrialLoading(false);
    }
  }, [user?.id]);

  const startTrial = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !user?.email) return false;

    try {
      setTrialLoading(true);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          action: 'start-trial',
          userId: user.id,
          email: user.email,
        },
      });

      if (error) {
        console.error('Error starting trial:', error);
        return false;
      }

      if (data?.already_paid) {
        // User already paid, no trial needed
        setHasPaid(true);
        return true;
      }

      if (data?.trial) {
        setTrial(data.trial as TrialInfo);
        console.log('[PaymentContext] Trial started/loaded:', data.trial);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error starting trial:', err);
      return false;
    } finally {
      setTrialLoading(false);
    }
  }, [user?.id, user?.email]);

  const recordPayment = useCallback(async (paymentIntentId: string, customerId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_payments')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          stripe_payment_intent_id: paymentIntentId,
          stripe_customer_id: customerId,
          amount: 549,
          currency: 'eur',
          status: 'succeeded',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'stripe_payment_intent_id'
        });

      if (error) {
        console.error('Error recording payment:', error);
        const { error: insertError } = await supabase
          .from('user_payments')
          .insert({
            user_id: user.id,
            email: user.email || '',
            stripe_payment_intent_id: paymentIntentId,
            stripe_customer_id: customerId,
            amount: 549,
            currency: 'eur',
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error inserting payment (fallback):', insertError);
          setPaymentError('Payment processed but could not be recorded. The webhook will verify it shortly.');
        } else {
          setHasPaid(true);
          setShowPaywall(false);
        }
      } else {
        setHasPaid(true);
        setShowPaywall(false);
      }

      // Convert trial to paid
      if (trial) {
        try {
          await supabase.functions.invoke('create-payment', {
            body: {
              action: 'convert-trial',
              userId: user.id,
            },
          });
          setTrial(prev => prev ? { ...prev, converted_to_paid: true, is_active: false } : null);
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setPaymentError('Payment processed but recording failed. The webhook safety net will verify it.');
    }
  }, [user?.id, user?.email, trial]);

  const verifyPaymentServerSide = useCallback(async (paymentIntentId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          action: 'verify-payment',
          userId: user.id,
          paymentIntentId,
        },
      });

      if (error) {
        console.error('Server-side verification failed:', error);
        return false;
      }

      if (data?.verified) {
        setHasPaid(true);
        setWebhookVerified(true);
        setShowPaywall(false);
        await checkPaymentStatus();
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error verifying payment:', err);
      return false;
    }
  }, [user?.id, checkPaymentStatus]);

  const dismissTrialBanner = useCallback(() => {
    setTrialBannerDismissed(true);
  }, []);

  // Initialize: check payment status and trial on auth
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      checkPaymentStatus();
      checkTrialStatus();
    } else {
      setHasPaid(false);
      setWebhookVerified(false);
      setLastPayment(null);
      setTrial(null);
      setLoading(false);
      trialStartedRef.current = false;
      setTrialBannerDismissed(false);
    }
  }, [isAuthenticated, user?.id, checkPaymentStatus, checkTrialStatus]);

  // Auto-start trial for new authenticated users who haven't paid and don't have a trial
  useEffect(() => {
    if (
      isAuthenticated &&
      user?.id &&
      !loading &&
      !trialLoading &&
      !hasPaid &&
      trial === null &&
      !trialStartedRef.current
    ) {
      trialStartedRef.current = true;
      console.log('[PaymentContext] Auto-starting trial for new user');
      startTrial();
    }
  }, [isAuthenticated, user?.id, loading, trialLoading, hasPaid, trial, startTrial]);

  // Poll for webhook verification
  useEffect(() => {
    if (!hasPaid || webhookVerified || !lastPayment?.stripe_payment_intent_id) return;

    let attempts = 0;
    const maxAttempts = 12;

    const pollInterval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_payments')
          .select('webhook_verified, webhook_verified_at')
          .eq('stripe_payment_intent_id', lastPayment.stripe_payment_intent_id)
          .maybeSingle();

        if (data?.webhook_verified) {
          setWebhookVerified(true);
          setLastPayment(prev => prev ? { ...prev, webhook_verified: true, webhook_verified_at: data.webhook_verified_at } : prev);
          clearInterval(pollInterval);
          console.log('[PaymentContext] Webhook verification confirmed via polling');
        }
      } catch {
        // Silently continue polling
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [hasPaid, webhookVerified, lastPayment?.stripe_payment_intent_id]);

  return (
    <PaymentContext.Provider
      value={{
        hasPaid,
        loading,
        paymentError,
        showPaywall,
        webhookVerified,
        lastPayment,
        trial,
        isTrialActive,
        isTrialExpired,
        trialDaysRemaining: trialCountdown.days,
        trialHoursRemaining: trialCountdown.hours,
        trialMinutesRemaining: trialCountdown.minutes,
        trialEndsAt,
        trialLoading,
        hasFullAccess,
        setShowPaywall,
        checkPaymentStatus,
        recordPayment,
        verifyPaymentServerSide,
        startTrial,
        checkTrialStatus,
        dismissTrialBanner,
        trialBannerDismissed,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayment must be used within PaymentProvider');
  return context;
};
