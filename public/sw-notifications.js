// ZenPlan AI Mobile Service Worker Companion
// Handles background notification interactions, action buttons, and client communication

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  const taskId = data.taskId;

  // Option 1: User tapped "Mark as Complete" action button from notification shade
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

        // If no app window is currently open, open ZenPlan with completion parameter
        if (!notified && self.clients.openWindow) {
          return self.clients.openWindow(`/?completeTaskId=${encodeURIComponent(taskId)}`);
        }
      })
    );
    return;
  }

  // Option 2: User tapped notification body or "Open App"
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

// Listener for message events to show notifications directly via service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_TASK_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title, options);
    }
  }
});
