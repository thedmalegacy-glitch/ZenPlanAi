import React, { useState, useEffect } from 'react';
import { Task, DailyThought, WorkoutExercise, Note, NoteCategory, TaskNotificationPayload } from './types';
import { DayArc } from './components/DayArc';
import { DailyThoughtCard } from './components/DailyThoughtCard';
import { TaskItem } from './components/TaskItem';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { BottomNav, NavTab } from './components/BottomNav';
import { UpcomingTimeline } from './components/UpcomingTimeline';
import { FitnessView } from './components/FitnessView';
import { NotesView } from './components/NotesView';
import { NoteModal } from './components/NoteModal';
import { AddActionChoiceModal } from './components/AddActionChoiceModal';
import { ZenAppIntro } from './components/ZenAppIntro';
import { ZenActionModal } from './components/ZenActionModal';
import { ZenPlanLogo } from './components/ZenPlanLogo';
import { InstallAppButton } from './components/InstallAppButton';
import { NotificationSettingsButton } from './components/NotificationSettingsButton';
import { NotificationModal } from './components/NotificationModal';
import { AnimatedNotificationBanner } from './components/AnimatedNotificationBanner';
import { VoiceTaskModal } from './components/VoiceTaskModal';
import { AppToast, ToastNotification } from './components/AppToast';
import { ParsedVoiceTask } from './utils/voiceParser';
import { getTodayDateString, formatDateLabel, formatTimeDisplay, addDays, sortTasksChronologically } from './utils/time';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  checkAndTriggerTaskReminders,
  syncTaskRemindersWithBackend,
  NotificationSettings,
  playNotificationChime,
  triggerDeviceVibration,
} from './utils/notifications';

