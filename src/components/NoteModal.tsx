import React, { useState, useEffect } from 'react';
import { Note, NoteCategory } from '../types';
import { formatDateLabel } from '../utils/time';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: { id?: string; title: string; content: string; date: string; category?: NoteCategory }) => void;
  initialNote?: Note | null;
  defaultDate: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState<NoteCategory>('general');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title || '');
      setContent(initialNote.content || '');
      setDate(initialNote.date || defaultDate);
      setCategory(initialNote.category || 'general');
    } else {
      setTitle('');
      setContent('');
      setDate(defaultDate);
      setCategory('general');
    }
    setErrorMsg('');
  }, [initialNote, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setErrorMsg('Please enter a title or note content.');
      return;
    }

    onSave({
      id: initialNote?.id,
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      date,
      category,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-[20px] border border-[#DDE5EA] p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EEF3F6]">
          <div>
            <h2 id="note-modal-title" className="font-heading text-xl font-bold text-[#17212B]">
              {initialNote ? 'Edit Note' : 'Write Note'}
            </h2>
            <p className="font-body text-xs text-[#55636F] mt-0.5">
              Logged for {formatDateLabel(date)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close note dialog"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#FBE3DC] text-[#A3321A] text-xs font-semibold rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-[#EEF3F6] text-[#17212B] font-body text-xs focus:border-[#F2A33A] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily Standup Notes, Brainstorm, Reflection..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-[#EEF3F6] text-[#17212B] font-body text-sm font-medium focus:border-[#F2A33A] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1.5">
              Category
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {(['general', 'reflection', 'idea', 'meeting', 'journal'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[36px] px-3 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-[#17212B] text-white shadow-xs'
                      : 'bg-white border border-[#DDE5EA] text-[#55636F] hover:bg-[#EEF3F6]'
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Content TextArea */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1.5">
              Note Content
            </label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, meeting points, takeaways, or journal..."
              className="w-full px-3.5 py-3 rounded-xl border border-[#DDE5EA] bg-[#EEF3F6] text-[#17212B] font-body text-xs leading-relaxed focus:border-[#F2A33A] focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 rounded-full border border-[#DDE5EA] text-xs font-semibold text-[#55636F] hover:bg-[#EEF3F6] active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 rounded-full bg-[#17212B] text-white text-xs font-semibold hover:bg-black active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              {initialNote ? 'Save Changes' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
