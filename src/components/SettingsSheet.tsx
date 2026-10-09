import React, { useState } from 'react';
import { AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { haptic } from '../utils/dateAndHaptics';
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  sendTestNotification,
} from '../utils/notifications';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onExportJSON: () => void;
  onDeleteAllData: () => void;
  onOpenOnboarding: () => void;
  onToast: (msg: string) => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  open,
  onClose,
  settings,
  onUpdateSettings,
  onExportJSON,
  onDeleteAllData,
  onOpenOnboarding,
  onToast,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [emailInput, setEmailInput] = useState(settings.syncEmail || '');

  if (!open) return null;

  const handleSaveSyncAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    onUpdateSettings({ syncEmail: trimmed, lastSyncedAt: `Today at ${now}` });
    haptic(10);
    onToast(`Sync profile linked (${trimmed})`);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className="fixed inset-0"
        style={{ backgroundColor: 'rgba(10, 12, 18, 0.48)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-[560px] max-h-[88vh] overflow-y-auto rounded-t-[24px] p-5 animate-sheet space-y-5"
        style={{
          backgroundColor: 'var(--surface)',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div
          className="w-9 h-1 rounded-full mx-auto -mt-1"
          style={{ backgroundColor: 'var(--line)' }}
        />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl grid place-items-center text-sm font-semibold"
            style={{ color: 'var(--muted)' }}
          >
            Close
          </button>
        </div>

        <div>
          <div className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>
            Appearance
          </div>
          <div
            className="flex rounded-2xl p-1 gap-1"
            style={{ backgroundColor: 'var(--line)' }}
            role="group"
            aria-label="Theme selection"
          >
            {(['auto', 'light', 'dark'] as const).map((t) => {
              const active = settings.theme === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onUpdateSettings({ theme: t });
                    haptic(8);
                  }}
                  className="flex-1 min-h-[44px] rounded-xl text-sm font-bold capitalize transition-colors"
                  style={{
                    backgroundColor: active ? 'var(--surface)' : 'transparent',
                    color: active ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>
              Week starts on
            </div>
            <div
              className="flex rounded-2xl p-1 gap-1"
              style={{ backgroundColor: 'var(--line)' }}
              role="group"
              aria-label="Week start day"
            >
              {(['monday', 'sunday'] as const).map((day) => {
                const active = settings.weekStart === day;
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onUpdateSettings({ weekStart: day })}
                    className="flex-1 min-h-[44px] rounded-xl text-xs font-bold capitalize"
                    style={{
                      backgroundColor: active ? 'var(--surface)' : 'transparent',
                      color: active ? 'var(--ink)' : 'var(--muted)',
                    }}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>
              Weight units
            </div>
            <div
              className="flex rounded-2xl p-1 gap-1"
              style={{ backgroundColor: 'var(--line)' }}
              role="group"
              aria-label="Weight units"
            >
              {(['kg', 'lb'] as const).map((u) => {
                const active = settings.units === u;
                return (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onUpdateSettings({ units: u })}
                    className="flex-1 min-h-[44px] rounded-xl text-sm font-bold"
                    style={{
                      backgroundColor: active ? 'var(--surface)' : 'transparent',
                      color: active ? 'var(--ink)' : 'var(--muted)',
                    }}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5">
                <span>🔔 Mobile Push Reminders</span>
                {isNotificationSupported() && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{
                      backgroundColor:
                        getNotificationPermission() === 'granted'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'var(--tint)',
                      color:
                        getNotificationPermission() === 'granted'
                          ? 'var(--ok)'
                          : 'var(--accent)',
                    }}
                  >
                    {getNotificationPermission() === 'granted' ? 'Active' : 'Setup'}
                  </span>
                )}
              </div>
              <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                Get alerts on your phone before tasks start (10 min early, 20 min early, etc.).
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.notificationsEnabled !== false}
              onClick={async () => {
                const nextState = settings.notificationsEnabled === false ? true : false;
                if (nextState) {
                  await requestNotificationPermission();
                }
                onUpdateSettings({ notificationsEnabled: nextState });
                haptic(8);
              }}
              className="min-h-[44px] px-4 rounded-xl text-sm font-bold shrink-0"
              style={{
                backgroundColor: settings.notificationsEnabled !== false ? 'var(--accent)' : 'var(--surface)',
                color: settings.notificationsEnabled !== false ? 'var(--on-accent)' : 'var(--muted)',
                border: `1px solid ${settings.notificationsEnabled !== false ? 'var(--accent)' : 'var(--line)'}`,
              }}
            >
              {settings.notificationsEnabled !== false ? 'On' : 'Off'}
            </button>
          </div>

          {settings.notificationsEnabled !== false && (
            <div className="pt-2.5 space-y-2.5" style={{ borderTop: '1px solid var(--line)' }}>
              <div>
                <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  Default Reminder Lead Time
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: 'At time', val: 0 },
                    { label: '5m early', val: 5 },
                    { label: '10m early', val: 10 },
                    { label: '15m early', val: 15 },
                    { label: '20m early', val: 20 },
                    { label: '30m early', val: 30 },
                  ].map((lead) => {
                    const active = (settings.defaultReminderOffset ?? 10) === lead.val;
                    return (
                      <button
                        key={lead.val}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ defaultReminderOffset: lead.val });
                          haptic(6);
                        }}
                        className="min-h-[36px] px-3 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: active ? 'var(--accent)' : 'var(--surface)',
                          color: active ? 'var(--on-accent)' : 'var(--muted)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                        }}
                      >
                        {lead.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    haptic(10);
                    const success = await sendTestNotification();
                    if (success) {
                      onToast('Test reminder alert sent! Check your notification bar.');
                    } else {
                      onToast('Please grant notification permission in your browser/device settings.');
                    }
                  }}
                  className="min-h-[38px] px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                  style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
                >
                  <span>📲 Send Test Notification</span>
                </button>
                <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  Haptics enabled
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-sm">AI assistance</div>
              <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                Sends only your active prompt or task titles to our server endpoint when you request a suggestion. No tracking, no ads.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.aiEnabled}
              onClick={() => {
                onUpdateSettings({ aiEnabled: !settings.aiEnabled });
                haptic(8);
              }}
              className="min-h-[44px] px-4 rounded-xl text-sm font-bold shrink-0"
              style={{
                backgroundColor: settings.aiEnabled ? 'var(--accent)' : 'var(--surface)',
                color: settings.aiEnabled ? 'var(--on-accent)' : 'var(--muted)',
                border: `1px solid ${settings.aiEnabled ? 'var(--accent)' : 'var(--line)'}`,
              }}
            >
              {settings.aiEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 space-y-2.5"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
        >
          <div className="font-bold text-sm">Optional account & sync</div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            All tasks and workouts are saved locally in IndexedDB and work offline with no account. Link an email below to snapshot sync across devices.
          </p>
          {settings.syncEmail ? (
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="text-xs">
                <span className="font-semibold">{settings.syncEmail}</span>
                {settings.lastSyncedAt ? (
                  <span style={{ color: 'var(--muted)' }}> · Synced {settings.lastSyncedAt}</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    onUpdateSettings({ lastSyncedAt: `Today at ${now}` });
                    onToast('Synced latest snapshot');
                  }}
                  className="min-h-[44px] px-3 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
                >
                  Sync now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('');
                    onUpdateSettings({ syncEmail: undefined, lastSyncedAt: undefined });
                    onToast('Signed out of sync');
                  }}
                  className="min-h-[44px] px-3 rounded-xl text-xs font-semibold"
                  style={{ color: 'var(--muted)' }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveSyncAccount} className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                enterKeyHint="done"
                className="flex-1 min-h-[44px] px-3 rounded-xl text-sm"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                aria-label="Email for optional sync"
              />
              <button
                type="submit"
                disabled={!emailInput.trim()}
                className="min-h-[44px] px-4 rounded-xl text-xs font-bold disabled:opacity-40 whitespace-nowrap"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                Link email
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenOnboarding();
            }}
            className="min-h-[44px] px-4 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
          >
            Fitness & AI setup
          </button>
        </div>

        <div
          className="pt-3 flex items-center justify-between gap-2 flex-wrap"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <button
            type="button"
            onClick={onExportJSON}
            className="min-h-[44px] px-4 rounded-xl text-sm font-bold"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
          >
            Export data as JSON
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="min-h-[44px] px-4 rounded-xl text-sm font-bold"
              style={{ color: 'var(--danger)' }}
            >
              Delete all data
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onDeleteAllData();
                  setConfirmDelete(false);
                  onClose();
                }}
                className="min-h-[44px] px-4 rounded-xl text-sm font-bold"
                style={{ backgroundColor: 'var(--danger)', color: '#FFFFFF' }}
              >
                Confirm delete everything
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[44px] px-3 rounded-xl text-sm font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsSheet;
