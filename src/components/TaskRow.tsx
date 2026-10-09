import React, { useRef, useState } from 'react';
import { Task } from '../types';
import { formatFriendlyDate, formatTime12h, haptic, todayISO } from '../utils/dateAndHaptics';

interface TaskRowProps {
  task: Task;
  showDateInMeta?: boolean;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  showDateInMeta = false,
  onToggleDone,
  onDelete,
  onEdit,
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const thresholdPassedRef = useRef(false);

  const today = todayISO();
  const isOverdue = !task.done && !!task.due && task.due < today;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    didSwipeRef.current = false;
    thresholdPassedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || startYRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!isDragging) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        startXRef.current = null;
        startYRef.current = null;
        return;
      }
      if (Math.abs(dx) > 8) {
        setIsDragging(true);
        didSwipeRef.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
      }
    }

    if (isDragging || Math.abs(dx) > 8) {
      // Damped rubber-band clamping for mobile slider feel
      const maxDrag = 130;
      let clamped = dx;
      if (dx > maxDrag) {
        clamped = maxDrag + (dx - maxDrag) * 0.2;
      } else if (dx < -maxDrag) {
        clamped = -maxDrag + (dx + maxDrag) * 0.2;
      }
      setDragX(clamped);

      const passed = Math.abs(clamped) >= 68;
      if (passed && !thresholdPassedRef.current) {
        thresholdPassedRef.current = true;
        haptic(12);
      } else if (!passed && thresholdPassedRef.current) {
        thresholdPassedRef.current = false;
      }
    }
  };

  const handlePointerEnd = () => {
    if (startXRef.current === null) return;
    startXRef.current = null;
    startYRef.current = null;

    if (!isDragging) {
      setDragX(0);
      return;
    }

    setIsDragging(false);
    if (dragX >= 68) {
      setDragX(0);
      triggerToggle();
    } else if (dragX <= -68) {
      setDragX(0);
      setIsLeaving(true);
      setTimeout(() => onDelete(task.id), 180);
    } else {
      setDragX(0);
    }
  };

  const triggerToggle = () => {
    if (!task.done) {
      setJustChecked(true);
      setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => onToggleDone(task.id), 180);
      }, 220);
    } else {
      setIsLeaving(true);
      setTimeout(() => onToggleDone(task.id), 160);
    }
  };

  const borderCircleColor =
    task.done || justChecked
      ? 'var(--accent)'
      : task.priority === 'high'
      ? 'var(--danger)'
      : task.priority === 'medium'
      ? 'var(--warn)'
      : 'var(--muted)';

  const metaParts: React.ReactNode[] = [];
  if (isOverdue) {
    metaParts.push(
      <span key="late" className="font-bold" style={{ color: 'var(--danger)' }}>
        Overdue · {formatFriendlyDate(task.due)}
      </span>
    );
  } else if (showDateInMeta && task.due) {
    metaParts.push(<span key="due">{formatFriendlyDate(task.due)}</span>);
  }

  if (task.time) {
    metaParts.push(
      <span
        key="time"
        className="tabular-nums font-semibold inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]"
        style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
      >
        <span>⏰ {formatTime12h(task.time)}</span>
        {task.reminderEnabled && (
          <span
            className="text-[10px] font-bold"
            title={`Reminder: ${task.reminderOffsetMinutes ?? 10}m before`}
          >
            🔔 -{task.reminderOffsetMinutes ?? 10}m
          </span>
        )}
      </span>
    );
  }

  if (task.priority !== 'none') {
    metaParts.push(
      <span
        key="pri"
        style={{
          color: task.priority === 'high' ? 'var(--danger)' : 'var(--warn)',
          fontWeight: 600,
        }}
      >
        {task.priority === 'high' ? 'High' : 'Medium'} priority
      </span>
    );
  }

  if (task.repeat !== 'never') {
    metaParts.push(<span key="rep">Repeats {task.repeat}</span>);
  }

  if (task.tag) {
    metaParts.push(<span key="tag">#{task.tag}</span>);
  }

  const isRightSwipe = dragX > 0;
  const isLeftSwipe = dragX < 0;
  const swipeActive = Math.abs(dragX) > 4;
  const isThresholdMet = Math.abs(dragX) >= 68;

  return (
    <div className="relative rounded-2xl overflow-hidden select-none">
      {/* Background action reveal under the swipe slider */}
      <div
        className="absolute inset-0 flex items-center justify-between px-4 font-bold text-sm pointer-events-none transition-colors"
        style={{
          backgroundColor: isRightSwipe
            ? 'var(--ok)'
            : isLeftSwipe
            ? 'var(--danger)'
            : 'transparent',
          color: '#FFFFFF',
          opacity: swipeActive ? Math.min(1, Math.abs(dragX) / 60) : 0,
        }}
        aria-hidden="true"
      >
        <div
          className="flex items-center gap-2 transition-transform duration-150"
          style={{
            transform: isThresholdMet && isRightSwipe ? 'scale(1.08)' : 'scale(0.96)',
            opacity: isRightSwipe ? 1 : 0,
          }}
        >
          <span className="w-8 h-8 rounded-full bg-white/20 grid place-items-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5 10 17.5 19 7" />
            </svg>
          </span>
          <span className="text-xs uppercase tracking-wider font-extrabold text-white">
            {task.done ? 'Undo' : 'Complete'}
          </span>
        </div>

        <div
          className="flex items-center gap-2 ml-auto transition-transform duration-150"
          style={{
            transform: isThresholdMet && isLeftSwipe ? 'scale(1.08)' : 'scale(0.96)',
            opacity: isLeftSwipe ? 1 : 0,
          }}
        >
          <span className="text-xs uppercase tracking-wider font-extrabold text-white">
            Delete
          </span>
          <span className="w-8 h-8 rounded-full bg-white/20 grid place-items-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </span>
        </div>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="relative flex items-center gap-3 rounded-2xl px-4 py-3.5 min-h-[60px]"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--line)',
          touchAction: 'pan-y',
          transform: isLeaving
            ? 'translateX(28px)'
            : dragX !== 0
            ? `translateX(${dragX}px)`
            : 'none',
          opacity: isLeaving ? 0 : 1,
          transition: isDragging ? 'none' : 'transform 200ms ease, opacity 180ms ease',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerToggle();
          }}
          aria-label={task.done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
          className="w-11 h-11 -ml-1.5 shrink-0 grid place-items-center rounded-full"
        >
          <span
            className="w-7 h-7 rounded-full grid place-items-center transition-colors"
            style={{
              backgroundColor: task.done || justChecked ? 'var(--accent)' : 'transparent',
              border: `2px solid ${borderCircleColor}`,
            }}
          >
            {(task.done || justChecked) && (
              <svg
                className="w-4 h-4 animate-check"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--on-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12.5 10 17.5 19 7" />
              </svg>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!didSwipeRef.current) {
              onEdit(task);
            }
          }}
          className="flex-1 min-w-0 text-left py-0.5"
          aria-label={`Edit task: ${task.title}`}
        >
          <div
            className="font-semibold text-base break-words leading-snug"
            style={{
              color: task.done ? 'var(--muted)' : 'var(--ink)',
              textDecoration: task.done ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </div>

          {metaParts.length > 0 && (
            <div
              className="text-[13px] mt-1 flex items-center flex-wrap gap-x-1.5 gap-y-0.5"
              style={{ color: 'var(--muted)' }}
            >
              {metaParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  {part}
                </React.Fragment>
              ))}
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
