import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Production build optimizations
  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-dexie': ['dexie'],
          'vendor-zustand': ['zustand'],
          'vendor-lucide': ['lucide-react'],
        },
        // Cache-friendly chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    sourcemap: false,
    // Brotli/Gzip handled by CDN, not build-time
    reportCompressedSize: false,
  },

  // Dev server
  server: {
    port: 3000,
    open: false,
  },

  // Preview production build locally
  preview: {
    port: 4173,
    open: false,
  },
})
