import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
// As importações de plugins Workbox foram removidas daqui, pois são gerenciadas internamente pelo VitePWA.
// import { CacheableResponsePlugin } from 'workbox-cacheable-response';
// import { ExpirationPlugin } from 'workbox-expiration';

export default defineConfig(async () => ({ // Adicionado 'async' aqui
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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      workbox: {
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
                // Instanciar CacheableResponsePlugin diretamente aqui
                new (await import('workbox-cacheable-response')).CacheableResponsePlugin({
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
                // Instanciar CacheableResponsePlugin diretamente aqui
                new (await import('workbox-cacheable-response')).CacheableResponsePlugin({
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
                // Instanciar ExpirationPlugin e CacheableResponsePlugin diretamente aqui
                new (await import('workbox-expiration')).ExpirationPlugin({
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                }),
                new (await import('workbox-cacheable-response')).CacheableResponsePlugin({
                  statuses: [0, 200],
                }),
              ],
            },
          },
        ],
        navigateFallback: null,
      },
      devOptions: {
        enabled: true,
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