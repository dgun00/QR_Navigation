import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   server: {
    // 이 부분을 추가해주세요.
    allowedHosts: ['.ngrok-free.app']
  }
})
