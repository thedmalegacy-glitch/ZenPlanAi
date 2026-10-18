// Voice Task Parser for ZenPlan AI
// Converts spoken natural language phrases into structured Task objects (title, date, time, duration, category)

import { Task, TaskCategory, TaskPriority } from '../types';
import { addDays, getTodayDateString, parseNaturalTime } from './time';

export interface ParsedVoiceTask {
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  durationMinutes: number;
  category: TaskCategory;
  priority: TaskPriority;
  rawSpeech: string;
  hasExplicitTime: boolean;
  hasExplicitDate: boolean;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Calculates next date for a given weekday name (e.g., 'friday')
 */
function getNextWeekdayDate(dayName: string, refDateStr: string): string {
  const parts = refDateStr.split('-');
  const ref = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const targetDay = DAY_NAMES.indexOf(dayName.toLowerCase());
  if (targetDay === -1) return refDateStr;

  const currentDay = ref.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;
  if (daysUntil === 0) daysUntil = 7; // if today is Friday and user says "on Friday", target next Friday

  return addDays(refDateStr, daysUntil);
}

/**
 * Parse spoken natural language into a structured Task
 */
export function parseVoiceInputToTask(speech: string, defaultDate?: string): ParsedVoiceTask {
  const rawSpeech = speech.trim();
  let text = rawSpeech;
  const todayStr = getTodayDateString();
  let date = defaultDate || todayStr;
  let startTime: string | undefined = undefined;
  let durationMinutes = 30;
  let hasExplicitTime = false;
  let hasExplicitDate = false;

  // 1. Check relative offset times: "in 15 minutes", "in 30 mins", "in 1 hour", "in 2 hours"
  const inMinutesMatch = text.match(/\bin\s+(\d+)\s*(?:minutes|minute|mins|min)\b/i);
  const inHoursMatch = text.match(/\bin\s+(\d+)\s*(?:hours|hour|hrs|hr)\b/i);

  if (inMinutesMatch || inHoursMatch) {
    const minsToAdd = inMinutesMatch
      ? parseInt(inMinutesMatch[1], 10)
      : parseInt(inHoursMatch![1], 10) * 60;

    const now = new Date();
    now.setMinutes(now.getMinutes() + minsToAdd);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    startTime = `${h}:${m}`;
    hasExplicitTime = true;

    // Remove the "in X minutes" from text
    text = text.replace(inMinutesMatch ? inMinutesMatch[0] : inHoursMatch![0], ' ');
  }

  // 2. Check duration: "for 45 minutes", "for 1 hour", "for 30 mins"
  const durMatch = text.match(/\bfor\s+(\d+)\s*(minutes|minute|mins|min|hours|hour|hrs|hr)\b/i);
  if (durMatch) {
    const num = parseInt(durMatch[1], 10);
    const unit = durMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      durationMinutes = num * 60;
    } else {
      durationMinutes = num;
    }
    text = text.replace(durMatch[0], ' ');
  }

  // 3. Check dates: "day after tomorrow", "tomorrow", "tonight", "today"
  if (/\b(?:day after tomorrow)\b/i.test(text)) {
    date = addDays(todayStr, 2);
    hasExplicitDate = true;
    text = text.replace(/\b(?:the\s+)?day after tomorrow\b/gi, ' ');
  } else if (/\btomorrow\b/i.test(text)) {
    date = addDays(todayStr, 1);
    hasExplicitDate = true;
    text = text.replace(/\btomorrow\b/gi, ' ');
  } else if (/\btonight\b/i.test(text)) {
    date = todayStr;
    hasExplicitDate = true;
    if (!startTime) {
      startTime = '20:00'; // Default tonight to 8:00 PM if no time given
      hasExplicitTime = true;
    }
    text = text.replace(/\btonight\b/gi, ' ');
  } else if (/\btoday\b/i.test(text)) {
    date = todayStr;
    hasExplicitDate = true;
    text = text.replace(/\btoday\b/gi, ' ');
  }

