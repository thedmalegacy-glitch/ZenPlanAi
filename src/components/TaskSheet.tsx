import React, { useEffect, useRef, useState } from 'react';
import { Priority, RepeatFrequency, Task } from '../types';
import {
  addDays,
  formatFriendlyDate,
  formatTime12h,
  haptic,
  parseNaturalTaskLocal,
  todayISO,
} from '../utils/dateAndHaptics';
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from '../utils/notifications';

interface TaskSheetProps {
  open: boolean;
  editingTask: Task | null;
  aiEnabled: boolean;
  onClose: () => void;
  onSave: (
    draft: {
      title: string;
      due: string | null;
      time?: string;
      priority: Priority;
      repeat: RepeatFrequency;
      tag?: string;
      reminderEnabled?: boolean;
      reminderOffsetMinutes?: number;
    },
    editingId?: string
  ) => void;
  onDelete?: (id: string) => void;
}

const PRESET_TAGS = ['work', 'study', 'fitness', 'health', 'errands'];

const TIME_PRESETS = [
  { label: 'Morning (9 AM)', time: '09:00' },
  { label: 'Noon (12 PM)', time: '12:00' },
  { label: 'Afternoon (3 PM)', time: '15:00' },
  { label: 'Evening (6 PM)', time: '18:00' },
  { label: 'Night (9 PM)', time: '21:00' },
];

const REMINDER_OFFSETS = [
  { label: 'At time', val: 0 },
  { label: '5 min early', val: 5 },
  { label: '10 min early', val: 10 },
  { label: '15 min early', val: 15 },
  { label: '20 min early', val: 20 },
  { label: '30 min early', val: 30 },
  { label: '1 hr early', val: 60 },
];

