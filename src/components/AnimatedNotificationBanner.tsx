import React, { useEffect, useState } from 'react';
import { TaskNotificationPayload } from '../types';
import { formatTimeDisplay } from '../utils/time';
import { CATEGORY_COLORS } from './DayArc';

interface AnimatedNotificationBannerProps {
  notification: TaskNotificationPayload | null;
  onComplete: (taskId: string) => void;
  onDismiss: () => void;
}

export const AnimatedNotificationBanner: React.FC<AnimatedNotificationBannerProps> = ({
  notification,
  onComplete,
  onDismiss,
}) => {
  const [isCompletedState, setIsCompletedState] = useState(false);

  useEffect(() => {
    setIsCompletedState(false);
    if (!notification) return;

    // Auto-dismiss after 8.5 seconds if untouched
    const timer = setTimeout(() => {
      onDismiss();
    }, 8500);

    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompletedState(true);
    setTimeout(() => {
      onComplete(notification.taskId);
    }, 450);
  };

  const categoryColor = CATEGORY_COLORS[notification.category] || '#2F3E8F';
  const isNow = notification.type === 'now';
  const isLead = notification.type === 'lead';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-[110] flex justify-center px-3.5 pointer-events-none select-none"
    >
      <div className="pointer-events-auto w-full max-w-md relative overflow-hidden rounded-[24px] bg-white border border-[#DDE5EA] shadow-[0_16px_40px_rgba(23,33,43,0.18)] p-4 transition-all animate-bannerSlideDown">
        {/* Subtle glowing ambient pulse */}
        <div
          className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-25 pointer-events-none ${
            isNow ? 'bg-[#E4572E]' : 'bg-[#F2A33A]'
          }`}
        />

        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Animated ringing bell badge */}
            <div className="relative w-7 h-7 rounded-full bg-[#F2A33A]/15 text-[#F2A33A] flex items-center justify-center animate-pulseRing flex-shrink-0">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-bounce"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>

            {/* Status chip */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight ${
                isNow
                  ? 'bg-[#FBE3DC] text-[#A3321A]'
                  : isLead
                  ? 'bg-[#FFF3D6] text-[#8A5A0C]'
                  : 'bg-[#E3E8F6] text-[#2F3E8F]'
              }`}
            >
              {isNow
                ? '⚡ Starting Now'
                : isLead
                ? `Starts in ${notification.leadMinutes ?? 10} min`
                : 'Task Reminder'}
            </span>

            {/* Category dot */}
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#55636F]">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: categoryColor }}
              />
              <span className="capitalize">{notification.category}</span>
            </span>
          </div>

          {/* Dismiss button (min 44x44px target) */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss reminder"
            className="w-11 h-11 -mr-2 -mt-2 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Task Details */}
        <div className="pt-0.5 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="font-heading font-bold text-[16px] text-[#17212B] leading-tight line-clamp-1">
              {notification.title}
            </h4>
            {notification.startTime && (
              <span className="text-[12px] font-mono font-semibold text-[#2F3E8F] bg-[#E3E8F6] px-2 py-0.5 rounded-md flex-shrink-0">
                {formatTimeDisplay(notification.startTime)}
              </span>
            )}
          </div>

          {notification.description && (
            <p className="font-body text-[12px] text-[#55636F] leading-snug line-clamp-2">
              {notification.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-[#EEF3F6] flex items-center gap-2">
          {/* Main Action: Mark as Complete */}
          <button
            type="button"
            onClick={handleCompleteClick}
            disabled={isCompletedState}
            aria-label={`Mark ${notification.title} as complete`}
            className={`min-h-[44px] flex-1 px-4 py-2 rounded-[16px] font-heading font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
              isCompletedState
                ? 'bg-[#2A8C8C] text-white animate-pulse'
                : 'bg-[#17212B] text-white hover:bg-black'
            }`}
          >
            {isCompletedState ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Completed!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Mark as Complete</span>
              </>
            )}
          </button>

          {/* Secondary Action: Dismiss */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="min-h-[44px] px-3.5 py-2 rounded-[16px] border border-[#DDE5EA] text-[#55636F] font-heading font-semibold text-xs hover:bg-[#EEF3F6] active:scale-95 transition-all cursor-pointer"
          >
            Later
          </button>
        </div>

        {/* Auto-dismiss progress countdown line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EEF3F6]">
          <div className="h-full bg-[#F2A33A] animate-progressShrink" />
        </div>
      </div>
    </div>
  );
};
