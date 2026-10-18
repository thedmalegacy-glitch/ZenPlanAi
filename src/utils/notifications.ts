// Web Notifications & Push Reminder Utilities for ZenPlan AI
import { Task, TaskNotificationPayload } from '../types';
import { formatTimeDisplay } from './time';

const NOTIF_STORAGE_SETTINGS_KEY = 'zenplan_notification_settings_v1';
const FIRED_REMINDERS_KEY = 'zenplan_fired_reminders_v1';

export interface NotificationSettings {
  enabled: boolean;
  leadMinutes: number; // e.g. 0 (at time), 5, 10, 15, 30 minutes before
  soundEnabled: boolean;
}

export const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  enabled: true,
  leadMinutes: 10,
  soundEnabled: true,
};

// Check if notifications are supported by the browser
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

// Request permission from the user and proactively initialize Service Worker
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      getActiveServiceWorkerRegistration().catch(() => {});
    }
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
    if (saved) {
      const parsed = JSON.parse(saved);
      // If browser permission is already granted, keep notifications enabled
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        parsed.enabled = true;
      }
      return parsed;
    }
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

// Synthesize pleasant, zero-latency melodic audio chime using HTML5 Web Audio API
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: Gentle chime (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Harmonic resolution (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch {
    // Audio context may be restricted before initial user touch gesture
  }
}

// Mobile device vibration pattern for task reminders
export function triggerDeviceVibration(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 200]);
    } catch {
      // Ignore vibration errors if restricted
    }
  }
}

// Reliably acquire active Service Worker Registration (Required for Android & mobile notification panels)
export async function getActiveServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // 1. Check if we already have an active registration
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing && existing.active) {
      return existing;
    }

    // 2. Explicitly register /sw.js with root scope
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    // 3. Wait for readiness
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<ServiceWorkerRegistration | null>((resolve) =>
      setTimeout(() => resolve(reg), 1500)
    );
    const readyReg = await Promise.race([readyPromise, timeoutPromise]);
    return readyReg || reg;
  } catch (err) {
    console.warn('Could not acquire service worker registration:', err);
    try {
      return await navigator.serviceWorker.ready;
    } catch {
      return null;
    }
  }
}

export interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: Array<{ action: string; title: string; icon?: string }>;
  vibrate?: number[];
  renotify?: boolean;
}

// Send mobile notification panel alert with action buttons (✓ Mark Complete)
export async function showTaskNotification(
  title: string,
  options?: ExtendedNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  playNotificationChime();
  triggerDeviceVibration();

  const notificationOptions: ExtendedNotificationOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    renotify: true,
    actions: [
      { action: 'complete', title: '✓ Mark Complete' },
      { action: 'open', title: 'Open App' },
    ],
    ...options,
  };

  try {
    // Crucial for Mobile Chrome & Android PWA:
    // Mobile browsers prohibit `new Notification()`; they mandate `registration.showNotification(...)`.
    const reg = await getActiveServiceWorkerRegistration();
    if (reg && reg.showNotification) {
      await reg.showNotification(title, notificationOptions);
      return true;
    }

    // Attempt controller postMessage as fallback
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRIGGER_TASK_NOTIFICATION',
        title,
        options: notificationOptions,
      });
      return true;
    }

    // Desktop browser fallback ONLY (Android throws TypeError on new Notification)
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!isMobileDevice && typeof window.Notification === 'function') {
      new Notification(title, notificationOptions);
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error showing task notification:', err);
    return false;
  }
}

// Key for tracking fired reminders to prevent duplicate triggers
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
    // Keep max 250 items to prevent storage bloat
    const arr = Array.from(current).slice(-250);
    localStorage.setItem(FIRED_REMINDERS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
}

// Test trigger that fires both mobile panel notification and in-app animated banner
export async function sendTestNotification(
  onTriggerAnimatedBanner?: (payload: TaskNotificationPayload) => void
): Promise<boolean> {
  const testPayload: TaskNotificationPayload = {
    taskId: 'test_task_preview',
    title: 'Daily Focus & Review Block',
    description: 'Review your top 3 tasks for today and protect your deep work focus.',
    category: 'work',
    startTime: '09:00',
    leadMinutes: 10,
    type: 'test',
  };

  // 1. Trigger animated in-app notification banner
  if (onTriggerAnimatedBanner) {
    onTriggerAnimatedBanner(testPayload);
  }

  // 2. Trigger mobile notification panel system alert
  return showTaskNotification('ZenPlan • Daily Focus & Review Block', {
    body: 'Review your top 3 tasks for today and protect your deep work focus. (Starts at 09:00 AM)',
    tag: 'zenplan-test-notification',
    data: {
      taskId: 'test_task_preview',
      date: new Date().toISOString().slice(0, 10),
    },
    actions: [
      { action: 'complete', title: '✓ Mark Complete' },
      { action: 'open', title: 'Open App' },
    ],
  });
}

