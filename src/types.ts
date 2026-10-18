export type TaskCategory = 'work' | 'meeting' | 'fitness' | 'personal' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (24h)
  durationMinutes: number; // e.g., 30, 45, 60
  category: TaskCategory;
  priority: TaskPriority;
  completed: boolean;
  recurrence?: RecurrenceType;
  reminderLeadMinutes?: number; // Minutes before startTime to notify (e.g. 0, 5, 10, 15)
  steps: SubTask[];
  createdAt: number;
  completedAt?: number;
}

export interface DailyThought {
  quote: string;
  author: string;
  category: string;
  tip: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'mobility' | 'core';
  targetMuscle: string;
  defaultDurationMin: number;
  equipment?: 'dumbbells' | 'bodyweight' | 'none';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips: string;
  muscleGroup?: 'chest' | 'back' | 'legs' | 'gluteus' | 'deltoids' | 'arms' | 'abs' | 'cardio';
  reps?: number;
  sets?: number;
  weightKg?: number;
  restSec?: number;
  completedSets?: number;
}

export type NoteCategory = 'reflection' | 'idea' | 'meeting' | 'journal' | 'general';

export interface Note {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  category?: NoteCategory;
  createdAt: number;
  updatedAt: number;
}

export interface TaskNotificationPayload {
  taskId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  startTime?: string;
  leadMinutes?: number;
  type: 'lead' | 'now' | 'test';
}

