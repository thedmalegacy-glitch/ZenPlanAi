import React from 'react';
import { DemoType } from '../types';

interface ExerciseDemoProps {
  demoType: DemoType;
  name: string;
}

export const ExerciseDemo: React.FC<ExerciseDemoProps> = ({ demoType, name }) => {
  const renderIllustration = () => {
    switch (demoType) {
      case 'squat':
      case 'lunge':
        return (
          <svg
            viewBox="0 0 120 84"
            className="w-28 h-20 shrink-0"
            role="img"
            aria-label={`Animated form demo for ${name}`}
          >
            <line x1="16" y1="74" x2="104" y2="74" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
            <g className="demo-motion-squat" stroke="var(--accent)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="60" cy="20" r="6" fill="var(--tint)" />
              <line x1="60" y1="27" x2="54" y2="48" />
              <polyline points="58,33 76,36" />
              <polyline points="54,48 70,56 66,73" />
              {demoType === 'lunge' ? (
                <polyline points="54,48 38,62 28,73" strokeOpacity="0.65" />
              ) : (
                <polyline points="54,48 44,56 48,73" strokeOpacity="0.65" />
              )}
            </g>
          </svg>
        );
      case 'push':
        return (
          <svg
            viewBox="0 0 120 84"
            className="w-28 h-20 shrink-0"
            role="img"
            aria-label={`Animated form demo for ${name}`}
          >
            <line x1="12" y1="72" x2="108" y2="72" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
            <g className="demo-motion-squat" stroke="var(--accent)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="88" cy="38" r="5.5" fill="var(--tint)" />
              <line x1="82" y1="41" x2="26" y2="66" />
              <polyline points="75,44 78,58 78,71" />
            </g>
          </svg>
        );
      case 'pull':
        return (
          <svg
            viewBox="0 0 120 84"
            className="w-28 h-20 shrink-0"
            role="img"
            aria-label={`Animated form demo for ${name}`}
          >
            <line x1="24" y1="14" x2="96" y2="14" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />
            <g className="demo-motion-lift" stroke="var(--accent)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="60" cy="32" r="6" fill="var(--tint)" />
              <line x1="60" y1="39" x2="60" y2="62" />
              <polyline points="42,15 48,36 60,41" />
              <polyline points="78,15 72,36 60,41" />
              <line x1="60" y1="62" x2="53" y2="76" />
              <line x1="60" y1="62" x2="67" y2="76" />
            </g>
          </svg>
        );
      case 'hinge':
        return (
          <svg
            viewBox="0 0 120 84"
            className="w-28 h-20 shrink-0"
            role="img"
            aria-label={`Animated form demo for ${name}`}
          >
            <line x1="16" y1="74" x2="104" y2="74" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
            <g className="demo-motion-lift" stroke="var(--accent)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="76" cy="28" r="5.5" fill="var(--tint)" />
              <line x1="71" y1="32" x2="44" y2="48" />
              <line x1="66" y1="36" x2="66" y2="62" />
              <circle cx="66" cy="64" r="3.5" fill="var(--accent)" />
              <polyline points="44,48 54,60 54,73" />
            </g>
          </svg>
        );
      case 'core':
      case 'cardio':
      default:
        return (
          <svg
            viewBox="0 0 120 84"
            className="w-28 h-20 shrink-0"
            role="img"
            aria-label={`Animated form demo for ${name}`}
          >
            <line x1="12" y1="72" x2="108" y2="72" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
            <g className="demo-motion-lift" stroke="var(--accent)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="86" cy="44" r="5.5" fill="var(--tint)" />
              <line x1="80" y1="47" x2="30" y2="58" />
              <polyline points="74,49 74,70 84,70" />
              <line x1="30" y1="58" x2="26" y2="71" />
            </g>
          </svg>
        );
    }
  };

  return (
    <div
      className="mt-2 mb-3 rounded-xl p-3 flex items-center gap-3"
      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
    >
      {renderIllustration()}
      <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
        <strong className="block font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>
          Movement pattern: {demoType}
        </strong>
        Keep a controlled 2-second tempo on the lowering phase and exhale on effort.
      </div>
    </div>
  );
};

export default ExerciseDemo;
