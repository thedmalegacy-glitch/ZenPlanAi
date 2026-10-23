import React, { useState } from 'react';
import { Task } from '../types';
import { DayArc } from './DayArc';
import { ZenPlanLogo } from './ZenPlanLogo';
import {
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
  onViewTaskDetails?: (task: Task) => void;
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
  onViewTaskDetails,
}) => {
  const todayStr = getTodayDateString();
  const [weekOffset, setWeekOffset] = useState(0);

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

  // Filter tasks for selected date (pending first chronologically by time, completed at bottom)
  const rawDayTasks = tasks.filter((t) => t.date === selectedDate);
  const dayTasks = sortTasksChronologically(rawDayTasks);

  const remainingCount = dayTasks.filter((t) => !t.completed).length;

  // Total planned minutes
  const totalMinutesPlanned = dayTasks.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
  const hoursPlanned = Math.floor(totalMinutesPlanned / 60);
  const minsPlanned = totalMinutesPlanned % 60;

  // Identify next upcoming task
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
      {/* Header with ZenPlan Logo & Title */}
      <div className="flex items-center justify-between gap-3">
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
      </div>

      {/* Week Navigator Card - With Small Arrow Buttons on BOTH Sides */}
      <div className="w-full max-w-full bg-white border border-[#DDE5EA] rounded-[22px] p-3 sm:p-3.5 space-y-2.5 shadow-xs box-border overflow-hidden">
        {/* Month & Year Title Bar */}
        <div className="flex items-center justify-between px-1">
          <span className="font-heading font-bold text-[14px] sm:text-[15px] text-[#17212B]">
            {monthLabel}
          </span>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => handleSelectDate(todayStr)}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E3E8F6] text-[#2F3E8F] hover:bg-[#D5DFE6] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              Today
            </button>
          )}
        </div>

        {/* Week Strip Row: Left Arrow + 7 Days Grid + Right Arrow */}
        <div className="flex items-center gap-1 sm:gap-1.5 w-full">
          {/* Small Arrow Button on Left Side (Previous Week Dates) */}
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Previous week dates"
            title="Previous week"
            className="w-7 sm:w-8 h-11 flex-shrink-0 rounded-[12px] flex items-center justify-center text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* 7 Days Columns in Center */}
          <div className="grid grid-cols-7 gap-1 flex-1 min-w-0 box-border">
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
                  <span
                    className={`text-[10px] font-semibold uppercase leading-tight ${
                      isSelected
                        ? 'text-white/80'
                        : isCurrentToday
                        ? 'text-[#2F3E8F]'
                        : 'text-[#55636F]'
                    }`}
                  >
                    {wd.dayInitial}
                  </span>
                  <span className="text-[13px] font-heading mt-0.5 leading-none">
                    {wd.dayNum}
                  </span>
                  {/* Amber dot indicator if day has tasks */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      hasTasks
                        ? isSelected
                          ? 'bg-white'
                          : 'bg-[#F2A33A]'
                        : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Small Arrow Button on Right Side (Next Week Dates) */}
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Next week dates"
            title="Next week"
            className="w-7 sm:w-8 h-11 flex-shrink-0 rounded-[12px] flex items-center justify-center text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

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
            isToday && nextTask ? nextTask.title : 'planned daylight'
          }
        />
      </div>

      {/* Timeline List for Selected Date */}
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
            <p className="text-sm text-[#55636F]">
              No scheduled tasks for this date.
            </p>
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
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => onToggleComplete(t.id)}
                    aria-label={
                      t.completed ? 'Mark incomplete' : 'Mark complete'
                    }
                    className={`min-w-[40px] min-h-[40px] -ml-1 -mt-1 flex items-center justify-center rounded-full cursor-pointer active:scale-90 transition-all flex-shrink-0 ${
                      isTargetNext
                        ? 'text-white hover:bg-white/10'
                        : 'text-[#17212B] hover:bg-[#EEF3F6]'
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
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Content (Title, Description & Meta - Clicking opens task details pop-up) */}
                  <div
                    className="flex-1 min-w-0 pr-1 cursor-pointer group"
                    onClick={() => (onViewTaskDetails ? onViewTaskDetails(t) : onEditTask(t))}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        (onViewTaskDetails ? onViewTaskDetails(t) : onEditTask(t));
                      }
                    }}
                    aria-label={`View details for ${t.title}`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3
                        className={`font-body font-semibold text-[14px] sm:text-[15px] leading-snug break-words group-hover:underline ${
                          t.completed
                            ? 'line-through text-[#55636F]'
                            : isTargetNext
                            ? 'text-white'
                            : 'text-[#17212B]'
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

                    {/* Task description preview */}
                    {t.description && (
                      <p
                        className={`text-[12.5px] mt-1 line-clamp-2 leading-relaxed ${
                          isTargetNext ? 'text-[#D5DFE6]' : 'text-[#55636F]'
                        }`}
                      >
                        {t.description}
                      </p>
                    )}

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
                        isTargetNext
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6]'
                      }`}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
                        isTargetNext
                          ? 'text-white/80 hover:text-rose-300 hover:bg-white/10'
                          : 'text-[#55636F] hover:text-[#E4572E] hover:bg-[#FBE3DC]'
                      }`}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
                        isTargetNext
                          ? 'text-white/80 hover:text-[#F2A33A] hover:bg-white/10'
                          : 'text-[#55636F] hover:text-[#2F3E8F] hover:bg-[#E3E8F6]'
                      }`}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:translate-x-0.5 transition-transform"
                      >
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
  );
};
