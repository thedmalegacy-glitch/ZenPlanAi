import React, { useState } from 'react';
import { Task } from '../types';
import { DayArc } from './DayArc';
import { addDays, formatDateLabel, formatTimeDisplay, getMinutesSinceMidnight } from '../utils/time';

interface UpcomingTimelineProps {
  tasks: Task[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
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
  onAddTaskAtTime,
  onRebalanceDay,
}) => {
  // Generate 7-day week strip centered or starting from selectedDate or today
  const [weekOffset, setWeekOffset] = useState(0);

  // Compute days for strip
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
    return { dateStr, dayInitial, dayNum };
  });

  // Filter tasks for selected date
  const dayTasks = tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => {
      const aM = getMinutesSinceMidnight(a.startTime) ?? 9999;
      const bM = getMinutesSinceMidnight(b.startTime) ?? 9999;
      return aM - bM;
    });

  const remainingCount = dayTasks.filter((t) => !t.completed).length;

  // Total planned minutes
  const totalMinutesPlanned = dayTasks.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
  const hoursPlanned = Math.floor(totalMinutesPlanned / 60);
  const minsPlanned = totalMinutesPlanned % 60;

  // Day workload classification: under 4h light, 4-6h balanced, over 6h full
  const workloadLabel =
    totalMinutesPlanned < 240
      ? 'light day'
      : totalMinutesPlanned <= 360
      ? 'balanced day'
      : 'full day';

  // Identify next upcoming task
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
    <div className="space-y-4 pb-36">
      {/* Header */}
      <div>
        <h1 className="font-heading text-[28px] font-bold text-[#17212B] leading-tight">
          {formatDateLabel(selectedDate)}
        </h1>
        <p className="font-body text-[13px] text-[#55636F] mt-0.5">
          {remainingCount} tasks left • {hoursPlanned}h {minsPlanned}m planned •{' '}
          <span className="font-semibold text-[#17212B]">{workloadLabel}</span>
        </p>
      </div>

      {/* Week Strip M T W T F S S */}
      <div className="flex items-center justify-between gap-1 bg-white border border-[#DDE5EA] rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          aria-label="Previous week"
          className="w-8 h-8 flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex-1 flex justify-around gap-1">
          {weekDays.map((wd) => {
            const isSelected = wd.dateStr === selectedDate;
            const hasTasks = tasks.some((t) => t.date === wd.dateStr);

            return (
              <button
                key={wd.dateStr}
                type="button"
                onClick={() => onSelectDate(wd.dateStr)}
                aria-label={`Select ${wd.dateStr}`}
                className={`flex flex-col items-center justify-center w-10 py-1.5 rounded-full transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#17212B] text-white font-bold'
                    : 'text-[#17212B] hover:bg-[#EEF3F6]'
                }`}
              >
                <span className="text-[10px] font-semibold text-[#55636F] uppercase">
                  {wd.dayInitial}
                </span>
                <span className="text-sm font-heading">{wd.dayNum}</span>
                {/* Amber dot if day has tasks */}
                <span
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    hasTasks ? (isSelected ? 'bg-white' : 'bg-[#F2A33A]') : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setWeekOffset((w) => w + 1)}
          aria-label="Next week"
          className="w-8 h-8 flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Large Day Arc */}
      <div className="bg-white border border-[#DDE5EA] rounded-[20px] p-4 flex flex-col items-center">
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
        <h2 className="font-heading text-[17px] font-bold text-[#17212B] px-1">
          Chronological Timeline
        </h2>

        {dayTasks.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#DDE5EA] rounded-[18px]">
            <p className="text-sm text-[#55636F]">No scheduled tasks for this date.</p>
            <button
              type="button"
              onClick={() => onAddTaskAtTime(selectedDate, '09:00')}
              className="mt-3 min-h-[44px] px-5 rounded-full bg-[#17212B] text-white text-xs font-semibold cursor-pointer"
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
                className={`w-full rounded-[18px] p-4 border transition-all ${
                  isTargetNext
                    ? 'bg-[#17212B] text-white border-[#17212B]'
                    : t.completed
                    ? 'bg-[#FAFCFD] opacity-60 border-[#DDE5EA]'
                    : 'bg-white border-[#DDE5EA] hover:border-[#C9D4DC]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`font-body font-semibold text-[15px] ${
                          t.completed ? 'line-through text-[#55636F]' : isTargetNext ? 'text-white' : 'text-[#17212B]'
                        }`}
                      >
                        {t.title}
                      </h3>

                      {isTargetNext && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F2A33A] text-[#17212B] text-[11px] font-bold">
                          Next up
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs">
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

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(t.id)}
                      aria-label={t.completed ? 'Mark incomplete' : 'Mark complete'}
                      className={`w-11 h-11 flex items-center justify-center rounded-full cursor-pointer ${
                        isTargetNext ? 'text-white hover:bg-white/10' : 'text-[#17212B] hover:bg-[#EEF3F6]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
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
                    <button
                      type="button"
                      onClick={() => onEditTask(t)}
                      aria-label={`Edit ${t.title}`}
                      className={`w-11 h-11 flex items-center justify-center rounded-full cursor-pointer ${
                        isTargetNext ? 'text-white hover:bg-white/10' : 'text-[#55636F] hover:bg-[#EEF3F6]'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
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
                className="min-h-[44px] px-4 rounded-full bg-[#F2A33A] text-[#17212B] text-xs font-bold hover:bg-[#e09228] transition-colors cursor-pointer"
              >
                + Fit Task
              </button>
            </div>
          );
        })}
      </div>

      {/* Floating Action Row pinned above BottomNav */}
      <div className="fixed bottom-24 left-6 right-6 z-30 flex items-center justify-center pointer-events-none max-w-md mx-auto">
        <button
          type="button"
          onClick={() => onRebalanceDay(selectedDate)}
          aria-label="Ask Zen to rebalance my day"
          className="pointer-events-auto min-h-[44px] px-5 py-2.5 rounded-full bg-[#17212B] text-white text-xs font-semibold flex items-center gap-2 shadow-lg hover:bg-black transition-colors cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#F2A33A]" />
          <span>Ask Zen to rebalance my day</span>
        </button>
      </div>
    </div>
  );
};
