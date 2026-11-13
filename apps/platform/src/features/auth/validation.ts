import { Email } from '@inzpro/domain/common/email'
import { Schema } from 'effect'

import { onboardingSignInIntent } from './config'

export const SignInSearch = Schema.Struct({
  redirect: Schema.optional(Schema.String),
  intent: Schema.optional(Schema.Literal(onboardingSignInIntent)),
  error: Schema.optional(Schema.String),
})

export const VerifyOTPSearch = Schema.Struct({
  email: Email,
  redirect: Schema.optional(Schema.String),
  intent: Schema.optional(Schema.Literal(onboardingSignInIntent)),
})
