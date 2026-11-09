import { Config, ConfigProvider, Effect } from 'effect'

export const serverConfig = Config.all({
  PORT: Config.Port('PORT').pipe(Config.withDefault(8001)),
})

export const readServerEnv = (values: Record<string, string>) =>
  Effect.runSync(serverConfig.parse(ConfigProvider.fromUnknown(values)))
