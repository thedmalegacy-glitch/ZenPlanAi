import React, { useRef, useState } from 'react';
import { Task } from '../types';
import { formatFriendlyDate, formatTime12h, todayISO } from '../utils/dateAndHaptics';

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

  const today = todayISO();
  const isOverdue = !task.done && !!task.due && task.due < today;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    didSwipeRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || startYRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!isDragging) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        startXRef.current = null;
        startYRef.current = null;
        return;
      }
      if (Math.abs(dx) > 10) {
        setIsDragging(true);
        didSwipeRef.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
      }
    }

    if (isDragging || Math.abs(dx) > 10) {
      const clamped = Math.max(-140, Math.min(140, dx));
      setDragX(clamped);
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
    if (dragX > 80) {
      setDragX(0);
      triggerToggle();
    } else if (dragX < -80) {
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
      <span key="time" className="tabular-nums">
        {formatTime12h(task.time)}
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

  return (
    <div className="relative rounded-2xl overflow-hidden select-none">
      <div
        className="absolute inset-0 flex items-center justify-between px-5 font-bold text-sm pointer-events-none"
        style={{
          backgroundColor: dragX >= 0 ? 'var(--ok)' : 'var(--danger)',
          color: '#FFFFFF',
          opacity: Math.min(1, Math.abs(dragX) / 75),
        }}
        aria-hidden="true"
      >
        <span>{dragX > 0 ? (task.done ? 'Undo' : 'Complete') : ''}</span>
        <span>{dragX < 0 ? 'Delete' : ''}</span>
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
