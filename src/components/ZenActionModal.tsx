import React, { useState } from 'react';
import { Task } from '../types';

interface ZenActionModalProps {
  type: 'plan' | 'break' | 'review' | null;
  tasks: Task[];
  onClose: () => void;
  onApplyPlan?: (rebalancedTasks: Task[]) => void;
  onApplySubtasks?: (taskId: string, subtasks: string[]) => void;
}

export const ZenActionModal: React.FC<ZenActionModalProps> = ({
  type,
  tasks,
  onClose,
  onApplyPlan,
  onApplySubtasks,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [goalText, setGoalText] = useState('');
  const [generatedSteps, setGeneratedSteps] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [planSummary, setPlanSummary] = useState<string>('');

  if (!type) return null;

  // Handler for Break Goal into steps
  const handleGenerateBreakdown = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Deterministic smart breakdown tailored to the goal or selected task
      const targetTask = tasks.find((t) => t.id === selectedTaskId);
      const subject = goalText.trim() || targetTask?.title || 'Project goal';

      const templates = [
        `Outline scope & requirements for "${subject}"`,
        `Gather background research and essential inputs`,
        `Draft core prototype or initial iteration`,
        `Review details against quality standards`,
        `Finalize deliverables and share updates with stakeholders`,
      ];

      setGeneratedSteps(templates);
      setIsProcessing(false);
    }, 450);
  };

  const handleApplySteps = () => {
    if (!selectedTaskId || generatedSteps.length === 0) return;
    if (onApplySubtasks) {
      onApplySubtasks(selectedTaskId, generatedSteps);
    }
    onClose();
  };

  // Handler for Plan Day (Smart Schedule)
  const handleAutoSchedule = () => {
    setIsProcessing(true);
    setTimeout(() => {
      // Sort uncompleted tasks without time and allocate morning to evening slots
      let currentHour = 9;
      let currentMinute = 0;

      const updated = tasks.map((t) => {
        if (t.completed) return t;
        const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        // Advance time by duration + 15m buffer
        const dur = t.durationMinutes || 30;
        currentMinute += dur + 15;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
        return {
          ...t,
          startTime: t.startTime || timeSlot,
        };
      });

      setPlanSummary(`Optimized ${tasks.filter((t) => !t.completed).length} pending tasks into balanced focus blocks with 15-min buffers.`);
      setIsProcessing(false);
      if (onApplyPlan) {
        onApplyPlan(updated);
      }
    }, 500);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-[20px] border border-[#DDE5EA] p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EEF3F6]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2A33A]" />
            <h2 className="font-heading text-xl font-bold text-[#17212B]">
              {type === 'plan' && 'Plan Day & Auto-Schedule'}
              {type === 'break' && 'Break Goal into Subtasks'}
              {type === 'review' && 'Weekly Review & Focus Balance'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-11 h-11 flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content based on type */}
        <div className="mt-4 space-y-4">
          {/* 1. PLAN DAY */}
          {type === 'plan' && (
            <div>
              <p className="text-sm text-[#55636F] leading-relaxed">
                ZenPlan organizes your unscheduled tasks into balanced daylight blocks between 09:00 and 18:00 with breathing room in between.
              </p>

              {planSummary ? (
                <div className="mt-4 p-4 rounded-xl bg-[#DDF0EE] text-[#1F6F6F] text-sm font-medium">
                  ✓ {planSummary}
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-xl bg-[#EEF3F6] space-y-2">
                  <div className="flex justify-between text-xs text-[#55636F]">
                    <span>Pending Tasks to schedule</span>
                    <span className="font-bold text-[#17212B]">{tasks.filter((t) => !t.completed).length} tasks</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#55636F]">
                    <span>Default Buffer</span>
                    <span className="font-bold text-[#17212B]">15 mins</span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 py-2.5 rounded-full border border-[#C9D4DC] text-sm text-[#55636F] font-medium"
                >
                  {planSummary ? 'Done' : 'Cancel'}
                </button>
                {!planSummary && (
                  <button
                    type="button"
                    onClick={handleAutoSchedule}
                    disabled={isProcessing}
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#F2A33A] text-[#17212B] text-sm font-bold hover:bg-[#e09228] transition-colors"
                  >
                    {isProcessing ? 'Optimizing...' : 'Rebalance Schedule'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. BREAK GOAL */}
          {type === 'break' && (
            <div>
              <p className="text-sm text-[#55636F] mb-3 leading-relaxed">
                Transform any ambiguous goal or complex task into small, frictionless action steps.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#55636F] mb-1">
                    Select Target Task or Type Goal
                  </label>
                  {tasks.length > 0 && (
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDE5EA] bg-white text-sm mb-2 text-[#17212B]"
                    >
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="Or type a custom goal here..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE5EA] bg-white text-[#17212B] text-sm focus:border-[#F2A33A] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateBreakdown}
                  disabled={isProcessing}
                  className="w-full min-h-[44px] rounded-xl bg-[#EEF3F6] text-[#17212B] text-xs font-bold hover:bg-[#DDE5EA] transition-colors"
                >
                  {isProcessing ? 'Generating Steps...' : 'Generate 5 Actionable Steps'}
                </button>

                {generatedSteps.length > 0 && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-[#EEF3F6]">
                    <div className="text-xs font-semibold text-[#17212B]">Generated Steps:</div>
                    {generatedSteps.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-[#FAFCFD] border border-[#EEF3F6] rounded-lg text-xs text-[#17212B]">
                        <span className="w-5 h-5 rounded-full bg-[#E3E8F6] text-[#2F3E8F] flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{s}</span>
                      </div>
                    ))}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleApplySteps}
                        className="min-h-[44px] px-6 py-2 rounded-full bg-[#17212B] text-white text-xs font-bold"
                      >
                        Attach Steps to Task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. REVIEW */}
          {type === 'review' && (
            <div>
              <p className="text-sm text-[#55636F] leading-relaxed mb-4">
                Weekly rhythm assessment and focus distribution:
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 rounded-2xl bg-[#EEF3F6] text-center">
                  <div className="font-heading font-bold text-2xl text-[#17212B]">{completionRate}%</div>
                  <div className="text-[11px] font-medium text-[#55636F] uppercase tracking-wider mt-0.5">
                    Completion Rate
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#DDF0EE] text-center">
                  <div className="font-heading font-bold text-2xl text-[#1F6F6F]">{completedCount} of {totalCount}</div>
                  <div className="text-[11px] font-medium text-[#1F6F6F] uppercase tracking-wider mt-0.5">
                    Tasks Finished
                  </div>
                </div>
              </div>

              {/* Category distribution */}
              <div className="p-4 rounded-2xl border border-[#DDE5EA] space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#55636F]">
                  Distribution by Category
                </div>
                {(['work', 'meeting', 'fitness', 'personal'] as const).map((cat) => {
                  const catTasks = tasks.filter((t) => t.category === cat);
                  const count = catTasks.length;
                  const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize font-medium text-[#17212B]">{cat}</span>
                        <span className="text-[#55636F]">{count} tasks ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#EEF3F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              cat === 'work' ? '#2F3E8F' : cat === 'meeting' ? '#E4572E' : cat === 'fitness' ? '#2A8C8C' : '#7A5FA8',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#17212B] text-white text-sm font-semibold"
                >
                  Close Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
