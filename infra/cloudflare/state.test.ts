import { AlchemyContext } from 'alchemy/AlchemyContext'
import { StateStoreError } from 'alchemy/State'
import { deployMissing, upgradeOutdated } from 'alchemy/State/Provisioning'
import { ConfigProvider, Context, Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import { existingStateOnly } from './state.ts'

class StateReady extends Context.Service<StateReady, boolean>()('StateReady') {}

const store = { backend: 'cloudflare', name: 'inzpro-state', label: 'InzynierPRO state' }

describe('deployment state lifecycle', () => {
  it.each(['bootstrap', 'upgrade'] as const)(
    'refuses state %s even when deployment is approved',
    async action => {
      let provisioned = false

      const provision = Effect.sync(() => {
        provisioned = true

        return true
      })

      const policy =
        action === 'bootstrap'
          ? deployMissing(store, provision)
          : upgradeOutdated({ ...store, observed: 1, expected: 2 }, provision)

      const state = Layer.effect(StateReady, policy).pipe(existingStateOnly)

      const result = await Effect.runPromise(
        StateReady.pipe(
          Effect.provide(state),
          Effect.provideService(AlchemyContext, {
            dotAlchemy: '.alchemy',
            dev: false,
            adopt: false,
            updateStateStore: true,
          }),
          Effect.provideService(
            ConfigProvider.ConfigProvider,
            ConfigProvider.fromUnknown({ CI: 'true' }),
          ),
          Effect.match({ onFailure: error => error, onSuccess: () => undefined }),
        ),
      )

      expect(result).toBeInstanceOf(StateStoreError)
      expect(result).toMatchObject({ requires: { action } })
      expect(provisioned).toBe(false)
    },
  )
})
