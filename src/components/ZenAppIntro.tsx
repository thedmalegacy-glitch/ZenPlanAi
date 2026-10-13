import React from 'react';

interface ZenAppIntroProps {
  onDismiss?: () => void;
}

export const ZenAppIntro: React.FC<ZenAppIntroProps> = ({ onDismiss }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#EEF3F6] animate-introFade select-none pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Ambient Pulsing Aura */}
        <div className="absolute w-44 h-44 rounded-full bg-[#F2A33A]/20 blur-2xl animate-pulse" />

        {/* Circular Animated Orbit Badge (Not square) */}
        <div className="relative w-28 h-28 flex items-center justify-center animate-scaleIn">
          {/* Rotating outer orbit ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spinSlow"
            viewBox="0 0 120 120"
            fill="none"
          >
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="#D5DFE6"
              strokeWidth="4"
              strokeDasharray="6 8"
              strokeLinecap="round"
            />
            {/* Daylight arc gradient segment */}
            <path
              d="M 20 60 A 40 40 0 1 1 100 60"
              stroke="url(#introArcGrad)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="introArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2F3E8F" />
                <stop offset="50%" stopColor="#2A8C8C" />
                <stop offset="100%" stopColor="#F2A33A" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Circular Emblem */}
          <div className="w-20 h-20 rounded-full bg-[#17212B] shadow-xl flex items-center justify-center border-2 border-white/20 relative">
            {/* Glowing Sun Node */}
            <div className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-[#F2A33A] shadow-[0_0_12px_#F2A33A] animate-ping opacity-75" />
            <div className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-[#F2A33A] border-2 border-white" />

            {/* Checkmark icon with draw animation */}
            <svg
              className="w-9 h-9 text-white animate-checkmarkBounce"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Brand Text Reveal */}
        <div className="mt-5 text-center space-y-1 animate-fadeInUp">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#17212B]">
            ZenPlan
          </h1>
          <p className="font-body text-xs font-medium text-[#55636F] tracking-wider uppercase">
            Daylight Orbit Planner
          </p>
        </div>

        {/* Minimalist Breathing Dots */}
        <div className="mt-4 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F2A33A] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#2A8C8C] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F3E8F] animate-bounce" />
        </div>
      </div>
    </div>
  );
};
