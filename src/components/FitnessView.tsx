import React, { useState, useEffect, useRef } from 'react';
import { WorkoutExercise } from '../types';
import {
  ChestAnatomySvg,
  BackAnatomySvg,
  LegsAnatomySvg,
  GluteusAnatomySvg,
  DeltoidsAnatomySvg,
  ArmsAnatomySvg,
  AbsAnatomySvg,
  CardioAnatomySvg,
  DumbbellPulloverHeroSvg,
  getMuscleSvg,
} from './FitnessAnatomySvgs';
import { playNotificationChime, triggerDeviceVibration } from '../utils/notifications';
import { ZenPlanLogo } from './ZenPlanLogo';

export interface MuscleGroupInfo {
  id: string;
  name: string;
  subtitle: string;
  exercisesCount: number;
  durationLabel: string;
  category: 'strength' | 'core' | 'cardio' | 'mobility';
  svg: React.FC<{ className?: string; width?: number; height?: number }>;
  focusDescription: string;
}

export const MUSCLE_GROUPS: MuscleGroupInfo[] = [
  {
    id: 'chest',
    name: 'Chest',
    subtitle: 'Pectoralis major, minor & serratus anterior',
    exercisesCount: 6,
    durationLabel: '~ 45m',
    category: 'strength',
    svg: ChestAnatomySvg,
    focusDescription: 'Hypertrophy & functional pushing power with dumbbell presses and pullovers.',
  },
  {
    id: 'back',
    name: 'Back',
    subtitle: 'Latissimus dorsi, trapezius & rhomboids',
    exercisesCount: 6,
    durationLabel: '~ 45m',
    category: 'strength',
    svg: BackAnatomySvg,
    focusDescription: 'V-taper posture, heavy dumbbell rows, and thoracic extension.',
  },
  {
    id: 'legs',
    name: 'Legs',
    subtitle: 'Quadriceps, hamstrings & calves',
    exercisesCount: 6,
    durationLabel: '~ 50m',
    category: 'strength',
    svg: LegsAnatomySvg,
    focusDescription: 'Deep goblet squats, Romanian deadlifts, and unilateral leg drive.',
  },
  {
    id: 'gluteus',
    name: 'Gluteus',
    subtitle: 'Gluteus maximus, medius & hip abductors',
    exercisesCount: 5,
    durationLabel: '~ 35m',
    category: 'strength',
    svg: GluteusAnatomySvg,
    focusDescription: 'Hip thrusts, sumo squats, and pelvics stabilization for athletic performance.',
  },
  {
    id: 'deltoids',
    name: 'Deltoids',
    subtitle: 'Anterior, lateral & posterior shoulder heads',
    exercisesCount: 5,
    durationLabel: '~ 35m',
    category: 'strength',
    svg: DeltoidsAnatomySvg,
    focusDescription: '3D boulder shoulders, overhead dumbbell presses, and lateral raises.',
  },
  {
    id: 'arms',
    name: 'Arms',
    subtitle: 'Biceps brachii, brachialis & triceps',
    exercisesCount: 6,
    durationLabel: '~ 30m',
    category: 'strength',
    svg: ArmsAnatomySvg,
    focusDescription: 'Hammer curls, overhead dumbbell extensions, and triceps bench dips.',
  },
  {
    id: 'abs',
    name: 'Abs & Core',
    subtitle: 'Rectus abdominis, obliques & transverse core',
    exercisesCount: 5,
    durationLabel: '~ 25m',
    category: 'core',
    svg: AbsAnatomySvg,
    focusDescription: 'Anti-rotational stability, Russian twists, and core compression.',
  },
  {
    id: 'cardio',
    name: 'Cardio & HIIT',
    subtitle: 'Cardiorespiratory endurance & kinetic agility',
    exercisesCount: 4,
    durationLabel: '~ 30m',
    category: 'cardio',
    svg: CardioAnatomySvg,
    focusDescription: 'High-intensity interval stamina, treadmill pacing, and vital conditioning.',
  },
];

