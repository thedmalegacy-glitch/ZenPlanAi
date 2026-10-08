import React, { Suspense, useEffect, useRef, useState } from 'react';
import {
  AppSettings,
  EquipmentType,
  FitnessGoal,
  FitnessLevel,
  Workout,
  WorkoutLog,
} from '../types';
import { BUILTIN_WORKOUTS } from '../data/workouts';
import { computeWorkoutStats, haptic, pad2, todayISO } from '../utils/dateAndHaptics';

const LazyExerciseDemo = React.lazy(() => import('./ExerciseDemo'));

interface FitnessViewProps {
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  customWorkouts: Workout[];
  onDeleteCustomWorkout: (id: string) => void;
  logs: WorkoutLog[];
  onLogWorkout: (log: WorkoutLog) => void;
  onAddWorkoutToToday: (workout: Workout) => void;
  onOpenAIWorkoutGenerator: () => void;
  onToast: (msg: string) => void;
}

const LEVELS: Array<{ level: FitnessLevel; desc: string; loadHintKg: string; loadHintLb: string }> = [
  {
    level: 'Beginner',
    desc: 'Simple, low-impact movements to build consistency and joint control.',
    loadHintKg: 'Bodyweight or 2–6 kg',
    loadHintLb: 'Bodyweight or 5–15 lb',
  },
  {
    level: 'Intermediate',
    desc: 'Moderate volume and tempo control to build lean strength.',
    loadHintKg: '8–20 kg dumbbells',
    loadHintLb: '15–45 lb dumbbells',
  },
  {
    level: 'Advanced',
    desc: 'Heavy compound lifts and explosive conditioning for experienced lifters.',
    loadHintKg: 'Barbell & heavy loads (25+ kg)',
    loadHintLb: 'Barbell & heavy loads (55+ lb)',
  },
];

