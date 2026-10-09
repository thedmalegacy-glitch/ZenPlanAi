import React, { useState, useEffect } from 'react';
import { Task, TaskCategory, TaskPriority, RecurrenceType, SubTask } from '../types';
import { parseNaturalTime, formatTimeDisplay } from '../utils/time';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  initialTask?: Task | null;
  defaultDate: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [typedTime, setTypedTime] = useState('');
  const [parsedTime, setParsedTime] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [category, setCategory] = useState<TaskCategory>('work');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState<number>(10);
  const [steps, setSteps] = useState<SubTask[]>([]);
  const [newStepText, setNewStepText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setDate(initialTask.date || defaultDate);
      setTypedTime(initialTask.startTime || '');
      setParsedTime(initialTask.startTime || null);
      setDurationMinutes(initialTask.durationMinutes || 30);
      setCategory(initialTask.category || 'work');
      setPriority(initialTask.priority || 'medium');
      setRecurrence(initialTask.recurrence || 'none');
      setReminderLeadMinutes(initialTask.reminderLeadMinutes !== undefined ? initialTask.reminderLeadMinutes : 10);
      setSteps(initialTask.steps || []);
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate);
      setTypedTime('');
      setParsedTime(null);
      setDurationMinutes(30);
      setCategory('work');
      setPriority('medium');
      setRecurrence('none');
      setReminderLeadMinutes(10);
      setSteps([]);
    }
    setErrorMsg('');
  }, [initialTask, defaultDate, isOpen]);

  // Live parse typed time
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedTime(val);
    if (!val.trim()) {
      setParsedTime(null);
    } else {
      const parsed = parseNaturalTime(val);
      setParsedTime(parsed);
    }
  };

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setSteps([
      ...steps,
      {
        id: 's_' + Date.now() + Math.random().toString(36).substring(2, 6),
        title: newStepText.trim(),
        completed: false,
      },
    ]);
    setNewStepText('');
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task title is required');
      return;
    }

    onSave({
      ...(initialTask ? { id: initialTask.id } : {}),
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime: parsedTime || (typedTime ? parseNaturalTime(typedTime) || undefined : undefined),
      durationMinutes: Number(durationMinutes) || 30,
      category,
      priority,
      recurrence,
      reminderLeadMinutes: parsedTime || typedTime ? Number(reminderLeadMinutes) : undefined,
      steps,
      completed: initialTask ? initialTask.completed : false,
      completedAt: initialTask ? initialTask.completedAt : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-[20px] border border-[#DDE5EA] p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#EEF3F6]">
          <h2 id="task-modal-title" className="font-heading text-xl font-bold text-[#17212B]">
            {initialTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task form"
            className="w-11 h-11 flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-[#FBE3DC] text-[#A3321A] rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="task-title-input" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1">
              Title *
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design review with team"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc-input" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1">
              Description / Notes
            </label>
            <textarea
              id="task-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key context, deliverables, or agenda..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none resize-none"
            />
          </div>

          {/* Date and Typed Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-date-input" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1">
                Date
              </label>
              <input
                id="task-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="task-time-input" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F]">
                  Start Time (Type naturally)
                </label>
                {parsedTime && (
                  <span className="text-[11px] font-bold text-[#2F3E8F] bg-[#E3E8F6] px-1.5 py-0.5 rounded">
                    {formatTimeDisplay(parsedTime)}
                  </span>
                )}
              </div>
              <input
                id="task-time-input"
                type="text"
                value={typedTime}
                onChange={handleTimeChange}
                placeholder="e.g. 9:30am, 2pm, 14:15"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none"
              />
            </div>
          </div>

          {/* Duration & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-duration-select" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1">
                Duration (minutes)
              </label>
              <select
                id="task-duration-select"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none"
              >
                <option value={15}>15 mins</option>
                <option value={20}>20 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-category-select" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1">
                Category
              </label>
              <select
                id="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none"
              >
                <option value="work">Work / Focus (Indigo)</option>
                <option value="meeting">Meeting (Coral)</option>
                <option value="fitness">Fitness (Teal)</option>
                <option value="personal">Personal (Violet)</option>
                <option value="other">Admin / Other</option>
              </select>
            </div>
          </div>

          {/* Priority & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-priority-select" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1">
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-recurrence-select" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1">
                Recurrence
              </label>
              <select
                id="task-recurrence-select"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Every weekday (Mon-Fri)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Push Reminder Lead */}
          <div className="p-3 rounded-xl bg-[#EEF3F6] border border-[#DDE5EA]">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="task-reminder-select" className="text-xs font-semibold text-[#17212B] flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F2A33A]">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                Push Reminder Alert
              </label>
              <select
                id="task-reminder-select"
                value={reminderLeadMinutes}
                onChange={(e) => setReminderLeadMinutes(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-[#DDE5EA] bg-white text-[#17212B] font-body text-xs focus:border-[#F2A33A] focus:outline-none"
              >
                <option value={0}>At scheduled time</option>
                <option value={5}>5 min before</option>
                <option value={10}>10 min before</option>
                <option value={15}>15 min before</option>
                <option value={30}>30 min before</option>
              </select>
            </div>
            <p className="text-[11px] text-[#55636F] mt-1">
              Sends an on-device push notification prior to task kickoff (stored 100% locally).
            </p>
          </div>

          {/* Subtasks (Steps) */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1.5">
              Action Steps Breakdown ({steps.length})
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStep();
                  }
                }}
                placeholder="Add actionable subtask..."
                className="flex-1 px-3 py-2 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] text-xs focus:border-[#F2A33A] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddStep}
                aria-label="Add subtask step"
                className="min-h-[44px] px-4 rounded-xl bg-[#EEF3F6] text-[#17212B] text-xs font-semibold hover:bg-[#DDE5EA] transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {steps.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-1">
                {steps.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#EEF3F6] text-xs"
                  >
                    <span className="text-[#17212B] truncate">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(st.id)}
                      aria-label={`Remove step ${st.title}`}
                      className="text-[#55636F] hover:text-[#E4572E] p-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEF3F6]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#C9D4DC] text-[#55636F] text-sm font-medium hover:bg-[#EEF3F6] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#17212B] text-white text-sm font-semibold hover:bg-black transition-colors cursor-pointer"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
