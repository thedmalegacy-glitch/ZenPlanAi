import React, { useState } from 'react';
import {
  NotificationSettings,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  sendDelayedClosedAppTest,
  getOrRegisterPushSubscription,
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
  const [closedAppTestState, setClosedAppTestState] = useState<'idle' | 'counting' | 'sent'>('idle');
  const [countdown, setCountdown] = useState(5);

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

  const handleTestClosedApp = async () => {
    if (permission !== 'granted') {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res !== 'granted') return;
    }
    await getOrRegisterPushSubscription();
    const ok = await sendDelayedClosedAppTest(5);
    if (ok) {
      setClosedAppTestState('counting');
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            setClosedAppTestState('sent');
            setTimeout(() => setClosedAppTestState('idle'), 4000);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
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

            {/* Closed App & Background Push Notifications Card */}
            <div className="p-4 rounded-[18px] bg-linear-to-br from-[#17212B] to-[#2F3E8F] text-white space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h24s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <span className="font-heading font-bold text-xs tracking-wide">
                    Closed App &amp; Locked Screen Alerts
                  </span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#10B981]/25 text-[#6EE7B7] border border-[#10B981]/30">
                  Active
                </span>
              </div>

              <p className="font-body text-[11.5px] text-white/85 leading-relaxed">
                Reminders are delivered directly to your device screen &amp; sound alerts via Web Push even when this app is completely closed or screen is locked.
              </p>

              {/* Interactive Closed-App Test Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleTestClosedApp}
                  disabled={closedAppTestState === 'counting'}
                  className={`w-full min-h-[40px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    closedAppTestState === 'counting'
                      ? 'bg-[#F2A33A] text-[#17212B] font-bold animate-pulse'
                      : closedAppTestState === 'sent'
                      ? 'bg-[#10B981] text-white font-bold'
                      : 'bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20'
                  }`}
                >
                  {closedAppTestState === 'counting' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-[#17212B] animate-ping" />
                      <span>Firing in {countdown}s! Lock screen or close app now</span>
                    </>
                  ) : closedAppTestState === 'sent' ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Alert Dispatched to Device!</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Test Closed-App Alert (5s delay)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-white/70 text-center mt-1.5">
                  Tap above, then immediately close this app or lock your phone to see it ring!
                </p>
              </div>
            </div>

            {/* Mobile PWA & Home Screen Tip */}
            <div className="p-3.5 rounded-[16px] bg-[#EEF3F6] border border-[#DDE5EA] text-[#55636F] text-xs space-y-1">
              <div className="font-bold text-[#17212B] flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                  <path d="M12 18h.01" />
                </svg>
                Mobile Best Practice
              </div>
              <p className="leading-relaxed text-[11px]">
                On Android &amp; iOS, install ZenPlan to your <strong>Home Screen</strong> via the install button or Safari Share menu. Installed web apps receive system push wakeups with the highest reliability.
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
