import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskCategory, TaskPriority, RecurrenceType, SubTask } from '../types';
import { parseNaturalTime, formatTimeDisplay, addDays } from '../utils/time';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/notifications';
import { parseVoiceInputToTask } from '../utils/voiceParser';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  initialTask?: Task | null;
  defaultDate: string;
  onDeleteTask?: (id: string) => void;
  onMoveToNextDay?: (id: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultDate,
  onDeleteTask,
  onMoveToNextDay,
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
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const voiceRecRef = useRef<any>(null);

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

  const handleVoiceDictate = () => {
    if (isVoiceListening) {
      if (voiceRecRef.current) {
        try {
          voiceRecRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsVoiceListening(false);
      return;
    }

    const SpeechClass = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechClass) {
      setErrorMsg('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const rec = new SpeechClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsVoiceListening(true);
      rec.onerror = () => setIsVoiceListening(false);
      rec.onend = () => setIsVoiceListening(false);

      rec.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript;
        if (spoken) {
          const parsed = parseVoiceInputToTask(spoken, date);
          setTitle(parsed.title);
          if (parsed.startTime) {
            setTypedTime(parsed.startTime);
            setParsedTime(parsed.startTime);
          }
          if (parsed.durationMinutes) {
            setDurationMinutes(parsed.durationMinutes);
          }
          if (parsed.category) {
            setCategory(parsed.category);
          }
          if (parsed.priority) {
            setPriority(parsed.priority);
          }
        }
      };

      voiceRecRef.current = rec;
      rec.start();
    } catch {
      setIsVoiceListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task title is required');
      return;
    }

    const resolvedStartTime = parsedTime || (typedTime ? parseNaturalTime(typedTime) || undefined : undefined);

    // Prompt user for notification permission if scheduled with a time and not yet asked
    if (resolvedStartTime && isNotificationSupported() && getNotificationPermission() === 'default') {
      requestNotificationPermission().catch(() => {});
    }

    onSave({
      ...(initialTask ? { id: initialTask.id } : {}),
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      startTime: resolvedStartTime,
      durationMinutes: Number(durationMinutes) || 30,
      category,
      priority,
      recurrence,
      reminderLeadMinutes: resolvedStartTime ? Number(reminderLeadMinutes) : undefined,
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
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 active:bg-[#DDE5EA] transition-all cursor-pointer"
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

          {/* Title with Voice Dictation */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="task-title-input" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F]">
                Title *
              </label>
              <button
                type="button"
                onClick={handleVoiceDictate}
                aria-label={isVoiceListening ? 'Stop listening' : 'Dictate task by voice'}
                className={`min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  isVoiceListening
                    ? 'bg-[#E4572E] text-white animate-pulse'
                    : 'bg-[#EEF3F6] text-[#55636F] hover:text-[#17212B] hover:bg-[#DDE5EA]'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                <span>{isVoiceListening ? 'Listening...' : 'Speak'}</span>
              </button>
            </div>
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
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key context, deliverables, agenda, or checklist details..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] font-body text-sm focus:border-[#F2A33A] focus:outline-none resize-y min-h-[76px]"
            />
          </div>

          {/* Date and Typed Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="task-date-input" className="block text-xs font-semibold uppercase tracking-wider text-[#55636F]">
                  Date
                </label>
                <button
                  type="button"
                  onClick={() => setDate((prev) => addDays(prev || defaultDate, 1))}
                  className="text-[11px] font-semibold text-[#2F3E8F] hover:text-[#17212B] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  title="Shift task date forward by 1 day"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                    <line x1="5" y1="12" x2="15" y2="12" />
                  </svg>
                  <span>+ Move to Next Day</span>
                </button>
              </div>
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
            <p className="text-[11px] text-[#55636F] mt-1.5 leading-snug">
              Sends 1st alert {reminderLeadMinutes > 0 ? `${reminderLeadMinutes} min before` : 'at start time'}{reminderLeadMinutes > 0 ? ' and 2nd alert when the task starts' : ''}, with a &quot;✓ Mark Complete&quot; button in your notification panel.
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
                className="min-h-[44px] min-w-[44px] px-4 rounded-xl bg-[#EEF3F6] text-[#17212B] text-xs font-semibold hover:bg-[#DDE5EA] active:scale-95 active:bg-[#D5DFE6] transition-all cursor-pointer"
              >
                Add
              </button>
            </div>

            {steps.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-1">
                {steps.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#EEF3F6] text-xs min-h-[44px]"
                  >
                    <span className="text-[#17212B] truncate">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(st.id)}
                      aria-label={`Remove step ${st.title}`}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#55636F] hover:text-[#E4572E] active:scale-90 transition-all cursor-pointer"
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

          {/* Submit & Quick Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#EEF3F6]">
            {initialTask ? (
              <div className="flex items-center gap-2 flex-wrap">
                {onDeleteTask && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteTask(initialTask.id);
                      onClose();
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-full border border-[#FBE3DC] bg-[#FEF4F2] text-[#E4572E] text-xs font-semibold hover:bg-[#FBE3DC] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Delete</span>
                  </button>
                )}

                {onMoveToNextDay && (
                  <button
                    type="button"
                    onClick={() => {
                      onMoveToNextDay(initialTask.id);
                      onClose();
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-full border border-[#DDE5EA] bg-[#EEF3F6] text-[#2F3E8F] text-xs font-semibold hover:bg-[#E3E8F6] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                      <line x1="5" y1="12" x2="15" y2="12" />
                    </svg>
                    <span>Move to Next Day</span>
                  </button>
                )}
              </div>
            ) : <div />}

            <div className="flex items-center justify-end gap-3 ml-auto">
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
          </div>
        </form>
      </div>
    </div>
  );
};
