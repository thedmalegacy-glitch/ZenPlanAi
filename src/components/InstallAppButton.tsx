import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const InstallAppButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // If already installed in standalone mode, do not clutter the UI
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // In browsers where beforeinstallprompt hasn't fired yet or desktop browser
      setShowHelpModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Install ZenPlan App"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium font-body bg-white border border-[#DDE5EA] text-[#17212B] hover:bg-[#F2A33A]/10 hover:border-[#F2A33A]/50 active:scale-95 transition-all shadow-none cursor-pointer"
        title="Install app to your home screen"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#F2A33A]"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Install App</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] bg-white border border-[#DDE5EA] p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F2A33A]/15 flex items-center justify-center text-[#F2A33A]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <h3 id="ios-install-title" className="font-heading text-[18px] font-bold text-[#17212B]">
                  Install on iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#55636F] hover:bg-[#EEF3F6]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="font-body text-[13px] text-[#55636F] leading-relaxed">
              Install <strong>ZenPlan</strong> directly on your home screen for a fullscreen, fast app experience:
            </p>

            <ol className="font-body text-[13px] text-[#17212B] space-y-2.5 bg-[#EEF3F6] p-3.5 rounded-[16px]">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[#F2A33A]">1.</span>
                <span>
                  Tap the <strong>Share</strong> button (
                  <svg className="inline w-3.5 h-3.5 mx-0.5 text-[#2F3E8F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  ) in Safari toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[#F2A33A]">2.</span>
                <span>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-[#F2A33A]">3.</span>
                <span>Tap <strong>Add</strong> in the top-right corner.</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-[16px] bg-[#17212B] text-white font-body text-[13px] font-semibold hover:bg-black transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* General / Android instructions modal if native prompt is blocked or queued */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="generic-install-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[24px] bg-white border border-[#DDE5EA] p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F2A33A]/15 flex items-center justify-center text-[#F2A33A]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <h3 id="generic-install-title" className="font-heading text-[18px] font-bold text-[#17212B]">
                  Install ZenPlan App
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#55636F] hover:bg-[#EEF3F6]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="font-body text-[13px] text-[#55636F] leading-relaxed">
              To install ZenPlan directly on your phone or desktop:
            </p>

            <ul className="font-body text-[13px] text-[#17212B] space-y-2 bg-[#EEF3F6] p-3.5 rounded-[16px]">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2A8C8C]">•</span>
                <span><strong>In Chrome/Edge:</strong> Tap the browser menu (⋮) and select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#2A8C8C]">•</span>
                <span><strong>In Safari (iOS):</strong> Tap Share (square with arrow) → <strong>&quot;Add to Home Screen&quot;</strong>.</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-[16px] bg-[#17212B] text-white font-body text-[13px] font-semibold hover:bg-black transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
