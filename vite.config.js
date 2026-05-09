import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: ['logo.png', 'logo.svg'],

      manifest: {
        name: 'TeleDrive Cloud Storage',
        short_name: 'TeleDrive',
        description: 'Cloud storage powered by Telegram',

        theme_color: '#0088cc',
        background_color: '#1e1e1e',

        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',

        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,

            handler: 'CacheFirst',

            options: {
              cacheName: 'google-fonts-cache',

              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },

  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
})