export const FitnessView: React.FC<FitnessViewProps> = ({
  settings,
  onUpdateSettings,
  customWorkouts,
  onDeleteCustomWorkout,
  logs,
  onLogWorkout,
  onAddWorkoutToToday,
  onOpenAIWorkoutGenerator,
  onToast,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel>(settings.fitnessLevel || 'Beginner');
  const [equipFilter, setEquipFilter] = useState<'all' | EquipmentType>('all');
  const [goalFilter, setGoalFilter] = useState<'all' | FitnessGoal>('all');
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>('beg-full');
  const [activeWorkoutStart, setActiveWorkoutStart] = useState<Record<string, number>>({});
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [expandedDemos, setExpandedDemos] = useState<Record<string, boolean>>({});
  const [completedSummary, setCompletedSummary] = useState<{
    workoutName: string;
    level: FitnessLevel;
    setsCompleted: number;
    durationSec: number;
  } | null>(null);

  const [restLeft, setRestLeft] = useState<number>(0);
  const restIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (restIntervalRef.current) window.clearInterval(restIntervalRef.current);
    };
  }, []);

  const startRestTimer = (seconds: number) => {
    if (restIntervalRef.current) window.clearInterval(restIntervalRef.current);
    haptic(10);
    setRestLeft(seconds);
    restIntervalRef.current = window.setInterval(() => {
      setRestLeft((prev) => {
        if (prev <= 1) {
          if (restIntervalRef.current) window.clearInterval(restIntervalRef.current);
          haptic([200, 100, 200]);
          onToast('Rest complete. Ready for your next set.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (restIntervalRef.current) window.clearInterval(restIntervalRef.current);
    setRestLeft(0);
  };

  const allWorkouts = [...customWorkouts, ...BUILTIN_WORKOUTS];
  const filteredWorkouts = allWorkouts.filter((w) => {
    if (w.level !== selectedLevel) return false;
    if (equipFilter !== 'all' && w.equipment !== equipFilter) return false;
    if (goalFilter !== 'all' && w.goal !== goalFilter) return false;
    return true;
  });

  const today = todayISO();
  const { workoutsThisWeek, streak } = computeWorkoutStats(logs, today);
  const currentLevelMeta = LEVELS.find((l) => l.level === selectedLevel) || LEVELS[0];

  const handleToggleSet = (workout: Workout, exIdx: number, setNumber: number) => {
    const key = `${workout.id}-${exIdx}`;
    const current = completedSets[key] || 0;
    const nextVal = current === setNumber ? setNumber - 1 : setNumber;

    if (!activeWorkoutStart[workout.id]) {
      setActiveWorkoutStart((prev) => ({ ...prev, [workout.id]: Date.now() }));
    }

    const updated = { ...completedSets, [key]: nextVal };
    setCompletedSets(updated);
    haptic(12);

    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
    const doneSets = workout.exercises.reduce(
      (acc, _ex, idx) => acc + (updated[`${workout.id}-${idx}`] || 0),
      0
    );

    if (doneSets === totalSets && totalSets > 0) {
      finishWorkout(workout, doneSets);
    }
  };

  const finishWorkout = (workout: Workout, setsDone: number) => {
    const startedAt = activeWorkoutStart[workout.id] || Date.now() - workout.durationMin * 60 * 1000;
    const elapsedSec = Math.max(60, Math.round((Date.now() - startedAt) / 1000));

    const newLog: WorkoutLog = {
      id: `log-${Date.now()}`,
      workoutId: workout.id,
      workoutName: workout.name,
      date: todayISO(),
      setsCompleted: setsDone,
      durationSec: elapsedSec,
    };

    onLogWorkout(newLog);
    haptic([60, 50, 80]);
    setCompletedSummary({
      workoutName: workout.name,
      level: workout.level,
      setsCompleted: setsDone,
      durationSec: elapsedSec,
    });
  };

  const resetWorkoutSets = (workout: Workout) => {
    const copy = { ...completedSets };
    workout.exercises.forEach((_ex, idx) => {
      delete copy[`${workout.id}-${idx}`];
    });
    setCompletedSets(copy);
  };

  return (
    <section aria-label="Fitness trainer">
      {!settings.disclaimerAccepted && (
        <div
          className="mb-4 rounded-2xl p-4"
          style={{ backgroundColor: 'var(--tint)', border: '1px solid var(--line)' }}
          role="region"
          aria-label="Fitness safety disclaimer"
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Before you train
          </p>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
            Workouts and AI suggestions are general fitness guidance, not medical advice. Warm up for 5 minutes first and stop immediately if something hurts.
          </p>
          <button
            type="button"
            onClick={() => onUpdateSettings({ disclaimerAccepted: true })}
            className="mt-3 min-h-[44px] px-4 rounded-xl text-sm font-bold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            I understand
          </button>
        </div>
      )}

      <div
        className="mb-4 rounded-2xl p-4 flex items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
      >
        <div>
          <div className="text-[13px]" style={{ color: 'var(--muted)' }}>
            Weekly consistency · {workoutsThisWeek} session{workoutsThisWeek === 1 ? '' : 's'}
            {streak > 0 ? ` · ${streak} day streak` : ''}
          </div>
          <div className="text-sm font-semibold mt-0.5">
            {currentLevelMeta.desc}
          </div>
          <div className="text-[13px] mt-1" style={{ color: 'var(--muted)' }}>
            Typical load: {settings.units === 'kg' ? currentLevelMeta.loadHintKg : currentLevelMeta.loadHintLb}
          </div>
        </div>
        {settings.aiEnabled && (
          <button
            type="button"
            onClick={onOpenAIWorkoutGenerator}
            className="min-h-[44px] px-3.5 rounded-xl text-sm font-bold shrink-0 whitespace-nowrap"
            style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
          >
            Custom AI session
          </button>
        )}
      </div>

      <div
        className="flex rounded-2xl p-1 gap-1 mb-3"
        style={{ backgroundColor: 'var(--line)' }}
        role="group"
        aria-label="Fitness level"
      >
        {LEVELS.map((item) => {
          const active = selectedLevel === item.level;
          return (
            <button
              key={item.level}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setSelectedLevel(item.level);
                onUpdateSettings({ fitnessLevel: item.level });
                haptic(8);
              }}
              className="flex-1 min-h-[44px] rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
              style={{
                backgroundColor: active ? 'var(--surface)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--muted)',
              }}
            >
              {item.level}
            </button>
          );
        })}
      </div>

      <div className="space-y-2 mb-4">
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
          role="group"
          aria-label="Filter by equipment"
        >
          {(
            [
              { label: 'All gear', value: 'all' },
              { label: 'No equipment', value: 'no equipment' },
              { label: 'Dumbbells', value: 'dumbbells' },
              { label: 'Gym', value: 'gym' },
            ] as const
          ).map((eq) => {
            const active = equipFilter === eq.value;
            return (
              <button
                key={eq.value}
                type="button"
                aria-pressed={active}
                onClick={() => setEquipFilter(eq.value)}
                className="min-h-[44px] px-3.5 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors"
                style={{
                  backgroundColor: active ? 'var(--tint)' : 'var(--surface)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                {eq.label}
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
          role="group"
          aria-label="Filter by goal"
        >
          {(
            [
              { label: 'All goals', value: 'all' },
              { label: 'Strength', value: 'strength' },
              { label: 'Fat loss', value: 'fat loss' },
              { label: 'Mobility', value: 'mobility' },
            ] as const
          ).map((g) => {
            const active = goalFilter === g.value;
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={active}
                onClick={() => setGoalFilter(g.value)}
                className="min-h-[44px] px-3.5 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors"
                style={{
                  backgroundColor: active ? 'var(--tint)' : 'var(--surface)',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {completedSummary && (
        <div
          className="mb-4 rounded-2xl p-5"
          style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--ok)' }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold" style={{ color: 'var(--ok)' }}>
                Workout complete
              </span>
              <h3 className="text-lg font-extrabold mt-0.5">{completedSummary.workoutName}</h3>
              <p className="text-[13px] mt-1 tabular-nums" style={{ color: 'var(--muted)' }}>
                {completedSummary.level} · {completedSummary.setsCompleted} sets finished ·{' '}
                {Math.max(1, Math.round(completedSummary.durationSec / 60))} min logged
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCompletedSummary(null)}
              className="min-h-[44px] px-3 rounded-xl text-sm font-semibold"
              style={{ color: 'var(--muted)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {filteredWorkouts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}>
          <p className="font-bold text-base">No workouts match those filters</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Reset the equipment or goal filter, or generate a custom session with AI.
          </p>
          <button
            type="button"
            onClick={() => {
              setEquipFilter('all');
              setGoalFilter('all');
            }}
            className="mt-4 min-h-[44px] px-4 rounded-xl text-sm font-bold"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            Show all {selectedLevel.toLowerCase()} workouts
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkouts.map((workout) => {
            const isOpen = openWorkoutId === workout.id;
            const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
            const doneSets = workout.exercises.reduce(
              (acc, _ex, idx) => acc + (completedSets[`${workout.id}-${idx}`] || 0),
              0
            );

            return (
              <article
                key={workout.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenWorkoutId(isOpen ? null : workout.id)}
                  className="w-full text-left p-4 min-h-[68px] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[17px] leading-snug">{workout.name}</div>
                    <div className="text-[13px] mt-1 tabular-nums" style={{ color: 'var(--muted)' }}>
                      {workout.durationMin} min · {workout.exercises.length} exercises · {workout.equipment} · {workout.goal}
                      {doneSets > 0 ? ` · ${doneSets}/${totalSets} sets` : ''}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 shrink-0 transition-transform duration-200"
                    style={{
                      color: 'var(--muted)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isOpen && (
                  <div>
                    {workout.exercises.map((ex, exIdx) => {
                      const key = `${workout.id}-${exIdx}`;
                      const doneCount = completedSets[key] || 0;
                      const showDemo = !!expandedDemos[key];

                      return (
                        <div
                          key={key}
                          className="p-4"
                          style={{ borderTop: '1px solid var(--line)' }}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold text-base">{ex.name}</span>
                            <span
                              className="font-extrabold text-sm whitespace-nowrap tabular-nums"
                              style={{ color: 'var(--accent)' }}
                            >
                              {ex.sets} × {ex.repsOrSec}
                            </span>
                          </div>

                          <div className="text-[13px] mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                            {ex.cue} · <span>{ex.equipment}</span>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={`Sets for ${ex.name}`}>
                              {Array.from({ length: ex.sets }, (_, i) => i + 1).map((setNum) => {
                                const isDone = setNum <= doneCount;
                                return (
                                  <button
                                    key={setNum}
                                    type="button"
                                    aria-pressed={isDone}
                                    aria-label={`${ex.name} set ${setNum}`}
                                    onClick={() => handleToggleSet(workout, exIdx, setNum)}
                                    className="w-11 h-11 rounded-full font-bold text-sm tabular-nums transition-colors grid place-items-center"
                                    style={{
                                      backgroundColor: isDone ? 'var(--accent)' : 'transparent',
                                      border: `2px solid ${isDone ? 'var(--accent)' : 'var(--line)'}`,
                                      color: isDone ? 'var(--on-accent)' : 'var(--muted)',
                                    }}
                                  >
                                    {setNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              aria-expanded={showDemo}
                              onClick={() =>
                                setExpandedDemos((prev) => ({ ...prev, [key]: !prev[key] }))
                              }
                              className="min-h-[44px] px-3 rounded-xl text-[13px] font-semibold whitespace-nowrap"
                              style={{ color: 'var(--accent)' }}
                            >
                              {showDemo ? 'Hide demo' : 'Form demo'}
                            </button>
                          </div>

                          {showDemo && (
                            <Suspense
                              fallback={
                                <div className="mt-2 text-xs py-3" style={{ color: 'var(--muted)' }}>
                                  Loading form demo...
                                </div>
                              }
                            >
                              <LazyExerciseDemo demoType={ex.demoType} name={ex.name} />
                            </Suspense>
                          )}
                        </div>
                      );
                    })}

                    <div
                      className="p-4 space-y-3"
                      style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--line)' }}
                    >
                      <div>
                        <div className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>
                          Rest timer (vibrates when finished)
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[30, 60, 90].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => startRestTimer(sec)}
                              className="min-h-[44px] px-4 rounded-xl text-sm font-semibold tabular-nums"
                              style={{
                                backgroundColor: 'var(--surface)',
                                border: '1px solid var(--line)',
                              }}
                            >
                              {sec}s rest
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <button
                          type="button"
                          onClick={() => onAddWorkoutToToday(workout)}
                          className="min-h-[44px] px-4 rounded-xl text-sm font-bold"
                          style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                          }}
                        >
                          Add to Today
                        </button>

                        {doneSets > 0 && (
                          <button
                            type="button"
                            onClick={() => finishWorkout(workout, doneSets)}
                            className="min-h-[44px] px-4 rounded-xl text-sm font-bold"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: 'var(--on-accent)',
                            }}
                          >
                            Finish workout ({doneSets}/{totalSets} sets)
                          </button>
                        )}

                        {doneSets > 0 && (
                          <button
                            type="button"
                            onClick={() => resetWorkoutSets(workout)}
                            className="min-h-[44px] px-3 rounded-xl text-sm font-semibold"
                            style={{ color: 'var(--muted)' }}
                          >
                            Reset sets
                          </button>
                        )}

                        {workout.isCustom && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomWorkout(workout.id)}
                            className="min-h-[44px] px-3 rounded-xl text-sm font-semibold ml-auto"
                            style={{ color: 'var(--danger)' }}
                          >
                            Remove custom workout
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="text-[13px] mt-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
        Safety note: Warm up for 5 minutes before training and stop if you feel sharp pain. Fitness plans are general guidance and not medical advice.
      </p>

      {restLeft > 0 && (
        <div
          className="fixed left-5 z-30 h-14 pl-5 pr-2 rounded-full flex items-center gap-3 shadow-lg tabular-nums"
          style={{
            bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
            backgroundColor: 'var(--ink)',
            color: 'var(--bg)',
          }}
          role="timer"
          aria-live="off"
          aria-label="Rest timer"
        >
          <span className="font-extrabold text-lg">
            {Math.floor(restLeft / 60)}:{pad2(restLeft % 60)}
          </span>
          <button
            type="button"
            onClick={() => setRestLeft((r) => r + 15)}
            className="min-h-[44px] px-2.5 text-xs font-bold opacity-85"
          >
            +15s
          </button>
          <button
            type="button"
            onClick={stopRestTimer}
            className="min-h-[44px] px-3 text-sm font-bold opacity-85"
          >
            Skip
          </button>
        </div>
      )}
    </section>
  );
};

export default FitnessView;
