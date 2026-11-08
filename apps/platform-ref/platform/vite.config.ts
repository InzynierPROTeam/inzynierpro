import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { iconsSpritesheet } from 'vite-plugin-icons-spritesheet'
import { env } from '~platform/lib/env.server'

export default defineConfig({
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
  resolve: { tsconfigPaths: true },
  server: { host: true, port: env.PORT, strictPort: true },
  preview: { host: true, port: env.PORT, strictPort: true },
})
