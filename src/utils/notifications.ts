import { Task } from '../types';
import { formatTime12h } from './dateAndHaptics';

const NOTIFIED_STORAGE_KEY = 'zenplan.notified_reminders.v1';

// In-memory set for fast checking
const notifiedReminders = new Set<string>();

// Hydrate from localStorage for cross-refresh persistence
try {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(NOTIFIED_STORAGE_KEY);
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      parsed.forEach((id) => notifiedReminders.add(id));
    }
  }
} catch {
  // Ignore storage errors
}

function persistNotified() {
  try {
    if (typeof window !== 'undefined') {
      // Keep only last 100 entries to prevent growth
      const list = Array.from(notifiedReminders).slice(-100);
      localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage errors
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}

export async function dispatchNotification(
  title: string,
  options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: unknown;
  } = {}
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  // Trigger mobile haptic vibration if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([180, 80, 180]);
    } catch {
      // Ignore vibration error
    }
  }

  const notificationOptions: NotificationOptions = {
    body: options.body || 'ZenPlan AI reminder',
    icon: options.icon || '/pwa-192x192.png',
    badge: options.badge || '/pwa-192x192.png',
    tag: options.tag || 'zenplan-reminder',
    ...options,
  };

  // Try service worker first for background mobile push display
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch {
      // Fall through to standard Notification constructor
    }
  }

  try {
    new Notification(title, notificationOptions);
    return true;
  } catch {
    return false;
  }
}

export async function sendTestNotification(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  return dispatchNotification('🔔 ZenPlan AI: Notifications Active', {
    body: 'Reminders are set up! You will get alerts before your scheduled tasks.',
    tag: 'zenplan-test',
  });
}

/**
 * Checks all active tasks with due dates and times, and fires reminders
 * based on each task's reminderOffsetMinutes (default 10 minutes early).
 */
export function checkAndTriggerTaskReminders(tasks: Task[]): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const currentTimestamp = now.getTime();

  for (const task of tasks) {
    if (task.done || !task.due || !task.time) continue;

    // Default reminder offset to 10 minutes unless explicitly set
    const offsetMin = task.reminderOffsetMinutes !== undefined ? task.reminderOffsetMinutes : 10;
    if (task.reminderEnabled === false) continue;

    const [year, month, day] = task.due.split('-').map(Number);
    const [hours, minutes] = task.time.split(':').map(Number);
    if (!year || !month || !day || isNaN(hours) || isNaN(minutes)) continue;

    // Create the task scheduled date in local time
    const taskDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const taskTimestamp = taskDate.getTime();

    // Trigger time is task time minus offset minutes
    const reminderTimestamp = taskTimestamp - offsetMin * 60 * 1000;

    // Notification window: between reminderTimestamp and reminderTimestamp + 5 minutes
    // (allows user to receive notification if app wakes slightly late or mobile switches network)
    const windowStart = reminderTimestamp;
    const windowEnd = reminderTimestamp + 5 * 60 * 1000;

    const reminderKey = `${task.id}_${task.due}_${task.time}_${offsetMin}`;

    if (currentTimestamp >= windowStart && currentTimestamp <= windowEnd) {
      if (!notifiedReminders.has(reminderKey)) {
        notifiedReminders.add(reminderKey);
        persistNotified();

        const formattedTime = formatTime12h(task.time);
        const earlyText =
          offsetMin === 0
            ? 'Starting right now!'
            : `Starting in ${offsetMin} minute${offsetMin === 1 ? '' : 's'} (${formattedTime})`;

        dispatchNotification(`⏰ ${task.title}`, {
          body: `${earlyText}${task.tag ? ` · #${task.tag}` : ''}`,
          tag: reminderKey,
          data: { taskId: task.id },
        });
      }
    }
  }
}
