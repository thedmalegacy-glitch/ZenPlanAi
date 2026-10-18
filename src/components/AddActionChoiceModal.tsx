import React from 'react';

interface AddActionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: () => void;
  onSelectVoiceTask?: () => void;
  onSelectNote: () => void;
  dateLabel?: string;
}

export const AddActionChoiceModal: React.FC<AddActionChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectTask,
  onSelectVoiceTask,
  onSelectNote,
  dateLabel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-t-[24px] sm:rounded-[20px] border border-[#DDE5EA] p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#EEF3F6]">
          <div>
            <h3 className="font-heading text-lg font-bold text-[#17212B]">
              What would you like to add?
            </h3>
            {dateLabel && (
              <p className="font-body text-xs text-[#55636F] mt-0.5">
                For {dateLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          {/* Option 0: Add with Voice */}
          {onSelectVoiceTask && (
            <button
              type="button"
              onClick={onSelectVoiceTask}
              className="min-h-[56px] w-full p-4 rounded-[18px] border-2 border-[#17212B] bg-[#17212B] text-white hover:bg-black active:scale-98 transition-all flex items-center justify-between group cursor-pointer text-left shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 text-[#F2A33A] flex items-center justify-center shadow-xs">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-heading font-bold text-[15px] text-white">Add with Voice</p>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F2A33A] text-[#17212B] font-bold">New</span>
                  </div>
                  <p className="font-body text-xs text-white/80">Speak your task & time naturally</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/70 group-hover:translate-x-0.5 transition-transform">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Option 1: Add Note */}
          <button
            type="button"
            onClick={onSelectNote}
            className="min-h-[56px] w-full p-4 rounded-[18px] border border-[#DDE5EA] hover:border-[#F2A33A] bg-[#FAFCFD] hover:bg-white active:scale-98 transition-all flex items-center justify-between group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F2A33A] text-[#17212B] flex items-center justify-center shadow-xs">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <p className="font-heading font-semibold text-[15px] text-[#17212B]">Add Note</p>
                <p className="font-body text-xs text-[#55636F]">Write thoughts, journal, or takeaways</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9AA9B5] group-hover:text-[#F2A33A] transition-colors">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Option 2: Add Task Form */}
          <button
            type="button"
            onClick={onSelectTask}
            className="min-h-[56px] w-full p-4 rounded-[18px] border border-[#DDE5EA] hover:border-[#17212B] bg-[#FAFCFD] hover:bg-white active:scale-98 transition-all flex items-center justify-between group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EEF3F6] text-[#17212B] flex items-center justify-center shadow-xs">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="font-heading font-semibold text-[15px] text-[#17212B]">Add Task (Form)</p>
                <p className="font-body text-xs text-[#55636F]">Schedule a task, meeting, or timeblock</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9AA9B5] group-hover:text-[#17212B] transition-colors">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
