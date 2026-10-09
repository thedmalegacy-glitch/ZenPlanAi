import React, { useState } from 'react';
import { Task } from '../types';
import { CATEGORY_COLORS } from './DayArc';
import { formatTimeDisplay } from '../utils/time';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onToggleStep?: (taskId: string, stepId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onToggleStep,
  onEdit,
  onDelete,
}) => {
  const [showSteps, setShowSteps] = useState(false);

  const completedStepsCount = task.steps?.filter((s) => s.completed).length || 0;
  const totalSteps = task.steps?.length || 0;
  const categoryColor = CATEGORY_COLORS[task.category] || '#7A5FA8';

  return (
    <div
      className={`w-full bg-white border border-[#DDE5EA] rounded-[18px] p-4 transition-all ${
        task.completed ? 'opacity-60 bg-[#FAFCFD]' : 'hover:border-[#C9D4DC]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Priority stripe / Category dot */}
        <div
          className="w-1.5 self-stretch rounded-full flex-shrink-0 my-0.5"
          style={{ backgroundColor: categoryColor }}
          title={`Category: ${task.category}`}
        />

        {/* Completion checkbox button (min 44x44 tap target) */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
          className="w-11 h-11 -ml-1 -mt-1 flex items-center justify-center flex-shrink-0 text-[#17212B] cursor-pointer"
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              task.completed
                ? 'bg-[#17212B] border-[#17212B] text-white'
                : 'border-[#9AA9B5] bg-white hover:border-[#17212B]'
            }`}
          >
            {task.completed && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`font-body font-semibold text-[15px] leading-snug cursor-pointer ${
                task.completed ? 'line-through text-[#55636F]' : 'text-[#17212B]'
              }`}
            >
              {task.title}
            </h4>

            {/* Priority Indicator */}
            {task.priority === 'high' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBE3DC] text-[#A3321A]">
                High
              </span>
            )}
            {task.priority === 'medium' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF4E8] text-[#8A5A0C]">
                Med
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="font-body text-[13px] text-[#55636F] mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Meta line: Time chip, category, subtask count */}
          <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[12px]">
            {task.startTime && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E3E8F6] text-[#2F3E8F] font-medium tabular-nums">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTimeDisplay(task.startTime)}
                <span className="text-[#55636F] text-[11px]">({task.durationMinutes}m)</span>
              </span>
            )}

            <span className="capitalize text-[#55636F] font-medium">
              #{task.category}
            </span>

            {totalSteps > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSteps(!showSteps);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EEF3F6] text-[#17212B] font-medium text-[11px] hover:bg-[#DDE5EA] transition-colors"
                aria-label={`Toggle steps. ${completedStepsCount} of ${totalSteps} completed`}
              >
                <span>{completedStepsCount}/{totalSteps} steps</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${showSteps ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}

            {task.recurrence && task.recurrence !== 'none' && (
              <span className="text-[11px] text-[#55636F] flex items-center gap-0.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                {task.recurrence}
              </span>
            )}

            {task.startTime && (
              <span
                className="text-[11px] text-[#55636F] flex items-center gap-1"
                title={`Push alert set for ${task.reminderLeadMinutes ?? 10}m prior`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F2A33A]">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span>{task.reminderLeadMinutes ?? 10}m alert</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Menu / Delete Button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete ${task.title}`}
            className="w-11 h-11 flex items-center justify-center rounded-full text-[#55636F] hover:text-[#E4572E] hover:bg-[#FBE3DC] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtasks Checklist */}
      {showSteps && task.steps && task.steps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#EEF3F6] pl-6 space-y-2">
          {task.steps.map((step) => (
            <div
              key={step.id}
              onClick={() => onToggleStep && onToggleStep(task.id, step.id)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  step.completed
                    ? 'bg-[#17212B] border-[#17212B] text-white'
                    : 'border-[#9AA9B5] group-hover:border-[#17212B]'
                }`}
              >
                {step.completed && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span
                className={`text-[13px] ${
                  step.completed ? 'line-through text-[#9AA9B5]' : 'text-[#17212B]'
                }`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
