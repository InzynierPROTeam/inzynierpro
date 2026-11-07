import { ConfigProvider } from 'effect'

export const EnvProviderLive = ConfigProvider.layer(ConfigProvider.fromEnv())
