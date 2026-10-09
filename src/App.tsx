import React, { useState, useEffect } from 'react';
import { Task, DailyThought, WorkoutExercise } from './types';
import { DayArc } from './components/DayArc';
import { DailyThoughtCard } from './components/DailyThoughtCard';
import { TaskItem } from './components/TaskItem';
import { TaskModal } from './components/TaskModal';
import { BottomNav, NavTab } from './components/BottomNav';
import { UpcomingTimeline } from './components/UpcomingTimeline';
import { FitnessView } from './components/FitnessView';
import { DoneView } from './components/DoneView';
import { ZenActionModal } from './components/ZenActionModal';
import { InstallAppButton } from './components/InstallAppButton';
import { NotificationSettingsButton } from './components/NotificationSettingsButton';
import { NotificationModal } from './components/NotificationModal';
import { getTodayDateString, formatDateLabel, addDays } from './utils/time';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  checkAndTriggerTaskReminders,
  NotificationSettings,
} from './utils/notifications';

const STORAGE_KEY_TASKS = 'zenplan_orbit_tasks_v1';
const STORAGE_KEY_THOUGHT = 'zenplan_orbit_thought_idx';

const MOTIVATIONAL_THOUGHTS: DailyThought[] = [
  {
    quote: "Simplicity is about subtracting the obvious and adding the meaningful.",
    author: "John Maeda",
    category: "focus",
    tip: "Pick the one single task today that moves the needle and protect a 90-minute block for it.",
  },
  {
    quote: "Focus is a muscle. The more you defend your attention, the stronger your clarity.",
    author: "Cal Newport",
    category: "deep work",
    tip: "Close unneeded browser tabs and put your phone face down for the next work interval.",
  },
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    category: "consistency",
    tip: "Commit to completing your movement routine before beginning afternoon meetings.",
  },
  {
    quote: "Peace comes from knowing you did your honest best within the limits of the daylight.",
    author: "Marcus Aurelius",
    category: "mindfulness",
    tip: "Acknowledge progress made at sunset and gracefully roll over what remains.",
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('today');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [thoughtIndex, setThoughtIndex] = useState<number>(() => {
    try {
      const idx = localStorage.getItem(STORAGE_KEY_THOUGHT);
      return idx ? parseInt(idx, 10) % MOTIVATIONAL_THOUGHTS.length : 0;
    } catch {
      return 0;
    }
  });

  // Insights card expansion
  const [insightsExpanded, setInsightsExpanded] = useState(false);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(getTodayDateString());
  const [zenModalType, setZenModalType] = useState<'plan' | 'break' | 'review' | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Notifications settings & on-device reminder scheduler
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    return loadNotificationSettings();
  });

  // Sync tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  // Periodic reminder checking interval (every 25 seconds)
  useEffect(() => {
    if (!notificationSettings.enabled) return;

    // Check immediately on load/update
    checkAndTriggerTaskReminders(tasks, notificationSettings);

    const interval = setInterval(() => {
      checkAndTriggerTaskReminders(tasks, notificationSettings);
    }, 25000);

    return () => clearInterval(interval);
  }, [tasks, notificationSettings]);

  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleNextThought = () => {
    const nextIdx = (thoughtIndex + 1) % MOTIVATIONAL_THOUGHTS.length;
    setThoughtIndex(nextIdx);
    localStorage.setItem(STORAGE_KEY_THOUGHT, String(nextIdx));
  };

  // Task Handlers
  const handleToggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newCompleted = !t.completed;
          const updated: Task = {
            ...t,
            completed: newCompleted,
            completedAt: newCompleted ? Date.now() : undefined,
          };

          // If completing a recurring task, clone next recurrence instance with clean steps
          if (newCompleted && t.recurrence && t.recurrence !== 'none') {
            let nextDateStr = t.date;
            if (t.recurrence === 'daily') {
              nextDateStr = addDays(t.date, 1);
            } else if (t.recurrence === 'weekdays') {
              const d = new Date(t.date);
              const day = d.getDay(); // 5 is Friday
              nextDateStr = addDays(t.date, day === 5 ? 3 : day === 6 ? 2 : 1);
            } else if (t.recurrence === 'weekly') {
              nextDateStr = addDays(t.date, 7);
            }

            // Create next recurring instance
            const nextInstance: Task = {
              ...t,
              id: 't_' + Date.now() + Math.random().toString(36).substring(2, 7),
              date: nextDateStr,
              completed: false,
              completedAt: undefined,
              createdAt: Date.now(),
              steps: t.steps.map((st) => ({ ...st, completed: false })),
            };

            setTimeout(() => {
              setTasks((curr) => [...curr, nextInstance]);
            }, 50);
          }

          return updated;
        }
        return t;
      })
    );
  };

  const handleToggleStep = (taskId: string, stepId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSteps = t.steps.map((s) =>
            s.id === stepId ? { ...s, completed: !s.completed } : s
          );
          return { ...t, steps: updatedSteps };
        }
        return t;
      })
    );
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      // Edit existing
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskData.id
            ? {
                ...t,
                ...taskData,
              }
            : t
        )
      );
    } else {
      // Create new
      const newTask: Task = {
        ...taskData,
        id: 't_' + Date.now() + Math.random().toString(36).substring(2, 7),
        createdAt: Date.now(),
      };
      setTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearAllCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  };

  const handleOpenAddModal = (date?: string, defaultTime?: string) => {
    setEditingTask(null);
    setModalDefaultDate(date || getTodayDateString());
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setModalDefaultDate(task.date);
    setIsTaskModalOpen(true);
  };

  const handleAddFitnessAsTask = (ex: WorkoutExercise) => {
    const newTask: Task = {
      id: 'fit_' + Date.now(),
      title: ex.name,
      description: ex.instructions.join(' • '),
      date: getTodayDateString(),
      startTime: undefined,
      durationMinutes: ex.defaultDurationMin,
      category: 'fitness',
      priority: 'medium',
      completed: false,
      recurrence: 'none',
      steps: ex.instructions.map((ins, i) => ({
        id: `s_${i}`,
        title: ins,
        completed: false,
      })),
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  // Subtask attachment from Zen Action
  const handleApplySubtasks = (taskId: string, subtaskTitles: string[]) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newSteps = subtaskTitles.map((st, i) => ({
            id: `step_${Date.now()}_${i}`,
            title: st,
            completed: false,
          }));
          return {
            ...t,
            steps: [...t.steps, ...newSteps],
          };
        }
        return t;
      })
    );
  };

  // Rebalance schedule handler
  const handleApplyRebalance = (rebalanced: Task[]) => {
    setTasks(rebalanced);
  };

  // Today calculations
  const todayStr = getTodayDateString();
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayPending = todayTasks.filter((t) => !t.completed).length;
  const todayUrgent = todayTasks.filter((t) => !t.completed && t.priority === 'high').length;

  const currentThought = MOTIVATIONAL_THOUGHTS[thoughtIndex];
  const isAnyModalOpen = isTaskModalOpen || zenModalType !== null || isNotificationModalOpen;

  return (
    <div className="h-full min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#EEF3F6] text-[#17212B] flex justify-center selection:bg-[#F2A33A]/30">
      <main className="w-full max-w-md min-h-[100dvh] overflow-x-hidden px-4 sm:px-6 pt-[max(20px,env(safe-area-inset-top))] pb-[max(120px,calc(env(safe-area-inset-bottom)+96px))] relative">
        {/* ================= SCREEN 1: TODAY ================= */}
        {currentTab === 'today' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-heading text-[28px] font-bold text-[#17212B] leading-tight">
                  Today
                </h1>
                <p className="font-body text-[13px] text-[#55636F] mt-0.5">
                  {formatDateLabel(todayStr)} •{' '}
                  <span className="font-semibold text-[#17212B]">
                    {todayCompleted} of {todayTasks.length} done
                  </span>
                </p>
              </div>

              {/* Action buttons: Reminders & Install App */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <NotificationSettingsButton
                  settings={notificationSettings}
                  onOpenModal={() => setIsNotificationModalOpen(true)}
                  onUpdateSettings={handleUpdateNotificationSettings}
                />
                <InstallAppButton />
              </div>
            </div>

            {/* Daily Thought Strip */}
            <DailyThoughtCard
              thought={currentThought}
              onRefresh={handleNextThought}
            />

            {/* Insights Card */}
            <div
              onClick={() => setInsightsExpanded(!insightsExpanded)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setInsightsExpanded(!insightsExpanded);
                }
              }}
              aria-label="Insights card, tap to expand focus rhythm"
              className="w-full bg-white border border-[#DDE5EA] rounded-[20px] p-4 text-center cursor-pointer hover:border-[#C9D4DC] transition-all select-none"
            >
              {/* Compact Day Arc with center primary "X of N" and secondary "done today" */}
              <DayArc
                tasks={todayTasks}
                selectedDate={todayStr}
                size="compact"
                showSun={true}
                centerPrimary={`${todayCompleted} of ${todayTasks.length}`}
                centerSecondary="done today"
              />

              {/* Status chips */}
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DDF0EE] text-[#1F6F6F]">
                  Completed {todayCompleted}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E3E8F6] text-[#2F3E8F]">
                  Pending {todayPending}
                </span>
                {todayUrgent > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FBE3DC] text-[#A3321A]">
                    {todayUrgent} urgent
                  </span>
                )}
              </div>

              {/* Expandable Focus Rhythm & Details */}
              {insightsExpanded && (
                <div className="mt-4 pt-3 border-t border-[#EEF3F6] text-left space-y-2 animate-fadeIn text-xs text-[#55636F]">
                  <div className="font-semibold text-[#17212B] flex items-center justify-between">
                    <span>Daylight Arc (06:00 - 22:00)</span>
                    <span className="text-[#F2A33A]">● Live Sun position</span>
                  </div>
                  <p className="leading-relaxed">
                    Visualizes your daytime focus distribution across indigo (work), coral (meetings), teal (fitness), and violet (personal).
                  </p>
                </div>
              )}
            </div>

            {/* Three equal quick-action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setZenModalType('plan')}
                aria-label="Plan day"
                className="min-h-[44px] px-2 py-2.5 rounded-[16px] bg-[#F2A33A] text-[#17212B] font-heading font-bold text-xs flex flex-col items-center justify-center gap-0.5 hover:bg-[#e09228] active:scale-95 active:bg-[#d6851f] transition-all cursor-pointer shadow-xs"
              >
                <span>Plan day</span>
                <span className="text-[10px] font-normal opacity-85">Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setZenModalType('break')}
                aria-label="Break goal into subtasks"
                className="min-h-[44px] px-2 py-2.5 rounded-[16px] bg-white border border-[#DDE5EA] text-[#17212B] font-heading font-semibold text-xs flex flex-col items-center justify-center gap-0.5 hover:bg-[#EEF3F6] active:scale-95 active:bg-[#DDE5EA] transition-all cursor-pointer shadow-xs"
              >
                <span>Break goal</span>
                <span className="text-[10px] text-[#55636F] font-normal">Subtasks</span>
              </button>

              <button
                type="button"
                onClick={() => setZenModalType('review')}
                aria-label="Review weekly progress"
                className="min-h-[44px] px-2 py-2.5 rounded-[16px] bg-white border border-[#DDE5EA] text-[#17212B] font-heading font-semibold text-xs flex flex-col items-center justify-center gap-0.5 hover:bg-[#EEF3F6] active:scale-95 active:bg-[#DDE5EA] transition-all cursor-pointer shadow-xs"
              >
                <span>Review</span>
                <span className="text-[10px] text-[#55636F] font-normal">Weekly</span>
              </button>
            </div>

            {/* Section Header */}
            <div className="flex items-center justify-between pt-2 px-1">
              <h2 className="font-heading font-bold text-[17px] text-[#17212B]">
                Today's tasks
              </h2>
              <span className="text-xs font-semibold text-[#55636F]">
                {todayPending} left
              </span>
            </div>

            {/* Today's Task List */}
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#DDE5EA] rounded-[20px] space-y-3">
                <p className="text-sm text-[#55636F]">No tasks scheduled for today yet.</p>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(todayStr)}
                  className="min-h-[44px] px-5 rounded-full bg-[#17212B] text-white text-xs font-semibold hover:bg-black cursor-pointer"
                >
                  Create your first task
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onToggleStep={handleToggleStep}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= SCREEN 2: UPCOMING ================= */}
        {currentTab === 'upcoming' && (
          <UpcomingTimeline
            tasks={tasks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleOpenEditModal}
            onDeleteTask={handleDeleteTask}
            onAddTaskAtTime={(d, t) => {
              setModalDefaultDate(d);
              setEditingTask({
                id: '',
                title: '',
                date: d,
                startTime: t,
                durationMinutes: 45,
                category: 'work',
                priority: 'medium',
                completed: false,
                recurrence: 'none',
                steps: [],
                createdAt: Date.now(),
              });
              setIsTaskModalOpen(true);
            }}
            onRebalanceDay={() => setZenModalType('plan')}
          />
        )}

        {/* ================= SCREEN 3: FITNESS ================= */}
        {currentTab === 'fitness' && (
          <FitnessView onAddAsTask={handleAddFitnessAsTask} />
        )}

        {/* ================= SCREEN 4: DONE ================= */}
        {currentTab === 'done' && (
          <DoneView
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleOpenEditModal}
            onDeleteTask={handleDeleteTask}
            onClearAllCompleted={handleClearAllCompleted}
          />
        )}
      </main>

      {/* Floating Bottom Task Bar (BottomNav) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onAddTask={() => handleOpenAddModal(currentTab === 'upcoming' ? selectedDate : todayStr)}
        visible={!isAnyModalOpen}
      />

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask?.id ? editingTask : null}
        defaultDate={modalDefaultDate}
      />

      {/* Zen Action Sheets (Plan Day, Break Goal, Review) */}
      <ZenActionModal
        type={zenModalType}
        tasks={currentTab === 'upcoming' ? tasks.filter((t) => t.date === selectedDate) : todayTasks}
        onClose={() => setZenModalType(null)}
        onApplyPlan={handleApplyRebalance}
        onApplySubtasks={handleApplySubtasks}
      />

      {/* Push Notification & Reminder Settings Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={notificationSettings}
        onSaveSettings={handleUpdateNotificationSettings}
      />
    </div>
  );
}
