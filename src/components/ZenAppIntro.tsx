import React from 'react';
import { ZenPlanLogo } from './ZenPlanLogo';

interface ZenAppIntroProps {
  onDismiss?: () => void;
}

export const ZenAppIntro: React.FC<ZenAppIntroProps> = () => {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#EEF3F6] animate-introFade select-none pointer-events-none"
      aria-hidden="true"
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Ambient Pulsing Aura */}
        <div className="absolute w-48 h-48 rounded-full bg-[#F2A33A]/15 blur-2xl animate-pulse" />

        {/* Exact ZenPlan Logo & Lockup from uploaded design */}
        <div className="relative animate-scaleIn flex flex-col items-center">
          <ZenPlanLogo
            size={110}
            showText={true}
            showSubtext={true}
            animate={true}
          />
        </div>

        {/* Minimalist Breathing Dots */}
        <div className="mt-5 flex items-center gap-1.5 animate-fadeInUp">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F2A33A] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#2A8C8C] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F3E8F] animate-bounce" />
        </div>
      </div>
    </div>
  );
};
