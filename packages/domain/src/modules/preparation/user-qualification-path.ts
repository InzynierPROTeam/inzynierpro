import { Schema } from 'effect'

export const UserQualificationPathVersion = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('UserQualificationPathVersion'),
)

export type UserQualificationPathVersion = typeof UserQualificationPathVersion.Type
