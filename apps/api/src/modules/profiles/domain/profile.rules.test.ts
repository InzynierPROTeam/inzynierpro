import { UserId } from '@inzpro/domain/modules/identity/user'
import { Option, Schema } from 'effect'
import { expect, test } from 'vitest'

import type { UserProfile } from './profile.model.js'
import { canViewProfile } from './profile.rules.js'

const ownerId = Schema.decodeSync(UserId)('019a7ca1-8c00-7000-8000-000000000001')
const viewerId = Schema.decodeSync(UserId)('019a7ca1-8c00-7000-8000-000000000002')

const profile = (privateProfile: boolean): UserProfile => ({
  userId: ownerId,
  name: 'Anna Nowak',
  image: Option.none(),
  privateProfile,
})

test('anyone can view a public profile', () => {
  expect(canViewProfile(viewerId, profile(false))).toBe(true)
})

test('only the owner can view a private profile', () => {
  expect(canViewProfile(viewerId, profile(true))).toBe(false)
  expect(canViewProfile(ownerId, profile(true))).toBe(true)
})
