import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Bell, BellOff, BellRing, Shield, ShieldCheck, ShieldAlert,
  Clock, Moon, Sun, Volume2, VolumeX, Send, CheckCircle2,
  XCircle, Loader2, AlertTriangle, Settings, ToggleLeft,
  ToggleRight, Pill, ChevronDown, ChevronUp, Smartphone,
  Wifi, WifiOff, Info, Zap, Timer, RefreshCw, X
} from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  hasActivePushSubscription,
  sendLocalNotification,
  loadNotificationPreferences,
  saveNotificationPreferences,
  loadSupplementNotificationSettings,
  saveSupplementNotificationSetting,
  registerServiceWorker,
  scheduleLocalReminders,
} from '@/utils/pushNotifications';

interface SupplementRecord {
  id: string;
  name: string;
  dosage: string;
  dosage_unit: string;
  time_of_day: string;
  reminder_enabled: boolean;
  reminder_time: string | null;
  active: boolean;
}

interface NotificationPreferencesProps {
  supplements: SupplementRecord[];
}

interface Preferences {
  notifications_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  advance_minutes: number;
  sound_enabled: boolean;
}

interface SupplementNotifSetting {
  supplement_id: string;
  notification_enabled: boolean;
  custom_reminder_time: string | null;
}

const defaultPreferences: Preferences = {
  notifications_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  advance_minutes: 5,
  sound_enabled: true,
};

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ supplements }) => {
  const { user } = useAuth();

  // State
  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [suppSettings, setSuppSettings] = useState<SupplementNotifSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuppSettings, setShowSuppSettings] = useState(false);
  const [savingSupp, setSavingSupp] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const activeSupplements = supplements.filter(s => s.active);
  const remindersEnabled = supplements.filter(s => s.reminder_enabled);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setPushSupported(isPushSupported());
      setPermission(getNotificationPermission());

      if (isPushSupported()) {
        const hasSub = await hasActivePushSubscription();
        setHasSubscription(hasSub);
      }

      if (user?.id) {
        try {
          const prefs = await loadNotificationPreferences(user.id);
          if (prefs) {
            setPreferences({
              notifications_enabled: prefs.notifications_enabled ?? true,
              quiet_hours_enabled: prefs.quiet_hours_enabled ?? false,
              quiet_hours_start: prefs.quiet_hours_start ?? '22:00',
              quiet_hours_end: prefs.quiet_hours_end ?? '07:00',
              advance_minutes: prefs.advance_minutes ?? 5,
              sound_enabled: prefs.sound_enabled ?? true,
            });
          }

          const settings = await loadSupplementNotificationSettings(user.id);
          setSuppSettings(
            settings.map((s: any) => ({
              supplement_id: s.supplement_id,
              notification_enabled: s.notification_enabled,
              custom_reminder_time: s.custom_reminder_time,
            }))
          );
        } catch (err) {
          console.error('Failed to load notification preferences:', err);
        }
      }

      setLoading(false);
    };

    init();
  }, [user?.id]);

  // Schedule local reminders when preferences change
  useEffect(() => {
    if (!user?.id || !preferences.notifications_enabled || permission !== 'granted') return;

    const cleanup = scheduleLocalReminders(supplements, preferences, suppSettings);
    return cleanup;
  }, [user?.id, supplements, preferences, suppSettings, permission]);

  const handleRequestPermission = async () => {
    setSubscribing(true);
    setError(null);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === 'granted' && user?.id) {
        await registerServiceWorker();
        const sub = await subscribeToPush(user.id);
        setHasSubscription(!!sub);

        if (sub) {
          // Save default preferences
          await saveNotificationPreferences(user.id, preferences);
        }
      } else if (perm === 'denied') {
        setError('Notifications were blocked. Please enable them in your browser settings.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enable notifications');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user?.id) return;
    setSubscribing(true);
    try {
      await unsubscribeFromPush(user.id);
      setHasSubscription(false);
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.id) return;
    setSaving(true);
    setError(null);
    try {
      await saveNotificationPreferences(user.id, preferences);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleToggleSuppNotification = async (supplementId: string, currentEnabled: boolean) => {
    if (!user?.id) return;
    setSavingSupp(supplementId);
    try {
      await saveSupplementNotificationSetting(user.id, supplementId, {
        notification_enabled: !currentEnabled,
      });
      setSuppSettings(prev => {
        const existing = prev.find(s => s.supplement_id === supplementId);
        if (existing) {
          return prev.map(s =>
            s.supplement_id === supplementId
              ? { ...s, notification_enabled: !currentEnabled }
              : s
          );
        }
        return [...prev, {
          supplement_id: supplementId,
          notification_enabled: !currentEnabled,
          custom_reminder_time: null,
        }];
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update setting');
    } finally {
      setSavingSupp(null);
    }
  };

  const handleCustomTime = async (supplementId: string, time: string) => {
    if (!user?.id) return;
    setSavingSupp(supplementId);
    try {
      await saveSupplementNotificationSetting(user.id, supplementId, {
        notification_enabled: true,
        custom_reminder_time: time || null,
      });
      setSuppSettings(prev => {
        const existing = prev.find(s => s.supplement_id === supplementId);
        if (existing) {
          return prev.map(s =>
            s.supplement_id === supplementId
              ? { ...s, custom_reminder_time: time || null }
              : s
          );
        }
        return [...prev, {
          supplement_id: supplementId,
          notification_enabled: true,
          custom_reminder_time: time || null,
        }];
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update custom time');
    } finally {
      setSavingSupp(null);
    }
  };

  const handleTestNotification = async () => {
    setTestingSend(true);
    setTestResult(null);
    try {
      // First try local notification
      if (permission === 'granted') {
        await sendLocalNotification(
          'NutriAnalysis Test',
          'Push notifications are working! You\'ll receive supplement reminders at your scheduled times.',
          { tag: 'test-notification' }
        );
        setTestResult({ success: true, message: 'Test notification sent! Check your notifications.' });
      }

      // Also try the edge function if subscribed
      if (hasSubscription && user?.id) {
        const { data, error: fnError } = await supabase.functions.invoke('send-push-notifications', {
          body: { action: 'test', user_id: user.id },
        });
        if (fnError) {
          console.warn('Edge function test:', fnError);
        }
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to send test notification' });
    } finally {
      setTestingSend(false);
    }
  };

  const getSuppNotifEnabled = (supplementId: string): boolean => {
    const setting = suppSettings.find(s => s.supplement_id === supplementId);
    return setting ? setting.notification_enabled : true; // default enabled
  };

  const getSuppCustomTime = (supplementId: string): string => {
    const setting = suppSettings.find(s => s.supplement_id === supplementId);
    return setting?.custom_reminder_time || '';
  };

  const getTimeLabel = (time: string): string => {
    const labels: Record<string, string> = {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      bedtime: 'Bedtime',
      'with-meals': 'With Meals',
    };
    return labels[time] || time;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Test Result Banner */}
      {testResult && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          testResult.success
            ? 'bg-emerald-50 border border-emerald-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          )}
          <p className={`text-sm flex-1 ${testResult.success ? 'text-emerald-700' : 'text-amber-700'}`}>
            {testResult.message}
          </p>
          <button onClick={() => setTestResult(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Push Notification Status & Permission */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-purple-600" />
            Push Notifications
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Receive browser notifications when it's time to take your supplements
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Browser Support Check */}
          {!pushSupported ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <WifiOff className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Push notifications not supported</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Your browser doesn't support push notifications. Try using Chrome, Firefox, or Edge.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Permission Status */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  permission === 'granted'
                    ? 'bg-emerald-100'
                    : permission === 'denied'
                    ? 'bg-red-100'
                    : 'bg-amber-100'
                }`}>
                  {permission === 'granted' ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  ) : permission === 'denied' ? (
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                  ) : (
                    <Shield className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {permission === 'granted'
                      ? 'Notifications Enabled'
                      : permission === 'denied'
                      ? 'Notifications Blocked'
                      : 'Notifications Not Set Up'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {permission === 'granted'
                      ? hasSubscription
                        ? 'You\'re subscribed to push notifications for supplement reminders.'
                        : 'Permission granted. Click below to subscribe to push notifications.'
                      : permission === 'denied'
                      ? 'Please enable notifications in your browser settings to receive reminders.'
                      : 'Enable notifications to get reminders when it\'s time to take your supplements.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {permission === 'granted' && hasSubscription && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                      <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-700">Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {permission !== 'granted' ? (
                  <button
                    onClick={handleRequestPermission}
                    disabled={subscribing || permission === 'denied'}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {subscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    Enable Notifications
                  </button>
                ) : !hasSubscription ? (
                  <button
                    onClick={handleRequestPermission}
                    disabled={subscribing}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {subscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wifi className="w-4 h-4" />
                    )}
                    Subscribe to Push
                  </button>
                ) : (
                  <button
                    onClick={handleUnsubscribe}
                    disabled={subscribing}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {subscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                    Unsubscribe
                  </button>
                )}

                {permission === 'granted' && (
                  <button
                    onClick={handleTestNotification}
                    disabled={testingSend}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 rounded-xl hover:bg-purple-100 border border-purple-100 transition-colors disabled:opacity-50"
                  >
                    {testingSend ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Test
                  </button>
                )}
              </div>

              {permission === 'denied' && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    To re-enable notifications: Click the lock/info icon in your browser's address bar,
                    find "Notifications" in the permissions, and change it to "Allow".
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Global Notification Settings */}
      {permission === 'granted' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Notification Settings
            </h3>
          </div>

          <div className="p-5 space-y-5">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  {preferences.notifications_enabled ? (
                    <Bell className="w-5 h-5 text-purple-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">All Notifications</p>
                  <p className="text-xs text-gray-500">Master toggle for all supplement reminders</p>
                </div>
              </div>
              <button
                onClick={() => updatePreference('notifications_enabled', !preferences.notifications_enabled)}
                className="flex-shrink-0"
              >
                {preferences.notifications_enabled ? (
                  <ToggleRight className="w-10 h-10 text-purple-600" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div>

            {preferences.notifications_enabled && (
              <>
                {/* Advance Reminder */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Timer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Advance Reminder</p>
                      <p className="text-xs text-gray-500">Get notified before the scheduled time</p>
                    </div>
                  </div>
                  <select
                    value={preferences.advance_minutes}
                    onChange={(e) => updatePreference('advance_minutes', parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={0}>At scheduled time</option>
                    <option value={5}>5 min before</option>
                    <option value={10}>10 min before</option>
                    <option value={15}>15 min before</option>
                    <option value={30}>30 min before</option>
                  </select>
                </div>

                {/* Quiet Hours */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Moon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Quiet Hours</p>
                        <p className="text-xs text-gray-500">Pause notifications during sleep</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updatePreference('quiet_hours_enabled', !preferences.quiet_hours_enabled)}
                      className="flex-shrink-0"
                    >
                      {preferences.quiet_hours_enabled ? (
                        <ToggleRight className="w-10 h-10 text-indigo-600" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {preferences.quiet_hours_enabled && (
                    <div className="flex items-center gap-3 ml-[52px]">
                      <div className="flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        <input
                          type="time"
                          value={preferences.quiet_hours_start}
                          onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <span className="text-xs text-gray-400">to</span>
                      <div className="flex items-center gap-2">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <input
                          type="time"
                          value={preferences.quiet_hours_end}
                          onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                      {preferences.sound_enabled ? (
                        <Volume2 className="w-5 h-5 text-teal-600" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Notification Sound</p>
                      <p className="text-xs text-gray-500">Play a sound with each reminder</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreference('sound_enabled', !preferences.sound_enabled)}
                    className="flex-shrink-0"
                  >
                    {preferences.sound_enabled ? (
                      <ToggleRight className="w-10 h-10 text-teal-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-400" />
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Save Button */}
            {hasChanges && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Save Preferences
                </button>
                <button
                  onClick={() => {
                    setPreferences(defaultPreferences);
                    setHasChanges(false);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Per-Supplement Notification Settings */}
      {permission === 'granted' && preferences.notifications_enabled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowSuppSettings(!showSuppSettings)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-gray-900">Per-Supplement Settings</h3>
              <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">
                {remindersEnabled.length} with reminders
              </span>
            </div>
            {showSuppSettings ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showSuppSettings && (
            <div className="border-t border-gray-100">
              {activeSupplements.length === 0 ? (
                <div className="p-8 text-center">
                  <Pill className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No active supplements.</p>
                  <p className="text-xs text-gray-400 mt-1">Add supplements to configure individual notification settings.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeSupplements.map(supp => {
                    const isEnabled = getSuppNotifEnabled(supp.id);
                    const customTime = getSuppCustomTime(supp.id);
                    const isSaving = savingSupp === supp.id;

                    return (
                      <div key={supp.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                        {/* Supplement info */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isEnabled && supp.reminder_enabled ? 'bg-purple-50' : 'bg-gray-50'
                        }`}>
                          <Pill className={`w-4 h-4 ${
                            isEnabled && supp.reminder_enabled ? 'text-purple-500' : 'text-gray-400'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{supp.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{supp.dosage} {supp.dosage_unit}</span>
                            <span className="text-gray-300">|</span>
                            <span>{getTimeLabel(supp.time_of_day)}</span>
                            {supp.reminder_enabled && supp.reminder_time && (
                              <>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1 text-amber-600">
                                  <Clock className="w-3 h-3" />
                                  {customTime || supp.reminder_time}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Custom time input */}
                        {supp.reminder_enabled && isEnabled && (
                          <input
                            type="time"
                            value={customTime}
                            onChange={(e) => handleCustomTime(supp.id, e.target.value)}
                            placeholder={supp.reminder_time || ''}
                            className="hidden sm:block w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                            title="Custom reminder time (leave empty to use default)"
                          />
                        )}

                        {/* Toggle */}
                        <button
                          onClick={() => handleToggleSuppNotification(supp.id, isEnabled)}
                          disabled={isSaving || !supp.reminder_enabled}
                          className="flex-shrink-0 disabled:opacity-40"
                          title={!supp.reminder_enabled ? 'Enable reminder on this supplement first' : ''}
                        >
                          {isSaving ? (
                            <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                          ) : isEnabled && supp.reminder_enabled ? (
                            <ToggleRight className="w-8 h-8 text-purple-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-400" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info note */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-gray-500">
                    Toggle notifications for individual supplements. Set a custom reminder time to override the default.
                    Supplements must have reminders enabled in the stack to receive notifications.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notification Schedule Overview */}
      {permission === 'granted' && preferences.notifications_enabled && remindersEnabled.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Today's Notification Schedule
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upcoming reminders for today based on your settings
            </p>
          </div>

          <div className="p-5">
            <div className="space-y-2">
              {remindersEnabled
                .filter(s => s.active && getSuppNotifEnabled(s.id))
                .sort((a, b) => {
                  const timeA = getSuppCustomTime(a.id) || a.reminder_time || '00:00';
                  const timeB = getSuppCustomTime(b.id) || b.reminder_time || '00:00';
                  return timeA.localeCompare(timeB);
                })
                .map(supp => {
                  const time = getSuppCustomTime(supp.id) || supp.reminder_time || '';
                  const now = new Date();
                  const [h, m] = time.split(':').map(Number);
                  const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
                  reminderDate.setMinutes(reminderDate.getMinutes() - preferences.advance_minutes);
                  const isPast = reminderDate < now;
                  const effectiveTime = `${String(reminderDate.getHours()).padStart(2, '0')}:${String(reminderDate.getMinutes()).padStart(2, '0')}`;

                  return (
                    <div
                      key={supp.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        isPast
                          ? 'border-gray-100 bg-gray-50/50 opacity-60'
                          : 'border-purple-100 bg-purple-50/30'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isPast ? 'bg-gray-100' : 'bg-purple-100'
                      }`}>
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-gray-400" />
                        ) : (
                          <BellRing className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                          {supp.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {supp.dosage} {supp.dosage_unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {preferences.advance_minutes > 0 && effectiveTime !== time && (
                          <span className="text-[10px] text-gray-400">
                            ({preferences.advance_minutes}min early)
                          </span>
                        )}
                        <span className={`text-sm font-mono font-semibold ${
                          isPast ? 'text-gray-400' : 'text-purple-700'
                        }`}>
                          {effectiveTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {preferences.quiet_hours_enabled && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <Moon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <p className="text-xs text-indigo-700">
                  Quiet hours active from <span className="font-semibold">{preferences.quiet_hours_start}</span> to{' '}
                  <span className="font-semibold">{preferences.quiet_hours_end}</span>. No notifications during this time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Setup Guide (when no reminders are configured) */}
      {permission === 'granted' && remindersEnabled.length === 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-1">Set Up Your Reminders</h4>
              <p className="text-sm text-gray-600 mb-3">
                Notifications are enabled, but none of your supplements have reminders configured.
                Go to your supplement stack and enable reminders with specific times for each supplement.
              </p>
              <div className="flex items-center gap-2 text-xs text-purple-700">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-purple-100">
                  <span className="font-medium">Step 1:</span> Edit a supplement
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-purple-100">
                  <span className="font-medium">Step 2:</span> Toggle "Set Reminder"
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-purple-100">
                  <span className="font-medium">Step 3:</span> Set a time
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPreferences;
