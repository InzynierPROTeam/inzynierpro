import { Schema } from 'effect'
import { expect, test } from 'vitest'

import { normalizeProfileName, ProfileName, profileNameMaxLength } from './profile.js'

const isProfileName = Schema.is(ProfileName)

test.each([
  ['a single character', 'A'],
  ['the maximum length', 'a'.repeat(profileNameMaxLength)],
  ['inner spaces', 'Jan Kowalski'],
])('accepts a name with %s', (_, name) => {
  expect(isProfileName(name)).toBe(true)
})

test.each([
  ['an empty name', ''],
  ['a name over the maximum length', 'a'.repeat(profileNameMaxLength + 1)],
  ['leading whitespace', ' Jan'],
  ['trailing whitespace', 'Jan '],
])('rejects %s', (_, name) => {
  expect(isProfileName(name)).toBe(false)
})

test.each([
  ['trims surrounding whitespace', '  Jan Kowalski  ', 'Jan Kowalski'],
  [
    'truncates to the maximum length',
    'a'.repeat(profileNameMaxLength + 5),
    'a'.repeat(profileNameMaxLength),
  ],
  [
    'drops whitespace left at the cut',
    `${'a'.repeat(profileNameMaxLength - 1)} b`,
    'a'.repeat(profileNameMaxLength - 1),
  ],
  [
    'keeps surrogate pairs whole at the cut',
    `${'a'.repeat(profileNameMaxLength - 1)}😀`,
    'a'.repeat(profileNameMaxLength - 1),
  ],
  ['returns an empty name for whitespace only', '   ', ''],
])('normalizing a sign-in name %s', (_, name, expected) => {
  expect(normalizeProfileName(name)).toBe(expected)
})

test('a non-empty normalized name is a valid profile name', () => {
  expect(isProfileName(normalizeProfileName(` ${'a'.repeat(profileNameMaxLength * 2)} `))).toBe(
    true,
  )
})
