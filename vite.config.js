import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    nodePolyfills({
      // Exclude 'os' so we can use our custom shim
      exclude: ['os'],

      // Enable Node.js polyfills needed for GramJS
      include: [
        'buffer',
        'stream',
        'util',
        'events',
        'crypto',
        'process',
        'string_decoder',
        'path'
      ],

      globals: {
        Buffer: true,
        global: true,
        process: true,
      },

      protocolImports: true,
    }),

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

  define: {
    'process.env': {},
    'process.browser': true,
  },

  resolve: {
    alias: {
      // Use custom os shim for GramJS compatibility
      os: resolve(__dirname, 'src/lib/osShim.js'),
    },
  },

  optimizeDeps: {
    include: ['telegram', 'buffer'],
    exclude: ['os'],

    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },

    rollupOptions: {
      output: {
        intro: 'var exports = {}; var module = { exports: exports };',
      },
    },
  },

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
