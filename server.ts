import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

// Production security headers middleware
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 25;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count += 1;
  return true;
}

function sanitizeString(input: unknown, maxLen = 400): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function validateQuickAdd(data: any, today: string) {
  if (!data || typeof data.title !== 'string' || !data.title.trim()) {
    throw new Error('Invalid task title returned from AI.');
  }
  const priorities = ['none', 'medium', 'high'];
  const repeats = ['never', 'daily', 'weekly'];
  return {
    title: sanitizeString(data.title, 140),
    due: typeof data.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.due) ? data.due : today,
    time: typeof data.time === 'string' && /^\d{2}:\d{2}$/.test(data.time) ? data.time : '',
    priority: priorities.includes(data.priority) ? data.priority : 'none',
    repeat: repeats.includes(data.repeat) ? data.repeat : 'never',
    tag: typeof data.tag === 'string' ? sanitizeString(data.tag.toLowerCase(), 24) : '',
    explanation: typeof data.explanation === 'string' ? sanitizeString(data.explanation, 200) : 'Parsed from your note.',
  };
}

function validateGoalBreakdown(data: any, today: string) {
  if (!data || !Array.isArray(data.subtasks) || data.subtasks.length === 0) {
    throw new Error('Invalid goal breakdown returned from AI.');
  }
  const priorities = ['none', 'medium', 'high'];
  return {
    goalTitle: sanitizeString(data.goalTitle || 'Goal plan', 100),
    summary: sanitizeString(data.summary || 'Step-by-step schedule to reach your goal.', 240),
    subtasks: data.subtasks.slice(0, 8).map((item: any) => ({
      title: sanitizeString(item?.title || 'Subtask', 140),
      due: typeof item?.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.due) ? item.due : today,
      priority: priorities.includes(item?.priority) ? item.priority : 'medium',
      tag: typeof item?.tag === 'string' ? sanitizeString(item.tag.toLowerCase(), 24) : 'goal',
    })),
  };
}

function validateDayPlan(data: any) {
  if (!data || !Array.isArray(data.schedule)) {
    throw new Error('Invalid day plan returned from AI.');
  }
  const priorities = ['none', 'medium', 'high'];
  return {
    explanation: sanitizeString(data.explanation || 'Ordered by energy and priority.', 260),
    schedule: data.schedule.slice(0, 15).map((item: any) => ({
      taskId: String(item?.taskId || ''),
      title: sanitizeString(item?.title || 'Task', 140),
      timeBlock: sanitizeString(item?.timeBlock || '09:00', 20),
      priority: priorities.includes(item?.priority) ? item.priority : 'medium',
      note: sanitizeString(item?.note || '', 120),
    })),
  };
}

function validateWorkout(data: any) {
  if (!data || !Array.isArray(data.exercises) || data.exercises.length === 0) {
    throw new Error('Invalid workout returned from AI.');
  }
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const goals = ['fat loss', 'strength', 'mobility'];
  const equips = ['no equipment', 'dumbbells', 'gym'];
  const demos = ['squat', 'push', 'pull', 'hinge', 'core', 'lunge', 'cardio'];

  return {
    name: sanitizeString(data.name || 'Custom session', 80),
    level: levels.includes(data.level) ? data.level : 'Beginner',
    goal: goals.includes(data.goal) ? data.goal : 'strength',
    durationMin: typeof data.durationMin === 'number' ? Math.min(90, Math.max(10, Math.round(data.durationMin))) : 25,
    equipment: equips.includes(data.equipment) ? data.equipment : 'no equipment',
    exercises: data.exercises.slice(0, 7).map((ex: any) => ({
      name: sanitizeString(ex?.name || 'Exercise', 80),
      sets: typeof ex?.sets === 'number' ? Math.min(6, Math.max(1, Math.round(ex.sets))) : 3,
      repsOrSec: sanitizeString(ex?.repsOrSec || '10 reps', 24),
      cue: sanitizeString(ex?.cue || 'Move with steady control and breathe.', 140),
      equipment: equips.includes(ex?.equipment) ? ex.equipment : 'no equipment',
      demoType: demos.includes(ex?.demoType) ? ex.demoType : 'squat',
    })),
  };
}

