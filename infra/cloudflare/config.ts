import { Config, ConfigProvider, Data, Effect } from 'effect'

class InvalidDeploymentConfig extends Data.TaggedError('InvalidDeploymentConfig')<{
  message: string
}> {}

export const readDeploymentConfig = (values: NodeJS.ProcessEnv) =>
  Effect.gen(function* () {
    const config = yield* Config.all({
      accountId: Config.NonEmptyString('CLOUDFLARE_ACCOUNT_ID'),
      platform: Config.URL('VITE_APP_BASE_URL'),
      api: Config.URL('VITE_API_URL'),
      website: Config.URL('VITE_MAIN_PAGE_BASE_URL'),
      cookiesDomain: Config.NonEmptyString('COOKIES_DOMAIN'),
    }).parse(ConfigProvider.fromUnknown(values))

    if (!/^[a-f0-9]{32}$/.test(config.accountId)) {
      return yield* new InvalidDeploymentConfig({
        message: 'CLOUDFLARE_ACCOUNT_ID must be a 32-character account ID',
      })
    }

    for (const url of [config.platform, config.api, config.website]) {
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.port ||
        url.pathname !== '/' ||
        url.search ||
        url.hash
      ) {
        return yield* new InvalidDeploymentConfig({
          message: 'Deployment URLs must be HTTPS origins',
        })
      }
    }

    const cookiesDomain = config.cookiesDomain.replace(/^\./, '')

    if (
      cookiesDomain.split('.').length < 2 ||
      config.platform.hostname.split('.').slice(1).join('.') !== cookiesDomain ||
      config.api.hostname.split('.').slice(1).join('.') !== cookiesDomain ||
      config.platform.origin === config.api.origin
    ) {
      return yield* new InvalidDeploymentConfig({
        message: 'API and platform must be siblings under COOKIES_DOMAIN',
      })
    }

    return config
  })
