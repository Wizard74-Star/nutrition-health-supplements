import React, { useState, useEffect, useMemo } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { usePayment } from '@/context/PaymentContext';
import { useStripeMode } from '@/context/StripeModeContext';
import { X, Shield, Zap, Brain, Droplets, Utensils, FlaskConical, Check, Lock, CreditCard, AlertTriangle, Copy, CheckCheck, ShieldCheck, RefreshCw, Loader2, Clock, Gift, Sparkles, ArrowRight } from 'lucide-react';
const TestTube2 = FlaskConical;

const FEATURES = [
  { icon: Brain, label: 'Symptom Assessment & Analysis' },
  { icon: Droplets, label: 'Blood Test Tracking & Upload' },
  { icon: FlaskConical, label: 'Supplement Management' },
  { icon: Utensils, label: 'Daily Food Tracker' },
  { icon: Zap, label: 'Personalized Meal Plans' },
  { icon: Shield, label: 'Nutrient Database Access' },
];

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', label: 'Visa (Success)', color: 'text-green-700 bg-green-50' },
  { number: '4000 0000 0000 3220', label: '3D Secure Auth', color: 'text-blue-700 bg-blue-50' },
  { number: '4000 0000 0000 9995', label: 'Declined', color: 'text-red-700 bg-red-50' },
  { number: '4000 0000 0000 0077', label: 'Charge Succeeds', color: 'text-green-700 bg-green-50' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = text.replace(/\s/g, '');
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-gray-200 transition-colors" title="Copy card number">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  );
}

