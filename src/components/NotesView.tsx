import React, { useState } from 'react';
import { Note } from '../types';
import { addDays, formatDateLabel, getTodayDateString } from '../utils/time';
import { ZenPlanLogo } from './ZenPlanLogo';

interface NotesViewProps {
  notes: Note[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onAddNote: (date: string) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  selectedDate,
  onSelectDate,
  onAddNote,
  onEditNote,
  onDeleteNote,
}) => {
  const todayStr = getTodayDateString();
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Compute days for strip based on weekOffset (Monday - Sunday, matching Upcoming section)
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

  // Filter notes for the selected date
  const dayNotes = notes
    .filter((n) => n.date === selectedDate)
    .filter((n) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.category && n.category.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const totalNotesForDate = notes.filter((n) => n.date === selectedDate).length;

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ZenPlanLogo size={38} />
          <div>
            <h1 className="font-heading text-[26px] sm:text-[28px] font-bold text-[#17212B] leading-tight">
              {formatDateLabel(selectedDate)}
            </h1>
            <p className="font-body text-[13px] text-[#55636F] mt-0.5">
              {totalNotesForDate} {totalNotesForDate === 1 ? 'note' : 'notes'} for this day • Daily Logs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddNote(selectedDate)}
          aria-label="Add note for this date"
          className="min-h-[44px] px-4 py-2 rounded-full bg-[#F2A33A] text-[#17212B] text-xs font-bold hover:bg-[#e09228] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Note</span>
        </button>
      </div>

      {/* Week Navigator Card - Identical to Upcoming Section, Zero Overflow */}
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
              const hasNotes = notes.some((n) => n.date === wd.dateStr);
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
                  {/* Amber dot indicator if day has notes */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      hasNotes
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

      {/* Optional Search / Filter for the day */}
      {totalNotesForDate > 1 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes on this day..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#DDE5EA] text-xs text-[#17212B] placeholder-[#9AA9B5] focus:outline-none focus:border-[#F2A33A]"
          />
          <svg
            className="absolute left-3 top-2.5 text-[#9AA9B5]"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      )}

      {/* Top Quick Add Note Card */}
      <div
        onClick={() => onAddNote(selectedDate)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAddNote(selectedDate);
          }
        }}
        aria-label="Write a new note for this day"
        className="w-full p-3.5 rounded-[18px] bg-white border border-dashed border-[#C9D4DC] hover:border-[#F2A33A] hover:bg-[#FEF4E8]/20 transition-all flex items-center justify-between cursor-pointer group active:scale-98 select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FEF4E8] text-[#F2A33A] group-hover:bg-[#F2A33A] group-hover:text-[#17212B] flex items-center justify-center transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="font-body text-xs font-medium text-[#55636F] group-hover:text-[#17212B] transition-colors">
            Write a note for {formatDateLabel(selectedDate)}...
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#F2A33A] bg-[#FEF4E8] px-2.5 py-1 rounded-full group-hover:bg-[#F2A33A] group-hover:text-[#17212B] transition-colors">
          + Add
        </span>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {dayNotes.length === 0 ? (
          <div className="p-10 text-center bg-white border border-[#DDE5EA] rounded-[20px] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FEF4E8] text-[#F2A33A] flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <p className="font-heading font-semibold text-[15px] text-[#17212B]">No notes for this date</p>
              <p className="font-body text-xs text-[#55636F] mt-1 max-w-xs mx-auto">
                Keep quick thoughts, daily reflections, meeting summaries, or journal entries recorded date-wise.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAddNote(selectedDate)}
              className="mt-2 min-h-[44px] px-5 rounded-full bg-[#17212B] text-white text-xs font-semibold hover:bg-black active:scale-95 transition-all cursor-pointer"
            >
              Write First Note
            </button>
          </div>
        ) : (
          dayNotes.map((note) => (
            <div
              key={note.id}
              className="w-full bg-white border border-[#DDE5EA] rounded-[18px] p-4 text-left transition-all hover:border-[#C9D4DC] space-y-2.5 shadow-2xs group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0" onClick={() => onEditNote(note)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-[16px] text-[#17212B] cursor-pointer hover:text-[#2F3E8F] transition-colors">
                      {note.title || 'Untitled Note'}
                    </h3>
                    {note.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-[#EEF3F6] text-[#55636F]">
                        #{note.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditNote(note)}
                    aria-label={`Edit ${note.title}`}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    aria-label={`Delete ${note.title}`}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#55636F] hover:text-[#E4572E] hover:bg-[#FBE3DC] active:scale-90 transition-all cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Note Content Body */}
              <div
                className="font-body text-[13px] text-[#2C3844] whitespace-pre-wrap leading-relaxed cursor-pointer"
                onClick={() => onEditNote(note)}
              >
                {note.content}
              </div>

              {/* Timestamp footer */}
              <div className="pt-1.5 border-t border-[#EEF3F6] flex items-center justify-between text-[11px] text-[#9AA9B5]">
                <span>
                  Saved at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {note.updatedAt > note.createdAt && (
                  <span>Edited</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
