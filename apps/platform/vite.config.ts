import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { iconsSpritesheet } from 'vite-plugin-icons-spritesheet'

import { readServerEnv } from './src/lib/env.server.ts'

export default defineConfig(({ mode }) => {
  const values = loadEnv(mode, import.meta.dirname, '')
  const env = readServerEnv(values)

  return {
    plugins: [
      tailwindcss(),
      iconsSpritesheet({
        withTypes: true,
        inputDir: 'icons',
        outputDir: 'src/styles',
        typesOutputFile: 'src/types/icons.ts',
        formatter: 'oxfmt',
      }),
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tanstackStart({
        pages: [{ path: '/' }],
        prerender: {
          enabled: false,
          crawlLinks: false,
          autoStaticPathsDiscovery: false,
        },
      }),
      react({ compiler: { target: '19' } }),
    ],
    optimizeDeps: {
      include: ['pdf-lib', '@pdf-lib/fontkit'],
    },
    server: {
      host: true,
      port: env.PORT,
    },
    resolve: {
      tsconfigPaths: true,
    },
  }
})
