import { Percent } from '@inzpro/domain/common/percent'
import {
  activeStudySession,
  endedStudySession,
  type StudySessionStatus,
} from '@inzpro/domain/modules/study/study-session'
import { Option } from 'effect'

import type { StudySession } from './study-session.model.js'

export const studySessionStatus = (session: Pick<StudySession, 'endedAt'>): StudySessionStatus =>
  Option.isSome(session.endedAt) ? endedStudySession : activeStudySession

/** The share of the session's questions already answered, rounded down so 100 means all of them. */
export const answeredPercent = (
  session: Pick<StudySession, 'answeredCount' | 'questionCount'>,
): Percent => Percent.make(Math.floor((session.answeredCount / session.questionCount) * 100))
