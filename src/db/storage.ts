import { AppSettings, Task, Workout, WorkoutLog } from '../types';
import { BUILTIN_WORKOUTS, createStarterTasks } from '../data/workouts';
import { addDays, todayISO } from '../utils/dateAndHaptics';

const DB_NAME = 'zenplan_ai_db';
const DB_VERSION = 1;

const LS_TASKS = 'zenplan.tasks.v1';
const LS_CUSTOM_WORKOUTS = 'zenplan.workouts.v1';
const LS_LOGS = 'zenplan.logs.v1';
const LS_SETTINGS = 'zenplan.settings.v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  weekStart: 'monday',
  units: 'kg',
  aiEnabled: true,
  fitnessLevel: 'Beginner',
  fitnessGoal: 'strength',
  onboarded: false,
  disclaimerAccepted: false,
};

function openIDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openIDB();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('kv', 'readonly');
      const store = tx.objectStore('kv');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbClearAll(): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function loadInitialSyncState(): {
  tasks: Task[];
  customWorkouts: Workout[];
  logs: WorkoutLog[];
  settings: AppSettings;
} {
  const today = todayISO();
  let tasks: Task[] = [];
  let customWorkouts: Workout[] = [];
  let logs: WorkoutLog[] = [];
  let settings: AppSettings = { ...DEFAULT_SETTINGS };

  try {
    const rawTasks = localStorage.getItem(LS_TASKS);
    tasks = rawTasks ? JSON.parse(rawTasks) : createStarterTasks(today, addDays);
  } catch {
    tasks = createStarterTasks(today, addDays);
  }

  try {
    const rawW = localStorage.getItem(LS_CUSTOM_WORKOUTS);
    customWorkouts = rawW ? JSON.parse(rawW) : [];
  } catch {
    customWorkouts = [];
  }

  try {
    const rawLogs = localStorage.getItem(LS_LOGS);
    logs = rawLogs ? JSON.parse(rawLogs) : [];
  } catch {
    logs = [];
  }

  try {
    const rawSet = localStorage.getItem(LS_SETTINGS);
    if (rawSet) {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(rawSet) };
    }
  } catch {
    settings = { ...DEFAULT_SETTINGS };
  }

  return { tasks, customWorkouts, logs, settings };
}

export async function hydrateFromIndexedDB(): Promise<{
  tasks?: Task[];
  customWorkouts?: Workout[];
  logs?: WorkoutLog[];
  settings?: AppSettings;
}> {
  const [tasks, customWorkouts, logs, settings] = await Promise.all([
    idbGet<Task[]>(LS_TASKS),
    idbGet<Workout[]>(LS_CUSTOM_WORKOUTS),
    idbGet<WorkoutLog[]>(LS_LOGS),
    idbGet<AppSettings>(LS_SETTINGS),
  ]);
  return { tasks, customWorkouts, logs, settings };
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(LS_TASKS, JSON.stringify(tasks));
  } catch {}
  void idbSet(LS_TASKS, tasks);
}

export function saveCustomWorkouts(workouts: Workout[]): void {
  try {
    localStorage.setItem(LS_CUSTOM_WORKOUTS, JSON.stringify(workouts));
  } catch {}
  void idbSet(LS_CUSTOM_WORKOUTS, workouts);
}

export function saveWorkoutLogs(logs: WorkoutLog[]): void {
  try {
    localStorage.setItem(LS_LOGS, JSON.stringify(logs));
  } catch {}
  void idbSet(LS_LOGS, logs);
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  } catch {}
  void idbSet(LS_SETTINGS, settings);
}

export async function clearAllStorage(): Promise<void> {
  try {
    localStorage.removeItem(LS_TASKS);
    localStorage.removeItem(LS_CUSTOM_WORKOUTS);
    localStorage.removeItem(LS_LOGS);
    localStorage.removeItem(LS_SETTINGS);
  } catch {}
  await idbClearAll();
}

export function exportAllDataJSON(
  tasks: Task[],
  customWorkouts: Workout[],
  logs: WorkoutLog[],
  settings: AppSettings
): string {
  return JSON.stringify(
    {
      app: 'ZenPlan AI',
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      workouts: [...BUILTIN_WORKOUTS, ...customWorkouts],
      customWorkouts,
      workoutLogs: logs,
      settings,
    },
    null,
    2
  );
}
