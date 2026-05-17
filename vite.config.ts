import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (info) => {
          const infoSrc = info.name || ''
          if (infoSrc.endsWith('.css')) return 'assets/[name][extname]'
          return 'assets/[name][extname]'
        },
      },
    },
  },
})
