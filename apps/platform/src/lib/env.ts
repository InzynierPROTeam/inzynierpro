import { Config, ConfigProvider, Effect } from 'effect'

export const clientConfig = Config.all({
  VITE_API_URL: Config.URL('VITE_API_URL'),
  VITE_APP_BASE_URL: Config.URL('VITE_APP_BASE_URL'),
  VITE_MAIN_PAGE_BASE_URL: Config.URL('VITE_MAIN_PAGE_BASE_URL'),
  VITE_GOOGLE_TAG_MANAGER_ID: Config.String('VITE_GOOGLE_TAG_MANAGER_ID').pipe(
    Config.withDefault(''),
  ),
  VITE_META_PIXEL_ID: Config.String('VITE_META_PIXEL_ID').pipe(Config.withDefault('')),
})

export const readClientEnv = (values: Record<string, string | undefined>) =>
  Effect.runSync(clientConfig.parse(ConfigProvider.fromUnknown(values)))

export const env = readClientEnv(import.meta.env)
