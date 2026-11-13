import { createFileRoute, redirect } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { OnboardingPage } from '~platform/features/onboarding/OnboardingPage'
import { getAvailableOnboardingStep } from '~platform/features/onboarding/utils/search'
import { OnboardingSearch } from '~platform/features/onboarding/validation'

export const Route = createFileRoute('/(app)/_authenticated/pierwsze-kroki')({
  validateSearch: Schema.toStandardSchemaV1(OnboardingSearch),
  beforeLoad: ({ search }) => {
    const step = getAvailableOnboardingStep(search)

    if (step !== (search.krok ?? 1)) {
      throw redirect({ to: '/pierwsze-kroki', search: { ...search, krok: step }, replace: true })
    }
  },
  component: OnboardingPage,
  head: () => ({
    meta: seo({ title: 'Wybierz ścieżkę nauki' }),
  }),
})
