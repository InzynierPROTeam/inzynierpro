import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { SignInPage } from '~platform/features/auth/SignInPage'
import { SignInSearch } from '~platform/features/auth/validation'

export const Route = createFileRoute('/(public)/_layout/_notauthenticated/login/')({
  validateSearch: Schema.toStandardSchemaV1(SignInSearch),
  component: SignInPage,
  head: () => ({
    meta: [...seo({ title: 'Zaloguj się' }), { name: 'robots', content: 'noindex' }],
  }),
})
