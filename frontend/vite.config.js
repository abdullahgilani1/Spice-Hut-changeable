import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Combined Vite configuration: React + Tailwind + build tuning
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // Raise the warning limit to 1 MB so dev builds aren't noisy while
    // you address large assets. You can lower this later once assets
    // are optimized.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put node_modules into a vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor'
          }

          // Group large media (images/videos) into a separate chunk so
          // they don't inflate the main JS bundle. Prefer moving very
          // large assets to `public/` or a CDN instead of bundling them.
          if (id.includes('/src/assets/') || id.endsWith('.mp4') || id.endsWith('.webm')) {
            return 'media'
          }
        },
      },
    },
  },
})