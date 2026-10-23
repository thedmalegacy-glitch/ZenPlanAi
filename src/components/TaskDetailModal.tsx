import React, { useState } from 'react';
import { Task } from '../types';
import { formatDateLabel, formatTimeDisplay } from '../utils/time';
import { CATEGORY_COLORS } from './DayArc';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (id: string) => void;
  onToggleStep?: (taskId: string, stepId: string) => void;
  onDelete: (id: string) => void;
  onMoveToNextDay: (id: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onToggleComplete,
  onToggleStep,
  onDelete,
  onMoveToNextDay,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !task) return null;

  const categoryColor = CATEGORY_COLORS[task.category] || '#2F3E8F';
  const completedSteps = task.steps?.filter((s) => s.completed).length || 0;
  const totalSteps = task.steps?.length || 0;

  const handleCopyDescription = () => {
    if (task.description) {
      navigator.clipboard.writeText(task.description).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-[26px] sm:rounded-[24px] border border-[#DDE5EA] p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-scaleUp select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EEF3F6]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Pill with Color Stripe */}
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-2xs"
              style={{ backgroundColor: categoryColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="capitalize">{task.category}</span>
            </span>

            {/* Priority Indicator */}
            {task.priority === 'high' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBE3DC] text-[#A3321A]">
                High Priority
              </span>
            )}
            {task.priority === 'medium' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF4E8] text-[#8A5A0C]">
                Medium Priority
              </span>
            )}
            {task.priority === 'low' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF3F6] text-[#55636F]">
                Low Priority
              </span>
            )}

            {/* Completion Status */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                task.completed
                  ? 'bg-[#EAF5F0] text-[#1E7E51]'
                  : 'bg-[#EEF3F6] text-[#55636F]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${task.completed ? 'bg-[#1E7E51]' : 'bg-[#9AA9B5]'}`} />
              <span>{task.completed ? 'Completed' : 'Pending'}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer flex-shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Task Title */}
        <div>
          <h2
            id="task-detail-title"
            className={`font-heading text-[20px] sm:text-[22px] font-bold leading-snug break-words ${
              task.completed ? 'line-through text-[#55636F]' : 'text-[#17212B]'
            }`}
          >
            {task.title}
          </h2>
        </div>

        {/* Task Description Section (Core User Request: Read Full Details) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#55636F] flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Task Description & Details</span>
            </span>

            {task.description && (
              <button
                type="button"
                onClick={handleCopyDescription}
                className="text-[11px] font-semibold text-[#2F3E8F] hover:text-[#17212B] flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                title="Copy description"
              >
                {copied ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          {task.description ? (
            <div className="p-4 rounded-[18px] bg-[#F8FAFC] border border-[#E2E8F0] shadow-2xs">
              <p className="font-body text-[14px] text-[#1E293B] leading-relaxed whitespace-pre-wrap break-words select-text">
                {task.description}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[18px] bg-[#F8FAFC] border border-dashed border-[#CBD5E1] flex items-center justify-between text-xs text-[#64748B]">
              <span>No description written for this task.</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(task);
                }}
                className="font-bold text-[#2F3E8F] hover:underline cursor-pointer"
              >
                + Add description
              </button>
            </div>
          )}
        </div>

        {/* Date, Time & Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Scheduled Date */}
          <div className="p-3 rounded-[16px] bg-[#EEF3F6] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2F3E8F] shadow-2xs flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#55636F]">
                Date
              </span>
              <span className="font-body text-xs font-semibold text-[#17212B] truncate block">
                {formatDateLabel(task.date)}
              </span>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="p-3 rounded-[16px] bg-[#EEF3F6] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2F3E8F] shadow-2xs flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#55636F]">
                Time & Duration
              </span>
              <span className="font-body text-xs font-semibold text-[#17212B] truncate block">
                {task.startTime ? `${formatTimeDisplay(task.startTime)} (${task.durationMinutes || 30}m)` : 'Anytime (All Day)'}
              </span>
            </div>
          </div>

          {/* Push Reminder */}
          {task.startTime && (
            <div className="p-3 rounded-[16px] bg-[#EEF3F6] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#F2A33A] shadow-2xs flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#55636F]">
                  Reminder Alert
                </span>
                <span className="font-body text-xs font-semibold text-[#17212B] truncate block">
                  {task.reminderLeadMinutes ? `${task.reminderLeadMinutes} min before` : '10 min before'}
                </span>
              </div>
            </div>
          )}

          {/* Recurrence */}
          {task.recurrence && task.recurrence !== 'none' && (
            <div className="p-3 rounded-[16px] bg-[#EEF3F6] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2A8C8C] shadow-2xs flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#55636F]">
                  Repeats
                </span>
                <span className="font-body text-xs font-semibold text-[#17212B] capitalize truncate block">
                  {task.recurrence}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Steps Checklist (if task has steps) */}
        {totalSteps > 0 && (
          <div className="pt-2 border-t border-[#EEF3F6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#55636F]">
                Action Steps ({completedSteps}/{totalSteps})
              </span>
              <span className="text-xs font-semibold text-[#2F3E8F]">
                {Math.round((completedSteps / totalSteps) * 100)}% done
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {task.steps?.map((step) => (
                <div
                  key={step.id}
                  onClick={() => onToggleStep && onToggleStep(task.id, step.id)}
                  role="checkbox"
                  aria-checked={step.completed}
                  className="p-2.5 rounded-xl bg-[#FAFCFD] border border-[#E2E8F0] hover:border-[#CBD5E1] flex items-center gap-2.5 cursor-pointer active:scale-[0.99] transition-all select-none"
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      step.completed
                        ? 'bg-[#17212B] border-[#17212B] text-white'
                        : 'border-[#9AA9B5] bg-white'
                    }`}
                  >
                    {step.completed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium leading-tight flex-1 ${
                      step.completed ? 'line-through text-[#9AA9B5]' : 'text-[#17212B]'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="pt-3 border-t border-[#EEF3F6] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Secondary Actions: Complete, Move to Next Day, Delete */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Completion */}
            <button
              type="button"
              onClick={() => {
                onToggleComplete(task.id);
              }}
              className={`min-h-[42px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs ${
                task.completed
                  ? 'bg-[#EEF3F6] text-[#55636F] hover:text-[#17212B]'
                  : 'bg-[#17212B] text-white hover:bg-black'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{task.completed ? 'Mark Incomplete' : 'Mark Complete'}</span>
            </button>

            {/* Move to Next Day */}
            <button
              type="button"
              onClick={() => {
                onMoveToNextDay(task.id);
                onClose();
              }}
              className="min-h-[42px] px-3 rounded-xl border border-[#DDE5EA] bg-white text-[#2F3E8F] text-xs font-semibold hover:bg-[#E3E8F6] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Postpone to tomorrow"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
                <line x1="5" y1="12" x2="15" y2="12" />
              </svg>
              <span>+1 Day</span>
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="w-10 h-10 rounded-xl border border-[#DDE5EA] bg-white text-[#55636F] hover:text-[#E4572E] hover:bg-[#FBE3DC] active:scale-90 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              title="Delete task"
              aria-label="Delete task"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>

          {/* Primary Action: Edit Task & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="flex-1 sm:flex-initial min-h-[42px] px-4 rounded-xl bg-[#F2A33A] text-[#17212B] font-body text-xs font-bold hover:bg-[#e09228] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 rounded-xl border border-[#DDE5EA] bg-white text-[#55636F] text-xs font-semibold hover:bg-[#EEF3F6] active:scale-95 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