export const TaskSheet: React.FC<TaskSheetProps> = ({
  open,
  editingTask,
  aiEnabled,
  onClose,
  onSave,
  onDelete,
}) => {
  const today = todayISO();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState<string | null>(today);
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  const [repeat, setRepeat] = useState<RepeatFrequency>('never');
  const [tag, setTag] = useState('');
  const [smartNote, setSmartNote] = useState<string | null>(null);

  // Time & Reminder state
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState(10);
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission>('default');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = todayISO();
      setNotificationPerm(getNotificationPermission());

      if (editingTask) {
        setTitle(editingTask.title);
        setDue(editingTask.due);
        const isStandard =
          editingTask.due === null ||
          editingTask.due === t ||
          editingTask.due === addDays(t, 1) ||
          editingTask.due === addDays(t, 7);
        setIsCustomDate(!isStandard && !!editingTask.due);
        setTime(editingTask.time || '');
        setPriority(editingTask.priority);
        setRepeat(editingTask.repeat);
        setTag(editingTask.tag || '');
        setReminderEnabled(editingTask.reminderEnabled !== false);
        setReminderOffsetMinutes(editingTask.reminderOffsetMinutes ?? 10);
      } else {
        setTitle('');
        setDue(t);
        setIsCustomDate(false);
        setTime('');
        setPriority('none');
        setRepeat('never');
        setTag('');
        setReminderEnabled(true);
        setReminderOffsetMinutes(10);
      }
      setSmartNote(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 90);
    }
  }, [open, editingTask]);

  if (!open) return null;

  const handleRequestPermission = async () => {
    haptic(10);
    const granted = await requestNotificationPermission();
    setNotificationPerm(granted ? 'granted' : 'denied');
  };

  const handleSmartParse = () => {
    if (!title.trim()) return;
    haptic(10);
    const parsed = parseNaturalTaskLocal(title, today);
    setTitle(parsed.title);
    setDue(parsed.due);
    if (parsed.time) {
      setTime(parsed.time);
      setReminderEnabled(true);
    }
    if (parsed.priority !== 'none') setPriority(parsed.priority);
    if (parsed.repeat !== 'never') setRepeat(parsed.repeat);
    if (parsed.tag) setTag(parsed.tag);
    setSmartNote('Smart-filled date, time, and priority from your text. Review and tap Save.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    haptic(10);
    onSave(
      {
        title: cleanTitle,
        due,
        time: time || undefined,
        priority,
        repeat,
        tag: tag.trim().toLowerCase() || undefined,
        reminderEnabled: time ? reminderEnabled : false,
        reminderOffsetMinutes: time && reminderEnabled ? reminderOffsetMinutes : undefined,
      },
      editingTask?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className="fixed inset-0"
        style={{ backgroundColor: 'rgba(10, 12, 18, 0.48)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-t-[24px] p-5 animate-sheet"
        style={{
          backgroundColor: 'var(--surface)',
          paddingBottom: 'calc(22px + env(safe-area-inset-bottom, 0px))',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={editingTask ? 'Edit task' : 'Add task'}
      >
        <div
          className="w-9 h-1 rounded-full mx-auto mb-3"
          style={{ backgroundColor: 'var(--line)' }}
        />

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            maxLength={140}
            autoComplete="off"
            enterKeyHint="done"
            className="flex-1 font-semibold text-xl py-2 bg-transparent border-0 outline-none"
            style={{ color: 'var(--ink)' }}
            aria-label="Task title"
          />
          {aiEnabled && title.trim().split(' ').length >= 2 && (
            <button
              type="button"
              onClick={handleSmartParse}
              className="min-h-[44px] px-3 rounded-xl text-xs font-bold shrink-0 whitespace-nowrap"
              style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
              title="Extract date, time, priority, and tag from text"
            >
              Smart fill
            </button>
          )}
        </div>

        {smartNote && (
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>
            {smartNote}
          </div>
        )}

        <div className="text-xs font-bold mt-3 mb-1.5" style={{ color: 'var(--muted)' }}>
          When
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { label: 'Today', val: today },
              { label: 'Tomorrow', val: addDays(today, 1) },
              { label: 'Next week', val: addDays(today, 7) },
              { label: 'No date', val: null },
            ] as const
          ).map((item) => {
            const active = !isCustomDate && due === item.val;
            return (
              <button
                key={item.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setDue(item.val);
                  setIsCustomDate(false);
                }}
                className="min-h-[44px] px-3.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: active ? 'var(--tint)' : 'var(--bg)',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                {item.label}
              </button>
            );
          })}

          <label
            className="min-h-[44px] px-3.5 rounded-xl text-sm font-semibold inline-flex items-center relative cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: isCustomDate ? 'var(--tint)' : 'var(--bg)',
              color: isCustomDate ? 'var(--accent)' : 'var(--ink)',
              border: `1px solid ${isCustomDate ? 'var(--accent)' : 'var(--line)'}`,
            }}
          >
            <span>{isCustomDate && due ? formatFriendlyDate(due) : 'Pick date'}</span>
            <input
              type="date"
              value={due || ''}
              onChange={(e) => {
                if (e.target.value) {
                  setDue(e.target.value);
                  setIsCustomDate(true);
                }
              }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick custom due date"
            />
          </label>
        </div>

        {/* Schedule Time Section */}
        <div className="text-xs font-bold mt-4 mb-1.5 flex items-center justify-between" style={{ color: 'var(--muted)' }}>
          <div className="flex items-center gap-1.5">
            <span>⏰ Schedule Time</span>
            {time && (
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}>
                {formatTime12h(time)}
              </span>
            )}
          </div>
          {time && (
            <button
              type="button"
              onClick={() => {
                setTime('');
                haptic(6);
              }}
              className="text-[11px] font-bold"
              style={{ color: 'var(--danger)' }}
            >
              Clear time
            </button>
          )}
        </div>

        {/* Quick Time Presets & Custom Picker */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TIME_PRESETS.map((preset) => {
            const active = time === preset.time;
            return (
              <button
                key={preset.time}
                type="button"
                onClick={() => {
                  setTime(active ? '' : preset.time);
                  haptic(8);
                }}
                className="min-h-[40px] px-3 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: active ? 'var(--tint)' : 'var(--bg)',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                {preset.label}
              </button>
            );
          })}

          <label
            className="min-h-[40px] px-3 rounded-xl text-xs font-semibold inline-flex items-center relative cursor-pointer whitespace-nowrap tabular-nums"
            style={{
              backgroundColor: time && !TIME_PRESETS.some((p) => p.time === time) ? 'var(--tint)' : 'var(--bg)',
              color: time && !TIME_PRESETS.some((p) => p.time === time) ? 'var(--accent)' : 'var(--ink)',
              border: `1px solid ${time && !TIME_PRESETS.some((p) => p.time === time) ? 'var(--accent)' : 'var(--line)'}`,
            }}
          >
            <span>{time && !TIME_PRESETS.some((p) => p.time === time) ? `Custom: ${formatTime12h(time)}` : 'Custom time...'}</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Pick custom scheduled time"
            />
          </label>
        </div>

        {/* Mobile Push Reminder Controls */}
        {time && (
          <div
            className="mt-3 p-3.5 rounded-2xl transition-all"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--line)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => {
                    setReminderEnabled(e.target.checked);
                    haptic(8);
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>
                  🔔 Push reminder on mobile
                </span>
              </label>

              {reminderEnabled && isNotificationSupported() && notificationPerm !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-transform active:scale-95"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                >
                  Enable notifications
                </button>
              )}
            </div>

            {reminderEnabled && (
              <div className="mt-2.5 pt-2" style={{ borderTop: '1px solid var(--line)' }}>
                <div className="text-[11px] font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                  When to remind you before task:
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {REMINDER_OFFSETS.map((offset) => {
                    const active = reminderOffsetMinutes === offset.val;
                    return (
                      <button
                        key={offset.val}
                        type="button"
                        onClick={() => {
                          setReminderOffsetMinutes(offset.val);
                          haptic(6);
                        }}
                        className="min-h-[34px] px-2.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: active ? 'var(--accent)' : 'var(--surface)',
                          color: active ? 'var(--on-accent)' : 'var(--muted)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                        }}
                      >
                        {offset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs font-bold mt-4 mb-1.5" style={{ color: 'var(--muted)' }}>
          Priority
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { label: 'None', val: 'none' },
              { label: 'Medium', val: 'medium' },
              { label: 'High', val: 'high' },
            ] as const
          ).map((item) => {
            const active = priority === item.val;
            return (
              <button
                key={item.val}
                type="button"
                aria-pressed={active}
                onClick={() => setPriority(item.val)}
                className="min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: active ? 'var(--tint)' : 'var(--bg)',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-bold mt-4 mb-1.5" style={{ color: 'var(--muted)' }}>
          Repeat
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { label: 'Never', val: 'never' },
              { label: 'Daily', val: 'daily' },
              { label: 'Weekly', val: 'weekly' },
            ] as const
          ).map((item) => {
            const active = repeat === item.val;
            return (
              <button
                key={item.val}
                type="button"
                aria-pressed={active}
                onClick={() => setRepeat(item.val)}
                className="min-h-[44px] px-4 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: active ? 'var(--tint)' : 'var(--bg)',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-bold mt-4 mb-1.5" style={{ color: 'var(--muted)' }}>
          Tag (optional)
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_TAGS.map((preset) => {
            const active = tag === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={active}
                onClick={() => setTag(active ? '' : preset)}
                className="min-h-[44px] px-3.5 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: active ? 'var(--tint)' : 'var(--bg)',
                  color: active ? 'var(--accent)' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                #{preset}
              </button>
            );
          })}
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase())}
            placeholder="custom tag"
            maxLength={20}
            className="min-h-[44px] w-32 px-3 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
            aria-label="Custom tag"
          />
        </div>

        <div className="mt-5 flex items-center gap-2">
          {editingTask && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(editingTask.id);
                onClose();
              }}
              className="min-h-[52px] px-4 rounded-2xl font-bold text-sm"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--line)',
                color: 'var(--danger)',
              }}
            >
              Delete
            </button>
          )}

          <button
            type="submit"
            disabled={!title.trim()}
            className="flex-1 min-h-[52px] rounded-2xl font-bold text-base disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {editingTask ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  );
};
