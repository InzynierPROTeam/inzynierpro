import type {
  LatestStudySession,
  StudySession as StudySessionDto,
} from '@inzpro/api-contracts/modules/study/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Option } from 'effect'
import type { StudySession } from '~api/modules/study/domain/study-session.model.js'
import {
  answeredPercent,
  studySessionStatus,
} from '~api/modules/study/domain/study-session.rules.js'

export const toStudySessionDto = (session: StudySession): StudySessionDto => ({
  id: session.id,
  status: studySessionStatus(session),
  progress: {
    total: session.questionCount,
    answered: session.answeredCount,
    percent: answeredPercent(session),
    currentQuestion: session.currentPosition,
  },
  createdAt: dateTimeUtcToUtcIsoDateTime(session.createdAt),
  endedAt: Option.match(session.endedAt, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
})

export const toLatestStudySessionDto = (session: StudySession): LatestStudySession => ({
  ...toStudySessionDto(session),
  document: { id: session.documentId, title: session.documentTitle },
})
