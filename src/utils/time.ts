// Time parsing helper for Daylight Orbit
// Parses natural typed inputs:
// "9", "9am", "9:30", "09:30", "2pm", "14:15", "1430", "14.30", "2:30 pm" -> "HH:mm"

export function parseNaturalTime(input: string): string | null {
  if (!input) return null;
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // Check 12-hour am/pm format e.g. "9:30am", "9am", "9:30 pm", "2.15 pm", "12pm"
  const ampmMatch = raw.match(/^(\d{1,2})(?::|\.|\s*)?(\d{2})?\s*(am|pm|a|p)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPm = ampmMatch[3].startsWith('p');

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (isPm && hours !== 12) hours += 12;
    if (!isPm && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Check 24-hour format with separator "09:30", "14:15", "14.30"
  const sepMatch = raw.match(/^(\d{1,2})[:.](\d{2})$/);
  if (sepMatch) {
    const hours = parseInt(sepMatch[1], 10);
    const minutes = parseInt(sepMatch[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return null;
  }

  // Check 4-digit military "1430", "0900"
  const milMatch = raw.match(/^(\d{2})(\d{2})$/);
  if (milMatch) {
    const hours = parseInt(milMatch[1], 10);
    const minutes = parseInt(milMatch[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return null;
  }

  // Check plain number "9", "14", "8" -> assume top of the hour
  const plainMatch = raw.match(/^(\d{1,2})$/);
  if (plainMatch) {
    let hours = parseInt(plainMatch[1], 10);
    // If between 1 and 6, could be afternoon (e.g. 2 -> 14:00, or leave as typed if standard business)
    // To be predictable, 1-6 without am/pm: standard 24h, or 7-23 as is
    if (hours >= 0 && hours <= 23) {
      // If user types 1..6, usually means afternoon 13..18 in daytime context, but let's follow standard if user typed 9 -> 09:00
      if (hours >= 1 && hours <= 6) {
        hours += 12; // e.g. 2 -> 14:00
      }
      return `${String(hours).padStart(2, '0')}:00`;
    }
  }

  return null;
}

export function formatTimeDisplay(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getMinutesSinceMidnight(timeStr?: string): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map((s) => parseInt(s, 10));
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sorts tasks so that:
 * 1. Incomplete/pending tasks come first.
 * 2. Within pending tasks, sort chronologically by scheduled startTime (e.g. 09:00, 10:00, 13:00 / 1 PM).
 *    Tasks without time follow after timed tasks, ordered by creation.
 * 3. Completed tasks are pushed to the bottom, sorted chronologically or by completedAt.
 */
export function sortTasksChronologically<T extends { completed: boolean; startTime?: string; createdAt?: number; completedAt?: number }>(
  tasks: T[]
): T[] {
  return [...tasks].sort((a, b) => {
    // Rule 1: Pending tasks first, completed tasks at the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Rule 2: Chronological ordering by startTime (9am -> 10am -> 1pm etc.)
    const aTime = getMinutesSinceMidnight(a.startTime);
    const bTime = getMinutesSinceMidnight(b.startTime);

    if (aTime !== null && bTime !== null) {
      if (aTime !== bTime) {
        return aTime - bTime;
      }
    } else if (aTime !== null) {
      return -1; // Timed tasks come before untimed tasks
    } else if (bTime !== null) {
      return 1;
    }

    // Tie-breaker: creation time ascending (earlier created first)
    const aCreated = a.createdAt || 0;
    const bCreated = b.createdAt || 0;
    return aCreated - bCreated;
  });
}
