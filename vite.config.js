import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Exclude 'os' so we can use our custom shim
      exclude: ['os'],
      // Enable all other Node.js polyfills needed for GramJS
      include: ['buffer', 'stream', 'util', 'events', 'crypto', 'process', 'string_decoder', 'path'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  define: {
    'process.env': {},
    'process.browser': true,
  },
  resolve: {
    alias: {
      // Use custom os shim for GramJS compatibility (must be absolute path)
      'os': resolve(__dirname, 'src/lib/osShim.js'),
    }
  },
  optimizeDeps: {
    include: ['telegram', 'buffer'],
    exclude: ['os'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        intro: 'var exports = {}; var module = { exports: exports };',
      }
    }
  }
})
