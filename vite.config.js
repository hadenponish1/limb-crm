import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5180, open: true },
  // Allow the Railway (or any) host to serve the built app via `npm start`.
  preview: { host: true, allowedHosts: true },
})
