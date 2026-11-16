import { ConfigProvider, Effect } from 'effect'

// EXTERNAL: ConfigProvider.fromEnv() snapshots process.env; defer it until dotenv loading has completed.
export const EnvProviderLive = ConfigProvider.layer(Effect.sync(() => ConfigProvider.fromEnv()))