const STORAGE_KEY_TASKS = 'zenplan_orbit_tasks_v1';
const STORAGE_KEY_NOTES = 'zenplan_orbit_notes_v1';
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

  // Notes state (date-wise)
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any demo note
          return parsed.filter((n: Note) => n.id !== 'sample_note_1');
        }
      }
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

  // Task Detail Pop-up Modal (Read full description & task metadata)
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Notes Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteModalDate, setNoteModalDate] = useState<string>(getTodayDateString());
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);

  // Voice Task Modal
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Install App PWA Modal
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // App notification toast (Task deleted with undo, workout added, etc.)
  const [appToast, setAppToast] = useState<ToastNotification | null>(null);

  // Mobile back button & double-back exit confirmation toast
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressTimeRef = React.useRef<number>(0);
  const exitToastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated In-App Notification Banner State
  const [activeBannerNotification, setActiveBannerNotification] = useState<TaskNotificationPayload | null>(null);

  // Keep ref in sync so popstate listener always reads fresh modal status without listener re-binding
  const openModalsRef = React.useRef({
    isTaskModalOpen: false,
    isTaskDetailModalOpen: false,
    isNoteModalOpen: false,
    isChoiceModalOpen: false,
    isZenModalOpen: false,
    isNotificationModalOpen: false,
    isVoiceModalOpen: false,
    isInstallModalOpen: false,
  });

  useEffect(() => {
    openModalsRef.current = {
      isTaskModalOpen,
      isTaskDetailModalOpen: viewingTask !== null,
      isNoteModalOpen,
      isChoiceModalOpen,
      isZenModalOpen: zenModalType !== null,
      isNotificationModalOpen,
      isVoiceModalOpen,
      isInstallModalOpen,
    };
  }, [isTaskModalOpen, viewingTask, isNoteModalOpen, isChoiceModalOpen, zenModalType, isNotificationModalOpen, isVoiceModalOpen, isInstallModalOpen]);

  // Mobile Back Button Navigation Engine (popstate handling)
  useEffect(() => {
    // 1. Initialize root state barrier so back press at root doesn't abruptly quit without prompt
    if (!window.history.state || !window.history.state.__zenplan) {
      window.history.replaceState({ tab: 'today', modal: null, isRoot: true, __zenplan: true }, '');
      window.history.pushState({ tab: 'today', modal: null, isRoot: false, __zenplan: true }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      const modals = openModalsRef.current;
      const anyModalWasOpen =
        modals.isTaskModalOpen ||
        modals.isTaskDetailModalOpen ||
        modals.isNoteModalOpen ||
        modals.isChoiceModalOpen ||
        modals.isZenModalOpen ||
        modals.isNotificationModalOpen ||
        modals.isVoiceModalOpen;

      // Case A: A modal was open. The mobile back button pops that modal!
      if (anyModalWasOpen) {
        setIsTaskModalOpen(false);
        setViewingTask(null);
        setIsNoteModalOpen(false);
        setIsChoiceModalOpen(false);
        setZenModalType(null);
        setIsNotificationModalOpen(false);
        setIsVoiceModalOpen(false);
        setEditingTask(null);
        setEditingNote(null);

        // Keep current tab aligned with history state
        if (state?.tab) {
          setCurrentTab(state.tab);
        }
        return;
      }

      // Case B: User reached root (Today screen)
      if (state?.isRoot) {
        const now = Date.now();
        if (now - lastBackPressTimeRef.current < 2000) {
          // Double-tap back confirmed: allow app exit
          window.history.back();
        } else {
          lastBackPressTimeRef.current = now;
          setShowExitToast(true);
          if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
          exitToastTimerRef.current = setTimeout(() => {
            setShowExitToast(false);
          }, 2000);

          // Restore active barrier state so user stays safely inside Today screen
          window.history.pushState({ tab: 'today', modal: null, isRoot: false, __zenplan: true }, '');
          setCurrentTab('today');
        }
        return;
      }

      // Case C: Standard screen/tab back navigation (e.g. from Notes, Upcoming, or Fitness back to Today)
      if (state?.tab) {
        setCurrentTab(state.tab);
      } else {
        setCurrentTab('today');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
    };
  }, []);

  // App launch intro splash screen
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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

  // Sync notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  }, [notes]);

  // Periodic reminder checking interval (every 10 seconds, plus on focus/visibility change)
  useEffect(() => {
    if (!notificationSettings.enabled) return;

    const triggerCheck = () => {
      checkAndTriggerTaskReminders(tasks, notificationSettings, (payload) => {
        setActiveBannerNotification(payload);
      });
    };

    // Check immediately on load/update
    triggerCheck();

    // Check every 10 seconds
    const interval = setInterval(triggerCheck, 10000);

    // Also check immediately when app resumes visibility or receives window focus
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        triggerCheck();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [tasks, notificationSettings]);

  // Sync scheduled tasks and reminder triggers to backend push queue for closed-app notifications
  useEffect(() => {
    if (!notificationSettings.enabled) return;
    const timer = setTimeout(() => {
      syncTaskRemindersWithBackend(tasks, notificationSettings).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [tasks, notificationSettings]);

  // Listen for notification action clicks from Service Worker (e.g. Android notification panel "✓ Mark Complete")
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'ZENPLAN_TASK_ACTION' && event.data.action === 'complete') {
          const taskId = event.data.taskId;
          if (taskId) {
            handleToggleComplete(taskId, true);
            setActiveBannerNotification(null);
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    }
  }, []);

  // Handle URL query parameters if opened from notification action click or tap while app was closed
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const completeTaskId = urlParams.get('completeTaskId');
      const viewTaskId = urlParams.get('viewTaskId');

      if (completeTaskId) {
        handleToggleComplete(completeTaskId, true);
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(window.history.state, '', cleanUrl);
      } else if (viewTaskId) {
        const found = tasks.find((t) => t.id === viewTaskId);
        if (found) {
          handleOpenTaskDetails(found);
        }
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState(window.history.state, '', cleanUrl);
      }
    } catch {
      // Ignore
    }
  }, [tasks]);

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
  const handleToggleComplete = (id: string, forceComplete?: boolean) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newCompleted = forceComplete !== undefined ? forceComplete : !t.completed;
          if (t.completed === newCompleted) return t;

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
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));
    triggerDeviceVibration();

    // Notify user with undo capability
    setAppToast({
      id: `del_${Date.now()}`,
      type: 'delete',
      message: `Task "${taskToDelete.title}" deleted`,
      subtext: taskToDelete.startTime ? `Was set for ${formatTimeDisplay(taskToDelete.startTime)}` : undefined,
      actionLabel: 'Undo',
      onAction: () => {
        setTasks((prev) => [taskToDelete, ...prev]);
        setAppToast({
          id: `restored_${Date.now()}`,
          type: 'info',
          message: `Restored "${taskToDelete.title}"`,
          durationMs: 2500,
        });
      },
      durationMs: 5000,
    });
  };

  const handleMoveToNextDay = (id: string) => {
    const taskToMove = tasks.find((t) => t.id === id);
    if (!taskToMove) return;

    const nextDate = addDays(taskToMove.date, 1);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, date: nextDate } : t))
    );
    triggerDeviceVibration();

    setAppToast({
      id: `move_${Date.now()}`,
      type: 'info',
      message: `Moved "${taskToMove.title}" to next day (${formatDateLabel(nextDate)})`,
      actionLabel: 'Undo',
      onAction: () => {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, date: taskToMove.date } : t))
        );
      },
      durationMs: 4500,
    });
  };

  const handleClearAllCompleted = () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    setTasks((prev) => prev.filter((t) => !t.completed));
    triggerDeviceVibration();

    setAppToast({
      id: `clear_${Date.now()}`,
      type: 'delete',
      message: `Cleared ${completedTasks.length} completed tasks`,
      actionLabel: 'Undo',
      onAction: () => {
        setTasks((prev) => [...prev, ...completedTasks]);
      },
      durationMs: 5000,
    });
  };

  // Tab Selection with browser history push
  const handleSelectTab = (tab: NavTab) => {
    if (tab === currentTab) return;

    // Close any modal if open
    setIsTaskModalOpen(false);
    setViewingTask(null);
    setIsNoteModalOpen(false);
    setIsChoiceModalOpen(false);
    setZenModalType(null);
    setIsNotificationModalOpen(false);
    setIsVoiceModalOpen(false);
    setEditingTask(null);
    setEditingNote(null);

    window.history.pushState({ tab, modal: null, isRoot: false, __zenplan: true }, '');
    setCurrentTab(tab);
  };

  const openModalInHistory = (modalName: string, replace = false) => {
    const currentState = window.history.state;
    const nextState = {
      tab: currentTab,
      modal: modalName,
      isRoot: false,
      __zenplan: true,
    };
    if (replace || currentState?.modal) {
      window.history.replaceState(nextState, '');
    } else {
      window.history.pushState(nextState, '');
    }
  };

  const handleOpenAddModal = (date?: string, defaultTime?: string, replace = false) => {
    setEditingTask(
      defaultTime
        ? {
            id: '',
            title: '',
            date: date || getTodayDateString(),
            startTime: defaultTime,
            durationMinutes: 45,
            category: 'work',
            priority: 'medium',
            completed: false,
            recurrence: 'none',
            steps: [],
            createdAt: Date.now(),
          }
        : null
    );
    setModalDefaultDate(date || (currentTab === 'upcoming' || currentTab === 'notes' ? selectedDate : getTodayDateString()));
    openModalInHistory('task', replace);
    setIsChoiceModalOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setModalDefaultDate(task.date);
    openModalInHistory('task');
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    if (window.history.state?.modal === 'task') {
      window.history.back();
    }
  };

  const handleOpenTaskDetails = (task: Task) => {
    setViewingTask(task);
    openModalInHistory('task_detail');
  };

  const handleCloseTaskDetails = () => {
    setViewingTask(null);
    if (window.history.state?.modal === 'task_detail') {
      window.history.back();
    }
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
    playNotificationChime();
    triggerDeviceVibration();

    // In-app notification toast for fitness addition
    setAppToast({
      id: `fit_${Date.now()}`,
      type: 'fitness_added',
      message: `Workout "${ex.name}" added to Today!`,
      subtext: `${ex.defaultDurationMin} mins • Added to your schedule`,
      actionLabel: 'View Today',
      onAction: () => {
        handleSelectTab('today');
      },
      durationMs: 4500,
    });
  };

  // Voice Task Handlers
  const handleOpenVoiceModal = (replace = false) => {
    openModalInHistory('voice', replace);
    setIsChoiceModalOpen(false);
    setIsVoiceModalOpen(true);
  };

  const handleCloseVoiceModal = () => {
    setIsVoiceModalOpen(false);
    if (window.history.state?.modal === 'voice') {
      window.history.back();
    }
  };

  const handleVoiceSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    handleSaveTask(taskData);
    playNotificationChime();
    triggerDeviceVibration();

    setAppToast({
      id: `voice_${Date.now()}`,
      type: 'task_added',
      message: `Task "${taskData.title}" added!`,
      subtext: taskData.startTime
        ? `Scheduled for ${formatTimeDisplay(taskData.startTime)} • ${formatDateLabel(taskData.date)}`
        : `Added for ${formatDateLabel(taskData.date)}`,
      actionLabel: 'View',
      onAction: () => {
        if (taskData.date === todayStr) {
          handleSelectTab('today');
        } else {
          setSelectedDate(taskData.date);
          handleSelectTab('upcoming');
        }
      },
      durationMs: 4500,
    });
  };

  const handleVoiceEditInModal = (parsed: ParsedVoiceTask) => {
    setEditingTask({
      id: '',
      title: parsed.title,
      date: parsed.date,
      startTime: parsed.startTime,
      durationMinutes: parsed.durationMinutes,
      category: parsed.category,
      priority: parsed.priority,
      completed: false,
      steps: [],
      createdAt: Date.now(),
    });
    setModalDefaultDate(parsed.date);
    openModalInHistory('task', true);
    setIsVoiceModalOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleChoiceSelectVoice = () => {
    setIsChoiceModalOpen(false);
    handleOpenVoiceModal(true);
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

  // Note Handlers
  const handleOpenAddNote = (date?: string, replace = false) => {
    setEditingNote(null);
    setNoteModalDate(date || (currentTab === 'upcoming' || currentTab === 'notes' ? selectedDate : todayStr));
    openModalInHistory('note', replace);
    setIsChoiceModalOpen(false);
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteModalDate(note.date);
    openModalInHistory('note');
    setIsNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
    setEditingNote(null);
    if (window.history.state?.modal === 'note') {
      window.history.back();
    }
  };

  const handleOpenChoiceModal = () => {
    openModalInHistory('choice');
    setIsChoiceModalOpen(true);
  };

  const handleCloseChoiceModal = () => {
    setIsChoiceModalOpen(false);
    if (window.history.state?.modal === 'choice') {
      window.history.back();
    }
  };

  const handleChoiceSelectTask = () => {
    setIsChoiceModalOpen(false);
    handleOpenAddModal(selectedDate, undefined, true);
  };

  const handleChoiceSelectNote = () => {
    setIsChoiceModalOpen(false);
    handleOpenAddNote(selectedDate, true);
  };

  const handleOpenZenModal = (type: 'plan' | 'break' | 'review') => {
    openModalInHistory('zen');
    setZenModalType(type);
  };

  const handleCloseZenModal = () => {
    setZenModalType(null);
    if (window.history.state?.modal === 'zen') {
      window.history.back();
    }
  };

  const handleOpenNotificationModal = () => {
    openModalInHistory('notification');
    setIsNotificationModalOpen(true);
  };

  const handleCloseNotificationModal = () => {
    setIsNotificationModalOpen(false);
    if (window.history.state?.modal === 'notification') {
      window.history.back();
    }
  };

  const handleSaveNote = (noteData: {
    id?: string;
    title: string;
    content: string;
    date: string;
    category?: NoteCategory;
  }) => {
    if (noteData.id) {
      // Edit existing
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteData.id
            ? {
                ...n,
                title: noteData.title,
                content: noteData.content,
                date: noteData.date,
                category: noteData.category,
                updatedAt: Date.now(),
              }
            : n
        )
      );
    } else {
      // Create new
      const newNote: Note = {
        id: `note_${Date.now()}`,
        title: noteData.title,
        content: noteData.content,
        date: noteData.date,
        category: noteData.category || 'general',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Center "Add" button click handler - opens the form to add a new task directly on one click
  const handleBottomAddClick = () => {
    const targetDate = currentTab === 'upcoming' || currentTab === 'notes' ? selectedDate : getTodayDateString();
    handleOpenAddModal(targetDate);
  };

  // Today calculations (sorted chronologically: pending first by time e.g. 9am, 10am, 1pm; completed at bottom)
  const todayStr = getTodayDateString();
  const rawTodayTasks = tasks.filter((t) => t.date === todayStr);
  const todayTasks = sortTasksChronologically(rawTodayTasks);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayPending = todayTasks.filter((t) => !t.completed).length;
  const todayUrgent = todayTasks.filter((t) => !t.completed && t.priority === 'high').length;

  const currentThought = MOTIVATIONAL_THOUGHTS[thoughtIndex];
  const activeViewingTask = viewingTask ? tasks.find((t) => t.id === viewingTask.id) || viewingTask : null;
  const isAnyModalOpen =
    isTaskModalOpen ||
    viewingTask !== null ||
    zenModalType !== null ||
    isNotificationModalOpen ||
    isNoteModalOpen ||
    isChoiceModalOpen ||
    isVoiceModalOpen ||
    isInstallModalOpen;

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#EEF3F6] text-[#17212B] flex justify-center selection:bg-[#F2A33A]/30">
      <main className="w-full max-w-md min-h-[100dvh] px-4 sm:px-6 pt-[max(20px,env(safe-area-inset-top))] pb-[max(120px,calc(env(safe-area-inset-bottom)+96px))] relative">
        {/* ================= SCREEN 1: TODAY ================= */}
        {currentTab === 'today' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <ZenPlanLogo size={42} animate={true} />
                <div>
                  <h1 className="font-heading text-[26px] font-bold text-[#17212B] leading-tight flex items-center gap-2">
                    <span>Today</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E3E8F6] text-[#2F3E8F]">
                      ZenPlan
                    </span>
                  </h1>
                  <p className="font-body text-[12.5px] text-[#55636F] mt-0.5">
                    {formatDateLabel(todayStr)} •{' '}
                    <span className="font-semibold text-[#17212B]">
                      {todayCompleted} of {todayTasks.length} done
                    </span>
                  </p>
                </div>
              </div>

              {/* Action buttons: Voice, Reminders & Install App */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenVoiceModal()}
                  aria-label="Add task with voice"
                  title="Speak task to add"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium font-body bg-white border border-[#DDE5EA] text-[#17212B] hover:bg-[#EEF3F6] hover:border-[#17212B] active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="w-4 h-4 rounded-full bg-[#17212B] text-white flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                  </div>
                  <span>Voice</span>
                </button>

                <NotificationSettingsButton
                  settings={notificationSettings}
                  onOpenModal={handleOpenNotificationModal}
                  onUpdateSettings={handleUpdateNotificationSettings}
                />
                <InstallAppButton onModalStateChange={setIsInstallModalOpen} />
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
                onClick={() => handleOpenZenModal('plan')}
                aria-label="Plan day"
                className="min-h-[44px] px-2 py-2.5 rounded-[16px] bg-[#F2A33A] text-[#17212B] font-heading font-bold text-xs flex flex-col items-center justify-center gap-0.5 hover:bg-[#e09228] active:scale-95 active:bg-[#d6851f] transition-all cursor-pointer shadow-xs"
              >
                <span>Plan day</span>
                <span className="text-[10px] font-normal opacity-85">Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenZenModal('break')}
                aria-label="Break goal into subtasks"
                className="min-h-[44px] px-2 py-2.5 rounded-[16px] bg-white border border-[#DDE5EA] text-[#17212B] font-heading font-semibold text-xs flex flex-col items-center justify-center gap-0.5 hover:bg-[#EEF3F6] active:scale-95 active:bg-[#DDE5EA] transition-all cursor-pointer shadow-xs"
              >
                <span>Break goal</span>
                <span className="text-[10px] text-[#55636F] font-normal">Subtasks</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenZenModal('review')}
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
                    onMoveToNextDay={handleMoveToNextDay}
                    onViewDetails={handleOpenTaskDetails}
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
            onMoveToNextDay={handleMoveToNextDay}
            onAddTaskAtTime={(d, t) => handleOpenAddModal(d, t)}
            onRebalanceDay={() => handleOpenZenModal('plan')}
            onViewTaskDetails={handleOpenTaskDetails}
          />
        )}

        {/* ================= SCREEN 3: FITNESS ================= */}
        {currentTab === 'fitness' && (
          <FitnessView onAddAsTask={handleAddFitnessAsTask} />
        )}

        {/* ================= SCREEN 4: NOTES (Date-Wise) ================= */}
        {currentTab === 'notes' && (
          <NotesView
            notes={notes}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onAddNote={handleOpenAddNote}
            onEditNote={handleOpenEditNote}
            onDeleteNote={handleDeleteNote}
          />
        )}
      </main>

      {/* Floating Bottom Task Bar (BottomNav) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onAddTask={handleBottomAddClick}
        visible={!isAnyModalOpen}
      />

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onSave={handleSaveTask}
        initialTask={editingTask?.id ? editingTask : null}
        defaultDate={modalDefaultDate}
        onDeleteTask={handleDeleteTask}
        onMoveToNextDay={handleMoveToNextDay}
      />

      {/* Read Task Details Pop-up Modal */}
      <TaskDetailModal
        task={activeViewingTask}
        isOpen={viewingTask !== null}
        onClose={handleCloseTaskDetails}
        onEdit={(taskToEdit) => {
          handleCloseTaskDetails();
          handleOpenEditModal(taskToEdit);
        }}
        onToggleComplete={handleToggleComplete}
        onToggleStep={handleToggleStep}
        onDelete={(taskId) => {
          handleCloseTaskDetails();
          handleDeleteTask(taskId);
        }}
        onMoveToNextDay={handleMoveToNextDay}
      />

      {/* Add / Edit Note Modal */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={handleCloseNoteModal}
        onSave={handleSaveNote}
        initialNote={editingNote}
        defaultDate={noteModalDate}
      />

      {/* Dual Action Choice Modal when tapping Add */}
      <AddActionChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={handleCloseChoiceModal}
        onSelectTask={handleChoiceSelectTask}
        onSelectVoiceTask={handleChoiceSelectVoice}
        onSelectNote={handleChoiceSelectNote}
        dateLabel={formatDateLabel(selectedDate)}
      />

      {/* Voice Task Modal */}
      <VoiceTaskModal
        isOpen={isVoiceModalOpen}
        onClose={handleCloseVoiceModal}
        onSaveTask={handleVoiceSaveTask}
        onEditInModal={handleVoiceEditInModal}
        defaultDate={currentTab === 'upcoming' || currentTab === 'notes' ? selectedDate : todayStr}
      />

      {/* Zen Action Sheets (Plan Day, Break Goal, Review) */}
      <ZenActionModal
        type={zenModalType}
        tasks={currentTab === 'upcoming' ? tasks.filter((t) => t.date === selectedDate) : todayTasks}
        onClose={handleCloseZenModal}
        onApplyPlan={handleApplyRebalance}
        onApplySubtasks={handleApplySubtasks}
      />

      {/* Push Notification & Reminder Settings Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={handleCloseNotificationModal}
        settings={notificationSettings}
        onSaveSettings={handleUpdateNotificationSettings}
        onTriggerTestBanner={(payload) => setActiveBannerNotification(payload)}
      />

      {/* Animated Mobile Task Reminder Banner */}
      <AnimatedNotificationBanner
        notification={activeBannerNotification}
        onComplete={(taskId) => {
          handleToggleComplete(taskId, true);
          setActiveBannerNotification(null);
        }}
        onDismiss={() => setActiveBannerNotification(null)}
      />

      {/* Floating Quick Voice Action Button */}
      {!isAnyModalOpen && (
        <button
          type="button"
          onClick={() => handleOpenVoiceModal()}
          aria-label="Add task with voice"
          title="Speak task to add"
          className="fixed right-4 sm:right-[max(1.5rem,calc(50%-220px))] bottom-[max(86px,calc(env(safe-area-inset-bottom)+78px))] z-40 w-13 h-13 min-w-[52px] min-h-[52px] rounded-full bg-[#17212B] hover:bg-black text-[#F2A33A] flex items-center justify-center shadow-[0_8px_24px_rgba(23,33,43,0.3)] border border-white/20 active:scale-90 transition-all cursor-pointer group"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>
      )}

      {/* Unified In-App Notification Toast (Task deleted with undo, workout added, etc.) */}
      <AppToast
        toast={appToast}
        onDismiss={() => setAppToast(null)}
      />

      {/* Mobile Double-Back Exit Confirmation Toast */}
      {showExitToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 pointer-events-none select-none"
        >
          <div className="px-4 py-2.5 rounded-full bg-[#17212B]/95 text-white text-[13px] font-medium backdrop-blur-md shadow-2xl border border-white/20 flex items-center gap-2 animate-fadeIn">
            <div className="w-5 h-5 rounded-full bg-[#F2A33A]/20 flex items-center justify-center text-[#F2A33A]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </div>
            <span>Press back again to exit</span>
          </div>
        </div>
      )}

      {/* Modern Circular Animated Intro Splash Screen */}
      {showIntro && <ZenAppIntro onDismiss={() => setShowIntro(false)} />}
    </div>
  );
}
