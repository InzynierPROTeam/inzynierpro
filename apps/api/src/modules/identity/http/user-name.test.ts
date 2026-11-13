import { generateUserName } from '@inzpro/auth/user-name'
import { Uuid } from '@inzpro/domain/common/id'
import { Effect, Schema } from 'effect'
import { expect, test } from 'vitest'

test.each([
  ['019a7ca1-8c00-7000-8000-000000000001', 'Inżynier#C9D93A'],
  ['019a7ca1-8c00-7000-8000-000000000002', 'Inżynier#D56C77'],
])('generates a stable name from the temporary UUID seed (%s)', async (id, expected) => {
  expect(await Effect.runPromise(generateUserName(Schema.decodeSync(Uuid)(id)))).toBe(expected)
})
