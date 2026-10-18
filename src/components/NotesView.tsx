import React, { useState } from 'react';
import { Note } from '../types';
import { addDays, formatDateLabel } from '../utils/time';
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
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generate 7 days for the current week slice
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dStr = addDays(selectedDate, i - 3 + weekOffset * 7);
    const dateObj = new Date(dStr + 'T12:00:00');
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dayInitial = dayNames[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    return { dateStr: dStr, dayInitial, dayNum };
  });

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

      {/* Week Strip Navigation (Identical date selector to Upcoming section) */}
      <div className="flex items-center justify-between gap-1 bg-white border border-[#DDE5EA] rounded-[20px] p-2">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          aria-label="Previous week"
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 active:bg-[#DDE5EA] transition-all cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex-1 flex justify-around gap-1">
          {weekDays.map((wd) => {
            const isSelected = wd.dateStr === selectedDate;
            const hasNotes = notes.some((n) => n.date === wd.dateStr);

            return (
              <button
                key={wd.dateStr}
                type="button"
                onClick={() => onSelectDate(wd.dateStr)}
                aria-label={`Select date ${wd.dateStr}`}
                className={`min-h-[44px] min-w-[40px] flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-[#17212B] text-white font-bold shadow-xs'
                    : 'text-[#17212B] hover:bg-[#EEF3F6] active:bg-[#DDE5EA]'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-white/80' : 'text-[#55636F]'}`}>
                  {wd.dayInitial}
                </span>
                <span className="text-sm font-heading">{wd.dayNum}</span>
                {/* Accent dot if date has saved notes */}
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    hasNotes ? 'bg-[#F2A33A]' : 'opacity-0'
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
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 active:bg-[#DDE5EA] transition-all cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
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