function validateWeeklyReview(data: any) {
  if (!data || typeof data.doneSentence !== 'string') {
    throw new Error('Invalid weekly review returned from AI.');
  }
  return {
    doneSentence: sanitizeString(data.doneSentence, 220),
    slippedSentence: sanitizeString(data.slippedSentence, 220),
    suggestionSentence: sanitizeString(data.suggestionSentence, 220),
    suggestedTaskTitle: sanitizeString(data.suggestedTaskTitle || 'Plan top 3 priorities for the week', 120),
  };
}

app.post('/api/ai', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.socket.remoteAddress || 'local';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      error: 'Too many AI requests right now. Wait a minute and try again.',
    });
    return;
  }

  const { action, payload } = req.body || {};
  if (!action || typeof action !== 'string') {
    res.status(400).json({
      error: 'Missing AI action type. Choose a valid assistant tool and try again.',
    });
    return;
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    res.status(503).json({
      error: 'AI service key is not configured on the server. Set GEMINI_API_KEY or use the offline smart preview.',
    });
    return;
  }

  const today = sanitizeString(payload?.today, 12) || new Date().toISOString().slice(0, 10);

  try {
    const ai = getGenAIClient();

    if (action === 'quick_add') {
      const text = sanitizeString(payload?.text, 250);
      if (!text) {
        res.status(400).json({ error: 'Enter a task description first.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Current date: ${today}. Parse this natural-language task input into structured fields: "${text}".
Rules:
- Keep title concise and in sentence case (remove date/priority words that were extracted).
- Resolve relative dates like "today", "tomorrow", "next week", or weekday names into YYYY-MM-DD based on ${today}.
- If a time is mentioned (e.g. 6am, 2:30pm), format as 24-hour HH:MM, otherwise empty string "".
- Priority must be one of: "none", "medium", "high".
- Repeat must be one of: "never", "daily", "weekly".
- Tag should be a single lowercase word (e.g. "fitness", "work", "study", "errands", "health") or "".`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              due: { type: Type.STRING },
              time: { type: Type.STRING },
              priority: { type: Type.STRING },
              repeat: { type: Type.STRING },
              tag: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['title', 'due', 'time', 'priority', 'repeat', 'tag', 'explanation'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({ result: validateQuickAdd(parsed, today) });
      return;
    }

    if (action === 'break_down_goal') {
      const goal = sanitizeString(payload?.goal, 300);
      if (!goal) {
        res.status(400).json({ error: 'Describe the goal you want to break down.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Current date: ${today}. Break down this goal into 4 to 6 concrete, calm, dated subtasks: "${goal}".
Rules:
- Use sentence case for all titles.
- Space due dates (YYYY-MM-DD) realistically starting from ${today}.
- Priority must be "none", "medium", or "high".
- Provide a short 1-sentence summary of the plan.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              goalTitle: { type: Type.STRING },
              summary: { type: Type.STRING },
              subtasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    due: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    tag: { type: Type.STRING },
                  },
                  required: ['title', 'due', 'priority', 'tag'],
                },
              },
            },
            required: ['goalTitle', 'summary', 'subtasks'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({ result: validateGoalBreakdown(parsed, today) });
      return;
    }

    if (action === 'plan_day') {
      const rawTasks = Array.isArray(payload?.tasks) ? payload.tasks.slice(0, 15) : [];
      if (rawTasks.length === 0) {
        res.status(400).json({ error: 'Add at least one open task to Today before planning your day.' });
        return;
      }
      const cleanTasks = rawTasks.map((t: any) => ({
        id: String(t.id || ''),
        title: sanitizeString(t.title, 120),
        priority: sanitizeString(t.priority, 16),
        tag: sanitizeString(t.tag, 24),
        time: sanitizeString(t.time, 10),
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Current date: ${today}. Organize today's tasks into a realistic, calm daily schedule with time blocks (24h format like "08:30" or "14:00") and a short explanation (1-2 sentences).
Tasks: ${JSON.stringify(cleanTasks)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              schedule: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    timeBlock: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                  required: ['taskId', 'title', 'timeBlock', 'priority', 'note'],
                },
              },
            },
            required: ['explanation', 'schedule'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({ result: validateDayPlan(parsed) });
      return;
    }

    if (action === 'generate_workout') {
      const level = sanitizeString(payload?.level, 20) || 'Beginner';
      const goal = sanitizeString(payload?.goal, 20) || 'strength';
      const minutes = Number(payload?.minutes) || 25;
      const equipment = sanitizeString(payload?.equipment, 24) || 'no equipment';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Design a safe, effective workout session of 5 to 6 exercises for:
- Level: ${level}
- Goal: ${goal}
- Available time: ${minutes} minutes
- Equipment: ${equipment}
Rules:
- Each exercise must have: name (sentence case), sets (integer 2-5), repsOrSec (e.g. "10 reps" or "30s"), cue (one clear form tip in plain language), equipment ("no equipment", "dumbbells", or "gym"), and demoType (one of: "squat", "push", "pull", "hinge", "core", "lunge", "cardio").`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              level: { type: Type.STRING },
              goal: { type: Type.STRING },
              durationMin: { type: Type.INTEGER },
              equipment: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.INTEGER },
                    repsOrSec: { type: Type.STRING },
                    cue: { type: Type.STRING },
                    equipment: { type: Type.STRING },
                    demoType: { type: Type.STRING },
                  },
                  required: ['name', 'sets', 'repsOrSec', 'cue', 'equipment', 'demoType'],
                },
              },
            },
            required: ['name', 'level', 'goal', 'durationMin', 'equipment', 'exercises'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({ result: validateWorkout(parsed) });
      return;
    }

    if (action === 'weekly_review') {
      const completedCount = Array.isArray(payload?.completedTasks) ? payload.completedTasks.length : 0;
      const completedSample = Array.isArray(payload?.completedTasks)
        ? payload.completedTasks.slice(0, 10).map((t: any) => sanitizeString(t.title, 80))
        : [];
      const openSample = Array.isArray(payload?.openTasks)
        ? payload.openTasks.slice(0, 10).map((t: any) => sanitizeString(t.title, 80))
        : [];
      const workoutsThisWeek = Number(payload?.workoutsThisWeek) || 0;
      const streakDays = Number(payload?.streakDays) || 0;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Write a calm 3-sentence weekly review based on this user activity:
- Completed tasks (${completedCount}): ${JSON.stringify(completedSample)}
- Open/slipped tasks (${openSample.length}): ${JSON.stringify(openSample)}
- Workouts this week: ${workoutsThisWeek} (streak: ${streakDays} days)
Rules:
- doneSentence: 1 plain sentence summarizing what was accomplished.
- slippedSentence: 1 plain sentence noting what slipped or remains open without guilt.
- suggestionSentence: 1 practical suggestion for next week.
- suggestedTaskTitle: A short actionable task title the user can add to Today.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              doneSentence: { type: Type.STRING },
              slippedSentence: { type: Type.STRING },
              suggestionSentence: { type: Type.STRING },
              suggestedTaskTitle: { type: Type.STRING },
            },
            required: ['doneSentence', 'slippedSentence', 'suggestionSentence', 'suggestedTaskTitle'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({ result: validateWeeklyReview(parsed) });
      return;
    }

    res.status(400).json({ error: `Unsupported AI action "${action}".` });
  } catch (err: any) {
    console.error('AI endpoint error:', err?.message || err);
    res.status(502).json({
      error: 'Could not complete the AI request right now. Check your connection or tap Retry.',
    });
  }
});

