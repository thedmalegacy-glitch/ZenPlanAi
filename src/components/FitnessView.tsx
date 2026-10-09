import React, { useState } from 'react';
import { WorkoutExercise } from '../types';

export const EXERCISE_LIBRARY: WorkoutExercise[] = [
  // ================= DUMBBELL HOME WORKOUTS =================
  {
    id: 'w_db_goblet_squat',
    name: 'Dumbbell Goblet Squats',
    category: 'strength',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    targetMuscle: 'Quadriceps, Glutes & Core',
    defaultDurationMin: 12,
    instructions: [
      'Hold a single dumbbell vertically against your chest with both hands under the top bell.',
      'Set feet shoulder-width apart, elbows pointing down inside knees.',
      'Inhale, brace core, and sit deep into hips until thighs are parallel to floor.',
      'Drive powerfully through mid-foot and heels to stand. Complete 3 sets of 10-12 reps.',
    ],
    tips: 'Keep chest proud and elbows tucked. Do not let knees cave inward.',
  },
  {
    id: 'w_db_romanian_deadlift',
    name: 'Dumbbell Romanian Deadlifts (RDL)',
    category: 'strength',
    equipment: 'dumbbells',
    difficulty: 'intermediate',
    targetMuscle: 'Hamstrings, Glutes & Erector Spinae',
    defaultDurationMin: 12,
    instructions: [
      'Stand holding a dumbbell in each hand in front of your thighs with a slight knee bend.',
      'Hinge backward at hips, sliding dumbbells down along shins while keeping spine neutral.',
      'Lower until feeling a deep stretch in hamstrings (around mid-shin level).',
      'Contract glutes and drive hips forward to return to standing. Complete 3 sets of 10 reps.',
    ],
    tips: 'Movement comes from hip hinge, not bending knees. Keep dumbbells grazing your legs.',
  },
  {
    id: 'w_db_floor_press',
    name: 'Dumbbell Floor Press',
    category: 'strength',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    targetMuscle: 'Chest, Triceps & Front Deltoids',
    defaultDurationMin: 10,
    instructions: [
      'Lie flat on your back on a mat with knees bent and feet flat on the floor.',
      'Hold dumbbells at 45-degree angle to torso with elbows resting lightly on floor.',
      'Press dumbbells upward together until arms are extended above chest.',
      'Lower under control until upper arms touch the floor softly. Complete 3 sets of 10-12 reps.',
    ],
    tips: 'The floor naturally protects your shoulders from excessive hyperextension.',
  },
  {
    id: 'w_db_bent_over_row',
    name: 'Dumbbell Bent-Over Rows',
    category: 'strength',
    equipment: 'dumbbells',
    difficulty: 'intermediate',
    targetMuscle: 'Lats, Rhomboids & Posterior Deltoids',
    defaultDurationMin: 10,
    instructions: [
      'Hold dumbbells with neutral grip, hinge hips 45 degrees forward with flat spine.',
      'Pull elbows toward hips, retracting shoulder blades at peak contraction.',
      'Pause for 1 second at top squeeze.',
      'Lower weights smoothly with control. Complete 3 sets of 12 reps.',
    ],
    tips: 'Avoid jerking with your lower back; let back and lat muscles do the pulling.',
  },
  {
    id: 'w_db_overhead_press',
    name: 'Standing Dumbbell Shoulder Press',
    category: 'strength',
    equipment: 'dumbbells',
    difficulty: 'intermediate',
    targetMuscle: 'Deltoids, Upper Traps & Triceps',
    defaultDurationMin: 10,
    instructions: [
      'Stand feet shoulder-width, bring dumbbells to shoulder height with palms facing forward.',
      'Brace core and glutes to lock your torso in place without arching lower back.',
      'Press dumbbells overhead until arms lock out smoothly over crown of head.',
      'Lower dumbbells back to ear level with control. Complete 3 sets of 8-10 reps.',
    ],
    tips: 'Squeeze glutes tight to stabilize spine during the overhead lockout.',
  },
  {
    id: 'w_db_bicep_curl',
    name: 'Dumbbell Hammer Curls',
    category: 'strength',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    targetMuscle: 'Biceps, Brachialis & Forearms',
    defaultDurationMin: 8,
    instructions: [
      'Stand tall holding dumbbells at sides with palms facing inward toward each other.',
      'Keeping elbows pinned near ribs, curl dumbbells upward toward shoulders.',
      'Squeeze biceps at the top for 1 full second.',
      'Lower slowly for 3 seconds back to starting position. Complete 3 sets of 12 reps.',
    ],
    tips: 'Keep elbows still; don’t swing momentum from your hips.',
  },
  {
    id: 'w_db_overhead_tricep',
    name: 'Overhead Dumbbell Triceps Extension',
    category: 'strength',
    equipment: 'dumbbells',
    difficulty: 'beginner',
    targetMuscle: 'Triceps (Long Head)',
    defaultDurationMin: 8,
    instructions: [
      'Sit or stand tall, holding one dumbbell overhead with both hands cup-gripping top plate.',
      'Keep elbows pointing forward and tucked close to ears.',
      'Lower dumbbell behind your neck until elbows hit 90-degree flexion.',
      'Press back up, squeezing triceps at top. Complete 3 sets of 12 reps.',
    ],
    tips: 'Keep core engaged so ribs do not flare upward.',
  },
  {
    id: 'w_db_renegade_row',
    name: 'Dumbbell Renegade Rows',
    category: 'core',
    equipment: 'dumbbells',
    difficulty: 'advanced',
    targetMuscle: 'Anti-Rotation Core, Lats & Obliques',
    defaultDurationMin: 12,
    instructions: [
      'Start in a full push-up plank position with hands gripping hex dumbbells on floor.',
      'Widen feet slightly for stability and lock pelvis square to floor.',
      'Row right dumbbell to hip, balancing on opposite hand and toes without rocking hips.',
      'Place dumbbell down smoothly and alternate to left side. Complete 16 total reps (8 per side).',
    ],
    tips: 'Wider feet prevent hip sway. Fight rotational movement with tight abdominal brace.',
  },

  // ================= HOME BODYWEIGHT & CALISTHENICS =================
  {
    id: 'w_bodyweight_squats',
    name: 'Tempo Air Squats & Pulse',
    category: 'strength',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    targetMuscle: 'Quadriceps, Glutes & Adductors',
    defaultDurationMin: 10,
    instructions: [
      'Stand feet shoulder-width apart, toes turned slightly outward.',
      'Send hips back and down for a slow 3-second descent.',
      'Hold the bottom parallel position for a 1-second pulse.',
      'Press firmly through whole foot to stand. Complete 3 sets of 15 reps.',
    ],
    tips: 'Inhale on the way down, exhale as you drive back up.',
  },
  {
    id: 'w_desk_pushups',
    name: 'Standard / Elevated Push-Ups',
    category: 'strength',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    targetMuscle: 'Chest, Triceps & Anterior Deltoids',
    defaultDurationMin: 8,
    instructions: [
      'Set hands slightly wider than shoulders on floor (or elevated on counter/bench).',
      'Body forms a rigid plank from heels to crown of head.',
      'Lower chest until 2 inches from floor with elbows tracking 45 degrees back.',
      'Push floor away with full lockout. Complete 3 sets of 10-15 reps.',
    ],
    tips: 'Squeeze glutes and abs throughout to keep hips in line.',
  },
  {
    id: 'w_walking_lunges',
    name: 'Walking Lunges & Knee Drive',
    category: 'strength',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    targetMuscle: 'Quads, Hamstrings, Glutes & Balance',
    defaultDurationMin: 10,
    instructions: [
      'Step forward with right foot, lowering back knee until both knees bend 90 degrees.',
      'Keep front knee tracking over middle toe and torso upright.',
      'Drive through front heel to step directly into next forward lunge.',
      'Complete 20 total paces (10 each leg).',
    ],
    tips: 'Lightly tap back knee to floor; avoid slamming joint.',
  },
  {
    id: 'w_chair_dips',
    name: 'Chair / Couch Triceps Dips',
    category: 'strength',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    targetMuscle: 'Triceps & Lower Pectorals',
    defaultDurationMin: 8,
    instructions: [
      'Sit on edge of sturdy chair or couch, place hands adjacent to hips gripping edge.',
      'Slide hips off edge with knees bent (or legs straight for more challenge).',
      'Lower hips by bending elbows to 90 degrees, keeping back close to chair.',
      'Press through palms back up to full extension. Complete 3 sets of 12 reps.',
    ],
    tips: 'Keep shoulders pulled down away from ears throughout motion.',
  },

  // ================= CORE & ABDOMINALS =================
  {
    id: 'w_plank_hold',
    name: 'Forearm Pillar Plank',
    category: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    targetMuscle: 'Transverse Abdominis & Deep Stabilizers',
    defaultDurationMin: 6,
    instructions: [
      'Set forearms on floor with elbows directly under shoulders.',
      'Extend legs straight, resting on balls of feet.',
      'Draw navel inward, tuck pelvis slightly, and squeeze quadriceps.',
      'Hold position with steady nasal breathing for 45-60 seconds. Repeat 3x.',
    ],
    tips: 'Gaze should be at floor just past knuckles to keep neck neutral.',
  },
  {
    id: 'w_deadbug',
    name: 'Dead Bug Spine Integrator',
    category: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    targetMuscle: 'Lower Abs, Pelvic Floor & Anti-Extension',
    defaultDurationMin: 8,
    instructions: [
      'Lie flat on back with arms pointing to ceiling and knees bent 90 degrees in air.',
      'Flatten lower back firmly into floor so no hand can slide underneath.',
      'Slowly extend right arm overhead while lowering left leg straight toward floor.',
      'Return to center and switch opposite limbs. Complete 16 total controlled reps.',
    ],
    tips: 'If lower back arches off floor, do not lower leg as far.',
  },
  {
    id: 'w_mountain_climbers',
    name: 'Cross-Body Mountain Climbers',
    category: 'core',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    targetMuscle: 'Obliques, Rectus Abdominis & Shoulder Girdle',
    defaultDurationMin: 8,
    instructions: [
      'Assume high push-up plank with hands stacked under shoulders.',
      'Drive right knee toward left elbow, contracting oblique.',
      'Step back quickly and drive left knee toward right elbow.',
      'Maintain steady cadence for 40 seconds. Rest 20 seconds. Repeat 3x.',
    ],
    tips: 'Keep hips level; don’t bounce hips up into the air.',
  },
  {
    id: 'w_russian_twists',
    name: 'Dumbbell Russian Twists',
    category: 'core',
    equipment: 'dumbbells',
    difficulty: 'intermediate',
    targetMuscle: 'Obliques & Transverse Abdominis',
    defaultDurationMin: 8,
    instructions: [
      'Sit on floor with knees bent, lean torso back 45 degrees holding a dumbbell with both hands.',
      'Lift feet 2 inches off floor for added challenge (or keep heels anchored).',
      'Rotate torso smoothly to tap dumbbell to right hip floor, then rotate to left hip.',
      'Complete 20 total twists (10 per side) with strict control.',
    ],
    tips: 'Rotate from your ribs and thoracic spine, not just waving your arms.',
  },

  // ================= CARDIO & HIIT =================
  {
    id: 'w_shadow_boxing',
    name: 'Shadow Boxing & Footwork Burner',
    category: 'cardio',
    equipment: 'none',
    difficulty: 'beginner',
    targetMuscle: 'Cardiovascular, Shoulders & Agility',
    defaultDurationMin: 12,
    instructions: [
      'Adopt athletic boxer stance, hands guarding chin.',
      'Throw crisp 1-2 (jab-cross) combinations, rotating through hips and balls of feet.',
      'Add hooks, slips, and light lateral hops for 3 minutes continuously.',
      'Rest 45 seconds and repeat for 3 intense rounds.',
    ],
    tips: 'Keep shoulders relaxed and exhale sharply with every punch.',
  },
  {
    id: 'w_hiit_jumping_jacks',
    name: 'HIIT Jumping Jacks & Squat Jumps',
    category: 'cardio',
    equipment: 'none',
    difficulty: 'intermediate',
    targetMuscle: 'Full Body Aerobic Conditioning',
    defaultDurationMin: 10,
    instructions: [
      'Minute 1: 45s brisk jumping jacks, 15s rest.',
      'Minute 2: 45s low-impact bodyweight squat pulses, 15s rest.',
      'Minute 3: 45s high knees or march in place, 15s rest.',
      'Repeat circuit twice through for 10-minute aerobic reset.',
    ],
    tips: 'Land softly on balls of feet to protect joints.',
  },
  {
    id: 'w_brisk_walk',
    name: 'Outdoor Power Walk & Posture Reset',
    category: 'cardio',
    equipment: 'none',
    difficulty: 'beginner',
    targetMuscle: 'Cardiovascular & Lower Body Circulation',
    defaultDurationMin: 15,
    instructions: [
      'Step away from screens and head outside or walk indoor concourse.',
      'Maintain an active, intentional pace (110-120 steps/min).',
      'Swing arms naturally, keeping shoulders back and gaze toward horizon.',
      'Practice rhythmic 4-count inhale, 4-count exhale nasal breathing.',
    ],
    tips: 'Promotes blood circulation, clearing cognitive fatigue and lowering cortisol.',
  },

  // ================= MOBILITY & DESK DECOMPRESSION =================
  {
    id: 'w_desk_stretch',
    name: 'Desk Decompression & Neck Rolls',
    category: 'mobility',
    equipment: 'none',
    difficulty: 'beginner',
    targetMuscle: 'Cervical Spine, Trapezius & Upper Back',
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
    equipment: 'none',
    difficulty: 'beginner',
    targetMuscle: 'Piriformis, Glutes & Hip Capsule',
    defaultDurationMin: 5,
    instructions: [
      'Sit toward front edge of chair with feet flat on floor.',
      'Cross right ankle over left knee, forming a figure-four shape.',
      'Hinge gently at hips with flat back until stretch is felt in glute.',
      'Hold 45 seconds, then switch to left leg.',
    ],
    tips: 'Keep foot of crossed leg flexed (toes pulled back) to protect knee.',
  },
  {
    id: 'w_thoracic_twist',
    name: 'World’s Greatest Stretch & Thoracic Rotation',
    category: 'mobility',
    equipment: 'none',
    difficulty: 'intermediate',
    targetMuscle: 'Hip Flexors, Hamstrings & Thoracic Spine',
    defaultDurationMin: 8,
    instructions: [
      'Step into deep lunge with right foot forward and left hand on floor.',
      'Drop right elbow toward inner right instep for 2 seconds.',
      'Rotate right arm up toward ceiling, following fingers with eyes.',
      'Place hand down, push hips up to stretch front hamstring. Repeat 5x per side.',
    ],
    tips: 'The single best full-body mobility flow for desk workers and lifters alike.',
  },
];

