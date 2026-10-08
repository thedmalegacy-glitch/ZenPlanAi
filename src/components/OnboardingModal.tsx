import React, { useState } from 'react';
import { AppSettings, FitnessGoal, FitnessLevel } from '../types';
import { haptic } from '../utils/dateAndHaptics';

interface OnboardingModalProps {
  open: boolean;
  settings: AppSettings;
  onComplete: (updated: Partial<AppSettings>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  settings,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [level, setLevel] = useState<FitnessLevel>(settings.fitnessLevel || 'Beginner');
  const [goal, setGoal] = useState<FitnessGoal>(settings.fitnessGoal || 'strength');
  const [aiEnabled, setAiEnabled] = useState<boolean>(settings.aiEnabled);

  if (!open) return null;

  const finish = () => {
    haptic(12);
    onComplete({
      fitnessLevel: level,
      fitnessGoal: goal,
      aiEnabled,
      onboarded: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0"
        style={{ backgroundColor: 'rgba(10, 12, 18, 0.55)' }}
        onClick={finish}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-[560px] rounded-t-[24px] sm:rounded-[24px] p-6 animate-sheet"
        style={{
          backgroundColor: 'var(--surface)',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to ZenPlan AI"
      >
        <div className="flex items-center justify-between text-xs font-bold mb-4" style={{ color: 'var(--muted)' }}>
          <span>Step {step} of 3</span>
          <button
            type="button"
            onClick={finish}
            className="min-h-[44px] px-2 text-xs font-semibold"
            style={{ color: 'var(--muted)' }}
          >
            Skip setup
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Pick your training level</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Matches your workouts to your current experience. You can switch anytime.
              </p>
            </div>

            <div className="space-y-2.5">
              {(
                [
                  {
                    lv: 'Beginner',
                    desc: 'New to training or returning after a break. Simple, low-impact moves.',
                  },
                  {
                    lv: 'Intermediate',
                    desc: 'Consistent training. Ready for dumbbell volume and controlled tempo.',
                  },
                  {
                    lv: 'Advanced',
                    desc: 'Experienced lifter comfortable with heavy barbells and intervals.',
                  },
                ] as const
              ).map((item) => {
                const active = level === item.lv;
                return (
                  <button
                    key={item.lv}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setLevel(item.lv);
                      haptic(8);
                    }}
                    className="w-full text-left p-4 rounded-2xl transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--tint)' : 'var(--bg)',
                      border: `2px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                    }}
                  >
                    <div className="font-bold text-base" style={{ color: active ? 'var(--accent)' : 'var(--ink)' }}>
                      {item.lv}
                    </div>
                    <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[52px] rounded-2xl font-bold text-base mt-2"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Choose your primary goal</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Helps prioritize workouts and AI session suggestions.
              </p>
            </div>

            <div className="space-y-2.5">
              {(
                [
                  {
                    g: 'strength',
                    label: 'Strength & muscle',
                    desc: 'Progressive compound movements and controlled rest periods.',
                  },
                  {
                    g: 'fat loss',
                    label: 'Fat loss & conditioning',
                    desc: 'Full-body circuits and brisk intervals to keep heart rate up.',
                  },
                  {
                    g: 'mobility',
                    label: 'Mobility & posture',
                    desc: 'Joint health, core stability, and desk-posture relief.',
                  },
                ] as const
              ).map((item) => {
                const active = goal === item.g;
                return (
                  <button
                    key={item.g}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setGoal(item.g);
                      haptic(8);
                    }}
                    className="w-full text-left p-4 rounded-2xl transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--tint)' : 'var(--bg)',
                      border: `2px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                    }}
                  >
                    <div className="font-bold text-base" style={{ color: active ? 'var(--accent)' : 'var(--ink)' }}>
                      {item.label}
                    </div>
                    <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[52px] px-5 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 min-h-[52px] rounded-2xl font-bold text-base"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Enable AI assistance?</h2>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
                Use AI for natural-language quick add, breaking down big goals, daily time-blocking, and custom workouts.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                aria-pressed={aiEnabled}
                onClick={() => setAiEnabled(true)}
                className="w-full text-left p-4 rounded-2xl"
                style={{
                  backgroundColor: aiEnabled ? 'var(--tint)' : 'var(--bg)',
                  border: `2px solid ${aiEnabled ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                <div className="font-bold text-base" style={{ color: aiEnabled ? 'var(--accent)' : 'var(--ink)' }}>
                  Enable AI assistant (recommended)
                </div>
                <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Only your prompt or task titles are sent when you ask for a preview. Every suggestion requires your confirmation.
                </div>
              </button>

              <button
                type="button"
                aria-pressed={!aiEnabled}
                onClick={() => setAiEnabled(false)}
                className="w-full text-left p-4 rounded-2xl"
                style={{
                  backgroundColor: !aiEnabled ? 'var(--tint)' : 'var(--bg)',
                  border: `2px solid ${!aiEnabled ? 'var(--accent)' : 'var(--line)'}`,
                }}
              >
                <div className="font-bold text-base" style={{ color: !aiEnabled ? 'var(--accent)' : 'var(--ink)' }}>
                  Keep AI off (100% local only)
                </div>
                <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Nothing ever leaves your device. You can turn AI on later in Settings.
                </div>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[52px] px-5 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--line)' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={finish}
                className="flex-1 min-h-[52px] rounded-2xl font-bold text-base"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                Start planning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