export const WORKOUT_ROUTINES: Record<string, WorkoutExercise[]> = {
  chest: [
    {
      id: 'w_chest_pullover',
      name: 'Horizontal dumbbell bench pullover',
      category: 'strength',
      muscleGroup: 'chest',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Upper Pectorals, Lats & Serratus',
      defaultDurationMin: 10,
      reps: 15,
      sets: 3,
      weightKg: 12,
      restSec: 60,
      instructions: [
        'Lie perpendicular across a flat bench with your upper back supported and hips slightly below bench height.',
        'Cup one dumbbell overhead with both hands under the top plate, arms nearly straight with a soft elbow bend.',
        'Slowly lower the dumbbell in an arc behind your head until feeling a deep expansion across your ribcage and chest.',
        'Engage pectorals and lats to pull the dumbbell back over your chest. Exhale powerfully at the peak contraction.',
      ],
      tips: 'Keep hips low and do not arch your lower spine excessively. Breathe deeply into your ribs on the descent.',
    },
    {
      id: 'w_chest_incline_press',
      name: '45-degree incline dumbbell bench press',
      category: 'strength',
      muscleGroup: 'chest',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Clavicular (Upper) Chest & Triceps',
      defaultDurationMin: 12,
      reps: 15,
      sets: 3,
      weightKg: 14,
      restSec: 60,
      instructions: [
        'Set an adjustable bench to 30-45 degrees. Kick dumbbells up to shoulder level as you lie back.',
        'Retract your shoulder blades and plant feet firmly on the gym floor.',
        'Press weights upward and slightly inward until arms are fully extended above your upper chest.',
        'Lower weights smoothly for 3 seconds until bells touch light chest stretch, then drive upward.',
      ],
      tips: 'Keep elbows tucked at a 45-degree angle to your torso; do not flare elbows straight out.',
    },
    {
      id: 'w_chest_floor_fly',
      name: 'Seated cable / dumbbell fly',
      category: 'strength',
      muscleGroup: 'chest',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Sternal Pectoralis Major',
      defaultDurationMin: 10,
      reps: 12,
      sets: 4,
      weightKg: 10,
      restSec: 45,
      instructions: [
        'Lie on flat bench or floor with dumbbells extended above mid-chest, palms facing each other.',
        'With a slight fixed bend in elbows, open your arms wide like hugging a large tree trunk.',
        'Lower until feeling a deep pectoral stretch, then contract chest to bring dumbbells back together.',
      ],
      tips: 'Imagine squeezing your inner chest together at the apex of the rep.',
    },
    {
      id: 'w_chest_floor_press',
      name: 'Dumbbell floor press',
      category: 'strength',
      muscleGroup: 'chest',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Mid Pectorals & Triceps Lockout',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 16,
      restSec: 60,
      instructions: [
        'Lie flat on the floor with knees bent and feet planted flat.',
        'Hold dumbbells at 45 degrees, pressing straight up toward the ceiling.',
        'Lower until your triceps gently tap the floor, pause for 1 second to eliminate momentum, then press.',
      ],
      tips: 'Floor contact prevents overextension and keeps shoulders safe under heavy loads.',
    },
    {
      id: 'w_chest_parallel_dips',
      name: 'Parallel bar triceps dips / push-ups',
      category: 'strength',
      muscleGroup: 'chest',
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      targetMuscle: 'Lower Chest & Triceps',
      defaultDurationMin: 8,
      reps: 15,
      sets: 3,
      weightKg: 0,
      restSec: 45,
      instructions: [
        'Grip parallel bars or place hands on elevated surface, leaning your chest slightly forward at 20 degrees.',
        'Lower your body by bending elbows until upper arms are parallel to floor.',
        'Push upward through palms to lock out, contracting chest and triceps.',
      ],
      tips: 'Leaning forward emphasizes chest fibers; staying upright emphasizes triceps.',
    },
    {
      id: 'w_chest_treadmill',
      name: 'Treadmill dynamic warm-up',
      category: 'cardio',
      muscleGroup: 'chest',
      equipment: 'none',
      difficulty: 'beginner',
      targetMuscle: 'Cardiorespiratory & Systemic Blood Flow',
      defaultDurationMin: 10,
      reps: 1,
      sets: 1,
      weightKg: 0,
      restSec: 30,
      instructions: [
        'Set treadmill to moderate incline (3-5%) and brisk walking pace.',
        'Swing arms smoothly across chest to elevate heart rate and lubricate shoulder joints.',
      ],
      tips: 'Gets synovial fluid flowing into shoulders before heavy pressing.',
    },
  ],

  back: [
    {
      id: 'w_back_bent_row',
      name: 'Dumbbell bent-over rows',
      category: 'strength',
      muscleGroup: 'back',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Latissimus Dorsi & Rhomboids',
      defaultDurationMin: 12,
      reps: 12,
      sets: 4,
      weightKg: 16,
      restSec: 60,
      instructions: [
        'Hinge 45 degrees at hips with flat neutral spine and knees soft.',
        'Pull dumbbells toward your waistline, driving elbows back toward the ceiling.',
        'Pause and squeeze shoulder blades together at peak contraction.',
      ],
      tips: 'Do not jerk with your lower back; let your back and lat muscles do the pulling.',
    },
    {
      id: 'w_back_lat_pulldown',
      name: 'Close-grip front lat pulldown / towel rows',
      category: 'strength',
      muscleGroup: 'back',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Latissimus Dorsi & Lower Traps',
      defaultDurationMin: 10,
      reps: 15,
      sets: 3,
      weightKg: 20,
      restSec: 60,
      instructions: [
        'Pull attachment or resistance downward toward upper clavicle while arching chest upward.',
        'Focus on pulling with your elbows, not curling with your hands.',
      ],
      tips: 'Feel the lats flare wide as you return weights to the top stretch.',
    },
    {
      id: 'w_back_rdl',
      name: 'Dumbbell Romanian deadlifts (RDL)',
      category: 'strength',
      muscleGroup: 'back',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Erector Spinae, Hamstrings & Glutes',
      defaultDurationMin: 12,
      reps: 10,
      sets: 3,
      weightKg: 20,
      restSec: 75,
      instructions: [
        'Slide dumbbells down along your shins while pushing hips backward.',
        'Lower until feeling deep hamstring stretch, keep spine locked neutral, then drive hips forward.',
      ],
      tips: 'Movement is a pure hip hinge; keep knees softly bent but not squatting.',
    },
    {
      id: 'w_back_single_row',
      name: 'Single-arm dumbbell lawnmower rows',
      category: 'strength',
      muscleGroup: 'back',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Unilateral Lat & Core Anti-Rotation',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 18,
      restSec: 45,
      instructions: [
        'Brace hand on knee or bench, pull dumbbell in smooth arc into hip pocket.',
        'Control the negative for 2 full seconds.',
      ],
      tips: 'Full stretch at bottom, explosive pull to hip pocket.',
    },
    {
      id: 'w_back_renegade',
      name: 'Dumbbell renegade rows',
      category: 'strength',
      muscleGroup: 'back',
      equipment: 'dumbbells',
      difficulty: 'advanced',
      targetMuscle: 'Upper Back, Obliques & Deep Core',
      defaultDurationMin: 8,
      reps: 10,
      sets: 3,
      weightKg: 12,
      restSec: 60,
      instructions: [
        'Set up in high push-up plank with hands gripping dumbbells.',
        'Row one dumbbell to ribcage while keeping hips parallel to floor without twisting.',
      ],
      tips: 'Widen your foot stance for solid pelvic stability.',
    },
    {
      id: 'w_back_ytw',
      name: 'Prone Y-T-W postural extensions',
      category: 'mobility',
      muscleGroup: 'back',
      equipment: 'none',
      difficulty: 'beginner',
      targetMuscle: 'Lower Traps, Infraspinatus & Rear Delts',
      defaultDurationMin: 6,
      reps: 15,
      sets: 3,
      weightKg: 0,
      restSec: 30,
      instructions: [
        'Lie chest-down on mat. Lift thumbs in Y shape (10 reps), T shape (10 reps), and W shape (10 reps).',
      ],
      tips: 'Excellent desk-slouch corrector for modern screen workers.',
    },
  ],

  legs: [
    {
      id: 'w_leg_goblet',
      name: 'Dumbbell goblet squats',
      category: 'strength',
      muscleGroup: 'legs',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Quadriceps, Glutes & Adductors',
      defaultDurationMin: 12,
      reps: 15,
      sets: 4,
      weightKg: 18,
      restSec: 60,
      instructions: [
        'Hold dumbbell vertically against chest, elbows tucked inside knees.',
        'Sit deep between hips until thighs break parallel, drive through mid-foot to stand.',
      ],
      tips: 'Keep chest upright and proud throughout the full squat depth.',
    },
    {
      id: 'w_leg_split_squat',
      name: 'Bulgarian split squats',
      category: 'strength',
      muscleGroup: 'legs',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Quads, Glute Medius & Hip Stability',
      defaultDurationMin: 12,
      reps: 10,
      sets: 3,
      weightKg: 12,
      restSec: 60,
      instructions: [
        'Rest rear foot laces-down on bench, lower front knee to 90 degrees.',
        'Drive through front heel to return to top.',
      ],
      tips: 'Lean torso 15 degrees forward to activate more glute power.',
    },
    {
      id: 'w_leg_walking_lunge',
      name: 'Walking dumbbell lunges',
      category: 'strength',
      muscleGroup: 'legs',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Quadriceps & Dynamic Balance',
      defaultDurationMin: 10,
      reps: 14,
      sets: 3,
      weightKg: 12,
      restSec: 60,
      instructions: [
        'Take long stride forward, drop back knee 1 inch off floor.',
        'Push off front foot directly into next forward stride.',
      ],
      tips: 'Keep front shin vertical and weight centered.',
    },
    {
      id: 'w_leg_calf_raise',
      name: 'Standing dumbbell calf raises',
      category: 'strength',
      muscleGroup: 'legs',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Gastrocnemius & Soleus',
      defaultDurationMin: 8,
      reps: 20,
      sets: 4,
      weightKg: 14,
      restSec: 45,
      instructions: [
        'Stand tall on ball of feet, elevate heels as high as possible.',
        'Hold peak contraction 2 seconds, lower slowly.',
      ],
      tips: 'Full range of motion beats heavy bouncing every time.',
    },
    {
      id: 'w_leg_hamstring_slide',
      name: 'Dumbbell stiff-leg deadlifts',
      category: 'strength',
      muscleGroup: 'legs',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Hamstring Tendons & Glutes',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 16,
      restSec: 60,
      instructions: [
        'Keep legs almost straight, push hips backward until deep stretch.',
        'Squeeze glutes tight to return upright.',
      ],
      tips: 'Hips go backward, not down.',
    },
    {
      id: 'w_leg_stepper',
      name: 'Stepper / stair climber cool-down',
      category: 'cardio',
      muscleGroup: 'legs',
      equipment: 'none',
      difficulty: 'beginner',
      targetMuscle: 'Cardio & Quad Flush',
      defaultDurationMin: 15,
      reps: 1,
      sets: 1,
      weightKg: 0,
      restSec: 30,
      instructions: [
        'Steady cadence rhythmic stepping, flushing lactic acid from leg muscles.',
      ],
      tips: 'Maintain tall upright posture.',
    },
  ],

  gluteus: [
    {
      id: 'w_glute_bridge',
      name: 'Dumbbell hip thrusts on bench',
      category: 'strength',
      muscleGroup: 'gluteus',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Gluteus Maximus Lockout',
      defaultDurationMin: 12,
      reps: 15,
      sets: 4,
      weightKg: 16,
      restSec: 60,
      instructions: [
        'Upper back on bench, dumbbell balanced on hip crease.',
        'Drive hips upward toward ceiling, lock out glutes for 2 seconds at top.',
      ],
      tips: 'Tuck chin and look forward, not up at the ceiling.',
    },
    {
      id: 'w_glute_sumo',
      name: 'Sumo dumbbell squats',
      category: 'strength',
      muscleGroup: 'gluteus',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Glutes & Inner Adductors',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 16,
      restSec: 60,
      instructions: [
        'Take wide stance with toes angled 45 degrees out.',
        'Squat straight down, pushing knees outward in line with toes.',
      ],
      tips: 'Feel glutes and inner thighs stretch at the bottom.',
    },
    {
      id: 'w_glute_kickback',
      name: 'Quadruped donkey kicks & fire hydrants',
      category: 'strength',
      muscleGroup: 'gluteus',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      targetMuscle: 'Gluteus Medius & Upper Shelf',
      defaultDurationMin: 8,
      reps: 20,
      sets: 3,
      weightKg: 0,
      restSec: 30,
      instructions: [
        'On hands and knees, kick heel toward ceiling with sole parallel to roof.',
      ],
      tips: 'Isolate glute squeeze without swinging spine.',
    },
    {
      id: 'w_glute_figure4',
      name: 'Seated figure-4 hip opener',
      category: 'mobility',
      muscleGroup: 'gluteus',
      equipment: 'none',
      difficulty: 'beginner',
      targetMuscle: 'Piriformis & Deep Rotators',
      defaultDurationMin: 5,
      reps: 1,
      sets: 2,
      weightKg: 0,
      restSec: 30,
      instructions: [
        'Cross ankle over opposite knee, hinge chest forward with flat back.',
      ],
      tips: 'Hold 45 seconds per side for deep hip release.',
    },
    {
      id: 'w_glute_curtsy',
      name: 'Dumbbell curtsy lunges',
      category: 'strength',
      muscleGroup: 'gluteus',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Lateral Glute Medius & Hip Stability',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 10,
      restSec: 45,
      instructions: [
        'Step one foot diagonally back behind your front leg, lowering hips.',
      ],
      tips: 'Hits the side glute curve for complete 360 development.',
    },
  ],

  deltoids: [
    {
      id: 'w_delt_ohp',
      name: 'Standing dumbbell shoulder press',
      category: 'strength',
      muscleGroup: 'deltoids',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Anterior & Lateral Deltoids',
      defaultDurationMin: 12,
      reps: 10,
      sets: 3,
      weightKg: 14,
      restSec: 60,
      instructions: [
        'Stand tall, press dumbbells smoothly overhead until arms lock out.',
        'Lower under control to ear level.',
      ],
      tips: 'Squeeze glutes tight to prevent lower back arching.',
    },
    {
      id: 'w_delt_lateral',
      name: 'Dumbbell lateral raises',
      category: 'strength',
      muscleGroup: 'deltoids',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Lateral (Side) Deltoid Cap',
      defaultDurationMin: 10,
      reps: 15,
      sets: 4,
      weightKg: 8,
      restSec: 45,
      instructions: [
        'Raise weights out to sides with slight forward angle (scaption plane).',
        'Lead with your elbows, pinkies slightly higher than thumbs.',
      ],
      tips: 'Do not swing or use body momentum. Strict control builds width.',
    },
    {
      id: 'w_delt_rear',
      name: 'Bent-over rear delt flyes',
      category: 'strength',
      muscleGroup: 'deltoids',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Posterior Deltoids',
      defaultDurationMin: 8,
      reps: 15,
      sets: 3,
      weightKg: 6,
      restSec: 45,
      instructions: [
        'Hinge hips forward, raise dumbbells wide to sides like wings.',
      ],
      tips: 'Essential for rounded 3D shoulders and balanced joint posture.',
    },
    {
      id: 'w_delt_arnold',
      name: 'Arnold dumbbell press',
      category: 'strength',
      muscleGroup: 'deltoids',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Complete 3-Head Deltoid Rotation',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 12,
      restSec: 60,
      instructions: [
        'Start palms facing chest, rotate outwards as you press overhead.',
      ],
      tips: 'Smooth fluid rotation through the entire range of motion.',
    },
    {
      id: 'w_delt_front',
      name: 'Dumbbell front raises',
      category: 'strength',
      muscleGroup: 'deltoids',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Anterior Deltoids & Upper Pectorals',
      defaultDurationMin: 8,
      reps: 12,
      sets: 3,
      weightKg: 8,
      restSec: 45,
      instructions: [
        'Raise dumbbell straight in front to eye level, pause 1 second.',
      ],
      tips: 'Control the descent for maximum muscle recruitment.',
    },
  ],

  arms: [
    {
      id: 'w_arm_hammer',
      name: 'Dumbbell hammer curls',
      category: 'strength',
      muscleGroup: 'arms',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Biceps Brachii, Brachialis & Forearms',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 12,
      restSec: 45,
      instructions: [
        'Palms facing each other, curl weights toward shoulders without swinging.',
        'Squeeze biceps for 1 second at top squeeze.',
      ],
      tips: 'Pin elbows to ribs like hinges.',
    },
    {
      id: 'w_arm_tricep_oh',
      name: 'Overhead dumbbell triceps extension',
      category: 'strength',
      muscleGroup: 'arms',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Triceps Long Head (Arm Mass)',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 14,
      restSec: 45,
      instructions: [
        'Hold dumbbell overhead with two hands, lower behind head to 90 degrees.',
        'Extend back to lockout, flexing triceps horseshoe.',
      ],
      tips: 'Keep elbows pointing forward and close to ears.',
    },
    {
      id: 'w_arm_bench_dips',
      name: 'Bench triceps dips',
      category: 'strength',
      muscleGroup: 'arms',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      targetMuscle: 'Triceps Medial & Lateral Heads',
      defaultDurationMin: 8,
      reps: 15,
      sets: 3,
      weightKg: 0,
      restSec: 45,
      instructions: [
        'Hands on bench behind hips, lower body until elbows hit 90 degrees, press up.',
      ],
      tips: 'Keep hips skimming close to the bench.',
    },
    {
      id: 'w_arm_incline_curl',
      name: 'Incline bench dumbbell curls',
      category: 'strength',
      muscleGroup: 'arms',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Biceps Long Head Stretch',
      defaultDurationMin: 10,
      reps: 10,
      sets: 3,
      weightKg: 10,
      restSec: 60,
      instructions: [
        'Lie back on 60-degree incline, letting arms hang straight down before curling.',
      ],
      tips: 'Provides deepest possible stretch on the bicep peak.',
    },
    {
      id: 'w_arm_kickbacks',
      name: 'Dumbbell triceps kickbacks',
      category: 'strength',
      muscleGroup: 'arms',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Triceps Peak Contraction',
      defaultDurationMin: 8,
      reps: 15,
      sets: 3,
      weightKg: 8,
      restSec: 45,
      instructions: [
        'Hinged at waist, kick dumbbells back until arm is fully straight parallel to torso.',
      ],
      tips: 'Hold contraction for 1 count.',
    },
    {
      id: 'w_arm_concentration',
      name: 'Seated concentration curls',
      category: 'strength',
      muscleGroup: 'arms',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Biceps Peak Isolation',
      defaultDurationMin: 8,
      reps: 12,
      sets: 3,
      weightKg: 10,
      restSec: 45,
      instructions: [
        'Brace elbow against inner thigh, curl strictly to chin.',
      ],
      tips: 'Zero body momentum allowed.',
    },
  ],

  abs: [
    {
      id: 'w_abs_russian',
      name: 'Dumbbell Russian twists',
      category: 'core',
      muscleGroup: 'abs',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Obliques & Transverse Abdominis',
      defaultDurationMin: 8,
      reps: 20,
      sets: 3,
      weightKg: 8,
      restSec: 45,
      instructions: [
        'Balance on sit bones with feet elevated, rotate dumbbell side to side.',
      ],
      tips: 'Move with your ribs, not just your arms.',
    },
    {
      id: 'w_abs_knee_raise',
      name: 'Lying reverse crunches / leg raises',
      category: 'core',
      muscleGroup: 'abs',
      equipment: 'bodyweight',
      difficulty: 'beginner',
      targetMuscle: 'Lower Rectus Abdominis',
      defaultDurationMin: 8,
      reps: 15,
      sets: 3,
      weightKg: 0,
      restSec: 45,
      instructions: [
        'Roll knees to chest, elevating hips slightly off floor with abdominal control.',
      ],
      tips: 'Do not use momentum; curl from your lower pelvis.',
    },
    {
      id: 'w_abs_plank',
      name: 'Plank with shoulder taps',
      category: 'core',
      muscleGroup: 'abs',
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      targetMuscle: 'Anti-Rotational Core Stability',
      defaultDurationMin: 6,
      reps: 20,
      sets: 3,
      weightKg: 0,
      restSec: 45,
      instructions: [
        'Solid push-up plank, tap opposite shoulder without hips rocking side to side.',
      ],
      tips: 'Brace abs as if preparing for a punch.',
    },
    {
      id: 'w_abs_deadbug',
      name: 'Dead bug dumbbell extension',
      category: 'core',
      muscleGroup: 'abs',
      equipment: 'dumbbells',
      difficulty: 'beginner',
      targetMuscle: 'Deep Transverse & Hip Flexors',
      defaultDurationMin: 8,
      reps: 12,
      sets: 3,
      weightKg: 6,
      restSec: 30,
      instructions: [
        'On back, lower opposite arm and leg while pressing lower back flat into floor.',
      ],
      tips: 'Lower back must remain glued to the floor.',
    },
    {
      id: 'w_abs_mountain',
      name: 'Mountain climbers',
      category: 'cardio',
      muscleGroup: 'abs',
      equipment: 'none',
      difficulty: 'intermediate',
      targetMuscle: 'Dynamic Core & Conditioning',
      defaultDurationMin: 6,
      reps: 30,
      sets: 3,
      weightKg: 0,
      restSec: 30,
      instructions: [
        'Drive knees alternately to chest in rapid rhythmic pace.',
      ],
      tips: 'Keep shoulders directly over wrists.',
    },
  ],

  cardio: [
    {
      id: 'w_cardio_treadmill',
      name: 'Treadmill interval training',
      category: 'cardio',
      muscleGroup: 'cardio',
      equipment: 'none',
      difficulty: 'intermediate',
      targetMuscle: 'Cardiorespiratory Engine',
      defaultDurationMin: 20,
      reps: 1,
      sets: 1,
      weightKg: 0,
      restSec: 30,
      instructions: [
        'Alternate 1 min fast jog with 1 min power walk at 4% incline.',
      ],
      tips: 'Stay tall and pump arms rhythmically.',
    },
    {
      id: 'w_cardio_swings',
      name: 'Dumbbell kettlebell-style swings',
      category: 'cardio',
      muscleGroup: 'cardio',
      equipment: 'dumbbells',
      difficulty: 'intermediate',
      targetMuscle: 'Posterior Chain Explosiveness & VO2 Max',
      defaultDurationMin: 12,
      reps: 20,
      sets: 4,
      weightKg: 16,
      restSec: 45,
      instructions: [
        'Hinge hips back, snap hips forward to float dumbbell to chest height.',
      ],
      tips: 'All momentum comes from explosive glute snap.',
    },
    {
      id: 'w_cardio_burpees',
      name: 'Burpees with lateral jump',
      category: 'cardio',
      muscleGroup: 'cardio',
      equipment: 'bodyweight',
      difficulty: 'advanced',
      targetMuscle: 'Full-Body Anaerobic Power',
      defaultDurationMin: 10,
      reps: 12,
      sets: 3,
      weightKg: 0,
      restSec: 60,
      instructions: [
        'Drop chest to floor, jump feet in, leap laterally over mat.',
      ],
      tips: 'Pace yourself evenly across all sets.',
    },
    {
      id: 'w_cardio_stepper',
      name: 'Stepper cadence climb',
      category: 'cardio',
      muscleGroup: 'cardio',
      equipment: 'none',
      difficulty: 'beginner',
      targetMuscle: 'Aerobic Base & Calves',
      defaultDurationMin: 15,
      reps: 1,
      sets: 1,
      weightKg: 0,
      restSec: 30,
      instructions: [
        'Maintain 70-80 steps per minute steady state.',
      ],
      tips: 'Great low-impact fat burner.',
    },
  ],
};

