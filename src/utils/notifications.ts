// Web Notifications & Push Reminder Utilities for ZenPlan AI
import { Task } from '../types';
import { formatTimeDisplay } from './time';

const NOTIF_STORAGE_SETTINGS_KEY = 'zenplan_notification_settings_v1';
const FIRED_REMINDERS_KEY = 'zenplan_fired_reminders_v1';

export interface NotificationSettings {
  enabled: boolean;
  leadMinutes: number; // e.g. 0 (at time), 5, 10, 15 minutes before
  soundEnabled: boolean;
}

export const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  enabled: false,
  leadMinutes: 10,
  soundEnabled: true,
};

// Check if browser notifications are supported
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

// Request permission from the user
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return 'denied';
  }
}

// Load saved settings
export function loadNotificationSettings(): NotificationSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_NOTIF_SETTINGS;
  try {
    const saved = localStorage.getItem(NOTIF_STORAGE_SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_NOTIF_SETTINGS;
}

// Save settings
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(NOTIF_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

// Send immediate web push/system notification
export async function showTaskNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    // If Service Worker is registered and active, use registration.showNotification for robust mobile/background behavior
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options,
        });
        return true;
      }
    }

    // Fallback to standard window Notification
    new Notification(title, {
      icon: '/pwa-192x192.png',
      ...options,
    });
    return true;
  } catch (err) {
    console.error('Error showing notification:', err);
    return false;
  }
}

// Test trigger
export async function sendTestNotification(): Promise<boolean> {
  return showTaskNotification('ZenPlan AI • Reminders Active', {
    body: 'Push notifications are successfully configured on this device. You will receive alerts for scheduled tasks.',
    tag: 'zenplan-test-notification',
  });
}

// Key for tracking fired reminders to avoid duplicate alerts
function getFiredReminders(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(FIRED_REMINDERS_KEY);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      return new Set(parsed);
    }
  } catch (e) {
    console.error(e);
  }
  return new Set();
}

function markReminderFired(key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = getFiredReminders();
    current.add(key);
    // Keep max 200 items to prevent storage bloat
    const arr = Array.from(current).slice(-200);
    localStorage.setItem(FIRED_REMINDERS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
}

// Background scheduler tick that examines scheduled tasks and triggers notifications
export function checkAndTriggerTaskReminders(tasks: Task[], settings: NotificationSettings): void {
  if (!settings.enabled || Notification.permission !== 'granted') return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const firedSet = getFiredReminders();

  tasks.forEach((task) => {
    // Only remind active (not completed) tasks that belong to today and have a start time
    if (task.completed || task.date !== todayStr || !task.startTime) return;

    const parts = task.startTime.split(':');
    if (parts.length < 2) return;
    const taskMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

    const targetNoticeMinutes = taskMinutes - (task.reminderLeadMinutes ?? settings.leadMinutes);

    // If within a 3-minute window of the reminder target time (or exactly now)
    const diff = currentMinutes - targetNoticeMinutes;
    if (diff >= 0 && diff <= 3) {
      const reminderKey = `${task.id}_${task.date}_${task.startTime}_${task.reminderLeadMinutes ?? settings.leadMinutes}`;
      if (!firedSet.has(reminderKey)) {
        markReminderFired(reminderKey);

        const timeLabel = formatTimeDisplay(task.startTime);
        const lead = task.reminderLeadMinutes ?? settings.leadMinutes;
        const bodyText =
          lead > 0
            ? `Starts in ${lead} minutes at ${timeLabel}. (${task.durationMinutes} min ${task.category})`
            : `Starting now at ${timeLabel}! (${task.durationMinutes} min ${task.category})`;

        showTaskNotification(`ZenPlan • ${task.title}`, {
          body: bodyText,
          tag: `task-${task.id}`,
        });
      }
    }
  });
}
