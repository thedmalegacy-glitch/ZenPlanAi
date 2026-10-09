import React, { useState } from 'react';
import { DailyThought } from '../types';

interface DailyThoughtCardProps {
  thought: DailyThought;
  onRefresh?: () => void;
}

export const DailyThoughtCard: React.FC<DailyThoughtCardProps> = ({
  thought,
  onRefresh,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `"${thought.quote}" — ${thought.author} (${thought.category})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefreshClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRefresh) onRefresh();
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
      aria-expanded={expanded}
      aria-label="Daily Thought card, tap to expand details"
      className="w-full bg-white border border-[#DDE5EA] rounded-[18px] p-4 text-left cursor-pointer transition-all hover:border-[#C9D4DC] select-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`font-body text-[13px] text-[#17212B] font-medium leading-relaxed ${
              !expanded ? 'line-clamp-2' : ''
            }`}
          >
            "{thought.quote}"
          </p>
          <div className="mt-1 flex items-center gap-2 text-[12px] text-[#55636F]">
            <span className="font-medium text-[#17212B]">{thought.author}</span>
            <span className="text-[#9AA9B5]">•</span>
            <span className="capitalize">{thought.category}</span>
          </div>
        </div>

        {/* Tiny chevron indicator */}
        <div className="w-6 h-6 flex items-center justify-center text-[#9AA9B5] flex-shrink-0 pt-0.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Expanded section: Actionable tip, Refresh, Share */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#EEF3F6] flex flex-col gap-3 animate-fadeIn">
          {thought.tip && (
            <div className="text-[12px] text-[#55636F] bg-[#EEF3F6] p-2.5 rounded-[12px]">
              <span className="font-semibold text-[#17212B] mr-1.5">Actionable Tip:</span>
              {thought.tip}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefreshClick}
                aria-label="Get another thought"
                className="min-h-[44px] px-3 py-2 rounded-full border border-[#C9D4DC] bg-white text-[#17212B] text-[12px] font-medium flex items-center gap-1.5 hover:bg-[#EEF3F6] transition-colors cursor-pointer"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                <span>New Quote</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              aria-label="Copy thought to clipboard"
              className="min-h-[44px] px-3 py-2 rounded-full border border-[#C9D4DC] bg-white text-[#17212B] text-[12px] font-medium flex items-center gap-1.5 hover:bg-[#EEF3F6] transition-colors cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
