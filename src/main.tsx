import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
// Removido: import { Workbox } from 'workbox-window'; // Import Workbox

// Render the React app
createRoot(document.getElementById("root")!).render(<App />);

// --- PWA Update Handling (Agora gerenciado pelo vite-plugin-pwa com injectRegister: 'auto') ---
// O vite-plugin-pwa injetará um script que registra o Service Worker
// e lida com as atualizações automaticamente.
// Se você precisar de lógica personalizada para 'waiting' ou 'externalwaiting',
// você pode adicionar um listener ao 'window.addEventListener('load', () => { ... })'
// e usar 'navigator.serviceWorker.ready.then(registration => { ... })' para acessar o SW.

// --- BFCache Handling ---
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was restored from BFCache.
    // Force a full reload to ensure fresh state and prevent issues.
    console.log('BFCache: Page restored from BFCache. Forcing full reload.');
    window.location.reload(true); // true forces a reload from the server, bypassing cache
  }
});