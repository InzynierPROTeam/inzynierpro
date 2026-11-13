import { maxOnboardingStep } from '../config'
import type { OnboardingSearch } from '../validation'

const getFirstIncompleteStep = (draft: OnboardingSearch): number => {
  if (draft.specjalnosc === undefined) {
    return 1
  }

  if (draft.rodzaj === undefined) {
    return 2
  }

  if (draft.zakres === undefined) {
    return 3
  }

  if (draft.egzamin === undefined) {
    return 4
  }

  return maxOnboardingStep
}

export const getAvailableOnboardingStep = (draft: OnboardingSearch) =>
  Math.min(draft.krok ?? 1, getFirstIncompleteStep(draft))

export const updateOnboardingSearch = (
  draft: OnboardingSearch,
  patch: Partial<OnboardingSearch>,
): OnboardingSearch => ({ ...draft, ...patch })
