import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt) {
      return (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt || null;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed or running in home screen PWA mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if early capture prompt exists
    if ((window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt) {
      setDeferredPrompt((window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt || null);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleEarlyPromptCaptured = () => {
      if ((window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt) {
        setDeferredPrompt((window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent }).__deferredPWAInstallPrompt || null);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as unknown as { __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null }).__deferredPWAInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-captured', handleEarlyPromptCaptured);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-captured', handleEarlyPromptCaptured);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}