function TestModeCardReference() {
  return (
    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <TestTube2 className="w-4 h-4 text-amber-600" />
        <span className="text-xs font-semibold text-amber-800">Test Card Numbers</span>
      </div>
      <div className="space-y-1.5">
        {TEST_CARDS.map((card, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">{card.number}</code>
              <CopyButton text={card.number} />
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${card.color}`}>{card.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-amber-600 mt-2">Use any future expiry, any 3-digit CVC, and any postal code.</p>
    </div>
  );
}

function TestModeBanner() {
  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 rounded-t-2xl">
      <TestTube2 className="w-4 h-4" />
      <span className="text-xs font-bold uppercase tracking-wider">Sandbox / Test Mode</span>
      <TestTube2 className="w-4 h-4" />
    </div>
  );
}

function SimulatedTestPayment({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState<'idle' | 'success' | 'declined'>('idle');

  const handleSimulate = async (shouldSucceed: boolean) => {
    setLoading(true);
    setSimResult('idle');
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (shouldSucceed) {
      setSimResult('success');
      setTimeout(() => onSuccess(), 500);
    } else {
      setSimResult('declined');
      onError('Card was declined (simulated test decline)');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800 mb-1">Simulated Test Mode</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              The payment gateway returned a simulated response. No real Stripe Elements are available.
            </p>
          </div>
        </div>
      </div>
      {simResult === 'success' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Payment simulated successfully!
        </div>
      )}
      {simResult === 'declined' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">Card was declined (simulated test decline)</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleSimulate(true)} disabled={loading}
          className="py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Simulate Success
        </button>
        <button onClick={() => handleSimulate(false)} disabled={loading}
          className="py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Simulate Decline
        </button>
      </div>
    </div>
  );
}

function CheckoutForm({ customerId, paymentIntentId, isTestMode, onSuccess, onError }: {
  customerId: string; paymentIntentId: string; isTestMode: boolean;
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin },
        redirect: 'if_required',
      });
      if (error) {
        setErrorMsg(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess();
      } else if (paymentIntent?.status === 'requires_action') {
        setErrorMsg('Additional authentication required.');
      } else {
        setErrorMsg('Payment is being processed. Please wait...');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
      onError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isTestMode && <TestModeCardReference />}
      <PaymentElement options={{ layout: 'tabs' }} />
      {errorMsg && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorMsg}</div>}
      <button type="submit" disabled={!stripe || loading}
        className={`w-full py-3.5 px-6 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
          isTestMode ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-amber-200'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200'
        }`}>
        {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>) : (<><Lock className="w-4 h-4" /> {isTestMode ? 'Test Pay €5.49' : 'Pay €5.49 — Unlock Full Access'}</>)}
      </button>
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        {isTestMode ? (<><TestTube2 className="w-3.5 h-3.5" /><span>Test mode — no real charges.</span></>) : (<><Shield className="w-3.5 h-3.5" /><span>Secured by Stripe. Encrypted.</span></>)}
      </div>
    </form>
  );
}

function SuccessWithVerification({ isTestMode, paymentIntentId, webhookVerified, verifyPaymentServerSide }: {
  isTestMode: boolean; paymentIntentId: string | null; webhookVerified: boolean;
  verifyPaymentServerSide: (piId: string) => Promise<boolean>;
}) {
  const [verifying, setVerifying] = useState(false);
  const [manualVerifyResult, setManualVerifyResult] = useState<'idle' | 'success' | 'failed'>('idle');

  const handleManualVerify = async () => {
    if (!paymentIntentId) return;
    setVerifying(true);
    setManualVerifyResult('idle');
    try {
      const result = await verifyPaymentServerSide(paymentIntentId);
      setManualVerifyResult(result ? 'success' : 'failed');
    } catch { setManualVerifyResult('failed'); }
    setVerifying(false);
  };

  return (
    <div className="p-8 text-center">
      <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isTestMode ? 'bg-amber-100' : 'bg-emerald-100'}`}>
        <Check className={`w-10 h-10 ${isTestMode ? 'text-amber-600' : 'text-emerald-600'}`} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{isTestMode ? 'Test Payment Successful!' : 'Payment Successful!'}</h2>
      <p className="text-gray-600 mb-4">{isTestMode ? 'Test payment processed. Account unlocked for testing.' : 'Welcome to NutriCheck Pro! Full access unlocked.'}</p>
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
            <Check className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Frontend Confirmed</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
            webhookVerified || manualVerifyResult === 'success' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            {webhookVerified || manualVerifyResult === 'success' ? (
              <><ShieldCheck className="w-3.5 h-3.5 text-blue-600" /><span className="text-xs font-semibold text-blue-700">Webhook Verified</span></>
            ) : (
              <><Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" /><span className="text-xs font-semibold text-gray-500">Awaiting Webhook</span></>
            )}
          </div>
        </div>
        {!webhookVerified && manualVerifyResult !== 'success' && paymentIntentId && (
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">Webhook verification may take a few seconds.</p>
            <button onClick={handleManualVerify} disabled={verifying}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
              {verifying ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</>) : (<><RefreshCw className="w-3.5 h-3.5" /> Verify Server-Side</>)}
            </button>
            {manualVerifyResult === 'failed' && <p className="text-xs text-amber-600 mt-1">Could not verify now. Webhook will confirm shortly.</p>}
          </div>
        )}
      </div>
      {isTestMode && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs mb-4">Test transaction — no real charges.</div>}
      <div className={`w-full h-1 rounded-full animate-pulse ${isTestMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
    </div>
  );
}

// ── Trial Info Section in Paywall ──────────────────────────────────────────
function TrialExpiredBadge() {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
      <div className="flex items-start gap-2">
        <Clock className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-red-800 font-semibold mb-0.5">Your 7-day free trial has ended</p>
          <p className="text-xs text-red-700 leading-relaxed">
            Upgrade to NutriCheck Pro to continue using all premium features. Your data is safe and waiting for you.
          </p>
        </div>
      </div>
    </div>
  );
}

function TrialActiveBadge({ daysRemaining, hoursRemaining }: { daysRemaining: number; hoursRemaining: number }) {
  return (
    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
      <div className="flex items-start gap-2">
        <Gift className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-purple-800 font-semibold mb-0.5">
            {daysRemaining > 0
              ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your free trial`
              : `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} left in your free trial`
            }
          </p>
          <p className="text-xs text-purple-700 leading-relaxed">
            Lock in lifetime access now and never worry about losing your premium features.
          </p>
        </div>
      </div>
    </div>
  );
}

function StartTrialSection({ onStartTrial, loading }: { onStartTrial: () => void; loading: boolean }) {
  return (
    <div className="mb-6">
      <div className="relative p-5 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border border-purple-200 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Gift className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-purple-900">Try Free for 7 Days</h4>
            <p className="text-[11px] text-purple-600">No credit card required</p>
          </div>
        </div>
        <p className="text-xs text-purple-700 mb-4 leading-relaxed">
          Get full access to all premium features for 7 days. Explore everything NutriCheck Pro has to offer before deciding.
        </p>
        <button
          onClick={onStartTrial}
          disabled={loading}
          className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Starting Trial...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Start Free 7-Day Trial</>
          )}
        </button>
        <div className="flex items-center justify-center gap-4 mt-3">
          {['No credit card', 'Cancel anytime', 'Full access'].map((item, i) => (
            <span key={i} className="flex items-center gap-1 text-[10px] text-purple-600 font-medium">
              <Check className="w-3 h-3" /> {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or pay once</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    </div>
  );
}

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    recordPayment, checkPaymentStatus, webhookVerified, verifyPaymentServerSide,
    trial, isTrialActive, isTrialExpired, trialDaysRemaining, trialHoursRemaining,
    startTrial, trialLoading, hasPaid,
  } = usePayment();
  const { isTestMode, activePublishableKey, connectedAccountId, testPublishableKey } = useStripeMode();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [isSimulatedTest, setIsSimulatedTest] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);

  const stripePromise = useMemo(() => {
    const key = isTestMode ? testPublishableKey : activePublishableKey;
    if (!key) return null;
    return loadStripe(key, { stripeAccount: connectedAccountId });
  }, [isTestMode, testPublishableKey, activePublishableKey, connectedAccountId]);

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setCustomerId(null);
      setPaymentIntentId(null);
      setError(null);
      setSuccess(false);
      setStep('info');
      setLoadingPayment(false);
      setIsSimulatedTest(false);
      setStartingTrial(false);
    }
  }, [isOpen]);

  const handleStartTrial = async () => {
    setStartingTrial(true);
    setError(null);
    try {
      const result = await startTrial();
      if (result) {
        onClose();
      } else {
        setError('Could not start trial. Please try again.');
      }
    } catch {
      setError('Failed to start trial.');
    }
    setStartingTrial(false);
  };

  const initializePayment = async () => {
    if (!user?.email) {
      setError('Please sign in to continue.');
      return;
    }
    if (isTestMode && !testPublishableKey) {
      setError('Test mode enabled but no test publishable key configured.');
      return;
    }
    setLoadingPayment(true);
    setError(null);
    setIsSimulatedTest(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-payment', {
        body: { email: user.email, userId: user.id, testMode: isTestMode },
      });
      if (fnError) throw new Error(fnError.message || 'Failed to initialize payment');
      if (data?.error) throw new Error(data.error);

      if (data?.simulatedTestMode && !data?.clientSecret) {
        setIsSimulatedTest(true);
        setCustomerId(data.customerId);
        setPaymentIntentId(data.paymentIntentId);
        setStep('payment');
      } else if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        setCustomerId(data.customerId);
        setPaymentIntentId(data.paymentIntentId);
        setStep('payment');
      } else {
        throw new Error('No client secret received');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setSuccess(true);
    if (paymentIntentId && customerId) {
      await recordPayment(paymentIntentId, customerId);
    }
    await checkPaymentStatus();
    setTimeout(() => onClose(), 2000);
  };

  if (!isOpen) return null;

  // Determine if we should show the "start trial" option
  const showTrialOption = !trial && !hasPaid && !isTestMode;
  const showTrialExpired = isTrialExpired && !hasPaid && trial && !trial.converted_to_paid;
  const showTrialActive = isTrialActive && !hasPaid;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {isTestMode && <TestModeBanner />}

        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          style={isTestMode ? { top: '3.5rem' } : {}}>
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {success ? (
          <SuccessWithVerification
            isTestMode={isTestMode}
            paymentIntentId={paymentIntentId}
            webhookVerified={webhookVerified}
            verifyPaymentServerSide={verifyPaymentServerSide}
          />
        ) : (
          <>
            {/* Header */}
            <div className={`p-8 ${isTestMode ? '' : 'rounded-t-2xl'} text-white ${
              showTrialExpired
                ? 'bg-gradient-to-br from-red-600 via-red-500 to-orange-500'
                : isTestMode
                  ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500'
                  : 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {showTrialExpired ? <Clock className="w-5 h-5" /> : isTestMode ? <TestTube2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <span className="text-sm font-medium opacity-80">
                  {showTrialExpired ? 'Trial Expired' : isTestMode ? 'Test Mode — One-Time Payment' : 'One-Time Payment'}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-1">
                {showTrialExpired
                  ? 'Your Free Trial Has Ended'
                  : isTestMode
                    ? 'Test: Unlock NutriCheck Pro'
                    : 'Unlock NutriCheck Pro'
                }
              </h2>
              <p className="text-sm mb-4 opacity-80">
                {showTrialExpired
                  ? 'Upgrade now to keep all your data and premium features'
                  : isTestMode
                    ? 'Testing the payment flow — no real charges'
                    : 'Get lifetime access to all premium features'
                }
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">€5.49</span>
                <span className="text-sm opacity-70">{isTestMode ? 'test' : 'one-time, forever'}</span>
              </div>
              {showTrialExpired && trial?.trial_started_at && (
                <div className="mt-3 flex items-center gap-2 text-xs opacity-70">
                  <Clock className="w-3.5 h-3.5" />
                  Trial started {new Date(trial.trial_started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' — '}expired {trial.trial_ends_at ? new Date(trial.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'info' ? (
                <>
                  {/* Trial status badges */}
                  {showTrialExpired && <TrialExpiredBadge />}
                  {showTrialActive && <TrialActiveBadge daysRemaining={trialDaysRemaining} hoursRemaining={trialHoursRemaining} />}

                  {/* Start Trial option (for users without a trial) */}
                  {showTrialOption && (
                    <StartTrialSection onStartTrial={handleStartTrial} loading={startingTrial || trialLoading} />
                  )}

                  {/* Features List */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">What's Included</h3>
                    <div className="space-y-3">
                      {FEATURES.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            showTrialExpired ? 'bg-red-50' : isTestMode ? 'bg-amber-50' : 'bg-emerald-50'
                          }`}>
                            <feature.icon className={`w-4 h-4 ${
                              showTrialExpired ? 'text-red-600' : isTestMode ? 'text-amber-600' : 'text-emerald-600'
                            }`} />
                          </div>
                          <span className="text-gray-700 text-sm">{feature.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isTestMode && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-amber-800 font-semibold mb-1">Test Mode Active</p>
                          <p className="text-xs text-amber-700">Use Stripe test card numbers. No real charges.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

                  <button onClick={initializePayment} disabled={loadingPayment}
                    className={`w-full py-3.5 px-6 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
                      showTrialExpired
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:from-red-700 hover:to-orange-600 shadow-red-200'
                        : isTestMode
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-amber-200'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200'
                    }`}>
                    {loadingPayment ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> {isTestMode ? 'Preparing Test Payment...' : 'Preparing Payment...'}</>
                    ) : (
                      <><CreditCard className="w-5 h-5" /> {showTrialExpired ? 'Upgrade Now — €5.49' : isTestMode ? 'Continue to Test Payment' : 'Continue to Payment'}</>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    {isTestMode ? 'Sandbox mode — Stripe test environment' : 'Secure payment powered by Stripe'}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <button onClick={() => { setStep('info'); setClientSecret(null); setError(null); setIsSimulatedTest(false); }}
                      className={`text-sm flex items-center gap-1 mb-4 ${isTestMode ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg> Back
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{isTestMode ? 'Test Payment Details' : 'Payment Details'}</h3>
                    <p className="text-sm text-gray-500">{isTestMode ? 'Enter test card details — no real charges' : 'Enter your payment information'}</p>
                  </div>

                  {isSimulatedTest ? (
                    <SimulatedTestPayment onSuccess={handlePaymentSuccess} onError={(msg) => setError(msg)} />
                  ) : clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: isTestMode ? '#f59e0b' : '#059669',
                          colorBackground: '#ffffff',
                          colorText: '#1f2937',
                          colorDanger: '#dc2626',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          spacingUnit: '4px',
                          borderRadius: '8px',
                        },
                      },
                    }}>
                      <CheckoutForm
                        customerId={customerId || ''}
                        paymentIntentId={paymentIntentId || ''}
                        isTestMode={isTestMode}
                        onSuccess={handlePaymentSuccess}
                        onError={(msg) => setError(msg)}
                      />
                    </Elements>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaywallModal;