// ==========================================
// Web Push & Background Closed-App Reminders
// ==========================================

const VAPID_FILE = path.join(__dirname, '.vapid-keys.json');
let vapidKeys: { publicKey: string; privateKey: string };

try {
  if (fs.existsSync(VAPID_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), 'utf-8');
  }
} catch {
  vapidKeys = webpush.generateVAPIDKeys();
}

webpush.setVapidDetails(
  'mailto:notifications@zenplan.app',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

interface PushSubRecord {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface ClientScheduledReminder {
  id: string;
  taskId: string;
  title: string;
  description: string;
  category: string;
  timeLabel: string;
  triggerTimeMs: number;
  leadMinutes: number;
  date: string;
}

interface StoredReminder extends ClientScheduledReminder {
  subscriptionEndpoint: string;
  fired: boolean;
}

const subscriptionsMap = new Map<string, PushSubRecord>();
let scheduledRemindersList: StoredReminder[] = [];

// GET /api/push/vapid-public-key
app.get('/api/push/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// POST /api/push/subscribe
app.post('/api/push/subscribe', (req: Request, res: Response) => {
  const { subscription } = req.body || {};
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    res.status(400).json({ error: 'Invalid push subscription payload.' });
    return;
  }
  subscriptionsMap.set(subscription.endpoint, subscription);
  res.json({ success: true });
});

// POST /api/push/sync-reminders
app.post('/api/push/sync-reminders', (req: Request, res: Response) => {
  const { subscription, reminders } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    res.status(400).json({ error: 'Missing push subscription' });
    return;
  }

  subscriptionsMap.set(subscription.endpoint, subscription);

  // Remove existing unfired reminders for this subscriber
  scheduledRemindersList = scheduledRemindersList.filter(
    (r) => r.subscriptionEndpoint !== subscription.endpoint || r.fired
  );

  if (Array.isArray(reminders)) {
    const now = Date.now();
    for (const item of reminders) {
      if (!item.id || !item.triggerTimeMs || typeof item.triggerTimeMs !== 'number') continue;
      // Skip reminders that are older than 5 minutes in the past
      if (item.triggerTimeMs < now - 5 * 60 * 1000) continue;

      scheduledRemindersList.push({
        id: sanitizeString(item.id, 100),
        taskId: sanitizeString(item.taskId, 60),
        title: sanitizeString(item.title, 120),
        description: sanitizeString(item.description, 300),
        category: sanitizeString(item.category, 30),
        timeLabel: sanitizeString(item.timeLabel, 20),
        triggerTimeMs: item.triggerTimeMs,
        leadMinutes: Number(item.leadMinutes) || 0,
        date: sanitizeString(item.date, 20),
        subscriptionEndpoint: subscription.endpoint,
        fired: false,
      });
    }
  }

  res.json({
    success: true,
    activeRemindersCount: scheduledRemindersList.filter((r) => !r.fired).length,
  });
});

// POST /api/push/test-delayed (Allows testing with closed app / locked phone!)
app.post('/api/push/test-delayed', (req: Request, res: Response) => {
  const { subscription, delaySeconds } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    res.status(400).json({ error: 'Missing push subscription' });
    return;
  }

  subscriptionsMap.set(subscription.endpoint, subscription);
  const delay = Math.max(1, Math.min(60, Number(delaySeconds) || 5));

  setTimeout(async () => {
    try {
      const payload = JSON.stringify({
        title: '🔔 ZenPlan Reminder (App Was Closed)',
        body: 'Success! Task reminders arrive on time even when the app is completely closed or screen is locked.',
        tag: 'zenplan-test-closed',
        data: { taskId: 'test_closed', date: new Date().toISOString().slice(0, 10) },
        actions: [
          { action: 'complete', title: '✓ Got It' },
          { action: 'open', title: 'Open ZenPlan' },
        ],
      });
      await webpush.sendNotification(subscription, payload);
    } catch (err: any) {
      console.warn('Delayed test notification failed:', err?.statusCode || err);
    }
  }, delay * 1000);

  res.json({ success: true, message: `Notification will fire in ${delay} seconds.` });
});

