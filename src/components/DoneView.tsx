import React from 'react';
import { Task } from '../types';
import { TaskItem } from './TaskItem';
import { formatDateLabel } from '../utils/time';

interface DoneViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onClearAllCompleted: () => void;
}

export const DoneView: React.FC<DoneViewProps> = ({
  tasks,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onClearAllCompleted,
}) => {
  const completedTasks = tasks.filter((t) => t.completed);

  // Group completed tasks by date
  const grouped: Record<string, Task[]> = {};
  completedTasks.forEach((t) => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  });

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-[28px] font-bold text-[#17212B] leading-tight">
            Accomplishments
          </h1>
          <p className="font-body text-[13px] text-[#55636F] mt-0.5">
            {completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'} completed and logged.
          </p>
        </div>

        {completedTasks.length > 0 && (
          <button
            type="button"
            onClick={onClearAllCompleted}
            aria-label="Clear all completed tasks"
            className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#DDE5EA] text-[#55636F] text-xs font-semibold hover:text-[#E4572E] hover:border-[#FBE3DC] hover:bg-[#FBE3DC]/30 transition-colors cursor-pointer"
          >
            Clear Finished
          </button>
        )}
      </div>

      {/* Done List */}
      {completedTasks.length === 0 ? (
        <div className="p-10 text-center bg-white border border-[#DDE5EA] rounded-[20px] space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#DDF0EE] text-[#1F6F6F] flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="font-heading font-semibold text-[17px] text-[#17212B]">
            No completed tasks yet
          </h3>
          <p className="font-body text-xs text-[#55636F] max-w-xs mx-auto">
            Check off tasks as you finish them during your focus blocks to build momentum.
          </p>
        </div>
      ) : (
        dates.map((dateStr) => (
          <div key={dateStr} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55636F]">
                {formatDateLabel(dateStr)}
              </span>
              <span className="text-[11px] text-[#9AA9B5]">
                ({grouped[dateStr].length})
              </span>
            </div>
            <div className="space-y-2.5">
              {grouped[dateStr].map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
