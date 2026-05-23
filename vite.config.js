import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Generate a unique boot timestamp for this dev server session
const devServerBootTime = Date.now();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __DEV_SERVER_ID__: JSON.stringify(devServerBootTime),
  },
})
