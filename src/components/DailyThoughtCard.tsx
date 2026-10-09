import React, { useState } from 'react';
import { getDailyThought, MOTIVATIONAL_THOUGHTS, MotivationalThought } from '../data/motivationalThoughts';
import { haptic } from '../utils/dateAndHaptics';

interface DailyThoughtCardProps {
  dateISO: string;
}

export const DailyThoughtCard: React.FC<DailyThoughtCardProps> = ({ dateISO }) => {
  const [thoughtIndex, setThoughtIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const defaultThought = getDailyThought(dateISO);
  const activeThought: MotivationalThought =
    thoughtIndex !== null ? MOTIVATIONAL_THOUGHTS[thoughtIndex] : defaultThought;

  const handleNextThought = () => {
    haptic(8);
    setThoughtIndex((prev) => {
      const current = prev !== null ? prev : MOTIVATIONAL_THOUGHTS.indexOf(defaultThought);
      return (current + 1) % MOTIVATIONAL_THOUGHTS.length;
    });
  };

  const handleCopy = () => {
    haptic(10);
    navigator.clipboard?.writeText(`"${activeThought.quote}" — ${activeThought.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="mt-3 mb-1 rounded-2xl p-4 transition-all"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--line)',
      }}
      role="region"
      aria-label="Daily motivational thought"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-lg grid place-items-center text-xs font-bold"
            style={{ backgroundColor: 'var(--tint)', color: 'var(--accent)' }}
          >
            ✨
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Daily Thought
          </span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full capitalize"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}
          >
            {activeThought.theme}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNextThought}
            className="w-8 h-8 rounded-lg grid place-items-center text-xs transition-colors"
            style={{ color: 'var(--muted)', backgroundColor: 'var(--bg)' }}
            title="Next inspirational thought"
            aria-label="Next inspirational thought"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 rounded-lg grid place-items-center text-xs transition-colors"
            style={{ color: 'var(--muted)', backgroundColor: 'var(--bg)' }}
            title={collapsed ? 'Expand thought' : 'Collapse thought'}
            aria-label={collapsed ? 'Expand thought' : 'Collapse thought'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <p
            className="text-[15px] font-medium leading-relaxed italic"
            style={{ color: 'var(--ink)' }}
          >
            "{activeThought.quote}"
          </p>

          <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
            <span className="font-semibold">— {activeThought.author}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-bold px-2 py-0.5 rounded transition-colors"
              style={{
                color: copied ? 'var(--ok)' : 'var(--muted)',
                backgroundColor: 'var(--bg)',
              }}
            >
              {copied ? 'Copied ✓' : 'Share'}
            </button>
          </div>

          <div
            className="mt-2.5 pt-2 flex items-center gap-1.5 text-[12px] font-medium"
            style={{ borderTop: '1px solid var(--line)', color: 'var(--accent)' }}
          >
            <span className="text-[10px]">💡</span>
            <span>{activeThought.action}</span>
          </div>
        </>
      )}
    </div>
  );
};
