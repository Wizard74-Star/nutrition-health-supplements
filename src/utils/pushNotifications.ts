import { supabase } from '@/lib/supabase';

// VAPID public key for push subscription
// In production, generate a real VAPID key pair and store the private key as a secret
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-qy0-KQUcN2HD_zzts_TLzfBi3Hc-VpSNzEcAg';

/**
 * Convert a base64 URL string to a Uint8Array for the applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications and store the subscription in the database
 */
export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  try {
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Service worker not available');
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create a new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Extract subscription details
    const subscriptionJSON = subscription.toJSON();
    const endpoint = subscriptionJSON.endpoint || '';
    const p256dh = subscriptionJSON.keys?.p256dh || '';
    const auth = subscriptionJSON.keys?.auth || '';

    // Store in database (upsert)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint,
          p256dh_key: p256dh,
          auth_key: auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (error) {
      console.error('Failed to store push subscription:', error);
      throw error;
    }

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);
    }

    return true;
  } catch (error) {
    console.error('Push unsubscription failed:', error);
    return false;
  }
}

/**
 * Check if user has an active push subscription
 */
export async function hasActivePushSubscription(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * Send a local notification via the service worker (for testing or immediate reminders)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  options?: {
    tag?: string;
    data?: Record<string, unknown>;
    delay?: number;
  }
): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  
  if (options?.delay && options.delay > 0) {
    // Send via service worker message for delayed notifications
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage({
        type: 'SCHEDULE_LOCAL_NOTIFICATION',
        title,
        body,
        delay: options.delay,
        tag: options.tag,
        data: options.data,
      });
    }
  } else {
    // Show immediately
    await registration.showNotification(title, {
      body,
      icon: '/placeholder.svg',
      badge: '/placeholder.svg',
      tag: options?.tag || 'supplement-reminder',
      data: options?.data || { url: '/' },
      vibrate: [100, 50, 100],
      requireInteraction: true,
    });
  }
}

/**
 * Load notification preferences from the database
 */
export async function loadNotificationPreferences(userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to load notification preferences:', error);
  }

  return data;
}

/**
 * Save notification preferences to the database
 */
export async function saveNotificationPreferences(
  userId: string,
  preferences: {
    notifications_enabled: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
    advance_minutes: number;
    sound_enabled: boolean;
  }
) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to save notification preferences:', error);
    throw error;
  }

  return data;
}

/**
 * Load per-supplement notification settings
 */
export async function loadSupplementNotificationSettings(userId: string) {
  const { data, error } = await supabase
    .from('supplement_notification_settings')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to load supplement notification settings:', error);
  }

  return data || [];
}

/**
 * Save per-supplement notification setting
 */
export async function saveSupplementNotificationSetting(
  userId: string,
  supplementId: string,
  settings: {
    notification_enabled: boolean;
    custom_reminder_time?: string | null;
  }
) {
  const { data, error } = await supabase
    .from('supplement_notification_settings')
    .upsert(
      {
        user_id: userId,
        supplement_id: supplementId,
        ...settings,
      },
      { onConflict: 'user_id,supplement_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Failed to save supplement notification setting:', error);
    throw error;
  }

  return data;
}

/**
 * Schedule local reminders based on supplement times
 * This runs client-side and schedules notifications for the current session
 */
export function scheduleLocalReminders(
  supplements: Array<{
    id: string;
    name: string;
    dosage: string;
    dosage_unit: string;
    reminder_enabled: boolean;
    reminder_time: string | null;
    time_of_day: string;
  }>,
  preferences: {
    notifications_enabled: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
    advance_minutes: number;
  },
  supplementSettings: Array<{
    supplement_id: string;
    notification_enabled: boolean;
    custom_reminder_time?: string | null;
  }>
): (() => void) {
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  if (!preferences.notifications_enabled) return () => {};

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  supplements.forEach((supp) => {
    if (!supp.reminder_enabled) return;

    // Check per-supplement setting
    const suppSetting = supplementSettings.find(s => s.supplement_id === supp.id);
    if (suppSetting && !suppSetting.notification_enabled) return;

    // Determine reminder time
    const reminderTime = suppSetting?.custom_reminder_time || supp.reminder_time;
    if (!reminderTime) return;

    // Parse the reminder time
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    // Subtract advance minutes
    reminderDate.setMinutes(reminderDate.getMinutes() - (preferences.advance_minutes || 0));

    // Check quiet hours
    if (preferences.quiet_hours_enabled) {
      const [qhStartH, qhStartM] = preferences.quiet_hours_start.split(':').map(Number);
      const [qhEndH, qhEndM] = preferences.quiet_hours_end.split(':').map(Number);
      const currentMinutes = hours * 60 + minutes;
      const qhStartMinutes = qhStartH * 60 + qhStartM;
      const qhEndMinutes = qhEndH * 60 + qhEndM;

      if (qhStartMinutes < qhEndMinutes) {
        // Same day range (e.g., 22:00 to 23:00)
        if (currentMinutes >= qhStartMinutes && currentMinutes < qhEndMinutes) return;
      } else {
        // Overnight range (e.g., 22:00 to 07:00)
        if (currentMinutes >= qhStartMinutes || currentMinutes < qhEndMinutes) return;
      }
    }

    const delay = reminderDate.getTime() - now.getTime();
    
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      const timeout = setTimeout(() => {
        sendLocalNotification(
          `Time for ${supp.name}`,
          `Take ${supp.dosage} ${supp.dosage_unit} of ${supp.name}`,
          {
            tag: `supplement-${supp.id}`,
            data: { url: '/', supplementId: supp.id },
          }
        );
      }, delay);
      timeouts.push(timeout);
    }
  });

  // Return cleanup function
  return () => {
    timeouts.forEach(clearTimeout);
  };
}
