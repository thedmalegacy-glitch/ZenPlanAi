export type Priority = 'none' | 'medium' | 'high';
export type RepeatFrequency = 'never' | 'daily' | 'weekly';
export type TabView = 'today' | 'upcoming' | 'fitness' | 'done';
export type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type FitnessGoal = 'fat loss' | 'strength' | 'mobility';
export type EquipmentType = 'no equipment' | 'dumbbells' | 'gym';
export type DemoType = 'squat' | 'push' | 'pull' | 'hinge' | 'core' | 'lunge' | 'cardio';

export interface Task {
  id: string;
  title: string;
  due: string | null;
  time?: string;
  priority: Priority;
  tag?: string;
  repeat: RepeatFrequency;
  done: boolean;
  doneAt?: string | null;
  createdAt: string;
}

export interface Exercise {
  name: string;
  sets: number;
  repsOrSec: string;
  cue: string;
  equipment: EquipmentType;
  demoType: DemoType;
  mediaUrl?: string;
}

export interface Workout {
  id: string;
  level: FitnessLevel;
  name: string;
  goal: FitnessGoal;
  durationMin: number;
  equipment: EquipmentType;
  exercises: Exercise[];
  isCustom?: boolean;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  setsCompleted: number;
  durationSec: number;
}

export interface AppSettings {
  theme: 'auto' | 'light' | 'dark';
  weekStart: 'monday' | 'sunday';
  units: 'kg' | 'lb';
  aiEnabled: boolean;
  fitnessLevel: FitnessLevel;
  fitnessGoal: FitnessGoal;
  onboarded: boolean;
  disclaimerAccepted: boolean;
  syncEmail?: string;
  lastSyncedAt?: string;
}

export interface AIQuickAddResult {
  title: string;
  due: string;
  time: string;
  priority: Priority;
  repeat: RepeatFrequency;
  tag: string;
  explanation: string;
}

export interface AIGoalBreakdownResult {
  goalTitle: string;
  summary: string;
  subtasks: Array<{
    title: string;
    due: string;
    priority: Priority;
    tag: string;
  }>;
}

export interface AIDayPlanResult {
  explanation: string;
  schedule: Array<{
    taskId: string;
    title: string;
    timeBlock: string;
    priority: Priority;
    note: string;
  }>;
}

export interface AIWeeklyReviewResult {
  doneSentence: string;
  slippedSentence: string;
  suggestionSentence: string;
  suggestedTaskTitle: string;
}
