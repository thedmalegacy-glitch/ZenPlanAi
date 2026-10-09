import React, { useState } from 'react';
import {
  NotificationSettings,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/notifications';

interface NotificationSettingsButtonProps {
  settings: NotificationSettings;
  onOpenModal: () => void;
  onUpdateSettings?: (settings: NotificationSettings) => void;
}

export const NotificationSettingsButton: React.FC<NotificationSettingsButtonProps> = ({
  settings,
  onOpenModal,
  onUpdateSettings,
}) => {
  const isSupported = isNotificationSupported();
  const permission = isNotificationSupported() ? getNotificationPermission() : 'denied';
  const isActive = settings.enabled && permission === 'granted';

  return (
    <button
      type="button"
      onClick={onOpenModal}
      aria-label="Notification Reminder Settings"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium font-body border transition-all active:scale-95 cursor-pointer ${
        isActive
          ? 'bg-[#E3E8F6] border-[#2F3E8F]/30 text-[#2F3E8F]'
          : 'bg-white border-[#DDE5EA] text-[#55636F] hover:bg-[#EEF3F6] hover:text-[#17212B]'
      }`}
      title={isActive ? `Reminders on (${settings.leadMinutes}m before)` : 'Set push reminders for tasks'}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isActive ? 'text-[#2F3E8F]' : 'text-[#F2A33A]'}
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      <span>{isActive ? 'Reminders On' : 'Reminders'}</span>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#2F3E8F]" />
      )}
    </button>
  );
};
