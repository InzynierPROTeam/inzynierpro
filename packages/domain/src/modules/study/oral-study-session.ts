import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const OralStudySessionId = Uuid.pipe(Schema.brand('OralStudySessionId'))

export type OralStudySessionId = typeof OralStudySessionId.Type

export const hardSelfAssessment = 'hard'
export const mediumSelfAssessment = 'medium'
export const easySelfAssessment = 'easy'

export const oralSelfAssessmentValues = [
  hardSelfAssessment,
  mediumSelfAssessment,
  easySelfAssessment,
] as const

export const OralSelfAssessment = Schema.Literals(oralSelfAssessmentValues)

export type OralSelfAssessment = typeof OralSelfAssessment.Type
