import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { env } from '~platform/lib/env.server'

export default defineConfig({
  plugins: [tanstackStart(), react()],
  resolve: { tsconfigPaths: true },
  server: { host: true, port: env.PORT, strictPort: true },
  preview: { host: true, port: env.PORT, strictPort: true },
})
