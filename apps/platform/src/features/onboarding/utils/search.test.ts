import { bothExamAccess, writtenExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { OnboardingSearch } from '../validation'
import { getAvailableOnboardingStep, updateOnboardingSearch } from './search'

const complete = Schema.decodeSync(OnboardingSearch)({
  specjalnosc: '60000000-0000-4000-8000-000000000001',
  rodzaj: '70000000-0000-4000-8000-000000000001',
  zakres: '80000000-0000-4000-8000-000000000001',
  egzamin: bothExamAccess,
  sesja: '90000000-0000-4000-8000-000000000001',
  krok: 5,
})

describe('committed onboarding choices', () => {
  it('does not allow skipping required steps', () => {
    expect(getAvailableOnboardingStep({ krok: 5 })).toBe(1)
    expect(getAvailableOnboardingStep({ specjalnosc: complete.specjalnosc, krok: 5 })).toBe(2)
    expect(getAvailableOnboardingStep({ ...complete, zakres: undefined })).toBe(3)
    expect(getAvailableOnboardingStep({ ...complete, egzamin: undefined })).toBe(4)
    expect(getAvailableOnboardingStep(complete)).toBe(5)
    expect(getAvailableOnboardingStep({ ...complete, krok: 2 })).toBe(2)
  })
  it('merges the explicit patch without mutating the committed draft', () => {
    const next = updateOnboardingSearch(complete, { egzamin: writtenExamAccess, sesja: undefined })
    expect(next.egzamin).toBe(writtenExamAccess)
    expect(next.sesja).toBeUndefined()
    expect(next.specjalnosc).toBe(complete.specjalnosc)
    expect(complete.egzamin).toBe(bothExamAccess)
    expect(complete.sesja).toBeDefined()
  })
})
