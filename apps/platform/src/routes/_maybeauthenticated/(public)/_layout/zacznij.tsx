import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { OnboardingPage } from '~platform/features/onboarding/OnboardingPage'
import { OnboardingSearch } from '~platform/features/onboarding/validation'

export const Route = createFileRoute('/_maybeauthenticated/(public)/_layout/zacznij')({
  validateSearch: Schema.toStandardSchemaV1(OnboardingSearch),
  component: OnboardingPage,
  head: () => ({
    meta: [...seo({ title: 'Wybierz ścieżkę nauki' }), { name: 'robots', content: 'noindex' }],
  }),
})
