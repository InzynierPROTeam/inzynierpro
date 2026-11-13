import { specializationsQueryOptions } from '@inzpro/queries/modules/qualification-paths'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { seo } from '~platform/config/app'
import { onboardingOptionsLimit } from '~platform/features/onboarding/config'
import { OnboardingPublicPage } from '~platform/features/onboarding/OnboardingPublicPage'
import { getAvailableOnboardingStep } from '~platform/features/onboarding/utils/search'
import { OnboardingSearch } from '~platform/features/onboarding/validation'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(public)/_layout/zacznij')({
  validateSearch: Schema.toStandardSchemaV1(OnboardingSearch),
  beforeLoad: ({ search }) => {
    const step = getAvailableOnboardingStep(search)

    if (step !== (search.krok ?? 1)) {
      throw redirect({ to: '/zacznij', search: { ...search, krok: step }, replace: true })
    }
  },
  loader: ({ context: { queryClient } }) => {
    void queryClient
      .query(
        specializationsQueryOptions(apiHttpClient, {
          query: { limit: onboardingOptionsLimit },
        }),
      )
      .catch(constVoid)
  },
  component: OnboardingPublicPage,
  head: () => ({
    meta: seo({ title: 'Wybierz ścieżkę nauki' }),
  }),
})
