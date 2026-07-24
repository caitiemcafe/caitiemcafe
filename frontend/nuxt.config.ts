import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

const apiTarget = process.env.NUXT_API_TARGET || process.env.VITE_API_TARGET || 'http://127.0.0.1:3003'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@vueuse/nuxt'
  ],

  css: ['~/src/style.css'],

  vite: {
    plugins: [
      tailwindcss()
    ]
  },

  runtimeConfig: {
    apiTarget,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.VITE_API_BASE_URL || '/api'
    }
  },

  routeRules: {
    '/admin/**': { ssr: false },
    '/api/**': { proxy: `${apiTarget}/api/**` }
  },

  nitro: {
    devProxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  },

  app: {
    head: {
      title: 'Cái Tiệm KÀFE — Một chút cà phê. Một ngày thật chill.',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Cái Tiệm — cà phê, ca cao, sữa chua và những thông điệp nhỏ cho một ngày thật chill.' },
        { name: 'theme-color', content: '#3B2417' },
        { property: 'og:title', content: 'Cái Tiệm KÀFE' },
        { property: 'og:description', content: 'Một chút cà phê. Một ngày thật chill.' },
        { property: 'og:image', content: '/images/brand/hero-cafe.webp' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180x180.png' }
      ]
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    manifest: {
      name: 'Cái Tiệm KÀFE',
      short_name: 'Cái Tiệm',
      description: 'Cái Tiệm — cà phê, ca cao, sữa chua và những thông điệp nhỏ cho một ngày thật chill.',
      theme_color: '#3B2417',
      background_color: '#FFFAF3',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: true,
      type: 'module',
      suppressWarnings: true
    }
  }
})
