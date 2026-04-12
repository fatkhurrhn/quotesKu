import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9900,
    proxy: {
      '/api/ayanami': {
        target: 'https://ayanami.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ayanami/, '/api/upload')
      }
    }
  }
})