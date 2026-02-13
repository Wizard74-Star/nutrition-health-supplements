import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  X, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, ArrowRight, Shield, FlaskConical, ArrowLeft, KeyRound, Send
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
}

type ModalView = 'signin' | 'signup' | 'forgot' | 'forgot-success';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'signin' }) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [activeView, setActiveView] = useState<ModalView>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState(''); // Stores the email used for reset
  const emailRef = useRef<HTMLInputElement>(null);
  const forgotEmailRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setIsLoading(false);
      setActiveView(initialTab);
      setTimeout(() => {
        if (initialTab === 'signin' || initialTab === 'signup') {
          emailRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, initialTab]);

  // Reset errors when switching views
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');

    // Focus the right input
    setTimeout(() => {
      if (activeView === 'forgot') {
        forgotEmailRef.current?.focus();
      } else if (activeView === 'signin' || activeView === 'signup') {
        emailRef.current?.focus();
      }
    }, 100);
  }, [activeView]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    const { error: authError } = await signIn(email, password);
    setIsLoading(false);

    if (authError) {
      setError(authError);
    } else {
      setSuccess('Signed in successfully!');
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1000);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const { error: authError } = await signUp(email, password, name);
    setIsLoading(false);

    if (authError) {
      setError(authError);
    } else {
      setSuccess('Account created! You can now sign in.');
      setTimeout(() => {
        setActiveView('signin');
        setSuccess(null);
      }, 2000);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const forgotEmail = email.trim();
    if (!forgotEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!validateEmail(forgotEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const { error: resetError } = await resetPassword(forgotEmail);
    setIsLoading(false);

    if (resetError) {
      setError(resetError);
    } else {
      setResetEmail(forgotEmail);
      setActiveView('forgot-success');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setShowPassword(false);
    setResetEmail('');
  };

  const handleClose = () => {
    resetForm();
    setActiveView('signin');
    onClose();
  };

  const goToForgotPassword = () => {
    // Keep the current email so user doesn't have to re-type
    setActiveView('forgot');
  };

  const backToSignIn = () => {
    setActiveView('signin');
  };

  // Determine header content based on active view
  const getHeaderContent = () => {
    switch (activeView) {
      case 'forgot':
        return {
          title: 'Forgot Password?',
          subtitle: "No worries! Enter your email and we'll send you a reset link.",
          icon: <KeyRound className="w-5 h-5 text-white" />,
        };
      case 'forgot-success':
        return {
          title: 'Check Your Email',
          subtitle: `We sent a password reset link to ${resetEmail}`,
          icon: <Send className="w-5 h-5 text-white" />,
        };
      case 'signup':
        return {
          title: 'Create Account',
          subtitle: 'Join to save and sync your nutrition reports',
          icon: <FlaskConical className="w-5 h-5 text-white" />,
        };
      default:
        return {
          title: 'Welcome Back',
          subtitle: 'Sign in to sync your reports across devices',
          icon: <FlaskConical className="w-5 h-5 text-white" />,
        };
    }
  };

  const header = getHeaderContent();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 px-8 pt-8 pb-12">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {header.icon}
            </div>
            <span className="text-white font-bold text-lg">NutriAnalysis</span>
          </div>

          <h2 className="text-2xl font-bold text-white">{header.title}</h2>
          <p className="text-white/70 text-sm mt-1">{header.subtitle}</p>
        </div>

        {/* Tab switcher - only show for signin/signup */}
        {(activeView === 'signin' || activeView === 'signup') && (
          <div className="relative -mt-6 mx-6">
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setActiveView('signin')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'signin'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveView('signup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'signup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Back button for forgot password views */}
        {(activeView === 'forgot' || activeView === 'forgot-success') && (
          <div className="relative -mt-6 mx-6">
            <button
              onClick={backToSignIn}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        )}

        {/* Form */}
        <div className="px-8 pt-6 pb-8">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-4">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* ─── SIGN IN FORM ─── */}
          {activeView === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={goToForgotPassword}
                    className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !!success}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Signed In!
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveView('signup')}
                  className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  Sign up free
                </button>
              </p>
            </form>
          )}

          {/* ─── SIGN UP FORM ─── */}
          {activeView === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= level * 3
                              ? password.length >= 12
                                ? 'bg-green-500'
                                : password.length >= 8
                                ? 'bg-teal-500'
                                : password.length >= 6
                                ? 'bg-amber-500'
                                : 'bg-red-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${
                      password.length >= 12 ? 'text-green-600' :
                      password.length >= 8 ? 'text-teal-600' :
                      password.length >= 6 ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {password.length < 6 ? 'Too short' :
                       password.length < 8 ? 'Fair' :
                       password.length < 12 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                        : confirmPassword && confirmPassword === password
                        ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500'
                        : 'border-gray-200 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                    disabled={isLoading}
                  />
                  {confirmPassword && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {confirmPassword === password ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !!success}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Account Created!
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveView('signin')}
                  className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* ─── FORGOT PASSWORD FORM ─── */}
          {activeView === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {/* Illustration */}
              <div className="flex justify-center py-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-teal-500" />
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={forgotEmailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={backToSignIn}
                  className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* ─── FORGOT PASSWORD SUCCESS ─── */}
          {activeView === 'forgot-success' && (
            <div className="space-y-5">
              {/* Success illustration */}
              <div className="flex justify-center pt-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  {/* Animated ring */}
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-green-200 animate-ping opacity-20" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Sent!</h3>
                <p className="text-sm text-gray-600">
                  We've sent a password reset link to:
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1 bg-gray-50 rounded-lg py-2 px-4 inline-block">
                  {resetEmail}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-teal-50/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-teal-800">What to do next:</p>
                <div className="space-y-2.5">
                  {[
                    { step: '1', text: 'Check your email inbox (and spam folder)' },
                    { step: '2', text: 'Click the password reset link in the email' },
                    { step: '3', text: "You'll be redirected here to set a new password" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-teal-700">{item.step}</span>
                      </div>
                      <p className="text-sm text-teal-700">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resend / Back */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setActiveView('forgot');
                    setError(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  Didn't receive it? Send again
                </button>

                <button
                  onClick={backToSignIn}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Security note */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
            <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              {activeView === 'forgot' || activeView === 'forgot-success'
                ? 'Password reset links expire after 1 hour for security. Your data remains safe.'
                : 'Your data is encrypted and securely stored. Reports sync automatically when signed in.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
