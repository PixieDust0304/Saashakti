import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'सशक्ति — Saashakti',
        short_name: 'सशक्ति',
        description: 'महिला कल्याण योजना मिलान मंच',
        theme_color: '#ED7023',
        background_color: '#FFF7ED',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    // LAN dev: allow mDNS hostnames and IP access from any device on the
    // WLAN. Vite 5.0.12+ blocks unknown hosts by default as DNS-rebinding
    // protection; `true` disables that for the dev server only.
    allowedHosts: true,
    proxy: {
      '/v1': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['jsqr'],
  },
})
