import React, { useState } from 'react';
import { WorkoutExercise } from '../types';

export const EXERCISE_LIBRARY: WorkoutExercise[] = [
  {
    id: 'w_desk_stretch',
    name: 'Desk Decompression & Neck Rolls',
    category: 'mobility',
    targetMuscle: 'Cervical Spine & Trapezius',
    defaultDurationMin: 5,
    instructions: [
      'Sit upright with shoulders relaxed down away from ears.',
      'Gently lower chin to chest, holding for 3 deep breaths.',
      'Slowly roll head to the right, pausing where tension is felt.',
      'Reverse rotation smoothly for 5 repetitions each direction.',
    ],
    tips: 'Never force range of motion; breathe evenly into stiff spots.',
  },
  {
    id: 'w_hip_openers',
    name: 'Seated Figure-4 Hip Opener',
    category: 'mobility',
    targetMuscle: 'Piriformis & Glutes',
    defaultDurationMin: 5,
    instructions: [
      'Sit toward front edge of chair with feet flat on floor.',
      'Cross right ankle over left knee, forming a figure-four shape.',
      'Hinge gently at hips with flat back until stretch is felt.',
      'Hold 30-45 seconds, then switch to left leg.',
    ],
    tips: 'Keep foot of crossed leg dorsiflexed (toes pulled back) to protect knee.',
  },
  {
    id: 'w_bodyweight_squats',
    name: 'Tempo Air Squats',
    category: 'strength',
    targetMuscle: 'Quadriceps, Glutes & Core',
    defaultDurationMin: 10,
    instructions: [
      'Stand feet shoulder-width apart, toes turned slightly outward.',
      'Send hips back and down, keeping chest tall and knees tracking toes.',
      'Descend until thighs are parallel to ground (or comfortable depth).',
      'Press firmly through heels to return to standing position. Complete 15 reps.',
    ],
    tips: 'Inhale on the way down, exhale as you drive back up.',
  },
  {
    id: 'w_desk_pushups',
    name: 'Elevated Desk Push-Ups',
    category: 'strength',
    targetMuscle: 'Pectorals, Triceps & Anterior Deltoids',
    defaultDurationMin: 8,
    instructions: [
      'Place hands slightly wider than shoulder-width on sturdy desk or counter.',
      'Step feet back until body forms a straight line from heels to head.',
      'Lower chest towards desk edge with elbows at 45-degree angle.',
      'Press through palms to lockout. Complete 10-12 controlled reps.',
    ],
    tips: 'Engage glutes and core to avoid sagging lower back.',
  },
  {
    id: 'w_plank_hold',
    name: 'Forearm Pillar Plank',
    category: 'core',
    targetMuscle: 'Transverse Abdominis & Scapular Stabilizers',
    defaultDurationMin: 6,
    instructions: [
      'Set forearms on mat or carpet with elbows directly under shoulders.',
      'Extend legs straight, resting on balls of feet.',
      'Draw navel inward, tuck pelvis slightly, and squeeze quadriceps.',
      'Hold position with steady nasal breathing for 45 seconds. Rest and repeat 2x.',
    ],
    tips: 'Gaze should be at floor just past knuckles to keep neck neutral.',
  },
  {
    id: 'w_brisk_walk',
    name: 'Brisk Walking & Posture Reset',
    category: 'cardio',
    targetMuscle: 'Cardiovascular & Lower Body Endurance',
    defaultDurationMin: 15,
    instructions: [
      'Step away from screens and step outside or walk hallways.',
      'Maintain an active, intentional pace (110-120 steps/min).',
      'Swing arms naturally, keeping shoulders back and eyes ahead.',
      'Focus on rhythmic belly breathing.',
    ],
    tips: 'Use this time for mental digestion or creative problem solving without audio.',
  },
];

interface FitnessViewProps {
  onAddAsTask?: (exercise: WorkoutExercise) => void;
}

export const FitnessView: React.FC<FitnessViewProps> = ({ onAddAsTask }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mobility' | 'strength' | 'core' | 'cardio'>('all');
  const [activeExercise, setActiveExercise] = useState<WorkoutExercise | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const filtered = selectedFilter === 'all'
    ? EXERCISE_LIBRARY
    : EXERCISE_LIBRARY.filter((e) => e.category === selectedFilter);

  const handleScheduleExercise = (e: WorkoutExercise) => {
    if (onAddAsTask) {
      onAddAsTask(e);
      setAddedToast(`Added "${e.name}" to today's schedule`);
      setTimeout(() => setAddedToast(null), 2500);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div>
        <h1 className="font-heading text-[28px] font-bold text-[#17212B] leading-tight">
          Physical Vitality
        </h1>
        <p className="font-body text-[13px] text-[#55636F] mt-0.5">
          Science-backed movement breaks tailored to balance intense focus blocks.
        </p>
      </div>

      {/* Toast */}
      {addedToast && (
        <div className="p-3 bg-[#DDF0EE] text-[#1F6F6F] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {addedToast}
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(['all', 'mobility', 'strength', 'core', 'cardio'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedFilter(cat)}
            className={`min-h-[44px] px-4 rounded-full text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
              selectedFilter === cat
                ? 'bg-[#17212B] text-white'
                : 'bg-white border border-[#DDE5EA] text-[#55636F] hover:bg-[#EEF3F6]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="w-full bg-white border border-[#DDE5EA] rounded-[18px] p-4 text-left transition-all hover:border-[#C9D4DC]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2A8C8C]" />
                  <h3 className="font-heading font-semibold text-[15px] text-[#17212B]">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs text-[#55636F]">
                  <span className="capitalize font-medium text-[#2A8C8C]">{item.category}</span>
                  <span>•</span>
                  <span>{item.targetMuscle}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#17212B]">{item.defaultDurationMin} mins</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleScheduleExercise(item)}
                aria-label={`Schedule ${item.name} into planner`}
                className="min-h-[44px] px-3.5 rounded-full bg-[#E3E8F6] text-[#2F3E8F] text-xs font-bold flex items-center gap-1 hover:bg-[#d2dcf5] transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add to Day</span>
              </button>
            </div>

            {/* Instruction Accordion */}
            <div className="mt-3 pt-3 border-t border-[#EEF3F6] space-y-2">
              <div className="text-[12px] text-[#55636F]">
                <strong className="text-[#17212B]">Protocol:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1 pl-1">
                  {item.instructions.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>

              {item.tips && (
                <div className="p-2.5 rounded-xl bg-[#EEF3F6] text-[11px] text-[#55636F]">
                  <span className="font-bold text-[#17212B] mr-1">Coach Note:</span>
                  {item.tips}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
