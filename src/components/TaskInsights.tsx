import React, { useState } from 'react';
import { Task } from '../types';
import { formatTime12h, haptic, isOverdue, todayISO } from '../utils/dateAndHaptics';

interface TaskInsightsProps {
  tasks: Task[];
  onRescheduleOverdue?: () => void;
}

export const TaskInsights: React.FC<TaskInsightsProps> = ({ tasks, onRescheduleOverdue }) => {
  const [expanded, setExpanded] = useState(false);
  const today = todayISO();

  // All relevant tasks for Today (due today, overdue, or no date)
  const todayRelevantTasks = tasks.filter((t) => {
    if (t.done && t.doneAt !== today && t.due !== today) return false;
    if (!t.due) return true;
    return t.due <= today;
  });

  const totalCount = todayRelevantTasks.length;
  const completedCount = todayRelevantTasks.filter((t) => t.done).length;
  const pendingCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Urgency breakdown (among pending tasks)
  const pendingTasks = todayRelevantTasks.filter((t) => !t.done);
  const urgentCount = pendingTasks.filter((t) => t.priority === 'high').length;
  const mediumCount = pendingTasks.filter((t) => t.priority === 'medium').length;
  const normalCount = pendingTasks.filter((t) => t.priority === 'none').length;

  // Overdue count (past due date & not done)
  const overdueTasks = tasks.filter((t) => !t.done && isOverdue(t.due, today));
  const overdueCount = overdueTasks.length;

  // Time scheduled tasks
  const timedPendingTasks = pendingTasks
    .filter((t) => !!t.time)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const nextScheduled = timedPendingTasks[0];

  // Zen Rhythm Score calculation:
  // Base 50 + 40 * (completion rate) - 15 (if urgent pending) - 10 (if overdue)
  const urgentPenalty = urgentCount > 0 ? 15 : 0;
  const overduePenalty = overdueCount > 0 ? 10 : 0;
  const zenScore = Math.max(
    10,
    Math.min(100, Math.round(30 + completionRate * 0.7 - urgentPenalty - overduePenalty))
  );

  // SVG circular gauge properties
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div
      className="mt-3 rounded-2xl p-4 transition-all"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--line)',
      }}
      role="region"
      aria-label="Task insights and progress"
    >
      {/* Header with quick stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-lg grid place-items-center text-xs font-bold"
            style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
          >
            📊
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Zen Insights
          </span>
          {urgentCount > 0 && (
            <span
              className="text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {urgentCount} Urgent
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            haptic(8);
            setExpanded(!expanded);
          }}
          className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
          style={{
            backgroundColor: expanded ? 'var(--tint)' : 'var(--bg)',
            color: expanded ? 'var(--accent)' : 'var(--muted)',
          }}
          aria-expanded={expanded}
        >
          <span>{expanded ? 'Less' : 'Details'}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Main visual insight cards */}
      <div className="mt-3 grid grid-cols-12 gap-3 items-center">
        {/* Circular Progress Gauge */}
        <div className="col-span-5 flex items-center justify-center relative py-1">
          <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="var(--line)"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Completed Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={completionRate === 100 ? 'var(--ok)' : 'var(--accent)'}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span className="text-xl font-extrabold tabular-nums tracking-tight" style={{ color: 'var(--ink)' }}>
              {completionRate}%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Complete
            </span>
          </div>
        </div>

        {/* Quick Numbers Column */}
        <div className="col-span-7 space-y-2">
          {/* Completed vs Pending row */}
          <div className="flex items-center justify-between text-xs font-semibold p-2 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--ok)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Completed: <strong className="tabular-nums font-extrabold">{completedCount}</strong>
            </span>
            <span className="flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              Pending: <strong className="tabular-nums font-extrabold">{pendingCount}</strong>
            </span>
          </div>

          {/* Zen Rhythm Score */}
          <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold" style={{ color: 'var(--muted)' }}>
                Focus Rhythm
              </span>
              <span
                className="font-extrabold tabular-nums text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: zenScore >= 75 ? 'rgba(34, 197, 94, 0.15)' : 'var(--tint)',
                  color: zenScore >= 75 ? 'var(--ok)' : 'var(--accent)',
                }}
              >
                {zenScore}/100
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--line)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${zenScore}%`,
                  backgroundColor: zenScore >= 75 ? 'var(--ok)' : 'var(--accent)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Deep Insights */}
      {expanded && (
        <div className="mt-3 pt-3 space-y-2.5 animate-fadeIn" style={{ borderTop: '1px solid var(--line)' }}>
          {/* Urgency Matrix */}
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
              Task Urgency Breakdown
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div
                className="p-2.5 rounded-xl text-center"
                style={{
                  backgroundColor: urgentCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg)',
                  border: urgentCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--line)',
                }}
              >
                <div className="text-base font-extrabold tabular-nums" style={{ color: urgentCount > 0 ? 'var(--danger)' : 'var(--ink)' }}>
                  {urgentCount}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: urgentCount > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                  High / Urgent
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl text-center"
                style={{
                  backgroundColor: mediumCount > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg)',
                  border: mediumCount > 0 ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid var(--line)',
                }}
              >
                <div className="text-base font-extrabold tabular-nums" style={{ color: mediumCount > 0 ? 'var(--amber, #f59e0b)' : 'var(--ink)' }}>
                  {mediumCount}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Medium
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl text-center"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
              >
                <div className="text-base font-extrabold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {normalCount}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Normal / Light
                </div>
              </div>
            </div>
          </div>

          {/* Time & Scheduling info */}
          <div className="p-2.5 rounded-xl flex items-center justify-between text-xs" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm">⏰</span>
              <span style={{ color: 'var(--ink)' }}>
                {nextScheduled ? (
                  <>
                    Next up: <strong>{nextScheduled.title}</strong> at{' '}
                    <strong>{formatTime12h(nextScheduled.time || '')}</strong>
                  </>
                ) : (
                  'No pending timed tasks today'
                )}
              </span>
            </div>
            {timedPendingTasks.length > 0 && (
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--muted)' }}>
                {timedPendingTasks.length} scheduled
              </span>
            )}
          </div>

          {/* Overdue Alert banner if any */}
          {overdueCount > 0 && (
            <div
              className="p-2.5 rounded-xl flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span className="font-semibold" style={{ color: 'var(--danger)' }}>
                  {overdueCount} task{overdueCount === 1 ? '' : 's'} past due date
                </span>
              </div>
              {onRescheduleOverdue && (
                <button
                  type="button"
                  onClick={() => {
                    haptic(10);
                    onRescheduleOverdue();
                  }}
                  className="px-2 py-1 rounded-lg text-[11px] font-extrabold"
                  style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
                >
                  Reschedule to Today
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
