import React, { useState } from 'react';
import { Task } from '../types';
import { DayArc } from './DayArc';
import { ZenPlanLogo } from './ZenPlanLogo';
import {
  addDays,
  formatDateLabel,
  formatTimeDisplay,
  getMinutesSinceMidnight,
  sortTasksChronologically,
  getTodayDateString,
} from '../utils/time';

interface UpcomingTimelineProps {
  tasks: Task[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveToNextDay: (id: string) => void;
  onAddTaskAtTime: (date: string, startTime: string) => void;
  onRebalanceDay: (date: string) => void;
}

export const UpcomingTimeline: React.FC<UpcomingTimelineProps> = ({
  tasks,
  selectedDate,
  onSelectDate,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onMoveToNextDay,
  onAddTaskAtTime,
  onRebalanceDay,
}) => {
  const todayStr = getTodayDateString();
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'timeline' | 'allDates'>('timeline');
  const [isDatesModalOpen, setIsDatesModalOpen] = useState(false);

  // Compute days for strip based on weekOffset
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  // Find Monday of this week
  const dayOfWeek = baseDate.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(baseDate);
  monday.setDate(monday.getDate() - distanceToMonday);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayInitial = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i];
    const dayNum = d.getDate();
    return { dateStr, dayInitial, dayNum, d };
  });

  // Calculate Month & Year label for the week
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const firstWeekDay = weekDays[0].d;
  const lastWeekDay = weekDays[6].d;
  const monthLabel =
    firstWeekDay.getMonth() === lastWeekDay.getMonth()
      ? `${monthNames[firstWeekDay.getMonth()]} ${firstWeekDay.getFullYear()}`
      : `${monthNames[firstWeekDay.getMonth()].substring(0, 3)} - ${monthNames[lastWeekDay.getMonth()].substring(0, 3)} ${lastWeekDay.getFullYear()}`;

  // Quick upcoming date shortcuts
  const tomorrowStr = addDays(todayStr, 1);
  const in2DaysStr = addDays(todayStr, 2);
  const in3DaysStr = addDays(todayStr, 3);
  const in4DaysStr = addDays(todayStr, 4);
  const nextWeekStr = addDays(todayStr, 7);
  const in2WeeksStr = addDays(todayStr, 14);

  // Synchronize weekOffset when selecting any arbitrary date
  const handleSelectDate = (dateStr: string) => {
    onSelectDate(dateStr);
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
        const now = new Date();
        now.setHours(12, 0, 0, 0);

        const currentDayOfWk = (now.getDay() + 6) % 7;
        const currentMon = new Date(now);
        currentMon.setDate(currentMon.getDate() - currentDayOfWk);

        const targetDayOfWk = (target.getDay() + 6) % 7;
        const targetMon = new Date(target);
        targetMon.setDate(targetMon.getDate() - targetDayOfWk);

        const diffTime = targetMon.getTime() - currentMon.getTime();
        const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
        setWeekOffset(diffWeeks);
      }
    } catch {
      // fallback
    }
  };

  // Find future dates that have tasks scheduled ahead
  const upcomingTaskDates = Array.from(
    new Set(
      tasks
        .filter((t) => t.date > todayStr)
        .map((t) => t.date)
        .sort()
    )
  );

  // Generate upcoming 14 days list for the "All Upcoming Dates" view
  const upcoming14Days = Array.from({ length: 14 }).map((_, i) => {
    const dStr = addDays(todayStr, i + 1);
    const dayTasksForDate = tasks.filter((t) => t.date === dStr);
    return {
      dateStr: dStr,
      offset: i + 1,
      tasks: sortTasksChronologically(dayTasksForDate),
    };
  });

  // Filter tasks for selected date (pending first chronologically by time, completed at bottom)
  const rawDayTasks = tasks.filter((t) => t.date === selectedDate);
  const dayTasks = sortTasksChronologically(rawDayTasks);

  const remainingCount = dayTasks.filter((t) => !t.completed).length;

  // Total planned minutes
  const totalMinutesPlanned = dayTasks.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
  const hoursPlanned = Math.floor(totalMinutesPlanned / 60);
  const minsPlanned = totalMinutesPlanned % 60;

  // Day workload classification
  const workloadLabel =
    totalMinutesPlanned < 240
      ? 'light day'
      : totalMinutesPlanned <= 360
      ? 'balanced day'
      : 'full day';

  // Identify next upcoming task (reusing todayStr from line 36)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = selectedDate === todayStr;

  let nextTask: Task | null = null;
  let minutesUntilNext: number | null = null;

  if (isToday) {
    for (const t of dayTasks) {
      if (!t.completed && t.startTime) {
        const startM = getMinutesSinceMidnight(t.startTime);
        if (startM !== null && startM >= currentMinutes) {
          nextTask = t;
          minutesUntilNext = startM - currentMinutes;
          break;
        }
      }
    }
  }

  // Find free slots (45 minutes or more) between 08:00 (480) and 20:00 (1200)
  interface FreeSlot {
    startMinutes: number;
    endMinutes: number;
    durationMinutes: number;
    startTimeStr: string;
  }

  const freeSlots: FreeSlot[] = [];
  const scheduled = dayTasks
    .filter((t) => !!t.startTime)
    .map((t) => ({
      start: getMinutesSinceMidnight(t.startTime)!,
      end: getMinutesSinceMidnight(t.startTime)! + (t.durationMinutes || 30),
      task: t,
    }))
    .sort((a, b) => a.start - b.start);

  let cursor = 480; // 08:00
  scheduled.forEach((s) => {
    if (s.start > cursor + 45) {
      const duration = s.start - cursor;
      const sh = Math.floor(cursor / 60);
      const sm = cursor % 60;
      freeSlots.push({
        startMinutes: cursor,
        endMinutes: s.start,
        durationMinutes: duration,
        startTimeStr: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
      });
    }
    cursor = Math.max(cursor, s.end);
  });

  if (1200 > cursor + 45) {
    const duration = 1200 - cursor;
    const sh = Math.floor(cursor / 60);
    const sm = cursor % 60;
    freeSlots.push({
      startMinutes: cursor,
      endMinutes: 1200,
      durationMinutes: duration,
      startTimeStr: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
    });
  }

  return (
    <div className="w-full max-w-full space-y-4 pb-36 overflow-x-hidden">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ZenPlanLogo size={38} />
          <div>
            <h1 className="font-heading text-[26px] sm:text-[28px] font-bold text-[#17212B] leading-tight">
              Upcoming
            </h1>
            <p className="font-body text-[13px] text-[#55636F] mt-0.5">
              {formatDateLabel(selectedDate)} •{' '}
              <span className="font-semibold text-[#17212B]">
                {remainingCount} tasks left
              </span>{' '}
              ({hoursPlanned}h {minsPlanned}m)
            </p>
          </div>
        </div>

        {/* View Mode Switcher: Timeline vs All Upcoming Dates */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#DDE5EA] rounded-full self-start shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`min-h-[34px] px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-[#17212B] text-white shadow-xs'
                : 'text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6]'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('allDates')}
            className={`min-h-[34px] px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'allDates'
                ? 'bg-[#17212B] text-white shadow-xs'
                : 'text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6]'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
            <span>Upcoming Dates</span>
            {upcomingTaskDates.length > 0 && (
              <span className={`w-2 h-2 rounded-full ${viewMode === 'allDates' ? 'bg-[#F2A33A]' : 'bg-[#2F3E8F]'}`} />
            )}
          </button>
        </div>
      </div>

      {/* Week Navigator Card - Fully Mobile Optimized, Zero Overflow */}
      <div className="w-full max-w-full bg-white border border-[#DDE5EA] rounded-[22px] p-3 sm:p-3.5 space-y-3 shadow-xs box-border overflow-hidden">
        {/* Top Controls: Month & Year + Week Arrows + Browse All Dates */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-heading font-bold text-[14px] sm:text-[15px] text-[#17212B] truncate">
              {monthLabel}
            </span>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => handleSelectDate(todayStr)}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E3E8F6] text-[#2F3E8F] hover:bg-[#D5DFE6] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                Today
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Prev Week Button */}
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w - 1)}
              aria-label="Previous week"
              title="Previous week"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Next Week Button */}
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              aria-label="Next week"
              title="Next week"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Browse Upcoming Dates Modal Button */}
            <button
              type="button"
              onClick={() => setIsDatesModalOpen(true)}
              className="min-h-[30px] px-2.5 py-1 rounded-full border border-[#DDE5EA] bg-[#EEF3F6] hover:bg-[#DDE5EA] text-[11px] font-semibold text-[#17212B] flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs whitespace-nowrap"
              title="See all upcoming dates"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#2F3E8F]">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span>Upcoming Dates ▾</span>
            </button>
          </div>
        </div>

        {/* 7-Days Grid: Exactly 7 equal columns spanning full card width without horizontal overflow */}
        <div className="grid grid-cols-7 gap-1 w-full box-border">
          {weekDays.map((wd) => {
            const isSelected = wd.dateStr === selectedDate;
            const hasTasks = tasks.some((t) => t.date === wd.dateStr);
            const isCurrentToday = wd.dateStr === todayStr;

            return (
              <button
                key={wd.dateStr}
                type="button"
                onClick={() => handleSelectDate(wd.dateStr)}
                aria-label={`Select ${wd.dateStr}`}
                className={`w-full min-h-[46px] py-1.5 rounded-[12px] sm:rounded-[14px] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer select-none relative box-border ${
                  isSelected
                    ? 'bg-[#17212B] text-white font-bold shadow-xs'
                    : isCurrentToday
                    ? 'bg-[#E3E8F6] text-[#2F3E8F] font-bold hover:bg-[#D5DFE6]'
                    : 'text-[#17212B] hover:bg-[#EEF3F6]'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase leading-tight ${
                  isSelected ? 'text-white/80' : isCurrentToday ? 'text-[#2F3E8F]' : 'text-[#55636F]'
                }`}>
                  {wd.dayInitial}
                </span>
                <span className="text-[13px] font-heading mt-0.5 leading-none">
                  {wd.dayNum}
                </span>
                {/* Amber dot indicator if day has tasks */}
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    hasTasks ? (isSelected ? 'bg-white' : 'bg-[#F2A33A]') : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Quick Upcoming Dates Chips */}
        <div className="pt-2 border-t border-[#EEF3F6] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-[#55636F] mr-0.5 whitespace-nowrap">
            Upcoming:
          </span>
          <button
            type="button"
            onClick={() => handleSelectDate(todayStr)}
            className={`min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-[#17212B] text-white'
                : 'bg-[#EEF3F6] text-[#55636F] hover:text-[#17212B]'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleSelectDate(tomorrowStr)}
            className={`min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedDate === tomorrowStr
                ? 'bg-[#17212B] text-white'
                : 'bg-[#EEF3F6] text-[#55636F] hover:text-[#17212B]'
            }`}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => handleSelectDate(in2DaysStr)}
            className={`min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedDate === in2DaysStr
                ? 'bg-[#17212B] text-white'
                : 'bg-[#EEF3F6] text-[#55636F] hover:text-[#17212B]'
            }`}
          >
            +2 Days
          </button>
          <button
            type="button"
            onClick={() => handleSelectDate(in3DaysStr)}
            className={`min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedDate === in3DaysStr
                ? 'bg-[#17212B] text-white'
                : 'bg-[#EEF3F6] text-[#55636F] hover:text-[#17212B]'
            }`}
          >
            +3 Days
          </button>
          <button
            type="button"
            onClick={() => handleSelectDate(nextWeekStr)}
            className={`min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedDate === nextWeekStr
                ? 'bg-[#17212B] text-white'
                : 'bg-[#EEF3F6] text-[#55636F] hover:text-[#17212B]'
            }`}
          >
            Next Week
          </button>
        </div>

        {/* Future Dates With Scheduled Tasks */}
        {upcomingTaskDates.length > 0 && (
          <div className="pt-2 border-t border-[#EEF3F6] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-[#2F3E8F] flex items-center gap-1 mr-0.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F2A33A]" />
              Scheduled:
            </span>
            {upcomingTaskDates.map((dStr) => {
              const count = tasks.filter((t) => t.date === dStr).length;
              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => handleSelectDate(dStr)}
                  className={`min-h-[28px] px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    selectedDate === dStr
                      ? 'bg-[#2F3E8F] text-white'
                      : 'bg-[#E3E8F6] text-[#2F3E8F] hover:bg-[#D5DFE6]'
                  }`}
                >
                  <span>{formatDateLabel(dStr)}</span>
                  <span className={`text-[10px] px-1 rounded-full ${selectedDate === dStr ? 'bg-white/20' : 'bg-[#2F3E8F]/15'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODE 1: DAYLIGHT TIMELINE & HOURLY SLOTS                */}
      {/* ======================================================== */}
      {viewMode === 'timeline' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Day Arc Card */}
          <div className="bg-white border border-[#DDE5EA] rounded-[20px] p-4 flex flex-col items-center shadow-2xs">
            <DayArc
              tasks={dayTasks}
              selectedDate={selectedDate}
              size="large"
              showSun={isToday}
              centerPrimary={
                isToday && minutesUntilNext !== null
                  ? `In ${minutesUntilNext} min`
                  : `${dayTasks.length} tasks`
              }
              centerSecondary={
                isToday && nextTask
                  ? nextTask.title
                  : 'planned daylight'
              }
            />
          </div>

          {/* Timeline List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-heading text-[17px] font-bold text-[#17212B]">
                Day Schedule ({formatDateLabel(selectedDate)})
              </h2>
              <button
                type="button"
                onClick={() => onAddTaskAtTime(selectedDate, '09:00')}
                className="text-xs font-bold text-[#2F3E8F] hover:underline cursor-pointer"
              >
                + Add Task
              </button>
            </div>

            {dayTasks.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#DDE5EA] rounded-[18px]">
                <p className="text-sm text-[#55636F]">No scheduled tasks for this date.</p>
                <button
                  type="button"
                  onClick={() => onAddTaskAtTime(selectedDate, '09:00')}
                  className="mt-3 min-h-[44px] px-5 rounded-full bg-[#17212B] text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                >
                  Add Task for 09:00 AM
                </button>
              </div>
            ) : (
              dayTasks.map((t) => {
                const isTargetNext = nextTask?.id === t.id;
                return (
                  <div
                    key={t.id}
                    className={`w-full max-w-full rounded-[18px] p-3.5 sm:p-4 border transition-all box-border overflow-hidden ${
                      isTargetNext
                        ? 'bg-[#17212B] text-white border-[#17212B] shadow-sm'
                        : t.completed
                        ? 'bg-[#FAFCFD] opacity-60 border-[#DDE5EA]'
                        : 'bg-white border-[#DDE5EA] hover:border-[#C9D4DC]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      {/* Checkbox (Consistent placement on the left with min 44px tap area) */}
                      <button
                        type="button"
                        onClick={() => onToggleComplete(t.id)}
                        aria-label={t.completed ? 'Mark incomplete' : 'Mark complete'}
                        className={`min-w-[40px] min-h-[40px] -ml-1 -mt-1 flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-all flex-shrink-0 ${
                          isTargetNext ? 'text-white hover:bg-white/10' : 'text-[#17212B] hover:bg-[#EEF3F6]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            t.completed
                              ? 'bg-[#F2A33A] border-[#F2A33A] text-[#17212B]'
                              : isTargetNext
                              ? 'border-white/50'
                              : 'border-[#9AA9B5]'
                          }`}
                        >
                          {t.completed && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>

                      {/* Content (Title & Meta) */}
                      <div className="flex-1 min-w-0 pr-1" onClick={() => onEditTask(t)}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            className={`font-body font-semibold text-[14px] sm:text-[15px] leading-snug break-words cursor-pointer ${
                              t.completed ? 'line-through text-[#55636F]' : isTargetNext ? 'text-white' : 'text-[#17212B]'
                            }`}
                          >
                            {t.title}
                          </h3>

                          {isTargetNext && (
                            <span className="px-2 py-0.5 rounded-full bg-[#F2A33A] text-[#17212B] text-[10px] font-bold">
                              Next up
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                          <span
                            className={`font-medium tabular-nums ${
                              isTargetNext ? 'text-[#D5DFE6]' : 'text-[#2F3E8F]'
                            }`}
                          >
                            {formatTimeDisplay(t.startTime) || 'No time set'}
                            {t.durationMinutes ? ` (${t.durationMinutes}m)` : ''}
                          </span>
                          <span
                            className={`capitalize ${
                              isTargetNext ? 'text-[#9AA9B5]' : 'text-[#55636F]'
                            }`}
                          >
                            #{t.category}
                          </span>
                        </div>
                      </div>

                      {/* Actions Column: Top Edit, Middle Delete, Bottom Move to Next Day */}
                      <div className="flex flex-col items-center justify-start gap-1 flex-shrink-0 self-start -mr-1 -mt-1">
                        {/* 1. Edit Button (On Top) */}
                        <button
                          type="button"
                          onClick={() => onEditTask(t)}
                          aria-label={`Edit ${t.title}`}
                          title="Edit task"
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl cursor-pointer active:scale-90 transition-all ${
                            isTargetNext ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6]'
                          }`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>

                        {/* 2. Delete Button (Below That) */}
                        <button
                          type="button"
                          onClick={() => onDeleteTask(t.id)}
                          aria-label={`Delete ${t.title}`}
                          title="Delete task"
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl cursor-pointer active:scale-90 transition-all ${
                            isTargetNext ? 'text-white/80 hover:text-rose-300 hover:bg-white/10' : 'text-[#55636F] hover:text-[#E4572E] hover:bg-[#FBE3DC]'
                          }`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>

                        {/* 3. Move to Next Day Button (Below That) */}
                        <button
                          type="button"
                          onClick={() => onMoveToNextDay(t.id)}
                          aria-label={`Move ${t.title} to next day`}
                          title="Move to next day (+1 day)"
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl cursor-pointer active:scale-90 transition-all group ${
                            isTargetNext ? 'text-white/80 hover:text-[#F2A33A] hover:bg-white/10' : 'text-[#55636F] hover:text-[#2F3E8F] hover:bg-[#E3E8F6]'
                          }`}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
                            <polyline points="9 18 15 12 9 6" />
                            <line x1="5" y1="12" x2="15" y2="12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Free Slot Cards */}
            {freeSlots.map((slot, idx) => {
              const hours = Math.floor(slot.durationMinutes / 60);
              const mins = slot.durationMinutes % 60;
              const label = `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m ` : ''}open`;

              return (
                <div
                  key={idx}
                  className="w-full rounded-[18px] border-2 border-dashed border-[#9AA9B5] p-3.5 flex items-center justify-between gap-3 bg-white/40"
                >
                  <div className="text-xs text-[#55636F]">
                    <span className="font-bold text-[#17212B] mr-1.5">{label}</span>
                    <span>at {formatTimeDisplay(slot.startTimeStr)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddTaskAtTime(selectedDate, slot.startTimeStr)}
                    aria-label={`Fill open slot at ${slot.startTimeStr}`}
                    className="min-h-[40px] px-3.5 rounded-full bg-[#F2A33A] text-[#17212B] text-xs font-bold hover:bg-[#e09228] transition-colors cursor-pointer active:scale-95"
                  >
                    + Fit Task
                  </button>
                </div>
              );
            })}
          </div>

          {/* Floating Action Button */}
          <div className="fixed bottom-24 left-4 right-4 z-30 flex items-center justify-center pointer-events-none max-w-md mx-auto">
            <button
              type="button"
              onClick={() => onRebalanceDay(selectedDate)}
              aria-label="Ask Zen to rebalance my day"
              className="pointer-events-auto min-h-[44px] px-5 py-2.5 rounded-full bg-[#17212B] text-white text-xs font-semibold flex items-center gap-2 shadow-lg hover:bg-black transition-colors cursor-pointer active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#F2A33A]" />
              <span>Ask Zen to rebalance my day</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: ALL UPCOMING DATES SCHEDULE & AGENDA             */}
      {/* ======================================================== */}
      {viewMode === 'allDates' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Quick Dates Navigation Bar */}
          <div className="bg-white border border-[#DDE5EA] rounded-[20px] p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55636F]">
                Upcoming Dates Ahead
              </span>
              <button
                type="button"
                onClick={() => setIsDatesModalOpen(true)}
                className="text-xs font-bold text-[#2F3E8F] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Calendar Picker</span>
                <span>→</span>
              </button>
            </div>

            {/* Quick jump pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { label: 'Tomorrow', date: tomorrowStr },
                { label: '+2 Days', date: in2DaysStr },
                { label: '+3 Days', date: in3DaysStr },
                { label: '+4 Days', date: in4DaysStr },
                { label: 'Next Week', date: nextWeekStr },
                { label: 'In 2 Weeks', date: in2WeeksStr },
              ].map((pill) => {
                const count = tasks.filter((t) => t.date === pill.date).length;
                const isSelected = selectedDate === pill.date;
                return (
                  <button
                    key={pill.date}
                    type="button"
                    onClick={() => {
                      handleSelectDate(pill.date);
                    }}
                    className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#17212B] text-white shadow-xs'
                        : 'bg-[#EEF3F6] text-[#55636F] hover:text-[#17212B] hover:bg-[#DDE5EA]'
                    }`}
                  >
                    <span>{pill.label}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-[#2F3E8F]/15 text-[#2F3E8F]'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feed of Next 14 Upcoming Days */}
          <div className="space-y-3">
            {upcoming14Days.map((day) => {
              const isSelected = selectedDate === day.dateStr;
              const hasTasks = day.tasks.length > 0;

              return (
                <div
                  key={day.dateStr}
                  className={`w-full max-w-full rounded-[20px] border p-4 transition-all box-border overflow-hidden ${
                    isSelected
                      ? 'bg-white border-[#2F3E8F] shadow-sm ring-1 ring-[#2F3E8F]'
                      : 'bg-white border-[#DDE5EA] hover:border-[#C9D4DC]'
                  }`}
                >
                  {/* Date Header Row */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EEF3F6]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-heading font-bold text-[15px] text-[#17212B] truncate">
                        {formatDateLabel(day.dateStr)}
                      </span>
                      {day.offset === 1 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3E8F6] text-[#2F3E8F]">
                          Tomorrow
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        hasTasks ? 'bg-[#FEF4E8] text-[#8A5A0C]' : 'bg-[#EEF3F6] text-[#55636F]'
                      }`}>
                        {hasTasks ? `${day.tasks.length} task${day.tasks.length > 1 ? 's' : ''}` : 'No tasks'}
                      </span>

                      {/* Switch to Timeline for this date */}
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectDate(day.dateStr);
                          setViewMode('timeline');
                        }}
                        title="View Day Arc timeline"
                        className="text-[11px] font-bold text-[#2F3E8F] hover:bg-[#EEF3F6] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Timeline ↗
                      </button>
                    </div>
                  </div>

                  {/* Tasks for this date */}
                  {hasTasks ? (
                    <div className="pt-3 space-y-2">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#FAFCFD] border border-[#EEF3F6] hover:border-[#DDE5EA] transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => onToggleComplete(task.id)}
                              aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                              className="w-5 h-5 rounded border border-[#9AA9B5] flex items-center justify-center flex-shrink-0 cursor-pointer hover:border-[#17212B]"
                            >
                              {task.completed && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${
                                task.completed ? 'line-through text-[#9AA9B5]' : 'text-[#17212B]'
                              }`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-[#55636F] mt-0.5">
                                <span>{formatTimeDisplay(task.startTime) || 'Anytime'}</span>
                                <span>•</span>
                                <span className="capitalize">#{task.category}</span>
                              </div>
                            </div>
                          </div>

                          {/* 3 Action Buttons: Edit, Delete, Move to Next Day */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* 1. Edit */}
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              title="Edit task"
                              className="w-7 h-7 rounded-lg text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6] flex items-center justify-center cursor-pointer"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>

                            {/* 2. Delete */}
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              title="Delete task"
                              className="w-7 h-7 rounded-lg text-[#55636F] hover:text-[#E4572E] hover:bg-[#FBE3DC] flex items-center justify-center cursor-pointer"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </button>

                            {/* 3. Move to Next Day */}
                            <button
                              type="button"
                              onClick={() => onMoveToNextDay(task.id)}
                              title="Move to next day (+1 day)"
                              className="w-7 h-7 rounded-lg text-[#55636F] hover:text-[#2F3E8F] hover:bg-[#E3E8F6] flex items-center justify-center cursor-pointer"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                                <line x1="5" y1="12" x2="15" y2="12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-2 text-xs text-[#55636F] italic">
                      No tasks scheduled for this day.
                    </div>
                  )}

                  {/* Add task button for this specific upcoming date */}
                  <div className="pt-3 mt-2 border-t border-[#EEF3F6] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onAddTaskAtTime(day.dateStr, '09:00')}
                      className="text-xs font-bold text-[#2F3E8F] hover:text-[#17212B] flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Add task for this date</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* UPCOMING DATES BROWSER & PICKER MODAL                    */}
      {/* ======================================================== */}
      {isDatesModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upcoming-dates-modal-title"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsDatesModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] bg-white border border-[#DDE5EA] p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto box-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EEF3F6]">
              <div>
                <h3 id="upcoming-dates-modal-title" className="font-heading font-bold text-base text-[#17212B]">
                  Browse Upcoming Dates
                </h3>
                <p className="text-xs text-[#55636F]">
                  Select any date to view and plan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDatesModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Native Calendar Input (Large & Clear) */}
            <div className="p-3 rounded-2xl bg-[#EEF3F6] space-y-2">
              <label htmlFor="calendar-custom-date" className="block text-xs font-bold text-[#17212B]">
                Pick Specific Date from Calendar:
              </label>
              <input
                id="calendar-custom-date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectDate(e.target.value);
                    setIsDatesModalOpen(false);
                  }
                }}
                className="w-full min-h-[44px] px-3 rounded-xl bg-white border border-[#DDE5EA] text-sm text-[#17212B] font-medium outline-none focus:border-[#2F3E8F]"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#55636F]">
                Quick Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Today', date: todayStr },
                  { label: 'Tomorrow', date: tomorrowStr },
                  { label: '+2 Days', date: in2DaysStr },
                  { label: '+3 Days', date: in3DaysStr },
                  { label: 'Next Week (+7d)', date: nextWeekStr },
                  { label: 'In 2 Weeks (+14d)', date: in2WeeksStr },
                ].map((item) => (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => {
                      handleSelectDate(item.date);
                      setIsDatesModalOpen(false);
                    }}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                      selectedDate === item.date
                        ? 'bg-[#17212B] text-white shadow-xs'
                        : 'bg-[#F4F7F9] text-[#17212B] hover:bg-[#E3E8F6]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-75">{item.date.slice(5)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled Future Dates Ahead */}
            {upcomingTaskDates.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#EEF3F6]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2F3E8F] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F2A33A]" />
                  Dates With Tasks Ahead ({upcomingTaskDates.length})
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                  {upcomingTaskDates.map((dStr) => {
                    const count = tasks.filter((t) => t.date === dStr).length;
                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => {
                          handleSelectDate(dStr);
                          setIsDatesModalOpen(false);
                        }}
                        className="w-full min-h-[36px] px-3 rounded-xl bg-[#FAFCFD] hover:bg-[#EEF3F6] border border-[#EEF3F6] flex items-center justify-between text-xs font-medium cursor-pointer transition-colors"
                      >
                        <span className="font-semibold text-[#17212B]">
                          {formatDateLabel(dStr)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#E3E8F6] text-[#2F3E8F] text-[10px] font-bold">
                          {count} task{count > 1 ? 's' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsDatesModalOpen(false)}
              className="w-full py-2.5 rounded-full bg-[#17212B] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
