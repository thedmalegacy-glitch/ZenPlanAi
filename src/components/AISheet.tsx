import React, { useState } from 'react';
import {
  AIDayPlanResult,
  AIGoalBreakdownResult,
  AIQuickAddResult,
  AIWeeklyReviewResult,
  AppSettings,
  EquipmentType,
  FitnessGoal,
  FitnessLevel,
  Priority,
  Task,
  Workout,
  WorkoutLog,
} from '../types';
import {
  buildLocalCustomWorkout,
  buildLocalDayPlan,
  buildLocalGoalBreakdown,
  buildLocalWeeklyReview,
  computeWorkoutStats,
  formatFriendlyDate,
  haptic,
  parseNaturalTaskLocal,
  todayISO,
} from '../utils/dateAndHaptics';

export type AIToolTab = 'quick_add' | 'goal' | 'plan_day' | 'workout' | 'review';

interface AISheetProps {
  open: boolean;
  initialTool?: AIToolTab;
  onClose: () => void;
  tasks: Task[];
  logs: WorkoutLog[];
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onAcceptTask: (taskDraft: Omit<Task, 'id' | 'createdAt' | 'done'>) => void;
  onAcceptMultipleTasks: (drafts: Array<Omit<Task, 'id' | 'createdAt' | 'done'>>) => void;
  onAcceptDayPlan: (updates: Array<{ taskId: string; time: string; priority: Priority }>) => void;
  onAcceptCustomWorkout: (workout: Workout, addToTodayAlso: boolean) => void;
  onToast: (msg: string) => void;
}

