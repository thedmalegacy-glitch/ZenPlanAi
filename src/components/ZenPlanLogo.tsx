import React from 'react';

interface ZenPlanLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  showSubtext?: boolean;
  className?: string;
  animate?: boolean;
}

export const ZenPlanLogo: React.FC<ZenPlanLogoProps> = ({
  size = 'md',
  showText = false,
  showSubtext = false,
  className = '',
  animate = false,
}) => {
  // Determine pixel dimension
  let pixelSize = 48;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'xs':
        pixelSize = 24;
        break;
      case 'sm':
        pixelSize = 36;
        break;
      case 'md':
        pixelSize = 48;
        break;
      case 'lg':
        pixelSize = 80;
        break;
      case 'xl':
        pixelSize = 120;
        break;
    }
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      {/* Emblem SVG matching the user's uploaded logo exactly */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full overflow-visible ${animate ? 'transition-transform duration-500 hover:scale-105' : ''}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="ZenPlan Daylight Orbit Logo"
        >
          {/* Subtle drop shadow under dark disc */}
          <defs>
            <filter id="zenLogoShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#17212B" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Outer Dashed Orbit Circle (Light Blue/Gray #CBD5E1) */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="3.2 3.2"
            className={animate ? 'animate-spinSlow origin-center' : ''}
          />

          {/* Central Dark Obsidian Badge Disc (#17212B) */}
          <circle
            cx="50"
            cy="50"
            r="28"
            fill="#17212B"
            filter="url(#zenLogoShadow)"
          />

          {/* Crisp White Checkmark */}
          <path
            d="M 40 50.5 L 47.8 58.3 L 61.5 43"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Golden-Amber Sun Dot on Orbit at Top-Right (~45 degrees, 1:30 position) with Clean White Stroke */}
          <circle
            cx="70.5"
            cy="29.5"
            r="5.5"
            fill="#F2A33A"
            stroke="#FFFFFF"
            strokeWidth="1.8"
          />
        </svg>
      </div>

      {/* Optional Brand Typography Lockup */}
      {showText && (
        <div className="mt-2 text-center">
          <h2 className="font-heading font-extrabold text-[19px] sm:text-[22px] text-[#17212B] tracking-tight leading-tight">
            ZenPlan
          </h2>
          {showSubtext && (
            <p className="font-heading text-[10px] sm:text-[11px] font-bold text-[#64748B] tracking-[0.16em] uppercase mt-0.5">
              Daylight Orbit Planner
            </p>
          )}
        </div>
      )}
    </div>
  );
};
