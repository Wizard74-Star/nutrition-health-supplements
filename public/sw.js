// NutriAnalysis Service Worker - Push Notification Handler
const APP_NAME = 'NutriAnalysis';

// Handle push events
self.addEventListener('push', (event) => {
  let data = {
    title: `${APP_NAME} Reminder`,
    body: 'Time to take your supplements!',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: 'supplement-reminder',
    data: { url: '/' },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.warn('Failed to parse push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/placeholder.svg',
    badge: data.badge || '/placeholder.svg',
    tag: data.tag || 'supplement-reminder',
    data: data.data || { url: '/' },
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      { action: 'taken', title: 'Mark as Taken' },
      { action: 'snooze', title: 'Snooze 10min' },
    ],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === 'taken') {
    // Open the app to the supplements page
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'SUPPLEMENT_ACTION',
              action: 'mark-taken',
              supplementId: notificationData.supplementId,
            });
            return;
          }
        }
        // Open a new window
        return clients.openWindow(notificationData.url || '/');
      })
    );
  } else if (action === 'snooze') {
    // Schedule another notification in 10 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(event.notification.title, {
            body: `Snoozed reminder: ${event.notification.body}`,
            icon: event.notification.icon,
            badge: event.notification.badge,
            tag: `${event.notification.tag}-snoozed`,
            data: notificationData,
            vibrate: [100, 50, 100],
            requireInteraction: true,
            actions: [
              { action: 'taken', title: 'Mark as Taken' },
              { action: 'dismiss', title: 'Dismiss' },
            ],
          }).then(resolve);
        }, 10 * 60 * 1000); // 10 minutes
      })
    );
  } else {
    // Default click - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(notificationData.url || '/');
      })
    );
  }
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle service worker install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_LOCAL_NOTIFICATION') {
    const { title, body, delay, tag, data } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title || `${APP_NAME} Reminder`, {
        body: body || 'Time to take your supplements!',
        icon: '/placeholder.svg',
        badge: '/placeholder.svg',
        tag: tag || 'supplement-reminder',
        data: data || { url: '/' },
        vibrate: [100, 50, 100],
        requireInteraction: true,
        actions: [
          { action: 'taken', title: 'Mark as Taken' },
          { action: 'snooze', title: 'Snooze 10min' },
        ],
      });
    }, delay || 0);
  }
});
