import { UserQualificationPathVersion } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const PathReset = Schema.Struct({
  qualificationPathId: QualificationPathId,
  version: UserQualificationPathVersion,
})

export type PathReset = typeof PathReset.Type