export const AISheet: React.FC<AISheetProps> = ({
  open,
  initialTool = 'quick_add',
  onClose,
  tasks,
  logs,
  settings,
  onUpdateSettings,
  onAcceptTask,
  onAcceptMultipleTasks,
  onAcceptDayPlan,
  onAcceptCustomWorkout,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<AIToolTab>(initialTool);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);

  const [quickText, setQuickText] = useState('Gym tomorrow 6am high priority #fitness');
  const [goalText, setGoalText] = useState('Prepare for final exams in 3 weeks');
  const [wLevel, setWLevel] = useState<FitnessLevel>(settings.fitnessLevel || 'Beginner');
  const [wGoal, setWGoal] = useState<FitnessGoal>(settings.fitnessGoal || 'strength');
  const [wMinutes, setWMinutes] = useState<number>(25);
  const [wEquip, setWEquip] = useState<EquipmentType>('no equipment');

  const [quickPreview, setQuickPreview] = useState<AIQuickAddResult | null>(null);
  const [goalPreview, setGoalPreview] = useState<AIGoalBreakdownResult | null>(null);
  const [dayPlanPreview, setDayPlanPreview] = useState<AIDayPlanResult | null>(null);
  const [workoutPreview, setWorkoutPreview] = useState<Workout | null>(null);
  const [reviewPreview, setReviewPreview] = useState<AIWeeklyReviewResult | null>(null);

  React.useEffect(() => {
    if (open && initialTool) {
      setActiveTab(initialTool);
      setErrorMsg(null);
    }
  }, [open, initialTool]);

  if (!open) return null;

  const today = todayISO();
  const todayOpenTasks = tasks.filter((t) => !t.done && (!t.due || t.due <= today));
  const completedTasks = tasks.filter((t) => t.done);
  const openTasks = tasks.filter((t) => !t.done);
  const { workoutsThisWeek, streak } = computeWorkoutStats(logs, today);

  const clearPreviews = () => {
    setQuickPreview(null);
    setGoalPreview(null);
    setDayPlanPreview(null);
    setWorkoutPreview(null);
    setReviewPreview(null);
    setIsEditingPreview(false);
    setErrorMsg(null);
  };

  const runAITool = async () => {
    setLoading(true);
    setErrorMsg(null);
    setIsEditingPreview(false);
    haptic(8);

    try {
      let payload: Record<string, unknown> = { today };
      let action = '';

      if (activeTab === 'quick_add') {
        action = 'quick_add';
        payload = { text: quickText, today };
      } else if (activeTab === 'goal') {
        action = 'break_down_goal';
        payload = { goal: goalText, today };
      } else if (activeTab === 'plan_day') {
        action = 'plan_day';
        payload = {
          today,
          tasks: todayOpenTasks.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            tag: t.tag || '',
            time: t.time || '',
          })),
        };
      } else if (activeTab === 'workout') {
        action = 'generate_workout';
        payload = {
          level: wLevel,
          goal: wGoal,
          minutes: wMinutes,
          equipment: wEquip,
        };
      } else if (activeTab === 'review') {
        action = 'weekly_review';
        payload = {
          today,
          completedTasks: completedTasks.map((t) => ({ title: t.title, doneAt: t.doneAt })),
          openTasks: openTasks.map((t) => ({ title: t.title, due: t.due })),
          workoutsThisWeek,
          streakDays: streak,
        };
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.result) {
        throw new Error(
          data.error || 'Could not reach the AI service right now. Check your connection and tap Retry.'
        );
      }

      if (activeTab === 'quick_add') setQuickPreview(data.result as AIQuickAddResult);
      if (activeTab === 'goal') setGoalPreview(data.result as AIGoalBreakdownResult);
      if (activeTab === 'plan_day') setDayPlanPreview(data.result as AIDayPlanResult);
      if (activeTab === 'workout') {
        setWorkoutPreview({
          ...(data.result as Workout),
          id: `custom-${Date.now()}`,
          isCustom: true,
        });
      }
      if (activeTab === 'review') setReviewPreview(data.result as AIWeeklyReviewResult);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Could not reach the AI assistant. Check your internet connection or tap Retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  const runOfflineSmartFallback = () => {
    setErrorMsg(null);
    setIsEditingPreview(false);
    haptic(10);
    if (activeTab === 'quick_add') {
      setQuickPreview(parseNaturalTaskLocal(quickText, today));
    } else if (activeTab === 'goal') {
      setGoalPreview(buildLocalGoalBreakdown(goalText, today));
    } else if (activeTab === 'plan_day') {
      setDayPlanPreview(buildLocalDayPlan(todayOpenTasks));
    } else if (activeTab === 'workout') {
      setWorkoutPreview(buildLocalCustomWorkout(wLevel, wGoal, wMinutes, wEquip));
    } else if (activeTab === 'review') {
      setReviewPreview(buildLocalWeeklyReview(completedTasks, openTasks, workoutsThisWeek, streak));
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className="fixed inset-0"
        style={{ backgroundColor: 'rgba(10, 12, 18, 0.48)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-[560px] max-h-[88vh] overflow-y-auto no-scrollbar rounded-t-[24px] p-5 animate-sheet"
        style={{
          backgroundColor: 'var(--surface)',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          scrollbarWidth: 'none',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="ZenPlan AI assistant"
      >
        <div
          className="w-9 h-1 rounded-full mx-auto mb-3"
          style={{ backgroundColor: 'var(--line)' }}
        />

        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">AI assistant</h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Every suggestion is a preview. Nothing changes until you tap Accept.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl grid place-items-center text-sm font-semibold"
            style={{ color: 'var(--muted)' }}
            aria-label="Close AI assistant"
          >
            Close
          </button>
        </div>

        {!settings.aiEnabled ? (
          <div
            className="rounded-2xl p-4 my-2"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
          >
            <p className="font-bold text-base">AI assistance is turned off</p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
              You disabled AI features in Settings. ZenPlan works 100% offline without AI, or you can re-enable it below.
            </p>
            <button
              type="button"
              onClick={() => onUpdateSettings({ aiEnabled: true })}
              className="mt-3 min-h-[44px] px-4 rounded-xl text-sm font-bold"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              Enable AI assistant
            </button>
          </div>
        ) : (
          <>
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar"
              style={{ scrollbarWidth: 'none' }}
              role="tablist"
              aria-label="AI tools"
            >
              {(
                [
                  { id: 'quick_add', label: 'Smart add' },
                  { id: 'goal', label: 'Break down goal' },
                  { id: 'plan_day', label: 'Plan my day' },
                  { id: 'workout', label: 'Workout builder' },
                  { id: 'review', label: 'Weekly review' },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setActiveTab(tab.id);
                      clearPreviews();
                    }}
                    className="min-h-[44px] px-3.5 rounded-xl text-[13px] font-bold whitespace-nowrap shrink-0 transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--tint)' : 'var(--bg)',
                      color: active ? 'var(--accent)' : 'var(--muted)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === 'quick_add' && !quickPreview && (
              <div className="space-y-3">
                <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }} htmlFor="ai-quick-input">
                  Type naturally (task, date, time, priority, or #tag)
                </label>
                <input
                  id="ai-quick-input"
                  type="text"
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  placeholder="e.g. gym tomorrow 6am high priority"
                  enterKeyHint="go"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickText.trim()) void runAITool();
                  }}
                  className="w-full min-h-[48px] px-3.5 rounded-xl text-base"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--line)',
                  }}
                />
                <button
                  type="button"
                  disabled={loading || !quickText.trim()}
                  onClick={() => void runAITool()}
                  className="w-full min-h-[48px] rounded-xl font-bold text-base disabled:opacity-40"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                >
                  {loading ? 'Parsing task...' : 'Preview structured task'}
                </button>
              </div>
            )}

            {activeTab === 'goal' && !goalPreview && (
              <div className="space-y-3">
                <label className="block text-xs font-bold" style={{ color: 'var(--muted)' }} htmlFor="ai-goal-input">
                  What goal do you want to break into dated steps?
                </label>
                <input
                  id="ai-goal-input"
                  type="text"
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="e.g. prepare for exams in 3 weeks"
                  enterKeyHint="go"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && goalText.trim()) void runAITool();
                  }}
                  className="w-full min-h-[48px] px-3.5 rounded-xl text-base"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--line)',
                  }}
                />
                <button
                  type="button"
                  disabled={loading || !goalText.trim()}
                  onClick={() => void runAITool()}
                  className="w-full min-h-[48px] rounded-xl font-bold text-base disabled:opacity-40"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                >
                  {loading ? 'Breaking down goal...' : 'Generate subtask plan'}
                </button>
              </div>
            )}

            {activeTab === 'plan_day' && !dayPlanPreview && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Reads your {todayOpenTasks.length} open task{todayOpenTasks.length === 1 ? '' : 's'} for Today and suggests a calm order with time blocks.
                </p>
                {todayOpenTasks.length === 0 ? (
                  <p className="text-sm font-semibold">
                    No open tasks on Today yet. Add a few tasks first to plan your day.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void runAITool()}
                    className="w-full min-h-[48px] rounded-xl font-bold text-base disabled:opacity-40"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    {loading ? 'Planning your day...' : `Suggest schedule for ${todayOpenTasks.length} tasks`}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'workout' && !workoutPreview && (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Disclaimer: AI workouts are general fitness guidance, not medical advice. Warm up first and stop if something hurts.
                </p>

                <div>
                  <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Level
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lv) => (
                      <button
                        key={lv}
                        type="button"
                        aria-pressed={wLevel === lv}
                        onClick={() => setWLevel(lv)}
                        className="min-h-[44px] px-3.5 rounded-xl text-sm font-semibold"
                        style={{
                          backgroundColor: wLevel === lv ? 'var(--tint)' : 'var(--bg)',
                          color: wLevel === lv ? 'var(--accent)' : 'var(--ink)',
                          border: `1px solid ${wLevel === lv ? 'var(--accent)' : 'var(--line)'}`,
                        }}
                      >
                        {lv}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Goal
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(['strength', 'fat loss', 'mobility'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={wGoal === g}
                        onClick={() => setWGoal(g)}
                        className="min-h-[44px] px-3.5 rounded-xl text-sm font-semibold capitalize"
                        style={{
                          backgroundColor: wGoal === g ? 'var(--tint)' : 'var(--bg)',
                          color: wGoal === g ? 'var(--accent)' : 'var(--ink)',
                          border: `1px solid ${wGoal === g ? 'var(--accent)' : 'var(--line)'}`,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                      Available minutes
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {[15, 25, 35, 45].map((m) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={wMinutes === m}
                          onClick={() => setWMinutes(m)}
                          className="min-h-[44px] px-3 rounded-xl text-sm font-semibold tabular-nums"
                          style={{
                            backgroundColor: wMinutes === m ? 'var(--tint)' : 'var(--bg)',
                            color: wMinutes === m ? 'var(--accent)' : 'var(--ink)',
                            border: `1px solid ${wMinutes === m ? 'var(--accent)' : 'var(--line)'}`,
                          }}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--muted)' }}>
                      Equipment
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['no equipment', 'dumbbells', 'gym'] as const).map((eq) => (
                        <button
                          key={eq}
                          type="button"
                          aria-pressed={wEquip === eq}
                          onClick={() => setWEquip(eq)}
                          className="min-h-[44px] px-3 rounded-xl text-xs font-semibold capitalize"
                          style={{
                            backgroundColor: wEquip === eq ? 'var(--tint)' : 'var(--bg)',
                            color: wEquip === eq ? 'var(--accent)' : 'var(--ink)',
                            border: `1px solid ${wEquip === eq ? 'var(--accent)' : 'var(--line)'}`,
                          }}
                        >
                          {eq}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void runAITool()}
                  className="w-full min-h-[48px] rounded-xl font-bold text-base disabled:opacity-40"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                >
                  {loading ? 'Designing workout...' : 'Generate custom workout'}
                </button>
              </div>
            )}

            {activeTab === 'review' && !reviewPreview && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Summarizes your week in 3 plain sentences: what you finished ({completedTasks.length} tasks, {workoutsThisWeek} workouts), what slipped ({openTasks.length} open), and one practical next step.
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void runAITool()}
                  className="w-full min-h-[48px] rounded-xl font-bold text-base disabled:opacity-40"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                >
                  {loading ? 'Writing weekly review...' : 'Generate 3-sentence review'}
                </button>
              </div>
            )}

            {errorMsg && (
              <div
                className="mt-4 rounded-2xl p-4"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--danger)' }}
                role="alert"
              >
                <p className="text-sm font-bold" style={{ color: 'var(--danger)' }}>
                  Could not complete AI request
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {errorMsg}
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => void runAITool()}
                    className="min-h-[44px] px-4 rounded-xl text-sm font-bold"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={runOfflineSmartFallback}
                    className="min-h-[44px] px-4 rounded-xl text-sm font-semibold"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  >
                    Use offline smart preview
                  </button>
                </div>
              </div>
            )}

            {quickPreview && (
              <div
                className="mt-3 rounded-2xl p-4 space-y-3"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--accent)' }}
              >
                <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  AI preview · {quickPreview.explanation}
                </div>

                {isEditingPreview ? (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={quickPreview.title}
                      onChange={(e) => setQuickPreview({ ...quickPreview, title: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl text-base"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                      aria-label="Edit task title"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={quickPreview.due}
                        onChange={(e) => setQuickPreview({ ...quickPreview, due: e.target.value })}
                        className="min-h-[44px] px-3 rounded-xl text-sm"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                        aria-label="Edit due date"
                      />
                      <input
                        type="time"
                        value={quickPreview.time}
                        onChange={(e) => setQuickPreview({ ...quickPreview, time: e.target.value })}
                        className="min-h-[44px] px-3 rounded-xl text-sm"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                        aria-label="Edit due time"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-base">{quickPreview.title}</div>
                    <div className="text-[13px] mt-1" style={{ color: 'var(--muted)' }}>
                      {formatFriendlyDate(quickPreview.due)}
                      {quickPreview.time ? ` at ${quickPreview.time}` : ''} · Priority: {quickPreview.priority} · Repeat: {quickPreview.repeat}
                      {quickPreview.tag ? ` · #${quickPreview.tag}` : ''}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAcceptTask({
                        title: quickPreview.title,
                        due: quickPreview.due || today,
                        time: quickPreview.time || undefined,
                        priority: quickPreview.priority,
                        repeat: quickPreview.repeat,
                        tag: quickPreview.tag || undefined,
                      });
                      clearPreviews();
                      onClose();
                    }}
                    className="flex-1 min-h-[44px] rounded-xl font-bold text-sm"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                    className="min-h-[44px] px-4 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                  >
                    {isEditingPreview ? 'Done editing' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={clearPreviews}
                    className="min-h-[44px] px-3 rounded-xl font-semibold text-sm"
                    style={{ color: 'var(--muted)' }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {goalPreview && (
              <div
                className="mt-3 rounded-2xl p-4 space-y-3"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--accent)' }}
              >
                <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  AI preview · {goalPreview.summary}
                </div>

                <ul className="space-y-2">
                  {goalPreview.subtasks.map((st, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                    >
                      {isEditingPreview ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={st.title}
                            onChange={(e) => {
                              const copy = [...goalPreview.subtasks];
                              copy[idx] = { ...st, title: e.target.value };
                              setGoalPreview({ ...goalPreview, subtasks: copy });
                            }}
                            className="w-full min-h-[44px] px-2.5 rounded-lg text-sm"
                            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={st.due}
                              onChange={(e) => {
                                const copy = [...goalPreview.subtasks];
                                copy[idx] = { ...st, due: e.target.value };
                                setGoalPreview({ ...goalPreview, subtasks: copy });
                              }}
                              className="min-h-[44px] px-2.5 rounded-lg text-xs"
                              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const copy = goalPreview.subtasks.filter((_, i) => i !== idx);
                                setGoalPreview({ ...goalPreview, subtasks: copy });
                              }}
                              className="min-h-[44px] px-3 text-xs font-semibold ml-auto"
                              style={{ color: 'var(--danger)' }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold text-sm">{st.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            {formatFriendlyDate(st.due)} · Priority: {st.priority} · #{st.tag}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAcceptMultipleTasks(
                        goalPreview.subtasks.map((st) => ({
                          title: st.title,
                          due: st.due,
                          priority: st.priority,
                          repeat: 'never',
                          tag: st.tag || 'goal',
                        }))
                      );
                      clearPreviews();
                      onClose();
                    }}
                    className="flex-1 min-h-[44px] rounded-xl font-bold text-sm"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    Accept {goalPreview.subtasks.length} tasks
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                    className="min-h-[44px] px-4 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                  >
                    {isEditingPreview ? 'Done' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={clearPreviews}
                    className="min-h-[44px] px-3 rounded-xl font-semibold text-sm"
                    style={{ color: 'var(--muted)' }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {dayPlanPreview && (
              <div
                className="mt-3 rounded-2xl p-4 space-y-3"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--accent)' }}
              >
                <div className="text-xs font-bold leading-relaxed" style={{ color: 'var(--accent)' }}>
                  AI schedule preview · {dayPlanPreview.explanation}
                </div>

                <ul className="space-y-2">
                  {dayPlanPreview.schedule.map((slot, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-xl flex items-center justify-between gap-3"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm">{slot.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          {slot.note} · Priority: {slot.priority}
                        </div>
                      </div>
                      {isEditingPreview ? (
                        <input
                          type="time"
                          value={slot.timeBlock}
                          onChange={(e) => {
                            const copy = [...dayPlanPreview.schedule];
                            copy[idx] = { ...slot, timeBlock: e.target.value };
                            setDayPlanPreview({ ...dayPlanPreview, schedule: copy });
                          }}
                          className="min-h-[44px] px-2 rounded-lg text-xs tabular-nums"
                          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
                        />
                      ) : (
                        <span
                          className="font-extrabold text-sm tabular-nums shrink-0"
                          style={{ color: 'var(--accent)' }}
                        >
                          {slot.timeBlock}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAcceptDayPlan(
                        dayPlanPreview.schedule.map((s) => ({
                          taskId: s.taskId,
                          time: s.timeBlock,
                          priority: s.priority,
                        }))
                      );
                      clearPreviews();
                      onClose();
                    }}
                    className="flex-1 min-h-[44px] rounded-xl font-bold text-sm"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    Accept schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                    className="min-h-[44px] px-4 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                  >
                    {isEditingPreview ? 'Done' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={clearPreviews}
                    className="min-h-[44px] px-3 rounded-xl font-semibold text-sm"
                    style={{ color: 'var(--muted)' }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {workoutPreview && (
              <div
                className="mt-3 rounded-2xl p-4 space-y-3"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--accent)' }}
              >
                <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  AI custom workout preview
                </div>

                {isEditingPreview ? (
                  <input
                    type="text"
                    value={workoutPreview.name}
                    onChange={(e) => setWorkoutPreview({ ...workoutPreview, name: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl font-bold text-base"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                  />
                ) : (
                  <div>
                    <div className="font-extrabold text-base">{workoutPreview.name}</div>
                    <div className="text-xs mt-0.5 tabular-nums" style={{ color: 'var(--muted)' }}>
                      {workoutPreview.level} · {workoutPreview.durationMin} min · {workoutPreview.equipment} · {workoutPreview.goal}
                    </div>
                  </div>
                )}

                <ul className="space-y-2">
                  {workoutPreview.exercises.map((ex, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-sm">{ex.name}</span>
                        <span className="font-bold text-xs tabular-nums" style={{ color: 'var(--accent)' }}>
                          {ex.sets} × {ex.repsOrSec}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {ex.cue}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      onAcceptCustomWorkout(workoutPreview, true);
                      clearPreviews();
                      onClose();
                    }}
                    className="flex-1 min-h-[44px] px-3 rounded-xl font-bold text-sm"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    Accept & add to Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                    className="min-h-[44px] px-4 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                  >
                    {isEditingPreview ? 'Done' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={clearPreviews}
                    className="min-h-[44px] px-3 rounded-xl font-semibold text-sm"
                    style={{ color: 'var(--muted)' }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {reviewPreview && (
              <div
                className="mt-3 rounded-2xl p-4 space-y-3"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--accent)' }}
              >
                <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  Weekly review preview (3 sentences)
                </div>

                <div className="space-y-2 text-sm leading-relaxed">
                  <p>
                    <strong style={{ color: 'var(--ok)' }}>Done:</strong> {reviewPreview.doneSentence}
                  </p>
                  <p>
                    <strong style={{ color: 'var(--warn)' }}>Slipped:</strong> {reviewPreview.slippedSentence}
                  </p>
                  <p>
                    <strong style={{ color: 'var(--accent)' }}>Next step:</strong> {reviewPreview.suggestionSentence}
                  </p>
                </div>

                <div className="pt-1">
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--muted)' }}>
                    Suggested action task for Today:
                  </label>
                  {isEditingPreview ? (
                    <input
                      type="text"
                      value={reviewPreview.suggestedTaskTitle}
                      onChange={(e) =>
                        setReviewPreview({ ...reviewPreview, suggestedTaskTitle: e.target.value })
                      }
                      className="w-full min-h-[44px] px-3 rounded-xl text-sm"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                    />
                  ) : (
                    <div
                      className="p-3 rounded-xl text-sm font-semibold"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                    >
                      {reviewPreview.suggestedTaskTitle}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAcceptTask({
                        title: reviewPreview.suggestedTaskTitle,
                        due: today,
                        priority: 'medium',
                        repeat: 'never',
                        tag: 'focus',
                      });
                      onToast('Added weekly review suggestion to Today');
                      clearPreviews();
                      onClose();
                    }}
                    className="flex-1 min-h-[44px] rounded-xl font-bold text-sm"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
                  >
                    Accept & add task
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingPreview(!isEditingPreview)}
                    className="min-h-[44px] px-4 rounded-xl font-semibold text-sm"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
                  >
                    {isEditingPreview ? 'Done' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={clearPreviews}
                    className="min-h-[44px] px-3 rounded-xl font-semibold text-sm"
                    style={{ color: 'var(--muted)' }}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            <p className="text-[12px] mt-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
              Privacy note: When you use an AI tool, only the prompt or current task titles for that request are sent to our server endpoint. You can turn AI off anytime in Settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AISheet;
