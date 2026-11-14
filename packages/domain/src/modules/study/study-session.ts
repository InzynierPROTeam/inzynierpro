import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const StudySessionId = Uuid.pipe(Schema.brand('StudySessionId'))

export type StudySessionId = typeof StudySessionId.Type

/** The 1-based place of a question in a session's fixed question set. */
export const SessionQuestionPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('SessionQuestionPosition'),
)

export type SessionQuestionPosition = typeof SessionQuestionPosition.Type

export const activeStudySession = 'active'
export const endedStudySession = 'ended'
export const studySessionStatusValues = [activeStudySession, endedStudySession] as const

/** An active session can be continued; an ended one only keeps its results. */
export const StudySessionStatus = Schema.Literals(studySessionStatusValues)

export type StudySessionStatus = typeof StudySessionStatus.Type
