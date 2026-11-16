import type {
  LatestStudySession,
  ReviewPreview,
  SessionQuestion as SessionQuestionDto,
  SessionQuestionResult as SessionQuestionResultDto,
  StudySession as StudySessionDto,
  StudySessionSummary,
} from '@inzpro/api-contracts/modules/study/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Option } from 'effect'
import type { ReviewPreview as ReviewPreviewModel } from '~api/modules/study/domain/review-session.model.js'
import type { SessionDocument } from '~api/modules/study/domain/study-document.model.js'
import type {
  SessionQuestion,
  SessionQuestionResult,
  StudySession,
  StudySessionResultCounts,
} from '~api/modules/study/domain/study-session.model.js'
import {
  answeredPercent,
  correctPercent,
  studySessionStatus,
} from '~api/modules/study/domain/study-session.rules.js'

export const toStudySessionDto = (session: StudySession): StudySessionDto => ({
  id: session.id,
  kind: session.kind,
  status: studySessionStatus(session),
  progress: {
    total: session.questionCount,
    answered: session.answeredCount,
    skipped: session.skippedCount,
    percent: answeredPercent(session),
    currentQuestion: session.currentPosition,
  },
  createdAt: dateTimeUtcToUtcIsoDateTime(session.createdAt),
  endedAt: Option.match(session.endedAt, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
})

// The document of a regular-study session or a document-scoped review session.
const sessionDocument = (session: StudySession): Option.Option<SessionDocument> =>
  Option.all({ id: session.documentId, title: session.documentTitle })

// The latest-session read returns regular study only, which always has a document.
export const toLatestStudySessionDto = (session: StudySession): Option.Option<LatestStudySession> =>
  Option.map(sessionDocument(session), document => ({ ...toStudySessionDto(session), document }))

export const toSessionQuestionDto = ({
  explanationOpenedAt,
  answer,
  ...question
}: SessionQuestion): SessionQuestionDto => ({
  ...question,
  explanationOpenedAt: Option.match(explanationOpenedAt, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
  answer: Option.match(answer, {
    onNone: () => null,
    onSome: ({ answeredAt, ...submitted }) => ({
      ...submitted,
      answeredAt: dateTimeUtcToUtcIsoDateTime(answeredAt),
    }),
  }),
})

export const toStudySessionSummaryDto = ({
  session,
  result,
}: {
  session: StudySession
  result: StudySessionResultCounts
}): StudySessionSummary => ({
  ...toStudySessionDto(session),
  document: Option.getOrNull(sessionDocument(session)),
  result: { ...result, correctPercent: correctPercent(result, session) },
})

export const toSessionQuestionResultDto = ({
  answer,
  ...question
}: SessionQuestionResult): SessionQuestionResultDto => ({
  ...question,
  answer: Option.getOrNull(answer),
})

export const toReviewPreviewDto = (preview: ReviewPreviewModel): ReviewPreview => ({
  qualificationPathId: preview.qualificationPathId,
  document: Option.getOrNull(preview.document),
  dueQuestionCount: preview.queue.dueCount,
  nextDueAt: Option.match(preview.queue.nextDueAt, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
  settings: Option.getOrNull(preview.settings),
})
