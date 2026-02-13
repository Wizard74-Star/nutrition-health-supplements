import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
  ArrowRight, Shield, FlaskConical, KeyRound, ArrowLeft
} from 'lucide-react';

interface ResetPasswordViewProps {
  onComplete: () => void;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onComplete }) => {
  const { updatePassword, clearRecoveryMode, user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => passwordRef.current?.focus(), 200);
  }, []);

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (pwd.length === 0) return { level: 0, label: '', color: '' };
    if (pwd.length < 6) return { level: 1, label: 'Too short', color: 'text-red-500' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 2, label: 'Fair', color: 'text-amber-600' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'text-teal-600' };
    return { level: 4, label: 'Strong', color: 'text-green-600' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await updatePassword(newPassword);
    setIsLoading(false);

    if (updateError) {
      setError(updateError);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2500);
    }
  };

  const handleSkip = () => {
    clearRecoveryMode();
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-50/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100/80">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 px-8 pt-8 pb-14">
            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-white/10" />
            <div className="absolute top-8 right-8 w-12 h-12 rounded-full border border-white/10" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />

            {/* Logo */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">NutriAnalysis</span>
            </div>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4">
              <KeyRound className="w-7 h-7 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-white">
              {success ? 'Password Updated!' : 'Set New Password'}
            </h1>
            <p className="text-white/70 text-sm mt-1.5">
              {success
                ? 'Your password has been changed successfully.'
                : user?.email
                  ? `Create a new password for ${user.email}`
                  : 'Choose a strong password for your account'}
            </p>
          </div>

          {/* Content */}
          <div className="relative -mt-6 mx-6 mb-0">
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 p-6">
              {success ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Set!</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Your password has been updated. You'll be redirected to the app momentarily.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                    <span className="text-sm text-teal-600 font-medium">Redirecting...</span>
                  </div>
                </div>
              ) : (
                /* Password Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error message */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        ref={passwordRef}
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                        disabled={isLoading}
                        autoComplete="new-password"
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
                    {newPassword.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map(level => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                strength.level >= level
                                  ? strength.level >= 4
                                    ? 'bg-green-500'
                                    : strength.level >= 3
                                    ? 'bg-teal-500'
                                    : strength.level >= 2
                                    ? 'bg-amber-500'
                                    : 'bg-red-400'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs font-medium ${strength.color}`}>
                            {strength.label}
                          </p>
                          {newPassword.length >= 6 && (
                            <p className="text-xs text-gray-400">
                              {newPassword.length} characters
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                          confirmPassword && confirmPassword !== newPassword
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : confirmPassword && confirmPassword === newPassword
                            ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500'
                            : 'border-gray-200 focus:ring-teal-500/20 focus:border-teal-500'
                        }`}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      {confirmPassword && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          {confirmPassword === newPassword ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                    )}
                  </div>

                  {/* Password tips */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Password tips:</p>
                    {[
                      { text: 'At least 6 characters', met: newPassword.length >= 6 },
                      { text: 'Include uppercase letters', met: /[A-Z]/.test(newPassword) },
                      { text: 'Include numbers', met: /[0-9]/.test(newPassword) },
                      { text: 'Include special characters', met: /[^A-Za-z0-9]/.test(newPassword) },
                    ].map((tip, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          newPassword.length > 0 && tip.met
                            ? 'bg-green-100'
                            : 'bg-gray-200'
                        }`}>
                          {newPassword.length > 0 && tip.met ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          )}
                        </div>
                        <span className={`text-xs transition-colors ${
                          newPassword.length > 0 && tip.met ? 'text-green-700' : 'text-gray-500'
                        }`}>
                          {tip.text}
                        </span>
                      </div>
                    ))}
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
                        Updating password...
                      </>
                    ) : (
                      <>
                        Update Password
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pt-4 pb-6">
            {!success && (
              <button
                onClick={handleSkip}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Skip and go to app
              </button>
            )}

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                Your password is encrypted and securely stored. We never have access to your password.
              </p>
            </div>
          </div>
        </div>

        {/* Subtle branding below card */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Powered by NutriAnalysis — Precision Nutrition
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordView;
