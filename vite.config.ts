/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { splitVendorChunkPlugin } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    splitVendorChunkPlugin()
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-components': ['@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'lucide': ['lucide-react'],
          'zustand': ['zustand']
        }
      }
    },
    // Gunakan minifier default (esbuild). Drop console/debugger di bawah opsi esbuild.
  },
  esbuild: {
    // Remove console logs and debugger in production build
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
}))