interface FitnessViewProps {
  onAddAsTask?: (exercise: WorkoutExercise) => void;
}

export const FitnessView: React.FC<FitnessViewProps> = ({ onAddAsTask }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'strength' | 'core' | 'cardio' | 'mobility'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<'all' | 'dumbbells' | 'bodyweight' | 'none'>('all');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const filtered = EXERCISE_LIBRARY.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesEq = selectedEquipment === 'all' || (item.equipment || 'none') === selectedEquipment;
    return matchesCat && matchesEq;
  });

  const handleScheduleExercise = (e: WorkoutExercise) => {
    if (onAddAsTask) {
      onAddAsTask(e);
      setAddedToast(`Added "${e.name}" to today's schedule`);
      setTimeout(() => setAddedToast(null), 2500);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedExerciseId((prev) => (prev === id ? null : id));
  };

  const dumbbellCount = EXERCISE_LIBRARY.filter((e) => e.equipment === 'dumbbells').length;
  const bodyweightCount = EXERCISE_LIBRARY.filter((e) => e.equipment === 'bodyweight').length;

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div>
        <h1 className="font-heading text-[28px] font-bold text-[#17212B] leading-tight">
          Physical Vitality
        </h1>
        <p className="font-body text-[13px] text-[#55636F] mt-0.5">
          Home workouts, dumbbell strength routines & mobility breaks for high performance.
        </p>
      </div>

      {/* Equipment Quick Filter Cards */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setSelectedEquipment(selectedEquipment === 'dumbbells' ? 'all' : 'dumbbells')}
          className={`min-h-[48px] p-2.5 rounded-[16px] border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-95 ${
            selectedEquipment === 'dumbbells'
              ? 'bg-[#17212B] text-white border-[#17212B] shadow-xs'
              : 'bg-white border-[#DDE5EA] text-[#17212B] hover:border-[#C9D4DC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold">Dumbbells</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              selectedEquipment === 'dumbbells' ? 'bg-white/20 text-white' : 'bg-[#EEF3F6] text-[#55636F]'
            }`}>
              {dumbbellCount}
            </span>
          </div>
          <span className={`text-[10px] ${selectedEquipment === 'dumbbells' ? 'text-white/70' : 'text-[#55636F]'}`}>
            Home weights
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedEquipment(selectedEquipment === 'bodyweight' ? 'all' : 'bodyweight')}
          className={`min-h-[48px] p-2.5 rounded-[16px] border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-95 ${
            selectedEquipment === 'bodyweight'
              ? 'bg-[#17212B] text-white border-[#17212B] shadow-xs'
              : 'bg-white border-[#DDE5EA] text-[#17212B] hover:border-[#C9D4DC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold">Bodyweight</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              selectedEquipment === 'bodyweight' ? 'bg-white/20 text-white' : 'bg-[#EEF3F6] text-[#55636F]'
            }`}>
              {bodyweightCount}
            </span>
          </div>
          <span className={`text-[10px] ${selectedEquipment === 'bodyweight' ? 'text-white/70' : 'text-[#55636F]'}`}>
            No equipment
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedEquipment('all');
            setSelectedCategory('all');
          }}
          className={`min-h-[48px] p-2.5 rounded-[16px] border text-left flex flex-col justify-between transition-all cursor-pointer active:scale-95 ${
            selectedEquipment === 'all' && selectedCategory === 'all'
              ? 'bg-[#17212B] text-white border-[#17212B] shadow-xs'
              : 'bg-white border-[#DDE5EA] text-[#17212B] hover:border-[#C9D4DC]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold">All Library</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              selectedEquipment === 'all' && selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-[#EEF3F6] text-[#55636F]'
            }`}>
              {EXERCISE_LIBRARY.length}
            </span>
          </div>
          <span className={`text-[10px] ${selectedEquipment === 'all' && selectedCategory === 'all' ? 'text-white/70' : 'text-[#55636F]'}`}>
            Full catalog
          </span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(['all', 'strength', 'core', 'cardio', 'mobility'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[44px] px-3.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              selectedCategory === cat
                ? 'bg-[#17212B] text-white shadow-xs'
                : 'bg-white border border-[#DDE5EA] text-[#55636F] hover:bg-[#EEF3F6]'
            }`}
          >
            {cat === 'all' ? 'All Types' : cat}
          </button>
        ))}
      </div>

      {/* Toast Notification */}
      {addedToast && (
        <div className="p-3 bg-[#DDF0EE] text-[#1F6F6F] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {addedToast}
        </div>
      )}

      {/* Exercise Count & List */}
      <div className="flex items-center justify-between px-1 text-xs text-[#55636F]">
        <span>Showing {filtered.length} routines</span>
        {selectedEquipment !== 'all' && (
          <span className="capitalize font-semibold text-[#17212B]">
            Filter: {selectedEquipment}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#DDE5EA] rounded-[18px]">
            <p className="text-sm text-[#55636F]">No exercises found for this filter combination.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedEquipment('all');
              }}
              className="mt-3 min-h-[44px] px-4 rounded-full bg-[#17212B] text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedExerciseId === item.id;
            const isDumbbell = item.equipment === 'dumbbells';

            return (
              <div
                key={item.id}
                className="w-full bg-white border border-[#DDE5EA] rounded-[18px] p-4 text-left transition-all hover:border-[#C9D4DC]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2 h-2 rounded-full ${isDumbbell ? 'bg-[#F2A33A]' : 'bg-[#2A8C8C]'}`} />
                      <h3 className="font-heading font-semibold text-[15px] text-[#17212B]">
                        {item.name}
                      </h3>
                      {item.equipment === 'dumbbells' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF4E8] text-[#8A5A0C]">
                          Dumbbells
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-[#55636F]">
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
                    className="min-h-[44px] min-w-[44px] px-3.5 rounded-full bg-[#E3E8F6] text-[#2F3E8F] text-xs font-bold flex items-center gap-1.5 hover:bg-[#d2dcf5] active:scale-95 transition-all cursor-pointer flex-shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add</span>
                  </button>
                </div>

                {/* Instruction / Protocol details (clickable accordion toggle) */}
                <div className="mt-3 pt-3 border-t border-[#EEF3F6] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#17212B]">
                      Instructions ({item.instructions.length} steps)
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="min-h-[44px] text-xs text-[#55636F] hover:text-[#17212B] flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Protocol'}</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="space-y-2.5 pt-1 animate-fadeIn">
                      <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[12px] text-[#55636F]">
                        {item.instructions.map((step, idx) => (
                          <li key={idx} className="leading-relaxed pl-1">{step}</li>
                        ))}
                      </ol>

                      {item.tips && (
                        <div className="p-3 rounded-xl bg-[#EEF3F6] text-[11px] text-[#55636F] border border-[#DDE5EA]/60">
                          <span className="font-bold text-[#17212B] mr-1">Coach Note:</span>
                          {item.tips}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
