import { PathResetConfirmation } from '@inzpro/domain/modules/path-reset/path-reset'
import { UserQualificationPathVersion } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { Schema } from 'effect'

export const ResetPathPayload = Schema.Struct({
  confirmation: PathResetConfirmation,
  expectedVersion: UserQualificationPathVersion,
})

export type ResetPathPayload = typeof ResetPathPayload.Type
