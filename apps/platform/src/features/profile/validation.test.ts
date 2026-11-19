import { profileNameMaxLength } from '@inzpro/domain/modules/profiles/profile'
import { Schema } from 'effect'
import { expect, test } from 'vitest'

import { profileNameFormSchema } from './validation'

const validator = Schema.toStandardSchemaV1(profileNameFormSchema)['~standard']

const messagesFor = async (name: string) => {
  const result = await validator.validate({ name })

  return result.issues?.map(issue => issue.message) ?? []
}

test.each([
  ['an empty name', ''],
  ['a name of whitespace only', '   '],
])('the form asks for a name when given %s', async (_, name) => {
  expect(await messagesFor(name)).toContain('Wpisz nazwę profilu.')
})

test('the form rejects a name that is too long after trimming', async () => {
  expect(await messagesFor('a'.repeat(profileNameMaxLength + 1))).toContain(
    `Nazwa może mieć maksymalnie ${profileNameMaxLength} znaków.`,
  )
})

test('the form measures the trimmed name', async () => {
  expect(await messagesFor(`  ${'a'.repeat(profileNameMaxLength)}  `)).toEqual([])
})
