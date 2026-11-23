import { UserQualificationPathVersion } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const PathResetResponse = Schema.Struct({
  qualificationPathId: QualificationPathId,
  version: UserQualificationPathVersion,
})

export type PathResetResponse = typeof PathResetResponse.Type
