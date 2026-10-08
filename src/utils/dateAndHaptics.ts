import {
  AIQuickAddResult,
  AIGoalBreakdownResult,
  AIDayPlanResult,
  AIWeeklyReviewResult,
  FitnessGoal,
  FitnessLevel,
  EquipmentType,
  Priority,
  RepeatFrequency,
  Task,
  Workout,
  WorkoutLog,
} from '../types';
import { BUILTIN_WORKOUTS } from '../data/workouts';

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(isoStr: string, days: number): string {
  const [y, m, d] = isoStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function formatFriendlyDate(isoStr: string | null | undefined, long = false): string {
  if (!isoStr) return 'No date';
  const t = todayISO();
  if (isoStr === t) return 'Today';
  if (isoStr === addDays(t, 1)) return 'Tomorrow';
  if (isoStr === addDays(t, -1)) return 'Yesterday';

  const [y, m, d] = isoStr.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString(
    undefined,
    long
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : { weekday: 'short', day: 'numeric', month: 'short' }
  );
}

export function formatTime12h(time24?: string): string {
  if (!time24 || !time24.includes(':')) return '';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return time24;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return mStr === '00' ? `${h12}${suffix}` : `${h12}:${mStr}${suffix}`;
}

export function haptic(pattern: number | number[] = 10): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

export function computeWorkoutStats(logs: WorkoutLog[], today: string) {
  const weekAgo = addDays(today, -6);
  const workoutsThisWeek = logs.filter((l) => l.date >= weekAgo && l.date <= today).length;

  const uniqueDates = Array.from(new Set(logs.map((l) => l.date))).sort().reverse();
  let streak = 0;
  let cursor = today;

  if (!uniqueDates.includes(today) && uniqueDates.includes(addDays(today, -1))) {
    cursor = addDays(today, -1);
  }

  for (const d of uniqueDates) {
    if (d === cursor) {
      streak++;
      cursor = addDays(cursor, -1);
    } else if (d < cursor) {
      break;
    }
  }

  return { workoutsThisWeek, streak };
}

export function parseNaturalTaskLocal(input: string, today: string): AIQuickAddResult {
  let working = input.trim();
  let due = today;
  let time = '';
  let priority: Priority = 'none';
  let repeat: RepeatFrequency = 'never';
  let tag = '';

  if (/\b(high\s*priority|urgent|important|p1|!!)\b/i.test(working)) {
    priority = 'high';
    working = working.replace(/\b(high\s*priority|urgent|important|p1|!!)\b/gi, '');
  } else if (/\b(medium\s*priority|med\s*priority|normal\s*priority|p2)\b/i.test(working)) {
    priority = 'medium';
    working = working.replace(/\b(medium\s*priority|med\s*priority|normal\s*priority|p2)\b/gi, '');
  }

  if (/\b(every\s*day|daily)\b/i.test(working)) {
    repeat = 'daily';
    working = working.replace(/\b(every\s*day|daily)\b/gi, '');
  } else if (/\b(every\s*week|weekly)\b/i.test(working)) {
    repeat = 'weekly';
    working = working.replace(/\b(every\s*week|weekly)\b/gi, '');
  }

  if (/\btomorrow\b/i.test(working)) {
    due = addDays(today, 1);
    working = working.replace(/\btomorrow\b/gi, '');
  } else if (/\bnext\s*week\b/i.test(working)) {
    due = addDays(today, 7);
    working = working.replace(/\bnext\s*week\b/gi, '');
  } else if (/\btoday\b/i.test(working)) {
    due = today;
    working = working.replace(/\btoday\b/gi, '');
  } else {
    const inDaysMatch = working.match(/\bin\s+(\d+)\s+days?\b/i);
    if (inDaysMatch) {
      due = addDays(today, Math.min(365, Number(inDaysMatch[1]) || 1));
      working = working.replace(inDaysMatch[0], '');
    }
  }

  const timeMatch = working.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (timeMatch) {
    let h = Number(timeMatch[1]);
    const m = timeMatch[2] || '00';
    const mer = timeMatch[3].toLowerCase();
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    time = `${pad2(h)}:${m}`;
    working = working.replace(timeMatch[0], '');
  } else {
    const time24Match = working.match(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (time24Match) {
      time = `${pad2(Number(time24Match[1]))}:${time24Match[2]}`;
      working = working.replace(time24Match[0], '');
    }
  }

  const tagMatch = working.match(/#([a-zA-Z0-9_-]+)/);
  if (tagMatch) {
    tag = tagMatch[1].toLowerCase();
    working = working.replace(tagMatch[0], '');
  } else if (/\b(gym|workout|run|lift|cardio|stretch|walk|yoga)\b/i.test(working)) {
    tag = 'fitness';
  } else if (/\b(exam|study|read|lecture|assignment|homework)\b/i.test(working)) {
    tag = 'study';
  } else if (/\b(buy|groceries|pay|bank|dentist|doctor)\b/i.test(working)) {
    tag = 'errands';
  }

  const cleanTitle = working.replace(/\s+/g, ' ').trim() || input.trim();
  const capitalized = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    title: capitalized,
    due,
    time,
    priority,
    repeat,
    tag,
    explanation: 'Parsed locally from your note.',
  };
}

export function buildLocalGoalBreakdown(goal: string, today: string): AIGoalBreakdownResult {
  const clean = goal.trim() || 'Complete goal';
  const weeksMatch = clean.match(/(\d+)\s*weeks?/i);
  const daysMatch = clean.match(/(\d+)\s*days?/i);
  const totalDays = weeksMatch
    ? Math.max(4, Number(weeksMatch[1]) * 7)
    : daysMatch
    ? Math.max(4, Number(daysMatch[1]))
    : 14;
  const stepGap = Math.max(1, Math.floor(totalDays / 4));

  return {
    goalTitle: clean.charAt(0).toUpperCase() + clean.slice(1),
    summary: `Broken into 4 steady milestones over the next ${totalDays} days.`,
    subtasks: [
      {
        title: `Outline scope and gather materials for: ${clean}`,
        due: today,
        priority: 'high',
        tag: 'study',
      },
      {
        title: `Complete first core block (25% progress) on ${clean}`,
        due: addDays(today, stepGap),
        priority: 'medium',
        tag: 'study',
      },
      {
        title: `Practice and review weak spots (65% progress)`,
        due: addDays(today, stepGap * 2),
        priority: 'medium',
        tag: 'study',
      },
      {
        title: `Final review and readiness check for ${clean}`,
        due: addDays(today, stepGap * 3),
        priority: 'high',
        tag: 'study',
      },
    ],
  };
}

export function buildLocalDayPlan(tasks: Task[]): AIDayPlanResult {
  const priWeight: Record<Priority, number> = { high: 3, medium: 2, none: 1 };
  const sorted = [...tasks].sort((a, b) => priWeight[b.priority] - priWeight[a.priority]);
  let hour = 9;

  return {
    explanation: 'High-priority tasks are scheduled first while focus is highest, with lighter items in the afternoon.',
    schedule: sorted.map((t) => {
      const slot = t.time || `${pad2(hour)}:00`;
      hour = Math.min(20, hour + 2);
      return {
        taskId: t.id,
        title: t.title,
        timeBlock: slot,
        priority: t.priority,
        note:
          t.priority === 'high'
            ? 'Deep focus block'
            : t.tag === 'fitness'
            ? 'Movement & recovery'
            : 'Steady batch task',
      };
    }),
  };
}

export function buildLocalCustomWorkout(
  level: FitnessLevel,
  goal: FitnessGoal,
  minutes: number,
  equipment: EquipmentType
): Workout {
  const pool = BUILTIN_WORKOUTS.filter((w) => w.level === level);
  const base = pool.find((w) => w.equipment === equipment) || pool[0] || BUILTIN_WORKOUTS[0];
  const setMultiplier = minutes >= 40 ? 4 : minutes <= 15 ? 2 : 3;

  return {
    id: `custom-${Date.now()}`,
    level,
    name: `${minutes}-min ${goal} (${equipment})`,
    goal,
    durationMin: minutes,
    equipment,
    isCustom: true,
    exercises: base.exercises.map((ex) => ({
      ...ex,
      sets: setMultiplier,
      equipment,
    })),
  };
}

export function buildLocalWeeklyReview(
  completedTasks: Task[],
  openTasks: Task[],
  workoutsThisWeek: number,
  streakDays: number
): AIWeeklyReviewResult {
  const doneCount = completedTasks.length;
  const openCount = openTasks.length;
  return {
    doneSentence: `You completed ${doneCount} task${doneCount === 1 ? '' : 's'} and logged ${workoutsThisWeek} workout${
      workoutsThisWeek === 1 ? '' : 's'
    } this week${streakDays > 0 ? ` (${streakDays}-day streak)` : ''}.`,
    slippedSentence:
      openCount > 0
        ? `${openCount} open task${openCount === 1 ? ' remains' : 's remain'} on your list, mostly ${
            openTasks[0]?.title ? `"${openTasks[0].title}"` : 'unscheduled items'
          }.`
        : 'Nothing slipped past your schedule this week.',
    suggestionSentence:
      workoutsThisWeek < 2
        ? 'Block 20 minutes tomorrow for a short foundation workout to rebuild momentum.'
        : 'Pick your single highest-priority task each evening so mornings start calm.',
    suggestedTaskTitle:
      workoutsThisWeek < 2
        ? '20-minute full body session'
        : openTasks[0]?.title || 'Plan top 3 priorities for tomorrow',
  };
}
