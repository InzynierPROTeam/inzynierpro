import { ConfigProvider, Effect } from 'effect'

// Reads the environment when the layer is built, after `env.ts` has loaded the dotenv file:
// `fromEnv()` copies process.env, so calling it at import time depends on module order.
export const EnvProviderLive = ConfigProvider.layer(Effect.sync(() => ConfigProvider.fromEnv()))