// Background Reminder Loop: Runs every 10 seconds in Node to dispatch notifications to closed apps
setInterval(async () => {
  const now = Date.now();
  const due = scheduledRemindersList.filter((r) => !r.fired && r.triggerTimeMs <= now);
  if (due.length === 0) return;

  for (const reminder of due) {
    reminder.fired = true;
    const sub = subscriptionsMap.get(reminder.subscriptionEndpoint);
    if (!sub) continue;

    const isExact = reminder.leadMinutes === 0;
    const title = isExact
      ? `Starting Now: ${reminder.title}`
      : `Upcoming in ${reminder.leadMinutes}m: ${reminder.title}`;

    const parts = [];
    if (reminder.description) parts.push(reminder.description);
    parts.push(isExact ? `Scheduled for now (${reminder.timeLabel})` : `Starts at ${reminder.timeLabel}`);
    if (reminder.category) parts.push(reminder.category.toUpperCase());

    const payload = JSON.stringify({
      title,
      body: parts.join(' • '),
      tag: `zenplan-${reminder.taskId}-${isExact ? 'now' : 'lead'}`,
      data: {
        taskId: reminder.taskId,
        date: reminder.date,
      },
      actions: [
        { action: 'complete', title: '✓ Mark Complete' },
        { action: 'open', title: 'Open App' },
      ],
    });

    try {
      await webpush.sendNotification(sub as any, payload);
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        subscriptionsMap.delete(reminder.subscriptionEndpoint);
      }
    }
  }

  // Prune fired reminders older than 2 hours
  scheduledRemindersList = scheduledRemindersList.filter(
    (r) => !r.fired || now - r.triggerTimeMs < 2 * 60 * 60 * 1000
  );
}, 10_000);

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ZenPlan AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
