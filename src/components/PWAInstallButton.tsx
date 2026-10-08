import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[44px] px-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 whitespace-nowrap transition-opacity active:opacity-80"
        style={{
          backgroundColor: compact ? 'var(--tint)' : 'var(--accent)',
          color: compact ? 'var(--accent)' : 'var(--on-accent)',
        }}
        aria-label="Install ZenPlan app"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
        </svg>
        <span>{compact ? 'Install' : 'Install app to home screen'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[44px] px-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 whitespace-nowrap"
          style={{
            backgroundColor: 'var(--tint)',
            color: 'var(--accent)',
          }}
        >
          <span>{compact ? 'Install' : 'Install on iPhone'}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ backgroundColor: 'rgba(10, 12, 18, 0.55)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Install on iOS"
          >
            <div
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
            >
              <h3 className="text-lg font-bold">Install on iPhone or iPad</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                1. Tap the <strong style={{ color: 'var(--ink)' }}>Share</strong> button in Safari.
                <br />
                2. Scroll down and tap <strong style={{ color: 'var(--ink)' }}>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[48px] rounded-xl font-bold text-sm"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--on-accent)' }}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
