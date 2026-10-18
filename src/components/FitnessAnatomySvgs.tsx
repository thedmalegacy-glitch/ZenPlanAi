import React from 'react';

// Anatomical high-contrast muscle illustrations with targeted muscles illuminated in coral/red
// Designed to match the dark-navy athletic card aesthetic in the user reference screenshots

interface SvgProps {
  className?: string;
  width?: number;
  height?: number;
}

// 1. CHEST: Pectoralis major & minor illuminated in coral
export const ChestAnatomySvg: React.FC<SvgProps> = ({ className = 'w-24 h-24', width = 96, height = 96 }) => (
  <svg viewBox="0 0 140 140" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="physiqueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="50%" stopColor="#64748B" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="chestGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="60%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
    </defs>
    {/* Head & Neck */}
    <circle cx="70" cy="22" r="14" fill="url(#physiqueGrad)" opacity="0.85" />
    <path d="M62 36 L60 48 L80 48 L78 36 Z" fill="url(#physiqueGrad)" />
    {/* Traps & Shoulders */}
    <path d="M60 42 C50 45 42 52 38 62 L42 74 C46 66 52 60 62 58 Z" fill="url(#physiqueGrad)" opacity="0.9" />
    <path d="M80 42 C90 45 98 52 102 62 L98 74 C94 66 88 60 78 58 Z" fill="url(#physiqueGrad)" opacity="0.9" />
    {/* Shoulders / Deltoids */}
    <path d="M38 62 C32 68 28 80 30 92 L42 86 C40 78 40 70 42 64 Z" fill="url(#physiqueGrad)" />
    <path d="M102 62 C108 68 112 80 110 92 L98 86 C100 78 100 70 98 64 Z" fill="url(#physiqueGrad)" />
    {/* TARGET: Left & Right Pectorals (Vibrant Coral) */}
    <path
      d="M68 54 C58 54 44 60 44 72 C44 82 56 88 68 86 C69 78 69 66 68 54 Z"
      fill="url(#chestGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    <path
      d="M72 54 C82 54 96 60 96 72 C96 82 84 88 72 86 C71 78 71 66 72 54 Z"
      fill="url(#chestGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Muscle Fiber Details */}
    <path d="M48 68 Q58 64 66 68" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <path d="M46 76 Q56 72 66 78" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <path d="M92 68 Q82 64 74 68" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <path d="M94 76 Q84 72 74 78" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    {/* Upper Abs & Ribcage */}
    <path d="M58 88 L68 88 L68 102 L56 100 Z" fill="url(#physiqueGrad)" opacity="0.8" />
    <path d="M82 88 L72 88 L72 102 L84 100 Z" fill="url(#physiqueGrad)" opacity="0.8" />
    <path d="M56 104 L68 104 L68 118 L54 114 Z" fill="url(#physiqueGrad)" opacity="0.7" />
    <path d="M84 104 L72 104 L72 118 L86 114 Z" fill="url(#physiqueGrad)" opacity="0.7" />
    {/* Sternum Center Line */}
    <line x1="70" y1="52" x2="70" y2="120" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 2. BACK: Latissimus dorsi, trapezius, and rhomboids highlighted in coral
export const BackAnatomySvg: React.FC<SvgProps> = ({ className = 'w-24 h-24', width = 96, height = 96 }) => (
  <svg viewBox="0 0 140 140" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="backPhysique" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="backGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
    </defs>
    {/* Head Back */}
    <circle cx="70" cy="22" r="14" fill="url(#backPhysique)" opacity="0.85" />
    <path d="M64 36 L62 46 L78 46 L76 36 Z" fill="url(#backPhysique)" />
    {/* TARGET: Trapezius Kite Shape */}
    <path
      d="M70 42 L88 56 L70 82 L52 56 Z"
      fill="url(#backGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* TARGET: Left & Right Lats (Wings) */}
    <path
      d="M50 60 C38 68 34 86 44 106 C52 104 60 96 66 84 C58 76 54 68 50 60 Z"
      fill="url(#backGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    <path
      d="M90 60 C102 68 106 86 96 106 C88 104 80 96 74 84 C82 76 86 68 90 60 Z"
      fill="url(#backGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Rear Delts & Arms */}
    <path d="M36 60 C30 68 28 80 32 90 L40 82 Z" fill="url(#backPhysique)" opacity="0.85" />
    <path d="M104 60 C110 68 112 80 108 90 L100 82 Z" fill="url(#backPhysique)" opacity="0.85" />
    {/* Spine Groove & Lower Back Christmas Tree */}
    <line x1="70" y1="42" x2="70" y2="122" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M60 110 L70 120 L80 110" stroke="#FFE4E6" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M58 98 Q64 92 68 86" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    <path d="M82 98 Q76 92 72 86" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// 3. LEGS: Quadriceps, Hamstrings, Adductors highlighted in coral
export const LegsAnatomySvg: React.FC<SvgProps> = ({ className = 'w-24 h-24', width = 96, height = 96 }) => (
  <svg viewBox="0 0 140 140" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="legGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="legPhysique" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    {/* Pelvis / Hips */}
    <path d="M46 24 C58 18 82 18 94 24 L96 38 C80 34 60 34 44 38 Z" fill="url(#legPhysique)" opacity="0.8" />
    {/* Left Thigh (Quadriceps) - TARGET */}
    <path
      d="M44 38 C34 50 32 72 38 90 C42 98 48 102 52 102 C58 102 62 88 64 68 C64 54 58 42 44 38 Z"
      fill="url(#legGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Right Thigh (Quadriceps) - TARGET */}
    <path
      d="M96 38 C106 50 108 72 102 90 C98 98 92 102 88 102 C82 102 78 88 76 68 C76 54 82 42 96 38 Z"
      fill="url(#legGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Knee & Patella */}
    <circle cx="50" cy="106" r="5" fill="url(#legPhysique)" />
    <circle cx="90" cy="106" r="5" fill="url(#legPhysique)" />
    {/* Calves (Gastrocnemius) */}
    <path d="M46 112 C40 120 44 132 48 136 L54 136 C58 130 56 120 54 112 Z" fill="url(#legGlow)" opacity="0.9" />
    <path d="M94 112 C100 120 96 132 92 136 L86 136 C82 130 84 120 86 112 Z" fill="url(#legGlow)" opacity="0.9" />
    {/* Quad Muscle Separation Lines (Rectus Femoris & Vastus Lateralis) */}
    <path d="M48 46 Q50 68 50 88" stroke="#FFE4E6" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M42 56 Q40 74 44 86" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    <path d="M92 46 Q90 68 90 88" stroke="#FFE4E6" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M98 56 Q100 74 96 86" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// 4. GLUTEUS: Gluteus maximus & abductors highlighted in coral
export const GluteusAnatomySvg: React.FC<SvgProps> = ({ className = 'w-24 h-24', width = 96, height = 96 }) => (
  <svg viewBox="0 0 140 140" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="gluteGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="60%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="glutePhysique" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    {/* Lower Back & Waist */}
    <path d="M54 26 C62 28 78 28 86 26 L88 42 C78 40 62 40 52 42 Z" fill="url(#glutePhysique)" opacity="0.75" />
    {/* TARGET: Left Gluteus Maximus */}
    <path
      d="M50 42 C36 46 32 64 36 82 C40 96 56 102 68 96 C69 82 68 58 50 42 Z"
      fill="url(#gluteGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* TARGET: Right Gluteus Maximus */}
    <path
      d="M90 42 C104 46 108 64 104 82 C100 96 84 102 72 96 C71 82 72 58 90 42 Z"
      fill="url(#gluteGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Gluteal Crease / Separation */}
    <line x1="70" y1="42" x2="70" y2="98" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    {/* Muscle Fiber Curve */}
    <path d="M42 62 Q52 74 64 78" stroke="#FFE4E6" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M98 62 Q88 74 76 78" stroke="#FFE4E6" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    {/* Upper Hamstrings */}
    <path d="M42 98 C46 112 50 126 52 134 L62 134 C64 122 66 106 66 98 Z" fill="url(#glutePhysique)" opacity="0.8" />
    <path d="M98 98 C94 112 90 126 88 134 L78 134 C76 122 74 106 74 98 Z" fill="url(#glutePhysique)" opacity="0.8" />
  </svg>
);

// 5. DELTOIDS: Shoulders (Anterior, lateral, posterior) highlighted in coral
export const DeltoidsAnatomySvg: React.FC<SvgProps> = ({ className = 'w-24 h-24', width = 96, height = 96 }) => (
  <svg viewBox="0 0 140 140" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="deltGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="deltPhysique" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    {/* Head & Neck */}
    <circle cx="70" cy="22" r="14" fill="url(#deltPhysique)" opacity="0.85" />
    <path d="M62 36 L60 48 L80 48 L78 36 Z" fill="url(#deltPhysique)" />
    {/* Traps */}
    <path d="M60 44 L48 54 L62 58 Z" fill="url(#deltPhysique)" opacity="0.75" />
    <path d="M80 44 L92 54 L78 58 Z" fill="url(#deltPhysique)" opacity="0.75" />
    {/* TARGET: Left Shoulder / Deltoid Cap */}
    <path
      d="M48 50 C36 54 26 66 28 82 C30 92 40 96 46 90 C48 80 50 64 48 50 Z"
      fill="url(#deltGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* TARGET: Right Shoulder / Deltoid Cap */}
    <path
      d="M92 50 C104 54 114 66 112 82 C110 92 100 96 94 90 C92 80 90 64 92 50 Z"
      fill="url(#deltGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Chest & Torso */}
    <path d="M50 56 C56 56 64 62 66 74 C58 78 50 74 46 66 Z" fill="url(#deltPhysique)" opacity="0.75" />
    <path d="M90 56 C84 56 76 62 74 74 C82 78 90 74 94 66 Z" fill="url(#deltPhysique)" opacity="0.75" />
    <rect x="58" y="76" width="24" height="44" rx="4" fill="url(#deltPhysique)" opacity="0.7" />
    {/* Delt striation lines */}
    <path d="M34 68 Q40 76 44 84" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    <path d="M106 68 Q100 76 96 84" stroke="#FFE4E6" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// 6. ARMS / BICEPS & TRICEPS: Highlighted in coral
export const ArmsAnatomySvg: React.FC<SvgProps> = ({ className = 'w-24 h-24', width = 96, height = 96 }) => (
  <svg viewBox="0 0 140 140" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="armGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="armPhysique" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    {/* Torso Center Outline */}
    <path d="M52 40 L88 40 L84 100 L56 100 Z" fill="url(#armPhysique)" opacity="0.6" />
    {/* Left Arm (Biceps Peak & Triceps) - TARGET */}
    <path
      d="M50 42 C40 46 32 58 30 74 C28 86 36 94 44 94 C48 84 50 68 50 42 Z"
      fill="url(#armGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Left Forearm */}
    <path d="M34 94 C30 106 32 122 36 130 L46 130 C48 122 46 106 44 94 Z" fill="url(#armGlow)" opacity="0.9" />
    {/* Right Arm (Biceps Peak & Triceps) - TARGET */}
    <path
      d="M90 42 C100 46 108 58 110 74 C112 86 104 94 96 94 C92 84 90 68 90 42 Z"
      fill="url(#armGlow)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Right Forearm */}
    <path d="M106 94 C110 106 108 122 104 130 L94 130 C92 122 94 106 96 94 Z" fill="url(#armGlow)" opacity="0.9" />
    {/* Bicep Peak line */}
    <path d="M38 66 Q42 76 46 84" stroke="#FFE4E6" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M102 66 Q98 76 94 84" stroke="#FFE4E6" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// 7. ABS & CORE: Six-pack rectus abdominis & obliques highlighted in coral
export const AbsAnatomySvg: React.FC<SvgProps> = ({ className = 'w-24 h-24', width = 96, height = 96 }) => (
  <svg viewBox="0 0 140 140" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="absGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="absPhysique" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    {/* Chest Silhouette */}
    <path d="M46 30 C58 30 68 34 68 46 C56 50 44 46 42 38 Z" fill="url(#absPhysique)" opacity="0.7" />
    <path d="M94 30 C82 30 72 34 72 46 C84 50 96 46 98 38 Z" fill="url(#absPhysique)" opacity="0.7" />
    {/* TARGET: 6-Pack Core Bricks */}
    {/* Top Pair */}
    <rect x="52" y="52" width="16" height="14" rx="3" fill="url(#absGlow)" stroke="#FDA4AF" strokeWidth="1" />
    <rect x="72" y="52" width="16" height="14" rx="3" fill="url(#absGlow)" stroke="#FDA4AF" strokeWidth="1" />
    {/* Middle Pair */}
    <rect x="51" y="70" width="17" height="15" rx="3" fill="url(#absGlow)" stroke="#FDA4AF" strokeWidth="1" />
    <rect x="72" y="70" width="17" height="15" rx="3" fill="url(#absGlow)" stroke="#FDA4AF" strokeWidth="1" />
    {/* Bottom Pair */}
    <rect x="50" y="89" width="18" height="16" rx="3" fill="url(#absGlow)" stroke="#FDA4AF" strokeWidth="1" />
    <rect x="72" y="89" width="18" height="16" rx="3" fill="url(#absGlow)" stroke="#FDA4AF" strokeWidth="1" />
    {/* TARGET: Obliques */}
    <path d="M40 64 C36 78 40 96 46 106 L48 94 C46 84 46 72 48 64 Z" fill="url(#absGlow)" opacity="0.85" />
    <path d="M100 64 C104 78 100 96 94 106 L92 94 C94 84 94 72 92 64 Z" fill="url(#absGlow)" opacity="0.85" />
    {/* Center Line (Linea Alba) */}
    <line x1="70" y1="46" x2="70" y2="114" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 8. CARDIO / HIIT: Dynamic athlete running with vitality ring
export const CardioAnatomySvg: React.FC<SvgProps> = ({ className = 'w-24 h-24', width = 96, height = 96 }) => (
  <svg viewBox="0 0 140 140" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="cardioGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2DD4BF" />
        <stop offset="60%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
    </defs>
    <circle cx="70" cy="70" r="56" stroke="#0D9488" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
    {/* Running Silhouette */}
    <circle cx="76" cy="30" r="10" fill="#2DD4BF" />
    <path d="M72 42 L66 66 L50 82" stroke="#2DD4BF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M66 66 L86 78 L98 108" stroke="#2DD4BF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M72 46 L90 56 L104 50" stroke="#2DD4BF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M72 46 L54 54 L44 68" stroke="#2DD4BF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Heart Rate Wave */}
    <path
      d="M30 118 L50 118 L58 106 L66 128 L74 112 L82 122 L90 118 L110 118"
      stroke="#F43F5E"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 9. DUMBBELL BENCH PULLOVER HERO (Image 2 active exercise movement)
export const DumbbellPulloverHeroSvg: React.FC<SvgProps> = ({ className = 'w-full h-48', width = 320, height = 200 }) => (
  <svg viewBox="0 0 360 220" width={width} height={height} className={className} fill="none">
    <defs>
      <linearGradient id="benchMetal" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="50%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      <linearGradient id="benchPad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <linearGradient id="targetMuscle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>
      <linearGradient id="bodySkin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="60%" stopColor="#64748B" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="weightPlate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>

    {/* Gym Floor Shadow */}
    <ellipse cx="190" cy="205" rx="140" ry="8" fill="#E2E8F0" />

    {/* Workout Bench Stand */}
    <rect x="90" y="145" width="16" height="55" rx="3" fill="url(#benchMetal)" />
    <polygon points="75,200 120,200 115,192 80,192" fill="#64748B" />
    <rect x="250" y="145" width="16" height="55" rx="3" fill="url(#benchMetal)" />
    <polygon points="235,200 280,200 275,192 240,192" fill="#64748B" />
    <rect x="80" y="140" width="200" height="8" rx="2" fill="url(#benchMetal)" />

    {/* Bench Leather Cushion */}
    <rect x="75" y="125" width="210" height="16" rx="6" fill="url(#benchPad)" stroke="#334155" strokeWidth="1" />

    {/* Lifter Body on Bench */}
    {/* Legs bent on floor */}
    <path d="M75 130 C65 140 60 160 62 175 C63 186 58 198 52 202 L70 202 C76 194 78 180 76 170 C78 155 82 140 85 130 Z" fill="url(#bodySkin)" opacity="0.9" />

    {/* Pelvis / Shorts */}
    <path d="M85 125 C100 125 118 123 130 125 L128 135 L85 135 Z" fill="#0F172A" />

    {/* Torso lying on bench */}
    <path d="M125 125 C150 122 180 120 210 125 C230 127 240 132 250 134 L210 135 Z" fill="url(#bodySkin)" />

    {/* TARGET: Pectorals & Lats during Pullover Extension (Illuminated in Coral) */}
    <path
      d="M175 110 C185 105 205 105 218 112 C222 118 218 124 205 124 C190 124 178 120 175 110 Z"
      fill="url(#targetMuscle)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Ribcage Serratus */}
    <path d="M165 114 Q172 120 180 122" stroke="#FDA4AF" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M160 118 Q167 123 174 125" stroke="#FDA4AF" strokeWidth="1.2" strokeLinecap="round" />

    {/* Head resting on bench */}
    <circle cx="258" cy="126" r="14" fill="url(#bodySkin)" opacity="0.85" />
    <path d="M250 122 C255 120 265 120 270 124 C268 134 256 136 250 130 Z" fill="#1E293B" opacity="0.7" />

    {/* Arms extended overhead with dumbbell */}
    {/* Upper Arm / Tricep stretched back */}
    <path
      d="M216 112 C210 98 200 80 186 64 C194 60 204 70 218 84 C226 94 228 106 226 114 Z"
      fill="url(#targetMuscle)"
      stroke="#FDA4AF"
      strokeWidth="1.2"
    />
    {/* Forearm holding bell */}
    <path d="M186 64 L218 36 L226 44 L196 72 Z" fill="url(#bodySkin)" />

    {/* Hands cupping top plate */}
    <ellipse cx="224" cy="38" rx="8" ry="6" fill="#64748B" />

    {/* Dumbbell held vertically */}
    {/* Handle */}
    <rect x="220" y="32" width="8" height="42" rx="2" fill="url(#benchMetal)" transform="rotate(-30 220 32)" />
    {/* Top Plate */}
    <ellipse cx="236" cy="22" rx="22" ry="10" fill="url(#weightPlate)" stroke="#475569" strokeWidth="1.5" transform="rotate(-30 236 22)" />
    <ellipse cx="236" cy="22" rx="14" ry="6" fill="#475569" transform="rotate(-30 236 22)" />
    {/* Bottom Plate */}
    <ellipse cx="204" cy="74" rx="22" ry="10" fill="url(#weightPlate)" stroke="#475569" strokeWidth="1.5" transform="rotate(-30 204 74)" />
  </svg>
);

export function getMuscleSvg(muscleGroup: string): React.FC<SvgProps> {
  const m = muscleGroup.toLowerCase();
  if (m.includes('chest')) return ChestAnatomySvg;
  if (m.includes('back')) return BackAnatomySvg;
  if (m.includes('leg') || m.includes('quad') || m.includes('hamstring')) return LegsAnatomySvg;
  if (m.includes('glute')) return GluteusAnatomySvg;
  if (m.includes('delt') || m.includes('shoulder')) return DeltoidsAnatomySvg;
  if (m.includes('arm') || m.includes('bicep') || m.includes('tricep')) return ArmsAnatomySvg;
  if (m.includes('core') || m.includes('abs')) return AbsAnatomySvg;
  return CardioAnatomySvg;
}