  // Check weekday names: "on monday", "next tuesday", "this friday"
  const weekdayMatch = text.match(/\b(?:on|next|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (weekdayMatch && !hasExplicitDate) {
    const targetWeekday = weekdayMatch[1].toLowerCase();
    date = getNextWeekdayDate(targetWeekday, todayStr);
    hasExplicitDate = true;
    text = text.replace(weekdayMatch[0], ' ');
  }

  // 4. Check explicit time of day:
  // e.g. "at 10:30 am", "at 9 am", "at 2pm", "at 14:00", "at 4 o'clock", "at noon", "at midnight"
  if (!startTime) {
    if (/\bat\s+noon\b/i.test(text)) {
      startTime = '12:00';
      hasExplicitTime = true;
      text = text.replace(/\bat\s+noon\b/gi, ' ');
    } else if (/\bat\s+midnight\b/i.test(text)) {
      startTime = '00:00';
      hasExplicitTime = true;
      text = text.replace(/\bat\s+midnight\b/gi, ' ');
    } else {
      // Check "at 9:30 am", "at 2 pm", "at 10 am", "at 5"
      const atTimeMatch = text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?|\d{1,2}(?::\d{2})|\d{1,2}\s*(?:o'clock)?)\b/i);
      if (atTimeMatch) {
        let rawTime = atTimeMatch[1].replace(/o'clock/i, '').trim();
        rawTime = rawTime.replace(/\./g, '');
        const parsed = parseNaturalTime(rawTime);
        if (parsed) {
          startTime = parsed;
          hasExplicitTime = true;
          text = text.replace(atTimeMatch[0], ' ');
        }
      }
    }
  }

  // Secondary check for time without "at", e.g. "meeting 10am", "dentist 3:30 pm"
  if (!startTime) {
    const looseTimeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (looseTimeMatch) {
      const parsed = parseNaturalTime(looseTimeMatch[1]);
      if (parsed) {
        startTime = parsed;
        hasExplicitTime = true;
        text = text.replace(looseTimeMatch[0], ' ');
      }
    }
  }

  // Check general daytime words if no exact time found:
  // "in the morning" -> 09:00, "in the afternoon" -> 14:00, "in the evening" -> 18:00
  if (!startTime) {
    if (/\b(?:in\s+the\s+)?morning\b/i.test(text)) {
      startTime = '09:00';
      hasExplicitTime = true;
      text = text.replace(/\b(?:in\s+the\s+)?morning\b/gi, ' ');
    } else if (/\b(?:in\s+the\s+)?afternoon\b/i.test(text)) {
      startTime = '14:00';
      hasExplicitTime = true;
      text = text.replace(/\b(?:in\s+the\s+)?afternoon\b/gi, ' ');
    } else if (/\b(?:in\s+the\s+)?evening\b/i.test(text)) {
      startTime = '18:00';
      hasExplicitTime = true;
      text = text.replace(/\b(?:in\s+the\s+)?evening\b/gi, ' ');
    }
  }

  // 5. Category deduction from keywords
  const lowerSpeech = rawSpeech.toLowerCase();
  let category: TaskCategory = 'work';

  if (/\b(workout|gym|run|running|exercise|cardio|pushups|squat|dumbbells|stretch|yoga|fitness|walk|jog)\b/.test(lowerSpeech)) {
    category = 'fitness';
  } else if (/\b(meeting|call|sync|standup|zoom|catchup|interview|discussion|conference)\b/.test(lowerSpeech)) {
    category = 'meeting';
  } else if (/\b(groceries|grocery|buy|doctor|dentist|dinner|lunch|breakfast|family|mom|dad|clean|laundry|haircut|movie|read|book|personal)\b/.test(lowerSpeech)) {
    category = 'personal';
  } else if (/\b(bill|tax|admin|pay|invoice|renew|paperwork)\b/.test(lowerSpeech)) {
    category = 'other';
  } else {
    category = 'work';
  }

  // 6. Priority deduction
  let priority: TaskPriority = 'medium';
  if (/\b(urgent|asap|important|critical|high priority)\b/i.test(lowerSpeech)) {
    priority = 'high';
  } else if (/\b(low priority|whenever|optional|low)\b/i.test(lowerSpeech)) {
    priority = 'low';
  }

  // 7. Clean up the title
  let cleanTitle = text
    .replace(/\b(?:add|create|schedule|set|remind\s+me\s+to|task|a\s+task|to\s+do)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If cleaning wiped out the entire title, fall back to a reasonable sentence
  if (!cleanTitle || cleanTitle.length < 2) {
    cleanTitle = rawSpeech
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Clean trailing punctuation or prepositions (e.g. "team meeting at", "call mom on")
  cleanTitle = cleanTitle.replace(/\b(at|on|for|in|by)$/i, '').trim();

  // Capitalize first letter
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    title: cleanTitle,
    date,
    startTime,
    durationMinutes,
    category,
    priority,
    rawSpeech,
    hasExplicitTime,
    hasExplicitDate,
  };
}