/**
 * Background scheduler tick that examines scheduled tasks and triggers two notifications:
 * 1st notification: At the user's chosen lead time (e.g. 10 min before task).
 * 2nd notification: At the exact time of the task (0 min / task start time).
 */
export function checkAndTriggerTaskReminders(
  tasks: Task[],
  settings: NotificationSettings,
  onTriggerAnimatedBanner?: (payload: TaskNotificationPayload) => void
): void {
  if (!settings.enabled) return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const firedSet = getFiredReminders();

  tasks.forEach((task) => {
    // Only remind active (not completed) tasks that belong to today and have a startTime
    if (task.completed || task.date !== todayStr || !task.startTime) return;

    const parts = task.startTime.split(':');
    if (parts.length < 2) return;
    const taskMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

    const lead = task.reminderLeadMinutes !== undefined ? task.reminderLeadMinutes : settings.leadMinutes;
    const timeLabel = formatTimeDisplay(task.startTime);

    // ================= NOTIFICATION 1: At chosen lead time by user =================
    if (lead > 0) {
      const targetLeadNoticeMinutes = taskMinutes - lead;
      const leadDiff = currentMinutes - targetLeadNoticeMinutes;

      // Within a 4-minute window of the chosen lead time (before the actual task start)
      if (leadDiff >= 0 && leadDiff <= 4 && currentMinutes < taskMinutes) {
        const leadReminderKey = `lead_${task.id}_${task.date}_${task.startTime}_${lead}`;
        if (!firedSet.has(leadReminderKey)) {
          markReminderFired(leadReminderKey);

          const bodyText = `${task.description ? `${task.description} • ` : ''}Starts in ${lead} mins at ${timeLabel} (${task.durationMinutes} min ${task.category})`;

          // Trigger mobile notification panel system alert if permission granted
          if (getNotificationPermission() === 'granted') {
            showTaskNotification(`Upcoming: ${task.title}`, {
              body: bodyText,
              tag: `zenplan-${task.id}-lead`,
              data: { taskId: task.id, date: task.date },
              actions: [
                { action: 'complete', title: '✓ Mark Complete' },
                { action: 'open', title: 'Open App' },
              ],
            });
          }

          // Trigger animated in-app notification banner
          playNotificationChime();
          triggerDeviceVibration();
          if (onTriggerAnimatedBanner) {
            onTriggerAnimatedBanner({
              taskId: task.id,
              title: task.title,
              description: task.description,
              category: task.category,
              startTime: task.startTime,
              leadMinutes: lead,
              type: 'lead',
            });
          }
        }
      }
    }

    // ================= NOTIFICATION 2: At the exact time of the task =================
    const taskDiff = currentMinutes - taskMinutes;

    // Within a 4-minute window of the actual task start time
    if (taskDiff >= 0 && taskDiff <= 4) {
      const exactReminderKey = `exact_${task.id}_${task.date}_${task.startTime}`;
      if (!firedSet.has(exactReminderKey)) {
        markReminderFired(exactReminderKey);

        const bodyText = `${task.description ? `${task.description} • ` : ''}Starting now at ${timeLabel}! (${task.durationMinutes} min ${task.category})`;

        // Trigger mobile notification panel system alert if permission granted
        if (getNotificationPermission() === 'granted') {
          showTaskNotification(`Starting Now: ${task.title}`, {
            body: bodyText,
            tag: `zenplan-${task.id}-now`,
            data: { taskId: task.id, date: task.date },
            actions: [
              { action: 'complete', title: '✓ Mark Complete' },
              { action: 'open', title: 'Open App' },
            ],
          });
        }

        // Trigger animated in-app notification banner
        playNotificationChime();
        triggerDeviceVibration();
        if (onTriggerAnimatedBanner) {
          onTriggerAnimatedBanner({
            taskId: task.id,
            title: task.title,
            description: task.description,
            category: task.category,
            startTime: task.startTime,
            leadMinutes: 0,
            type: 'now',
          });
        }
      }
    }
  });
}
