import { Email } from '@inzpro/domain/common/email'
import { Schema } from 'effect'

export const SignInSearch = Schema.Struct({
  redirect: Schema.optional(Schema.String),
})

export const VerifyOTPSearch = Schema.Struct({
  email: Email,
  redirect: Schema.optional(Schema.String),
})
