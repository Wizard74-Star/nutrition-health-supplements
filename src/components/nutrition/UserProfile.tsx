import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAssessment } from '@/context/AssessmentContext';
import { supabase } from '@/lib/supabase';
import ShareLinksManager from '@/components/nutrition/ShareLinksManager';

import {
  User, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, Shield, Calendar, Trash2, AlertTriangle, Settings,
  Save, X, KeyRound, Edit3, Clock, Cloud, FileText, Link2, Share2
} from 'lucide-react';


const UserProfile: React.FC = () => {
  const { user, profile, profileLoading, updateDisplayName, updatePassword, updateProfile, deleteAccount, signOut, isAuthenticated } = useAuth();
  const { setCurrentView } = useAssessment();

  // Display name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Bio editing
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Initialize form values from profile/user
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
    } else if (user) {
      setDisplayName(user.user_metadata?.full_name || '');
    }
  }, [profile, user]);

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isEditingName]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h2>
          <p className="text-gray-500 mb-6">Please sign in to access your account settings.</p>
          <button
            onClick={() => setCurrentView('home')}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const getUserInitials = () => {
    const name = displayName || user.user_metadata?.full_name;
    if (name) {
      return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || '?';
  };

  const getAccountAge = () => {
    const created = new Date(user.created_at);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Handlers ───

  const handleSaveName = async () => {
    setNameError(null);
    setNameSuccess(false);
    setNameLoading(true);

    const { error } = await updateDisplayName(displayName.trim());
    setNameLoading(false);

    if (error) {
      setNameError(error);
    } else {
      setNameSuccess(true);
      setIsEditingName(false);
      setTimeout(() => setNameSuccess(false), 3000);
    }
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setDisplayName(profile?.display_name || user.user_metadata?.full_name || '');
    setNameError(null);
  };

  const handleSaveBio = async () => {
    setBioError(null);
    setBioSuccess(false);
    setBioLoading(true);

    const { error } = await updateProfile({ bio: bio.trim() });
    setBioLoading(false);

    if (error) {
      setBioError(error);
    } else {
      setBioSuccess(true);
      setIsEditingBio(false);
      setTimeout(() => setBioSuccess(false), 3000);
    }
  };

  const handleCancelBioEdit = () => {
    setIsEditingBio(false);
    setBio(profile?.bio || '');
    setBioError(null);
  };

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);

    // First verify current password by attempting sign in
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordLoading(false);
        setPasswordError('Current password is incorrect');
        return;
      }
    } catch {
      setPasswordLoading(false);
      setPasswordError('Failed to verify current password');
      return;
    }


    // Update password
    const { error } = await updatePassword(newPassword);
    setPasswordLoading(false);

    if (error) {
      setPasswordError(error);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordSection(false);
      }, 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setDeleteError(null);
    setDeleteLoading(true);

    const { error } = await deleteAccount();
    setDeleteLoading(false);

    if (error) {
      setDeleteError(error);
    } else {
      // Account deleted, redirect to home
      setCurrentView('home');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back button */}
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your profile and account preferences</p>
          </div>
        </div>

        <div className="space-y-6">

          {/* ─── PROFILE CARD ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Profile header with gradient */}
            <div className="relative bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 px-6 sm:px-8 pt-8 pb-16">
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full border border-white/10" />
              <div className="absolute top-8 right-8 w-16 h-16 rounded-full border border-white/10" />
              <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full bg-white/5" />
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </h2>
              <p className="text-white/70 text-sm mt-1">Your personal details and public profile</p>
            </div>

            {/* Profile content */}
            <div className="relative -mt-10 mx-4 sm:mx-6 mb-6">
              <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 p-6">
                {/* Avatar + basic info */}
                <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20">
                      {getUserInitials()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900">
                      {displayName || user.user_metadata?.full_name || 'No name set'}
                    </h3>
                    <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Joined {getAccountAge()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Cloud className="w-3.5 h-3.5" />
                        Synced
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 space-y-5">
                  {/* Display Name */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Display Name</label>
                      {!isEditingName && (
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditingName ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            ref={nameInputRef}
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your display name"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                            maxLength={100}
                          />
                        </div>
                        {nameError && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {nameError}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveName}
                            disabled={nameLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/20 transition-all disabled:opacity-60"
                          >
                            {nameLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {nameLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelNameEdit}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900">
                          {displayName || user.user_metadata?.full_name || (
                            <span className="text-gray-400 italic">No display name set</span>
                          )}
                        </p>
                        {nameSuccess && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Saved
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={user.email || ''}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Email address cannot be changed for security reasons
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">Bio</label>
                      {!isEditingBio && (
                        <button
                          onClick={() => setIsEditingBio(true)}
                          className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditingBio ? (
                      <div className="space-y-2">
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us a bit about yourself..."
                          rows={3}
                          maxLength={500}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveBio}
                              disabled={bioLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-teal-500/20 transition-all disabled:opacity-60"
                            >
                              {bioLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              {bioLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelBioEdit}
                              className="flex items-center gap-2 px-4 py-2 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                          <span className="text-xs text-gray-400">{bio.length}/500</span>
                        </div>
                        {bioError && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {bioError}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900">
                          {bio || (
                            <span className="text-gray-400 italic">No bio added yet</span>
                          )}
                        </p>
                        {bioSuccess && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Saved
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── ACCOUNT DETAILS CARD ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Account Details
              </h2>
            </div>
            <div className="px-6 sm:px-8 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Account Created</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(user.created_at)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTime(user.created_at)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Last Sign In</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user.last_sign_in_at ? formatTime(user.last_sign_in_at) : ''}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">User ID</p>
                  <p className="text-xs font-mono text-gray-600 break-all">{user.id}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Auth Provider</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {user.app_metadata?.provider || 'Email'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── CHANGE PASSWORD CARD ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-gray-400" />
                Password & Security
              </h2>
              {!showPasswordSection && (
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            <div className="px-6 sm:px-8 py-5">
              {!showPasswordSection ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Password</p>
                    <p className="text-xs text-gray-500">Last updated with your account creation</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  {/* Success message */}
                  {passwordSuccess && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-700">Password updated successfully!</p>
                    </div>
                  )}

                  {/* Error message */}
                  {passwordError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{passwordError}</p>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                        disabled={passwordLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-gray-400"
                        disabled={passwordLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                          <p className={`text-xs font-medium ${strength.color}`}>{strength.label}</p>
                          {newPassword.length >= 6 && (
                            <p className="text-xs text-gray-400">{newPassword.length} characters</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                          confirmNewPassword && confirmNewPassword !== newPassword
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : confirmNewPassword && confirmNewPassword === newPassword
                            ? 'border-green-300 focus:ring-green-500/20 focus:border-green-500'
                            : 'border-gray-200 focus:ring-teal-500/20 focus:border-teal-500'
                        }`}
                        disabled={passwordLoading}
                        autoComplete="new-password"
                      />
                      {confirmNewPassword && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          {confirmNewPassword === newPassword ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {confirmNewPassword && confirmNewPassword !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                    )}
                  </div>

                  {/* Password tips */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Password requirements:</p>
                    {[
                      { text: 'At least 6 characters', met: newPassword.length >= 6 },
                      { text: 'Include uppercase letters', met: /[A-Z]/.test(newPassword) },
                      { text: 'Include numbers', met: /[0-9]/.test(newPassword) },
                      { text: 'Include special characters', met: /[^A-Za-z0-9]/.test(newPassword) },
                    ].map((tip, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          newPassword.length > 0 && tip.met ? 'bg-green-100' : 'bg-gray-200'
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

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all disabled:opacity-60"
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Update Password
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordSection(false);
                        setPasswordError(null);
                        setPasswordSuccess(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                      }}
                      className="px-5 py-2.5 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ─── QUICK LINKS ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
            </div>
            <div className="px-6 sm:px-8 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setCurrentView('reports')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">My Reports</p>
                    <p className="text-xs text-gray-500">View saved reports</p>
                  </div>
                </button>
                <button
                  onClick={() => setCurrentView('assessment')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">New Assessment</p>
                    <p className="text-xs text-gray-500">Start a new check</p>
                  </div>
                </button>
                <button
                  onClick={() => setCurrentView('database')}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Nutrient Database</p>
                    <p className="text-xs text-gray-500">Browse nutrients</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* ─── SHARED LINKS MANAGER ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-500" />
                Shared Report Links
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage links you've shared with others</p>
            </div>
            <div className="px-6 sm:px-8 py-5">
              <ShareLinksManager />
            </div>
          </div>


          {/* ─── DANGER ZONE ─── */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-red-100 bg-red-50/50">
              <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              <p className="text-sm text-red-600/70 mt-0.5">Irreversible and destructive actions</p>
            </div>
            <div className="px-6 sm:px-8 py-5">
              {!showDeleteConfirm ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Delete Account</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Permanently delete your account and all associated data including reports, profile, and assessment history. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Are you absolutely sure?</p>
                      <p className="text-xs text-red-700 mt-1">
                        This will permanently delete your account, all your saved reports, profile data, and assessment history. 
                        This action is <strong>irreversible</strong>.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="w-full max-w-xs px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all placeholder:text-gray-400 font-mono"
                      disabled={deleteLoading}
                    />
                  </div>

                  {deleteError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{deleteError}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting account...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Permanently Delete Account
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                        setDeleteError(null);
                      }}
                      disabled={deleteLoading}
                      className="px-5 py-2.5 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── FOOTER NOTE ─── */}
          <div className="flex items-center gap-2 px-2 pb-4">
            <Shield className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              Your data is encrypted and securely stored. Profile changes sync automatically across all your devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
