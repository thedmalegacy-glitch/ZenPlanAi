import React, { useState } from 'react';
import {
  NotificationSettings,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '../utils/notifications';
import { TaskNotificationPayload } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSaveSettings: (settings: NotificationSettings) => void;
  onTriggerTestBanner?: (payload: TaskNotificationPayload) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTriggerTestBanner,
}) => {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [leadMinutes, setLeadMinutes] = useState(settings.leadMinutes);
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const isSupported = isNotificationSupported();

  const handleToggleEnable = async () => {
    if (!enabled) {
      if (permission !== 'granted') {
        const res = await requestNotificationPermission();
        setPermission(res);
        if (res === 'granted') {
          setEnabled(true);
          onSaveSettings({ ...settings, enabled: true, leadMinutes });
        }
      } else {
        setEnabled(true);
        onSaveSettings({ ...settings, enabled: true, leadMinutes });
      }
    } else {
      setEnabled(false);
      onSaveSettings({ ...settings, enabled: false, leadMinutes });
    }
  };

  const handleLeadChange = (val: number) => {
    setLeadMinutes(val);
    onSaveSettings({ ...settings, enabled, leadMinutes: val });
  };

  const handleSendTest = async () => {
    if (permission !== 'granted') {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res !== 'granted') return;
    }
    const ok = await sendTestNotification(onTriggerTestBanner);
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md my-auto bg-white rounded-[24px] border border-[#DDE5EA] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#EEF3F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F2A33A]/15 text-[#F2A33A] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <div>
              <h2 id="notification-modal-title" className="font-heading text-lg font-bold text-[#17212B]">
                Task Push Reminders
              </h2>
              <p className="font-body text-xs text-[#55636F]">
                On-device alert alerts for scheduled tasks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications modal"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 active:bg-[#DDE5EA] transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {!isSupported ? (
          <div className="p-4 rounded-[16px] bg-[#FBE3DC] text-[#A3321A] text-xs font-medium">
            Push notifications are not supported in this browser environment. For mobile alerts, open ZenPlan in Safari on iOS (and Add to Home Screen) or Chrome on Android.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Master Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#EEF3F6] border border-[#DDE5EA]">
              <div>
                <p className="font-heading font-semibold text-sm text-[#17212B]">
                  Enable Task Notifications
                </p>
                <p className="font-body text-xs text-[#55636F]">
                  {permission === 'granted'
                    ? 'Browser permission granted'
                    : permission === 'denied'
                    ? 'Permission blocked in browser settings'
                    : 'Prompt for push permission'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleEnable}
                aria-label="Toggle notifications switch"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  enabled && permission === 'granted' ? 'bg-[#17212B]' : 'bg-[#D5DFE6]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled && permission === 'granted' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reminder Timing Lead */}
            <div className="space-y-2">
              <label htmlFor="lead-time-select" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F]">
                Default Alert Timing
              </label>
              <select
                id="lead-time-select"
                value={leadMinutes}
                disabled={!enabled}
                onChange={(e) => handleLeadChange(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none disabled:opacity-50"
              >
                <option value={0}>At scheduled start time (0 min)</option>
                <option value={5}>5 minutes before start</option>
                <option value={10}>10 minutes before start (Recommended)</option>
                <option value={15}>15 minutes before start</option>
                <option value={30}>30 minutes before start</option>
              </select>
              <div className="p-3 rounded-xl bg-[#FFF3D6] text-[#8A5A0C] text-[11px] leading-relaxed space-y-1">
                <p className="font-semibold text-xs text-[#17212B] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F2A33A]" />
                  Dual Reminder Schedule:
                </p>
                <p>
                  <strong>1st Alert:</strong> Arrives at your chosen lead time (e.g. {leadMinutes === 0 ? 'at start' : `${leadMinutes} mins before`}).
                </p>
                {leadMinutes > 0 && (
                  <p>
                    <strong>2nd Alert:</strong> Arrives at the exact moment the task starts.
                  </p>
                )}
                <p className="text-[10px] opacity-90 pt-0.5">
                  Both alerts show the title, description, and an instant <strong>&quot;✓ Mark Complete&quot;</strong> button right in your notification panel.
                </p>
              </div>
            </div>

            {/* On-device Storage Note */}
            <div className="p-3.5 rounded-[16px] bg-[#DDF0EE] text-[#1F6F6F] text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                100% Stored Locally on Your Device
              </div>
              <p className="leading-relaxed text-[11px]">
                All your schedule, habits, and tasks remain entirely inside this device’s local browser storage. No third-party servers see your schedule.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendTest}
                className="min-h-[44px] flex-1 py-2.5 px-4 rounded-[16px] border border-[#DDE5EA] font-body text-xs font-semibold text-[#17212B] hover:bg-[#EEF3F6] active:scale-95 active:bg-[#DDE5EA] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {testSent ? '✓ Notification Sent!' : 'Send Test Alert'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] py-2.5 px-6 rounded-[16px] bg-[#17212B] font-body text-xs font-semibold text-white hover:bg-black active:scale-95 active:bg-gray-800 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
