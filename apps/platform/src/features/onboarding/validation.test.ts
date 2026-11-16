import { Exit, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  ExamStepValues,
  KindStepValues,
  OnboardingSearch,
  ScopeStepValues,
  SessionStepValues,
  SpecializationStepValues,
} from './validation'

const specializationId = '60000000-0000-4000-8000-000000000001'

const stepMessages = async (
  schema: Parameters<typeof Schema.toStandardSchemaV1>[0],
  input: Record<string, string>,
) => {
  const result = await Schema.toStandardSchemaV1(schema)['~standard'].validate(input)

  return result.issues?.map(issue => issue.message) ?? []
}

describe('onboarding search', () => {
  const decode = Schema.decodeUnknownExit(OnboardingSearch)

  it('accepts a complete draft taken from the URL', () => {
    const draft = {
      specjalnosc: specializationId,
      rodzaj: '70000000-0000-4000-8000-000000000001',
      zakres: '80000000-0000-4000-8000-000000000001',
      krok: 5,
      egzamin: 'both',
      sesja: '90000000-0000-4000-8000-000000000001',
    }

    expect(decode(draft)).toEqual(Exit.succeed(draft))
  })

  it.each([0, 6, 2.5])('rejects step %s outside the five wizard steps', krok =>
    expect(Exit.isFailure(decode({ krok }))).toBe(true),
  )

  it('rejects an exam part that is not offered', () =>
    expect(Exit.isFailure(decode({ egzamin: 'practical' }))).toBe(true))
})

describe('onboarding steps', () => {
  it.each([
    [SpecializationStepValues, 'specializationId', 'Wybierz specjalność, aby kontynuować.'],
    [KindStepValues, 'qualificationKindId', 'Wybierz rodzaj uprawnień, aby kontynuować.'],
    [ScopeStepValues, 'qualificationScopeId', 'Wybierz zakres uprawnień, aby kontynuować.'],
    [ExamStepValues, 'accessScope', 'Wybierz egzamin, do którego chcesz się przygotować.'],
    [SessionStepValues, 'examSessionId', 'Wybierz sesję egzaminacyjną, aby rozpocząć naukę.'],
  ] as const)('an empty choice explains what to pick (%#)', async (schema, field, message) =>
    expect(await stepMessages(schema, { [field]: '' })).toEqual([message]),
  )

  it('a chosen specialization passes', async () =>
    expect(await stepMessages(SpecializationStepValues, { specializationId })).toEqual([]))
})
