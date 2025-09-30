import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa'; // Importar VitePWA

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    VitePWA({ // Configuração do VitePWA
      registerType: 'autoUpdate', // Garante que o SW tente se atualizar automaticamente
      injectRegister: 'auto',
      workbox: {
        clientsClaim: true, // Assume o controle de clientes não controlados imediatamente
        skipWaiting: true, // Ativa o novo SW imediatamente após a instalação
        cleanupOutdatedCaches: true, // Limpa caches antigos automaticamente
        // Estratégias de cache para diferentes tipos de assets
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname === '/', // Especificamente para o index.html
            handler: 'NetworkOnly', // Garante que index.html NUNCA seja servido do cache
            options: {
              cacheName: 'html-network-only',
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:js|css|html|ico|png|svg|jpg|jpeg|gif|webp)$/i, // Cache para assets estáticos
            handler: 'StaleWhileRevalidate', // Serve do cache enquanto revalida na rede
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://rrwtsnecjuugqlwmpgzd.supabase.co', // Cache para Supabase
            handler: 'NetworkFirst', // Prioriza a rede para dados Supabase
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        navigateFallback: null, // Impede que index.html seja servido como fallback para navegação offline
      },
      manifest: {
        name: 'Gama Creative Fut',
        short_name: 'GamaFut',
        description: 'Gerenciamento de Campeonatos de Futebol',
        theme_color: '#1a202c', // Cor do tema para o navegador
        background_color: '#1a202c', // Cor de fundo para a tela inicial
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