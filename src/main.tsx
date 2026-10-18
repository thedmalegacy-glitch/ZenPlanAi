import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { getActiveServiceWorkerRegistration } from './utils/notifications';

// Immediate PWA & Service Worker activation for mobile notification shade and action handlers
registerSW({ immediate: true });
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  getActiveServiceWorkerRegistration().catch(() => {});
}

createRoot(document.getElementById('root')!).render(<App />);

