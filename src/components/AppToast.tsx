import React, { useEffect } from 'react';

export type ToastType = 'delete' | 'fitness_added' | 'task_added' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  message: string;
  subtext?: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface AppToastProps {
  toast: ToastNotification | null;
  onDismiss: () => void;
}

export const AppToast: React.FC<AppToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;

    const duration = toast.durationMs || 4500;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isDelete = toast.type === 'delete';
  const isFitness = toast.type === 'fitness_added';
  const isTask = toast.type === 'task_added';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[max(84px,calc(env(safe-area-inset-bottom)+76px))] left-1/2 -translate-x-1/2 z-[80] w-[92%] max-w-md animate-slideDownNotification select-none"
    >
      <div className="relative overflow-hidden rounded-[20px] bg-[#17212B]/95 text-white backdrop-blur-md shadow-2xl border border-white/15 p-3.5 flex items-center justify-between gap-3">
        {/* Left Icon + Text */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Icon Badge */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDelete
                ? 'bg-[#E4572E]/25 text-[#FF7A55]'
                : isFitness
                ? 'bg-[#2A8C8C]/25 text-[#4FC3C3]'
                : 'bg-[#F2A33A]/25 text-[#F2A33A]'
            }`}
          >
            {isDelete && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            )}

            {isFitness && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6.5 6.5 11 11" />
                <path d="m21 21-1-1a2 2 0 0 0-2.8 0l-2.8 2.8a2 2 0 0 1-2.8 0L9.8 21" />
                <path d="m3 3 1 1a2 2 0 0 0 2.8 0l2.8-2.8a2 2 0 0 1 2.8 0L14.2 3" />
              </svg>
            )}

            {isTask && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}

            {!isDelete && !isFitness && !isTask && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>

          {/* Text details */}
          <div className="min-w-0 pr-1">
            <p className="font-heading font-semibold text-xs text-white leading-snug line-clamp-1">
              {toast.message}
            </p>
            {toast.subtext && (
              <p className="font-body text-[11px] text-white/70 line-clamp-1">
                {toast.subtext}
              </p>
            )}
          </div>
        </div>

        {/* Action Button & Dismiss */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                onDismiss();
              }}
              className="min-h-[36px] px-3 py-1.5 rounded-full bg-white text-[#17212B] font-heading font-bold text-xs hover:bg-[#EEF3F6] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              {toast.actionLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notice"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Progress timer shrink bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div
            className={`h-full ${
              isDelete ? 'bg-[#FF7A55]' : isFitness ? 'bg-[#4FC3C3]' : 'bg-[#F2A33A]'
            } animate-progressShrink`}
            style={{ animationDuration: `${toast.durationMs || 4500}ms` }}
          />
        </div>
      </div>
    </div>
  );
};
