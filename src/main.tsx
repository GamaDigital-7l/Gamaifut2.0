import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { Workbox } from 'workbox-window'; // Import Workbox

// Render the React app
createRoot(document.getElementById("root")!).render(<App />);

// --- PWA Update Handling ---
if ('serviceWorker' in navigator) {
  const wb = new Workbox('/sw.js'); // Path to your service worker file

  wb.addEventListener('waiting', () => {
    // A new service worker is waiting to activate.
    // This means a new version of your app is available.
    console.log('PWA: New service worker is waiting. Prompting user to reload.');
    if (confirm('Uma nova versão do aplicativo está disponível. Recarregar agora?')) {
      wb.messageSkipWaiting(); // Tell the waiting service worker to activate
      window.location.reload(); // Force a hard reload to get the new content
    }
  });

  wb.addEventListener('externalwaiting', () => {
    // Similar to 'waiting', but for service workers from other origins/scopes.
    console.log('PWA: External service worker is waiting. Prompting user to reload.');
    if (confirm('Uma nova versão do aplicativo está disponível. Recarregar agora?')) {
      wb.messageSkipWaiting();
      window.location.reload();
    }
  });

  wb.register(); // Register the service worker
  console.log('PWA: Service worker registered.');
}

// --- BFCache Handling ---
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was restored from BFCache.
    // Force a full reload to ensure fresh state and prevent issues.
    console.log('BFCache: Page restored from BFCache. Forcing full reload.');
    window.location.reload(true); // true forces a reload from the server, bypassing cache
  }
});