import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppButtonProps {
  onModalStateChange?: (isOpen: boolean) => void;
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({ onModalStateChange }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const onPop = () => {
      setShowIOSModal(false);
      setShowHelpModal(false);
      onModalStateChange?.(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [onModalStateChange]);

  const closeModals = () => {
    setShowIOSModal(false);
    setShowHelpModal(false);
    onModalStateChange?.(false);
    if (window.history.state?.modal === 'pwa-install') {
      window.history.back();
    }
  };

  const openModal = (type: 'ios' | 'help') => {
    window.history.pushState({ modal: 'pwa-install' }, '');
    onModalStateChange?.(true);
    if (type === 'ios') {
      setShowIOSModal(true);
    } else {
      setShowHelpModal(true);
    }
  };

  // If already installed in standalone mode, do not clutter the UI
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      openModal('ios');
    } else {
      openModal('help');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Install ZenPlan App"
        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-medium font-body bg-white border border-[#DDE5EA] text-[#17212B] hover:bg-[#F2A33A]/10 hover:border-[#F2A33A]/50 active:scale-95 active:bg-[#F2A33A]/20 transition-all shadow-none cursor-pointer"
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

      {/* iOS Instructions Modal - Positioned in the MIDDLE of the screen */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm transition-opacity overflow-y-auto"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-sm my-auto rounded-[24px] bg-white border border-[#DDE5EA] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EEF3F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#F2A33A]/15 flex items-center justify-center text-[#F2A33A] flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <div>
                  <h3 id="ios-install-title" className="font-heading text-[17px] font-bold text-[#17212B] leading-tight">
                    Install on iPhone / iPad
                  </h3>
                  <p className="font-body text-[11px] text-[#55636F]">
                    Fast 1-tap home screen access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModals}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="font-body text-[13px] text-[#55636F] leading-relaxed">
              Install <strong>ZenPlan</strong> directly on your home screen for an offline-ready, fullscreen app:
            </p>

            <ol className="font-body text-[13px] text-[#17212B] space-y-3 bg-[#EEF3F6] p-3.5 rounded-[18px]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#F2A33A] text-[#17212B] font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  <span>Tap the <strong>Share</strong> button (</span>
                  <svg className="inline w-3.5 h-3.5 mx-0.5 text-[#2F3E8F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  <span>) in Safari&apos;s bottom toolbar.</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#F2A33A] text-[#17212B] font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div>Scroll down the menu and tap <strong>&quot;Add to Home Screen&quot;</strong>.</div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#F2A33A] text-[#17212B] font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <div>Tap <strong>Add</strong> in the top-right corner of your screen.</div>
              </li>
            </ol>

            <button
              type="button"
              onClick={closeModals}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-[16px] bg-[#17212B] text-white font-body text-sm font-semibold hover:bg-black active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* General / Android Instructions Modal - Positioned in the MIDDLE of the screen */}
      {showHelpModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="generic-install-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm transition-opacity overflow-y-auto"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-sm my-auto rounded-[24px] bg-white border border-[#DDE5EA] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EEF3F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#F2A33A]/15 flex items-center justify-center text-[#F2A33A] flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div>
                  <h3 id="generic-install-title" className="font-heading text-[17px] font-bold text-[#17212B] leading-tight">
                    Install ZenPlan App
                  </h3>
                  <p className="font-body text-[11px] text-[#55636F]">
                    Save to home screen & use offline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModals}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Prominent Download Button if browser install prompt is ready */}
            {isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  await install();
                  closeModals();
                }}
                className="w-full min-h-[48px] py-3 px-4 rounded-[16px] bg-[#F2A33A] text-[#17212B] font-body text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#e09228] active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download & Install App Now</span>
              </button>
            )}

            <p className="font-body text-[13px] text-[#55636F] leading-relaxed">
              To install directly to your device home screen:
            </p>

            <ul className="font-body text-[12.5px] text-[#17212B] space-y-2.5 bg-[#EEF3F6] p-3.5 rounded-[18px]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#17212B] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <div>
                  <strong>On Android (Chrome / Edge / Brave):</strong> Tap the <strong>⋮ (3 dots)</strong> menu in the top-right corner of your browser, then tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#17212B] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <div>
                  <strong>On iPhone / iPad (Safari):</strong> Tap the <strong>Share</strong> button at the bottom of the screen, then choose <strong>&quot;Add to Home Screen&quot;</strong>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#17212B] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <div>
                  <strong>On Desktop / Laptop:</strong> Click the <strong>Install</strong> icon in your browser URL bar.
                </div>
              </li>
            </ul>

            {/* Bottom Actions Row */}
            <div className="flex gap-2.5 pt-1">
              {isInstallable ? (
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    closeModals();
                  }}
                  className="flex-1 min-h-[44px] py-2.5 px-3 rounded-[16px] bg-[#F2A33A] text-[#17212B] font-body text-xs font-bold hover:bg-[#e09228] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Install Now</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={closeModals}
                className={`min-h-[44px] py-2.5 px-4 rounded-[16px] bg-[#17212B] text-white font-body text-xs font-semibold hover:bg-black active:scale-95 transition-all cursor-pointer ${
                  isInstallable ? 'w-auto' : 'w-full'
                }`}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
