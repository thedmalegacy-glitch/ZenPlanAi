import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppSettings,
  Priority,
  RepeatFrequency,
  TabView,
  Task,
  Workout,
  WorkoutLog,
} from './types';
import {
  clearAllStorage,
  DEFAULT_SETTINGS,
  exportAllDataJSON,
  hydrateFromIndexedDB,
  loadInitialSyncState,
  saveCustomWorkouts,
  saveSettings,
  saveTasks,
  saveWorkoutLogs,
} from './db/storage';
import { createStarterTasks } from './data/workouts';
import {
  addDays,
  computeWorkoutStats,
  formatFriendlyDate,
  haptic,
  todayISO,
} from './utils/dateAndHaptics';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { TaskRow } from './components/TaskRow';
import { TaskSheet } from './components/TaskSheet';
import { PWAInstallButton } from './components/PWAInstallButton';
import type { AIToolTab } from './components/AISheet';

const LazyFitnessView = React.lazy(() => import('./components/FitnessView'));
const LazyAISheet = React.lazy(() => import('./components/AISheet'));
const LazySettingsSheet = React.lazy(() => import('./components/SettingsSheet'));
const LazyOnboardingModal = React.lazy(() => import('./components/OnboardingModal'));

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  none: 1,
};

export default function App() {
  const initial = useMemo(() => loadInitialSyncState(), []);

  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [customWorkouts, setCustomWorkouts] = useState<Workout[]>(initial.customWorkouts);
  const [logs, setLogs] = useState<WorkoutLog[]>(initial.logs);
  const [settings, setSettings] = useState<AppSettings>(initial.settings);

  const [view, setView] = useState<TabView>('today');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');

  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [aiInitialTool, setAiInitialTool] = useState<AIToolTab>('quick_add');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(!initial.settings.onboarded);

  const [toastState, setToastState] = useState<{
    message: string;
    canUndo: boolean;
  } | null>(null);
  const undoSnapshotRef = useRef<Task[] | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const isOnline = useOnlineStatus();
  const today = todayISO();

  useEffect(() => {
    let mounted = true;
    hydrateFromIndexedDB().then((idbData) => {
      if (!mounted) return;
      if (idbData.tasks && idbData.tasks.length > 0) setTasks(idbData.tasks);
      if (idbData.customWorkouts) setCustomWorkouts(idbData.customWorkouts);
      if (idbData.logs) setLogs(idbData.logs);
      if (idbData.settings) {
        setSettings((prev) => ({ ...prev, ...idbData.settings }));
        if (idbData.settings.onboarded) {
          setOnboardingOpen(false);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', settings.theme);
    }

    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'auto' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    const metaTheme = document.getElementById('theme-color-meta');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#0E1014' : '#F5F6F8');
    }
  }, [settings.theme]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTaskSheetOpen(false);
        setAiSheetOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const showToast = (message: string, canUndo = false) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastState({ message, canUndo });
    toastTimerRef.current = window.setTimeout(() => {
      setToastState(null);
    }, 4500);
  };

  const commitTasks = (nextTasks: Task[], snapshotForUndo?: Task[]) => {
    if (snapshotForUndo) {
      undoSnapshotRef.current = snapshotForUndo;
    }
    setTasks(nextTasks);
    saveTasks(nextTasks);
  };

  const handleUndo = () => {
    if (undoSnapshotRef.current) {
      setTasks(undoSnapshotRef.current);
      saveTasks(undoSnapshotRef.current);
      undoSnapshotRef.current = null;
      haptic(10);
    }
    setToastState(null);
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  };

  const handleToggleDone = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    haptic(10);
    const snapshot = [...tasks];
    const nowDone = !target.done;
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, done: nowDone, doneAt: nowDone ? today : null } : t
    );

    if (nowDone && target.repeat !== 'never') {
      const baseDate = target.due && target.due >= today ? target.due : today;
      const nextDue = addDays(baseDate, target.repeat === 'daily' ? 1 : 7);
      updatedTasks.push({
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: target.title,
        due: nextDue,
        time: target.time,
        priority: target.priority,
        tag: target.tag,
        repeat: target.repeat,
        done: false,
        createdAt: today,
      });
      commitTasks(updatedTasks, snapshot);
      showToast(`Marked done · Next due ${formatFriendlyDate(nextDue)}`, true);
      return;
    }

    commitTasks(updatedTasks, snapshot);
    showToast(nowDone ? 'Marked done' : 'Moved back to open', true);
  };

  const handleDeleteTask = (id: string) => {
    haptic(14);
    const snapshot = [...tasks];
    const next = tasks.filter((t) => t.id !== id);
    commitTasks(next, snapshot);
    showToast('Task deleted', true);
  };

  const handleSaveTaskFromSheet = (
    draft: {
      title: string;
      due: string | null;
      time?: string;
      priority: Priority;
      repeat: RepeatFrequency;
      tag?: string;
    },
    editingId?: string
  ) => {
    const snapshot = [...tasks];
    if (editingId) {
      const next = tasks.map((t) =>
        t.id === editingId
          ? {
              ...t,
              title: draft.title,
              due: draft.due,
              time: draft.time,
              priority: draft.priority,
              repeat: draft.repeat,
              tag: draft.tag,
            }
          : t
      );
      commitTasks(next, snapshot);
      showToast('Task updated', true);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: draft.title,
        due: draft.due,
        time: draft.time,
        priority: draft.priority,
        repeat: draft.repeat,
        tag: draft.tag,
        done: false,
        createdAt: today,
      };
      commitTasks([...tasks, newTask], snapshot);
      if (draft.due && draft.due > today) {
        setView('upcoming');
      } else {
        setView('today');
      }
      showToast('Task added', true);
    }
  };

  const handleClearCompleted = () => {
    const snapshot = [...tasks];
    const next = tasks.filter((t) => !t.done);
    commitTasks(next, snapshot);
    haptic(12);
    showToast('Cleared completed tasks', true);
  };

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.tag) set.add(t.tag);
    });
    return Array.from(set);
  }, [tasks]);

  const matchesFilter = (t: Task) => {
    if (activeTag !== 'all' && t.tag !== activeTag) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = t.title.toLowerCase().includes(q);
      const inTag = (t.tag || '').toLowerCase().includes(q);
      if (!inTitle && !inTag) return false;
    }
    return true;
  };

  const todayOpenTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.done && (!t.due || t.due <= today) && matchesFilter(t))
      .sort((a, b) => {
        const priDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (priDiff !== 0) return priDiff;
        const timeA = a.time || '99:99';
        const timeB = b.time || '99:99';
        return timeA.localeCompare(timeB);
      });
  }, [tasks, today, activeTag, searchQuery]);

  const overdueTasks = todayOpenTasks.filter((t) => t.due && t.due < today);
  const dueTodayOrUndated = todayOpenTasks.filter((t) => !t.due || t.due === today);

  const doneTodayCount = tasks.filter((t) => t.done && t.doneAt === today).length;
  const totalTodayCount = doneTodayCount + todayOpenTasks.length;
  const progressPct = totalTodayCount > 0 ? Math.round((doneTodayCount / totalTodayCount) * 100) : 0;

  const upcomingGroups = useMemo(() => {
    const openFuture = tasks
      .filter((t) => !t.done && t.due && t.due > today && matchesFilter(t))
      .sort((a, b) => (a.due! < b.due! ? -1 : 1));
    const groups: Record<string, Task[]> = {};
    openFuture.forEach((t) => {
      const key = t.due!;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [tasks, today, activeTag, searchQuery]);

  const completedTasksList = useMemo(() => {
    return tasks
      .filter((t) => t.done && matchesFilter(t))
      .sort((a, b) => ((b.doneAt || '') < (a.doneAt || '') ? -1 : 1));
  }, [tasks, activeTag, searchQuery]);

  const { workoutsThisWeek, streak } = useMemo(
    () => computeWorkoutStats(logs, today),
    [logs, today]
  );

  const headerTitle =
    view === 'today'
      ? 'Today'
      : view === 'upcoming'
      ? 'Upcoming'
      : view === 'fitness'
      ? 'Fitness'
      : 'Done';

  const headerSubtitle =
    view === 'today'
      ? `${formatFriendlyDate(today, true)}${
          totalTodayCount > 0 ? ` · ${doneTodayCount} of ${totalTodayCount} done` : ''
        }`
      : view === 'upcoming'
      ? 'Scheduled ahead on your plan'
      : view === 'fitness'
      ? `${settings.fitnessLevel} · ${workoutsThisWeek} workout${
          workoutsThisWeek === 1 ? '' : 's'
        } this week${streak > 0 ? ` · ${streak}d streak` : ''}`
      : `${completedTasksList.length} completed`;

  const handleExportJSON = () => {
    const json = exportAllDataJSON(tasks, customWorkouts, logs, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenplan-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported data as JSON');
  };

  const handleDeleteAllData = async () => {
    await clearAllStorage();
    const freshTasks = createStarterTasks(today, addDays);
    setTasks(freshTasks);
    setCustomWorkouts([]);
    setLogs([]);
    setSettings({ ...DEFAULT_SETTINGS, onboarded: true });
    showToast('All local data reset');
  };

  return (
    <div className="min-h-screen w-full overflow-hidden">
      <main className="max-w-[560px] mx-auto px-5 pb-48 overflow-hidden">
        <header className="pt-6 pb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--accent)' }}>
              ZenPlan AI
            </span>

            <div className="flex items-center gap-1.5">
              {!isOnline && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
                  role="status"
                >
                  Offline
                </span>
              )}

              <PWAInstallButton compact />

              {view !== 'fitness' && (
                <button
                  type="button"
                  aria-label="Search and filter tasks"
                  aria-expanded={searchOpen}
                  onClick={() => setSearchOpen((v) => !v)}
                  className="w-11 h-11 rounded-xl grid place-items-center transition-colors"
                  style={{
                    backgroundColor:
                      searchOpen || searchQuery || activeTag !== 'all'
                        ? 'var(--tint)'
                        : 'transparent',
                    color:
                      searchOpen || searchQuery || activeTag !== 'all'
                        ? 'var(--accent)'
                        : 'var(--muted)',
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                aria-label="Open settings"
                onClick={() => setSettingsOpen(true)}
                className="w-11 h-11 rounded-xl grid place-items-center"
                style={{ color: 'var(--muted)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            </div>
          </div>

          <h1
            className="text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em]"
            style={{ textWrap: 'balance' }}
          >
            {headerTitle}
          </h1>
          <p className="mt-1.5 text-[15px] tabular-nums" style={{ color: 'var(--muted)' }}>
            {headerSubtitle}
          </p>

          {view === 'today' && (
            <div
              className="mt-4 rounded-2xl p-4 transition-all"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
              }}
              role="region"
              aria-label="Daily task progress summary"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Daily Progress
                  </span>
                  {totalTodayCount > 0 && (
                    <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
                      {doneTodayCount} of {totalTodayCount}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs font-extrabold px-2 py-0.5 rounded-lg tabular-nums transition-all"
                  style={{
                    backgroundColor: progressPct === 100 && totalTodayCount > 0 ? 'rgba(21, 128, 61, 0.12)' : 'var(--tint)',
                    color: progressPct === 100 && totalTodayCount > 0 ? 'var(--ok)' : 'var(--accent)',
                  }}
                >
                  {totalTodayCount === 0 ? '0%' : `${progressPct}%`}
                </span>
              </div>

              {/* Polished progress track slider */}
              <div
                className="relative h-2.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--line)' }}
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Daily task progress"
              >
                <div
                  className="h-full rounded-full transition-all duration-300 relative"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: progressPct === 100 && totalTodayCount > 0 ? 'var(--ok)' : 'var(--accent)',
                  }}
                >
                  {progressPct > 4 && progressPct < 100 && (
                    <span
                      className="absolute right-0 top-0 bottom-0 w-2.5 rounded-full bg-white/40 shadow-sm"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[12px]" style={{ color: 'var(--muted)' }}>
                <span>
                  {totalTodayCount === 0
                    ? 'No tasks due today yet'
                    : progressPct === 100
                    ? 'All tasks completed for today'
                    : `${totalTodayCount - doneTodayCount} task${totalTodayCount - doneTodayCount === 1 ? '' : 's'} remaining`}
                </span>
                {progressPct === 100 && totalTodayCount > 0 && (
                  <span className="font-bold flex items-center gap-1" style={{ color: 'var(--ok)' }}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5 10 17.5 19 7" />
                    </svg>
                    Completed
                  </span>
                )}
              </div>
            </div>
          )}

          {view !== 'fitness' && (searchOpen || searchQuery || activeTag !== 'all') && (
            <div className="mt-4 space-y-2.5">
              <div className="relative flex items-center">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks or #tags..."
                  enterKeyHint="search"
                  className="w-full min-h-[44px] pl-3.5 pr-16 rounded-xl text-base"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--line)',
                  }}
                  aria-label="Search tasks"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 min-h-[40px] px-2.5 text-xs font-bold"
                    style={{ color: 'var(--muted)' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {availableTags.length > 0 && (
                <div
                  className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
                  style={{ scrollbarWidth: 'none' }}
                  role="group"
                  aria-label="Filter by tag"
                >
                  <button
                    type="button"
                    aria-pressed={activeTag === 'all'}
                    onClick={() => setActiveTag('all')}
                    className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: activeTag === 'all' ? 'var(--tint)' : 'var(--surface)',
                      color: activeTag === 'all' ? 'var(--accent)' : 'var(--muted)',
                      border: `1px solid ${activeTag === 'all' ? 'var(--accent)' : 'var(--line)'}`,
                    }}
                  >
                    All tags
                  </button>
                  {availableTags.map((tg) => {
                    const active = activeTag === tg;
                    return (
                      <button
                        key={tg}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveTag(active ? 'all' : tg)}
                        className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0"
                        style={{
                          backgroundColor: active ? 'var(--tint)' : 'var(--surface)',
                          color: active ? 'var(--accent)' : 'var(--muted)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                        }}
                      >
                        #{tg}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </header>

        {/* Quick AI action strip on Today (clean 3-pill grid on mobile, zero scrollbar) */}
        {view === 'today' && settings.aiEnabled && (
          <div className="grid grid-cols-3 gap-2 pb-3 mb-1 w-full max-w-full">
            <button
              type="button"
              onClick={() => {
                setAiInitialTool('plan_day');
                setAiSheetOpen(true);
              }}
              className="min-h-[46px] py-2 px-1.5 rounded-xl text-xs font-bold text-center flex flex-col items-center justify-center transition-colors active:scale-95"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              <span>Plan day</span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--muted)' }}>Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAiInitialTool('goal');
                setAiSheetOpen(true);
              }}
              className="min-h-[46px] py-2 px-1.5 rounded-xl text-xs font-bold text-center flex flex-col items-center justify-center transition-colors active:scale-95"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              <span>Break goal</span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--muted)' }}>Subtasks</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAiInitialTool('review');
                setAiSheetOpen(true);
              }}
              className="min-h-[46px] py-2 px-1.5 rounded-xl text-xs font-bold text-center flex flex-col items-center justify-center transition-colors active:scale-95"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            >
              <span>Review</span>
              <span className="text-[10px] font-normal" style={{ color: 'var(--muted)' }}>Weekly</span>
            </button>
          </div>
        )}

        {view === 'today' && (
          <section aria-label="Today's tasks">
            {todayOpenTasks.length === 0 ? (
              <div className="text-center py-16 px-6">
                <strong className="block text-lg font-bold mb-1.5">
                  {searchQuery || activeTag !== 'all'
                    ? 'No matching tasks'
                    : doneTodayCount > 0
                    ? 'All done for today'
                    : 'Nothing planned yet'}
                </strong>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {searchQuery || activeTag !== 'all'
                    ? 'Clear your search or tag filter to see all tasks.'
                    : 'Tap + in the bottom corner to add a task, or open Fitness to pick a workout.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {overdueTasks.length > 0 && (
                  <div>
                    <h2 className="text-[13px] font-bold mb-2" style={{ color: 'var(--danger)' }}>
                      Overdue ({overdueTasks.length})
                    </h2>
                    <ul className="space-y-2">
                      {overdueTasks.map((task) => (
                        <li key={task.id}>
                          <TaskRow
                            task={task}
                            onToggleDone={handleToggleDone}
                            onDelete={handleDeleteTask}
                            onEdit={(t) => {
                              setEditingTask(t);
                              setTaskSheetOpen(true);
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {dueTodayOrUndated.length > 0 && (
                  <div>
                    {overdueTasks.length > 0 && (
                      <h2 className="text-[13px] font-bold mb-2" style={{ color: 'var(--muted)' }}>
                        Today ({dueTodayOrUndated.length})
                      </h2>
                    )}
                    <ul className="space-y-2">
                      {dueTodayOrUndated.map((task) => (
                        <li key={task.id}>
                          <TaskRow
                            task={task}
                            onToggleDone={handleToggleDone}
                            onDelete={handleDeleteTask}
                            onEdit={(t) => {
                              setEditingTask(t);
                              setTaskSheetOpen(true);
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {view === 'upcoming' && (
          <section aria-label="Upcoming tasks">
            {Object.keys(upcomingGroups).length === 0 ? (
              <div className="text-center py-16 px-6">
                <strong className="block text-lg font-bold mb-1.5">No upcoming tasks</strong>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Tap + and pick Tomorrow or Next week to schedule ahead.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(upcomingGroups).map(([dateISO, dateTasks]) => (
                  <div key={dateISO}>
                    <h2 className="text-[13px] font-bold mb-2" style={{ color: 'var(--muted)' }}>
                      {formatFriendlyDate(dateISO, true)}
                    </h2>
                    <ul className="space-y-2">
                      {dateTasks.map((task) => (
                        <li key={task.id}>
                          <TaskRow
                            task={task}
                            onToggleDone={handleToggleDone}
                            onDelete={handleDeleteTask}
                            onEdit={(t) => {
                              setEditingTask(t);
                              setTaskSheetOpen(true);
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'fitness' && (
          <Suspense
            fallback={
              <div className="py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>
                Loading workouts...
              </div>
            }
          >
            <LazyFitnessView
              settings={settings}
              onUpdateSettings={updateSettings}
              customWorkouts={customWorkouts}
              onDeleteCustomWorkout={(id) => {
                const next = customWorkouts.filter((w) => w.id !== id);
                setCustomWorkouts(next);
                saveCustomWorkouts(next);
                showToast('Removed custom workout');
              }}
              logs={logs}
              onLogWorkout={(newLog) => {
                const next = [...logs, newLog];
                setLogs(next);
                saveWorkoutLogs(next);
              }}
              onAddWorkoutToToday={(workout) => {
                const snapshot = [...tasks];
                const newTask: Task = {
                  id: `task-${Date.now()}`,
                  title: `Workout: ${workout.name} (${workout.level})`,
                  due: today,
                  priority: 'medium',
                  tag: 'fitness',
                  repeat: 'never',
                  done: false,
                  createdAt: today,
                };
                commitTasks([...tasks, newTask], snapshot);
                haptic(10);
                showToast('Added workout to Today', true);
              }}
              onOpenAIWorkoutGenerator={() => {
                setAiInitialTool('workout');
                setAiSheetOpen(true);
              }}
              onToast={(msg) => showToast(msg, false)}
            />
          </Suspense>
        )}

        {view === 'done' && (
          <section aria-label="Completed tasks">
            {completedTasksList.length === 0 ? (
              <div className="text-center py-16 px-6">
                <strong className="block text-lg font-bold mb-1.5">Nothing completed yet</strong>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Swipe right on any task or tap its circle to complete it.
                </p>
              </div>
            ) : (
              <div>
                <ul className="space-y-2">
                  {completedTasksList.map((task) => (
                    <li key={task.id}>
                      <TaskRow
                        task={task}
                        showDateInMeta
                        onToggleDone={handleToggleDone}
                        onDelete={handleDeleteTask}
                        onEdit={(t) => {
                          setEditingTask(t);
                          setTaskSheetOpen(true);
                        }}
                      />
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="mt-4 min-h-[44px] px-3 text-sm font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  Clear all completed
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <div
        className="fixed right-5 z-20 flex items-center gap-2.5"
        style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
      >
        {settings.aiEnabled && (
          <button
            type="button"
            onClick={() => {
              setAiInitialTool(view === 'fitness' ? 'workout' : 'quick_add');
              setAiSheetOpen(true);
              haptic(8);
            }}
            aria-label="Open AI assistant"
            className="h-14 px-4 rounded-full font-extrabold text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--accent)',
              border: '2px solid var(--accent)',
            }}
          >
            <span>AI</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setTaskSheetOpen(true);
            haptic(8);
          }}
          aria-label="Add task"
          className="w-14 h-14 rounded-full grid place-items-center shadow-lg active:scale-95 transition-transform"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--on-accent)',
          }}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <nav
        aria-label="Primary views"
        className="fixed left-0 right-0 bottom-0 z-20 backdrop-blur-md pb-safe"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--surface) 90%, transparent)',
          borderTop: '1px solid var(--line)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="max-w-[560px] mx-auto grid grid-cols-4">
          {(
            [
              {
                id: 'today',
                label: 'Today',
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="m8.5 12.5 2.5 2.5 5-5.5" />
                  </svg>
                ),
              },
              {
                id: 'upcoming',
                label: 'Upcoming',
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="5" width="17" height="15" rx="3" />
                    <path d="M8 3v4M16 3v4M3.5 10h17" />
                  </svg>
                ),
              },
              {
                id: 'fitness',
                label: 'Fitness',
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" />
                  </svg>
                ),
              },
              {
                id: 'done',
                label: 'Done',
                icon: (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12.5 9 17.5 20 6.5" />
                  </svg>
                ),
              },
            ] as const
          ).map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  setView(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="h-16 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-colors"
                style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {toastState && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 z-50 rounded-2xl px-4 py-3 flex items-center gap-4 text-sm font-semibold shadow-lg whitespace-nowrap"
          style={{
            bottom: 'calc(148px + env(safe-area-inset-bottom, 0px))',
            backgroundColor: 'var(--ink)',
            color: 'var(--bg)',
          }}
        >
          <span>{toastState.message}</span>
          {toastState.canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              className="min-h-[36px] px-2 font-extrabold underline"
              style={{ color: 'var(--bg)' }}
            >
              Undo
            </button>
          )}
        </div>
      )}

      <TaskSheet
        open={taskSheetOpen}
        editingTask={editingTask}
        aiEnabled={settings.aiEnabled}
        onClose={() => {
          setTaskSheetOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTaskFromSheet}
        onDelete={handleDeleteTask}
      />

      {aiSheetOpen && (
        <Suspense fallback={null}>
          <LazyAISheet
            open={aiSheetOpen}
            initialTool={aiInitialTool}
            onClose={() => setAiSheetOpen(false)}
            tasks={tasks}
            logs={logs}
            settings={settings}
            onUpdateSettings={updateSettings}
            onAcceptTask={(draft) => {
              const snapshot = [...tasks];
              const newTask: Task = {
                ...draft,
                id: `task-${Date.now()}`,
                done: false,
                createdAt: today,
              };
              commitTasks([...tasks, newTask], snapshot);
              showToast('Added AI task', true);
            }}
            onAcceptMultipleTasks={(drafts) => {
              const snapshot = [...tasks];
              const created: Task[] = drafts.map((d, idx) => ({
                ...d,
                id: `task-${Date.now()}-${idx}`,
                done: false,
                createdAt: today,
              }));
              commitTasks([...tasks, ...created], snapshot);
              showToast(`Added ${created.length} subtasks`, true);
            }}
            onAcceptDayPlan={(updates) => {
              const snapshot = [...tasks];
              const map = new Map(updates.map((u) => [u.taskId, u]));
              const next = tasks.map((t) => {
                const match = map.get(t.id);
                return match ? { ...t, time: match.time, priority: match.priority } : t;
              });
              commitTasks(next, snapshot);
              showToast('Applied daily schedule', true);
            }}
            onAcceptCustomWorkout={(workout, addToTodayAlso) => {
              const nextW = [workout, ...customWorkouts];
              setCustomWorkouts(nextW);
              saveCustomWorkouts(nextW);
              if (addToTodayAlso) {
                const snapshot = [...tasks];
                commitTasks(
                  [
                    ...tasks,
                    {
                      id: `task-${Date.now()}`,
                      title: `Workout: ${workout.name} (${workout.level})`,
                      due: today,
                      priority: 'medium',
                      tag: 'fitness',
                      repeat: 'never',
                      done: false,
                      createdAt: today,
                    },
                  ],
                  snapshot
                );
              }
              setView('fitness');
              showToast('Saved custom workout');
            }}
            onToast={(m) => showToast(m, false)}
          />
        </Suspense>
      )}

      {settingsOpen && (
        <Suspense fallback={null}>
          <LazySettingsSheet
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={updateSettings}
            onExportJSON={handleExportJSON}
            onDeleteAllData={handleDeleteAllData}
            onOpenOnboarding={() => setOnboardingOpen(true)}
            onToast={(m) => showToast(m, false)}
          />
        </Suspense>
      )}

      {onboardingOpen && (
        <Suspense fallback={null}>
          <LazyOnboardingModal
            open={onboardingOpen}
            settings={settings}
            onComplete={(updated) => {
              updateSettings(updated);
              setOnboardingOpen(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
