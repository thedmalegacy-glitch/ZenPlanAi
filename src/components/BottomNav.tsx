import React from 'react';

export type NavTab = 'today' | 'upcoming' | 'fitness' | 'done';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onAddTask?: () => void;
  visible?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onAddTask,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed inset-x-0 bottom-0 z-50 px-4 sm:px-6 pb-[max(12px,calc(env(safe-area-inset-bottom)+8px))] pt-2 pointer-events-none flex justify-center"
    >
      <div
        className="pointer-events-auto w-full max-w-md bg-white border border-[#DDE5EA] rounded-[22px] p-1 flex gap-0.5 shadow-sm"
        style={{
          boxShadow: '0 4px 20px -2px rgba(23, 33, 43, 0.08)',
        }}
      >
        {/* Tab 1: Today */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          aria-label="Today"
          aria-current={currentTab === 'today' ? 'page' : undefined}
          className={`flex-1 min-h-[56px] rounded-[18px] border-none flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            currentTab === 'today'
              ? 'bg-[#17212B] text-white'
              : 'bg-transparent text-[#55636F] hover:bg-black/5'
          }`}
        >
          {/* Today icon: circle with a check mark, 24x24 viewBox, 20px rendered, stroke currentColor 2px */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span className="font-body text-[11px] font-medium leading-tight">Today</span>
        </button>

        {/* Tab 2: Upcoming */}
        <button
          type="button"
          onClick={() => onSelectTab('upcoming')}
          aria-label="Upcoming"
          aria-current={currentTab === 'upcoming' ? 'page' : undefined}
          className={`flex-1 min-h-[56px] rounded-[18px] border-none flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            currentTab === 'upcoming'
              ? 'bg-[#17212B] text-white'
              : 'bg-transparent text-[#55636F] hover:bg-black/5'
          }`}
        >
          {/* Upcoming icon: calendar */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          <span className="font-body text-[11px] font-medium leading-tight">Upcoming</span>
        </button>

        {/* Tab Center: Add Task Action Button */}
        {onAddTask && (
          <button
            type="button"
            onClick={onAddTask}
            aria-label="Add new task"
            className="flex-1 min-h-[56px] rounded-[18px] border-none flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 cursor-pointer bg-transparent text-[#55636F] hover:bg-black/5 group"
          >
            <div className="w-7 h-7 rounded-full bg-[#F2A33A] text-[#17212B] flex items-center justify-center shadow-xs group-hover:bg-[#e09228] transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="font-body text-[11px] font-medium leading-tight text-[#17212B]">Add</span>
          </button>
        )}

        {/* Tab 3: Fitness */}
        <button
          type="button"
          onClick={() => onSelectTab('fitness')}
          aria-label="Fitness"
          aria-current={currentTab === 'fitness' ? 'page' : undefined}
          className={`flex-1 min-h-[56px] rounded-[18px] border-none flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            currentTab === 'fitness'
              ? 'bg-[#17212B] text-white'
              : 'bg-transparent text-[#55636F] hover:bg-black/5'
          }`}
        >
          {/* Fitness icon: dumbbell */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6.5 6.5 11 11" />
            <path d="m21 21-1-1a2 2 0 0 0-2.8 0l-2.8 2.8a2 2 0 0 1-2.8 0L9.8 21" />
            <path d="m3 3 1 1a2 2 0 0 0 2.8 0l2.8-2.8a2 2 0 0 1 2.8 0L14.2 3" />
            <path d="m18 15 3 3" />
            <path d="m3 6 3 3" />
          </svg>
          <span className="font-body text-[11px] font-medium leading-tight">Fitness</span>
        </button>

        {/* Tab 4: Done */}
        <button
          type="button"
          onClick={() => onSelectTab('done')}
          aria-label="Done"
          aria-current={currentTab === 'done' ? 'page' : undefined}
          className={`flex-1 min-h-[56px] rounded-[18px] border-none flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            currentTab === 'done'
              ? 'bg-[#17212B] text-white'
              : 'bg-transparent text-[#55636F] hover:bg-black/5'
          }`}
        >
          {/* Done icon: single check mark */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="font-body text-[11px] font-medium leading-tight">Done</span>
        </button>
      </div>
    </nav>
  );
};
