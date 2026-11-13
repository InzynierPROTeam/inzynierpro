import type { Uuid } from '@inzpro/domain/common/id'
import { Effect } from 'effect'
import { Digest } from 'effect/crypto'

export const generateUserName = Effect.fn('Auth.generateUserName')(function* (seed: Uuid) {
  const digest = yield* Digest.Digest
  const hash = yield* digest.digestHex(Digest.sha256, new TextEncoder().encode(seed))

  return `Inżynier#${hash.slice(0, 6).toUpperCase()}`
}, Effect.provide(Digest.layerWebCrypto))
