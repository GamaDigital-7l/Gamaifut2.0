import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
// Import Workbox plugins here as they are used in the VitePWA config for runtimeCaching
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Use injectManifest strategy and point to the new sw.ts file
      strategies: 'injectManifest',
      srcDir: 'src', // Source directory for the service worker
      filename: 'sw.ts', // The name of your source service worker file
      workbox: {
        // These options are for generateSW, but injectManifest still uses some of them
        // like runtimeCaching. globDirectory/globPatterns are not needed for injectManifest
        // as the precache manifest is injected into the src/sw.ts file.
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/',
            handler: 'NetworkOnly',
            options: {
              cacheName: 'html-network-only',
              plugins: [
                new CacheableResponsePlugin({
                  statuses: [0, 200],
                }),
              ],
            },
          },
          {
            urlPattern: /\.(?:js|css|html|ico|png|svg|jpg|jpeg|gif|webp)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              plugins: [
                new CacheableResponsePlugin({
                  statuses: [0, 200],
                }),
              ],
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://rrwtsnecjuugqlwmpgzd.supabase.co',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              plugins: [
                new CacheableResponsePlugin({
                  statuses: [0, 200],
                }),
              ],
            },
          },
        ],
        // navigateFallback is not directly used in injectManifest, but good to keep consistent
        navigateFallback: null,
      },
      devOptions: {
        enabled: true,
        // navigateFallback: null is still important for the dev server not to serve index.html for sw.js
        navigateFallback: null,
      },
      manifest: {
        name: 'Gama Creative Fut',
        short_name: 'GamaFut',
        description: 'Gerenciamento de Campeonatos de Futebol',
        theme_color: '#1a202c',
        background_color: '#1a202c',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));