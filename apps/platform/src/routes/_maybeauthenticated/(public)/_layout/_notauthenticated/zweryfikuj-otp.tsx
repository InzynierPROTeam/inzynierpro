import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { seo } from '~platform/config/app'
import { VerifyOTPSearch } from '~platform/features/auth/validation'
import { VerifyOTPPage } from '~platform/features/auth/VerifyOTPPage'

export const Route = createFileRoute(
  '/_maybeauthenticated/(public)/_layout/_notauthenticated/zweryfikuj-otp',
)({
  validateSearch: Schema.toStandardSchemaV1(VerifyOTPSearch),
  component: VerifyOTPPage,
  head: () => ({
    meta: [...seo({ title: 'Zweryfikuj kod' }), { name: 'robots', content: 'noindex' }],
  }),
})