interface FitnessViewProps {
  onAddAsTask?: (exercise: WorkoutExercise) => void;
}

export const FitnessView: React.FC<FitnessViewProps> = ({ onAddAsTask }) => {
  // Navigation state:
  // 'categories' = Muscle group cards (Image 1)
  // 'plan' = Workout plan / timeline list (Image 3)
  // 'active' = Active workout execution player (Image 2)
  const [currentView, setCurrentView] = useState<'categories' | 'plan' | 'active'>('categories');
  const [selectedMuscleId, setSelectedMuscleId] = useState<string>('chest');
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'upper' | 'lower' | 'core' | 'cardio'>('all');

  // Active workout execution metrics (Image 2)
  const [currentWeight, setCurrentWeight] = useState<number>(12);
  const [currentReps, setCurrentReps] = useState<number>(15);
  const [setsMade, setSetsMade] = useState<number>(2);
  const [totalSets, setTotalSets] = useState<number>(3);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(51);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState<boolean>(false);
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState<number>(514); // 08:34 default
  const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState<boolean>(true);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeRoutine = WORKOUT_ROUTINES[selectedMuscleId] || WORKOUT_ROUTINES.chest;
  const activeExercise = activeRoutine[activeExerciseIndex] || activeRoutine[0];
  const activeMuscleInfo = MUSCLE_GROUPS.find((m) => m.id === selectedMuscleId) || MUSCLE_GROUPS[0];

  // Live Workout Elapsed Stopwatch
  useEffect(() => {
    if (currentView === 'active' && isWorkoutTimerRunning) {
      elapsedTimerRef.current = setInterval(() => {
        setWorkoutElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [currentView, isWorkoutTimerRunning]);

  // Live Rest Countdown Timer
  useEffect(() => {
    if (isRestTimerRunning && restSecondsRemaining > 0) {
      restTimerRef.current = setInterval(() => {
        setRestSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRestTimerRunning(false);
            playNotificationChime();
            triggerDeviceVibration();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isRestTimerRunning, restSecondsRemaining]);

  // When changing exercise in active mode, initialize metrics
  const selectExerciseForActiveMode = (index: number) => {
    const ex = activeRoutine[index] || activeRoutine[0];
    setActiveExerciseIndex(index);
    setCurrentWeight(ex.weightKg || 12);
    setCurrentReps(ex.reps || 12);
    setSetsMade(0);
    setTotalSets(ex.sets || 3);
    setRestSecondsRemaining(ex.restSec || 60);
    setIsRestTimerRunning(false);
    setCurrentView('active');
  };

  const handleOpenMusclePlan = (muscleId: string) => {
    setSelectedMuscleId(muscleId);
    setCurrentView('plan');
  };

  const handleBeginWorkout = () => {
    selectExerciseForActiveMode(0);
  };

  const handleCompleteSet = () => {
    triggerDeviceVibration();
    if (setsMade < totalSets) {
      const nextSets = setsMade + 1;
      setSetsMade(nextSets);
      // Start rest timer
      setRestSecondsRemaining(activeExercise.restSec || 60);
      setIsRestTimerRunning(true);
      playNotificationChime();

      if (nextSets === totalSets) {
        setAddedToast(`All ${totalSets} sets of "${activeExercise.name}" completed!`);
        setTimeout(() => setAddedToast(null), 3000);
      }
    } else {
      // Advance to next exercise if available
      if (activeExerciseIndex < activeRoutine.length - 1) {
        selectExerciseForActiveMode(activeExerciseIndex + 1);
      } else {
        setAddedToast('Workout routine complete! Great job!');
        setTimeout(() => setAddedToast(null), 3500);
      }
    }
  };

  const handleResetActiveExercise = () => {
    setSetsMade(0);
    setRestSecondsRemaining(activeExercise.restSec || 60);
    setIsRestTimerRunning(false);
  };

  const handleAddCurrentToToday = () => {
    if (onAddAsTask) {
      onAddAsTask(activeExercise);
      setAddedToast(`"${activeExercise.name}" added to Today!`);
      setTimeout(() => setAddedToast(null), 3000);
    }
  };

  const handleAddEntireRoutineToToday = () => {
    if (onAddAsTask) {
      // Schedule the primary routine exercise to today
      onAddAsTask({
        id: `routine_${selectedMuscleId}_${Date.now()}`,
        name: `${activeMuscleInfo.name} Workout Routine`,
        category: 'strength',
        targetMuscle: activeMuscleInfo.subtitle,
        defaultDurationMin: 45,
        instructions: activeRoutine.map((e) => `${e.name} (${e.sets || 3}x${e.reps || 12})`),
        tips: activeMuscleInfo.focusDescription,
      });
      setAddedToast(`"${activeMuscleInfo.name} Workout" scheduled for Today!`);
      setTimeout(() => setAddedToast(null), 3000);
    }
  };

  // Format MM:SS for timers
  const formatTimerDisplay = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Filter muscle groups in Explorer
  const filteredMuscles = MUSCLE_GROUPS.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.focusDescription.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'upper') {
      return ['chest', 'back', 'deltoids', 'arms'].includes(m.id);
    }
    if (categoryFilter === 'lower') {
      return ['legs', 'gluteus'].includes(m.id);
    }
    if (categoryFilter === 'core') {
      return m.id === 'abs';
    }
    if (categoryFilter === 'cardio') {
      return m.id === 'cardio';
    }
    return true;
  });

  return (
    <div className="w-full pb-32 transition-all">
      {/* Toast Feedback for Add to Task & Completions */}
      {addedToast && (
        <div className="fixed inset-x-0 top-5 z-[120] flex justify-center px-4 pointer-events-none select-none">
          <div className="pointer-events-auto max-w-sm w-full bg-[#17212B] text-white px-4 py-3 rounded-[18px] shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-bannerSlideDown">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00B4B4] flex-shrink-0" />
              <span className="text-xs font-semibold text-white leading-snug line-clamp-2">{addedToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setAddedToast(null)}
              className="text-white/70 hover:text-white text-xs font-bold px-2 py-1 flex-shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 1: MUSCLE GROUPS & EXERCISES EXPLORER (IMAGE 1)  */}
      {/* ======================================================== */}
      {currentView === 'categories' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <ZenPlanLogo size={32} />
              <h1 className="font-heading text-[22px] font-bold text-[#17212B]">
                Exercises
              </h1>
            </div>

            <div className="flex items-center gap-2 text-[#55636F]">
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Filter exercises"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#DDE5EA] active:scale-95 transition-all cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Clean Search Input (Matching Image 1) */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#9AA9B5]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search muscle group, exercise or equipment..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#EAF0F4] border border-transparent focus:border-[#00B4B4] focus:bg-white text-sm text-[#17212B] placeholder-[#9AA9B5] outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-[#9AA9B5] hover:text-[#17212B]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Segmented Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'upper', label: 'Upper Body' },
                { id: 'lower', label: 'Lower Body' },
                { id: 'core', label: 'Core' },
                { id: 'cardio', label: 'Cardio' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoryFilter(f.id)}
                className={`min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === f.id
                    ? 'bg-[#17212B] text-white shadow-xs'
                    : 'bg-white border border-[#DDE5EA] text-[#55636F] hover:text-[#17212B] hover:bg-[#EEF3F6]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Muscle Group Banners Stack (Matching Image 1: Dark Slate Navy, White Label, Target Muscle SVG) */}
          <div className="space-y-3">
            {filteredMuscles.map((muscle) => {
              const SvgComponent = muscle.svg;
              return (
                <div
                  key={muscle.id}
                  onClick={() => handleOpenMusclePlan(muscle.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenMusclePlan(muscle.id)}
                  aria-label={`Open ${muscle.name} exercise routine`}
                  className="w-full min-h-[92px] rounded-[20px] bg-[#0A1F2D] text-white p-4 flex items-center justify-between gap-3 shadow-sm hover:brightness-110 active:scale-[0.985] transition-all cursor-pointer select-none overflow-hidden relative group"
                >
                  {/* Left: Muscle Name & Subtext */}
                  <div className="z-10 pl-1">
                    <h3 className="font-heading text-[19px] font-bold tracking-wide text-white">
                      {muscle.name}
                    </h3>
                    <p className="text-[12px] text-slate-300 line-clamp-1 mt-0.5 max-w-[200px]">
                      {muscle.exercisesCount} exercises • {muscle.durationLabel}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00B4B4] mt-2 group-hover:translate-x-1 transition-transform">
                      <span>View Plan</span>
                      <span>→</span>
                    </span>
                  </div>

                  {/* Right: Anatomical Graphic with Target Muscle Illuminated */}
                  <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center -mr-2 group-hover:scale-105 transition-transform duration-300">
                    <SvgComponent className="w-22 h-22" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 2: ROUTINE PLAN & EXERCISES TIMELINE (IMAGE 3)    */}
      {/* ======================================================== */}
      {currentView === 'plan' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setCurrentView('categories')}
              aria-label="Back to all exercises"
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#17212B] hover:bg-[#DDE5EA] active:scale-90 transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            <h1 className="font-heading text-lg font-bold text-[#17212B]">
              Exercises
            </h1>

            <button
              type="button"
              onClick={handleAddEntireRoutineToToday}
              title="Add routine to Today's Tasks"
              className="text-xs font-bold text-[#00B4B4] hover:underline cursor-pointer"
            >
              + Add to Today
            </button>
          </div>

          {/* Routine Summary Card with Progress Circle (Matching Image 3) */}
          <div className="w-full bg-white border border-[#DDE5EA] rounded-[22px] p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              {/* Teal circular ring badge */}
              <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-[#F0FDFA]">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="#00B4B4"
                    strokeWidth="3.5"
                    strokeDasharray="113"
                    strokeDashoffset="18"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[12px] font-bold text-[#0D9488]">
                  84%
                </span>
              </div>

              <div>
                <p className="text-[12px] text-[#55636F] leading-tight">
                  {activeRoutine.length} workout movements
                </p>
                <h3 className="font-heading text-[16px] font-bold text-[#17212B] leading-snug">
                  {activeMuscleInfo.name} routine
                </h3>
                <span className="text-[11px] text-[#00B4B4] font-medium">
                  functional strength & hypertrophy
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-[#55636F] whitespace-nowrap">
                {activeMuscleInfo.durationLabel}
              </span>
            </div>
          </div>

          {/* Vertical Timeline Exercise List with Teal Connector (Matching Image 3) */}
          <div className="relative pl-6 space-y-4 pt-2">
            {/* Vertical Teal Connecting Line */}
            <div
              className="absolute left-[11px] top-6 bottom-6 w-[2.5px] bg-[#00B4B4] rounded-full"
              aria-hidden="true"
            />

            {activeRoutine.map((exercise, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const completionLabel = isFirst ? '100%' : isSecond ? '86%' : 'Ready';

              return (
                <div
                  key={exercise.id}
                  onClick={() => selectExerciseForActiveMode(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && selectExerciseForActiveMode(idx)}
                  aria-label={`Open ${exercise.name}`}
                  className="relative flex items-center justify-between gap-3 bg-white border border-[#DDE5EA] rounded-[18px] p-3.5 hover:border-[#00B4B4] active:scale-[0.99] transition-all cursor-pointer shadow-2xs group"
                >
                  {/* Timeline Node Dot */}
                  <div
                    className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[#00B4B4] shadow-xs"
                    aria-hidden="true"
                  />

                  {/* Left: Thumbnail Icon */}
                  <div className="w-12 h-12 rounded-xl bg-[#0A1F2D] flex items-center justify-center flex-shrink-0 p-1">
                    <ChestAnatomySvg className="w-10 h-10" />
                  </div>

                  {/* Middle: Name & Sets Specs */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-body font-semibold text-[14px] text-[#17212B] leading-tight line-clamp-1 group-hover:text-[#0D9488] transition-colors">
                      {exercise.name}
                    </h4>
                    <p className="font-body text-[12px] text-[#55636F] mt-1">
                      {exercise.sets || 3} × {exercise.reps || 12}
                      {exercise.weightKg ? ` × ${exercise.weightKg} kg` : ''}
                      {exercise.category === 'cardio' ? ` • ${exercise.defaultDurationMin} min` : ''}
                    </p>
                  </div>

                  {/* Right: Percent & Arrow */}
                  <div className="flex items-center gap-1 flex-shrink-0 text-[#00B4B4] font-bold text-xs">
                    <span>{completionLabel}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Big Teal Action Button: "BEGIN WORKOUT" (Matching Image 3) */}
          <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-40">
            <button
              type="button"
              onClick={handleBeginWorkout}
              aria-label="Begin full workout"
              className="w-full min-h-[54px] rounded-full bg-[#00B4B4] hover:bg-[#009e9e] active:scale-[0.98] text-white font-heading font-extrabold text-[16px] tracking-wider uppercase flex items-center justify-center shadow-lg transition-all cursor-pointer"
            >
              Begin Workout
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 3: ACTIVE WORKOUT EXECUTION PLAYER (IMAGE 2)       */}
      {/* ======================================================== */}
      {currentView === 'active' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top Bar with Timer & Controls (Matching Image 2) */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={() => setCurrentView('plan')}
              aria-label="Back to workout plan"
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#17212B] hover:bg-[#DDE5EA] active:scale-90 transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>

            {/* Exercise Index: e.g. "2/10 Chest" */}
            <div className="text-center">
              <span className="font-heading font-bold text-[15px] text-[#17212B]">
                {activeExerciseIndex + 1}/{activeRoutine.length} {activeMuscleInfo.name}
              </span>
            </div>

            {/* Running Stopwatch Timer (e.g. "08:34") */}
            <div className="flex items-center gap-1.5 font-bold text-[#00B4B4] text-[15px] tabular-nums">
              <span>{formatTimerDisplay(workoutElapsedSeconds)}</span>
            </div>
          </div>

          {/* Right Action Icons (Repeat & Info icons, just like Image 2) */}
          <div className="flex items-center justify-end gap-2 -mt-1">
            <button
              type="button"
              onClick={handleResetActiveExercise}
              title="Reset current sets & timer"
              aria-label="Reset sets"
              className="w-8 h-8 rounded-lg border border-[#00B4B4] text-[#00B4B4] flex items-center justify-center hover:bg-[#F0FDFA] active:scale-90 transition-all cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              title="Exercise form instructions"
              aria-label="View instructions"
              className="w-8 h-8 rounded-lg border border-[#00B4B4] text-[#00B4B4] flex items-center justify-center hover:bg-[#F0FDFA] active:scale-90 transition-all cursor-pointer font-serif italic text-sm font-bold"
            >
              i
            </button>
          </div>

          {/* Hero Image: Anatomical Lifter Movement on Bench (Matching Image 2) */}
          <div className="w-full bg-white border border-[#DDE5EA] rounded-[24px] p-4 flex items-center justify-center shadow-xs overflow-hidden">
            <DumbbellPulloverHeroSvg className="w-full h-44 object-contain" />
          </div>

          {/* Title & Weight Information */}
          <div className="space-y-1">
            <h2 className="font-heading font-bold text-[18px] text-[#17212B] leading-tight">
              {activeExercise.name}
            </h2>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#55636F]">
                <span>Recommended weight:</span>
                <span className="font-bold text-[#17212B] text-sm">
                  {currentWeight} kg
                </span>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="text-[#00B4B4] ml-0.5"
                  title="Form info"
                >
                  ℹ
                </button>
              </div>

              {/* Quick weight +/- adjusters */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentWeight((prev) => Math.max(0, prev - 2))}
                  className="w-7 h-7 rounded-full bg-[#EEF3F6] text-[#17212B] font-bold text-xs flex items-center justify-center hover:bg-[#DDE5EA] active:scale-90 cursor-pointer"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentWeight((prev) => prev + 2)}
                  className="w-7 h-7 rounded-full bg-[#EEF3F6] text-[#17212B] font-bold text-xs flex items-center justify-center hover:bg-[#DDE5EA] active:scale-90 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* The Three Circular Metric Dials (Matching Image 2 exactly!) */}
          <div className="grid grid-cols-3 gap-2 py-2">
            {/* Dial 1: Repeats required */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-white border-2 border-[#00B4B4] shadow-sm">
                <span className="font-heading font-bold text-[20px] text-[#17212B]">
                  {currentReps}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#55636F] mt-2 leading-tight">
                Repeats<br />required
              </span>
            </div>

            {/* Dial 2: Rest countdown */}
            <div
              className="flex flex-col items-center text-center cursor-pointer group"
              onClick={() => setIsRestTimerRunning(!isRestTimerRunning)}
              title="Tap to start / pause rest countdown"
            >
              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center bg-white border-2 border-[#00B4B4] shadow-sm transition-all ${
                isRestTimerRunning ? 'ring-2 ring-[#00B4B4]/40' : ''
              }`}>
                <span className="font-heading font-bold text-[18px] text-[#17212B] tabular-nums">
                  {formatTimerDisplay(restSecondsRemaining)}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#55636F] mt-2 leading-tight flex items-center gap-1">
                <span>Rest</span>
                <span className="text-[10px] text-[#00B4B4]">
                  {isRestTimerRunning ? '●' : '▶'}
                </span>
              </span>
            </div>

            {/* Dial 3: Sets made */}
            <div className="flex flex-col items-center text-center">
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-white border-2 border-[#86EFAC] shadow-sm">
                <span className="font-heading font-bold text-[20px] text-[#17212B]">
                  {setsMade}/{totalSets}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#55636F] mt-2 leading-tight">
                Sets<br />made
              </span>
            </div>
          </div>

          {/* Action Buttons: Log Set / Done / Next */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleCompleteSet}
              className="w-full min-h-[50px] rounded-full bg-[#17212B] hover:bg-black active:scale-[0.98] text-white font-heading font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                {setsMade < totalSets
                  ? `Log Done Set (${setsMade + 1} of ${totalSets})`
                  : activeExerciseIndex < activeRoutine.length - 1
                  ? 'Next Exercise →'
                  : 'Finish Workout'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddCurrentToToday}
                className="flex-1 min-h-[44px] rounded-full border border-[#DDE5EA] bg-white text-[#17212B] text-xs font-semibold hover:bg-[#EEF3F6] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+ Add to Today&apos;s Tasks</span>
              </button>

              {activeExerciseIndex < activeRoutine.length - 1 && (
                <button
                  type="button"
                  onClick={() => selectExerciseForActiveMode(activeExerciseIndex + 1)}
                  className="px-4 min-h-[44px] rounded-full border border-[#DDE5EA] bg-white text-[#55636F] hover:text-[#17212B] text-xs font-semibold hover:bg-[#EEF3F6] active:scale-95 transition-all cursor-pointer"
                >
                  Skip →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions & Form Guide Modal */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exercise-info-title"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] bg-white border border-[#DDE5EA] p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EEF3F6]">
              <h3 id="exercise-info-title" className="font-heading font-bold text-base text-[#17212B]">
                {activeExercise.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#55636F] hover:bg-[#EEF3F6] active:scale-90"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00B4B4]">
                Target Muscles
              </span>
              <p className="text-xs text-[#17212B] mt-0.5">
                {activeExercise.targetMuscle}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#55636F]">
                Execution Steps
              </span>
              <ol className="text-xs text-[#17212B] space-y-2 mt-1.5 list-decimal pl-4">
                {activeExercise.instructions.map((step, i) => (
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {activeExercise.tips && (
              <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1]">
                <span className="text-[11px] font-bold text-[#0D9488]">
                  Pro Tip:
                </span>
                <p className="text-xs text-[#134E4A] mt-0.5 leading-relaxed">
                  {activeExercise.tips}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-full bg-[#17212B] text-white text-xs font-semibold hover:bg-black transition-colors"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
