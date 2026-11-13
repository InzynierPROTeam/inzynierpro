import { createFileRoute, redirect } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { OnboardingPublicPage } from '~platform/features/onboarding/OnboardingPublicPage'
import { getAvailableOnboardingStep } from '~platform/features/onboarding/utils/search'
import { OnboardingSearch } from '~platform/features/onboarding/validation'

export const Route = createFileRoute('/(public)/_layout/zacznij')({
  validateSearch: Schema.toStandardSchemaV1(OnboardingSearch),
  beforeLoad: ({ search }) => {
    const step = getAvailableOnboardingStep(search)

    if (step !== (search.krok ?? 1)) {
      throw redirect({ to: '/zacznij', search: { ...search, krok: step }, replace: true })
    }
  },
  component: OnboardingPublicPage,
  head: () => ({
    meta: seo({ title: 'Wybierz ścieżkę nauki' }),
  }),
})
