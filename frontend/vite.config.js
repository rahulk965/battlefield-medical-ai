import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
  react(),
  VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'Battlefield Medical Assistant',
        short_name: 'BattlefieldMed',
        description: 'AI-Powered Battlefield Healthcare Assistant',
        theme_color: '#1a202c',
        background_color: '#1a202c',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3001,
    strictPort: false,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3001
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})