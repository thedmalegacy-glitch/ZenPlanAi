// ZenPlan AI - Production Mobile Service Worker
// Manages offline assets, mobile notification panel alerts, and action button events

const CACHE_NAME = 'zenplan-v2-cache';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

// Install: pre-cache critical shell assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Continue even if some optional asset fails to precache
      });
    })
  );
  self.skipWaiting();
});

// Activate: take immediate control of all open client tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and non-API/non-Vite-HMR requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/') || url.pathname.includes('vite') || url.pathname.includes('hmr')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  );
});

// Mobile Notification Click: Handles notification tap and "✓ Mark Complete" action button
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const taskId = data.taskId;

  // Case 1: User tapped the "✓ Mark Complete" action button directly in the mobile notification drawer
  if (action === 'complete' && taskId) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        let notified = false;
        for (const client of clientList) {
          client.postMessage({
            type: 'ZENPLAN_TASK_ACTION',
            action: 'complete',
            taskId: taskId,
          });
          notified = true;
          if ('focus' in client) {
            client.focus();
          }
        }

        // If app window is closed or suspended in background, launch app with completion query
        if (!notified && self.clients.openWindow) {
          return self.clients.openWindow(`/?completeTaskId=${encodeURIComponent(taskId)}`);
        }
      })
    );
    return;
  }

  // Case 2: User tapped the notification body or "Open App" action button
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Web Push Event: Triggered by OS push service even when app / browser is completely closed!
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = {
        title: 'Task Reminder • ZenPlan',
        body: event.data.text() || 'You have an upcoming task scheduled.',
      };
    }
  }

  const title = data.title || 'Task Reminder • ZenPlan';
  const options = {
    body: data.body || 'You have an upcoming task scheduled.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || `zenplan-reminder-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: data.data || {},
    actions: data.actions || [
      { action: 'complete', title: '✓ Mark Complete' },
      { action: 'open', title: 'Open App' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Direct message listener to trigger notifications through the Service Worker context
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_TASK_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title, options);
    }
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
