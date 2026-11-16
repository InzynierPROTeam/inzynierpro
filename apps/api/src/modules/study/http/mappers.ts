import type { OralReviewPreview as OralReviewPreviewDto } from '@inzpro/api-contracts/modules/study/responses'
import type {
  OralQuizCheck as OralQuizCheckDto,
  OralSessionQuiz as OralSessionQuizDto,
  OralSessionNextStep as OralSessionNextStepDto,
  OralSessionQuestion as OralSessionQuestionDto,
  OralSessionQuestionResult as OralSessionQuestionResultDto,
  OralStudySession as OralStudySessionDto,
  OralStudySessionSummary,
  FavoritesPreview,
  LatestStudySession,
  ReviewPreview,
  SessionNextStep as SessionNextStepDto,
  QuestionNote as QuestionNoteDto,
  QuestionNoteResult,
  SessionQuestion as SessionQuestionDto,
  SessionQuestionResult as SessionQuestionResultDto,
  StudySession as StudySessionDto,
  StudySessionSummary,
} from '@inzpro/api-contracts/modules/study/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  continueStudyNextStep,
  reviewNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/study/study-session'
import { Match, Option } from 'effect'
import { toResolvedRichContentDto } from '~api/modules/learning-content/http/mappers.js'
import type { FavoritesPreview as FavoritesPreviewModel } from '~api/modules/study/domain/favorites-session.model.js'
import type { OralSessionNextStep } from '~api/modules/study/domain/oral-session-next-step.model.js'
import type {
  OralQuizCheck,
  OralSessionQuiz,
} from '~api/modules/study/domain/oral-session-quiz.model.js'
import type {
  OralSessionQuestion,
  OralSessionQuestionResult,
  OralSessionResultCounts,
  OralStudySession,
} from '~api/modules/study/domain/oral-study-session.model.js'
import type { QuestionNote } from '~api/modules/study/domain/question-note.model.js'
import type { ReviewPreview as ReviewPreviewModel } from '~api/modules/study/domain/review-session.model.js'
import type { SessionNextStep } from '~api/modules/study/domain/session-next-step.model.js'
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

import type { OralReviewPreview } from '../domain/oral-review-session.model.js'

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

const sessionDocument = (session: StudySession): Option.Option<SessionDocument> =>
  Option.all({ id: session.documentId, title: session.documentTitle })

export const toLatestStudySessionDto = (session: StudySession): Option.Option<LatestStudySession> =>
  Option.map(sessionDocument(session), document => ({ ...toStudySessionDto(session), document }))

export const toQuestionNoteDto = ({ updatedAt, ...note }: QuestionNote): QuestionNoteDto => ({
  ...note,
  updatedAt: dateTimeUtcToUtcIsoDateTime(updatedAt),
})

export const toQuestionNoteResultDto = (result: {
  questionId: QuestionNoteResult['questionId']
  note: Option.Option<QuestionNote>
}): QuestionNoteResult => ({
  questionId: result.questionId,
  note: Option.match(result.note, { onNone: () => null, onSome: toQuestionNoteDto }),
})

export const toSessionQuestionDto = ({
  explanation,
  explanationOpenedAt,
  noteOpenedAt,
  note,
  answer,
  ...question
}: SessionQuestion): SessionQuestionDto => ({
  ...question,
  explanation: toResolvedRichContentDto(explanation),
  explanationOpenedAt: Option.match(explanationOpenedAt, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
  noteOpenedAt: Option.match(noteOpenedAt, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
  note: Option.match(note, { onNone: () => null, onSome: toQuestionNoteDto }),
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

export const toFavoritesPreviewDto = ({
  document,
  settings,
  ...preview
}: FavoritesPreviewModel): FavoritesPreview => ({
  ...preview,
  document: Option.getOrNull(document),
  settings: Option.getOrNull(settings),
})

export const toSessionNextStepDto = (step: SessionNextStep): Option.Option<SessionNextStepDto> =>
  Match.value(step).pipe(
    Match.discriminatorsExhaustive('type')({
      [reviewNextStep]: review =>
        Option.some<SessionNextStepDto>({
          type: reviewNextStep,
          document: Option.getOrNull(review.document),
          dueQuestionCount: review.dueCount,
        }),
      [continueStudyNextStep]: ({ session }) =>
        Option.map(toLatestStudySessionDto(session), (latest): SessionNextStepDto => ({
          type: continueStudyNextStep,
          session: latest,
        })),
      [startStudyNextStep]: ({ preview }) =>
        Option.some<SessionNextStepDto>({ type: startStudyNextStep, preview }),
    }),
  )

export const toOralStudySessionDto = (session: OralStudySession): OralStudySessionDto => ({
  id: session.id,
  kind: session.kind,
  category: Option.getOrNull(Option.all({ id: session.categoryId, name: session.categoryName })),
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

export const toOralSessionQuestionDto = ({
  body,
  answer,
  note,
  selfAssessment,
  ...question
}: OralSessionQuestion): OralSessionQuestionDto => ({
  ...question,
  body: toResolvedRichContentDto(body),
  answer: toResolvedRichContentDto(answer),
  note: Option.match(note, { onNone: () => null, onSome: toQuestionNoteDto }),
  selfAssessment: Option.match(selfAssessment, {
    onNone: () => null,
    onSome: ({ value, assessedAt }) => ({
      value,
      assessedAt: dateTimeUtcToUtcIsoDateTime(assessedAt),
    }),
  }),
})

export const toOralStudySessionSummaryDto = ({
  session,
  result,
}: {
  session: OralStudySession
  result: OralSessionResultCounts
}): OralStudySessionSummary => ({ ...toOralStudySessionDto(session), result })

export const toOralSessionQuestionResultDto = ({
  selfAssessment,
  ...question
}: OralSessionQuestionResult): OralSessionQuestionResultDto => ({
  ...question,
  selfAssessment: Option.getOrNull(selfAssessment),
})

export const toOralSessionNextStepDto = (step: OralSessionNextStep): OralSessionNextStepDto =>
  Match.value(step).pipe(
    Match.discriminatorsExhaustive('type')({
      [reviewNextStep]: ({ category, dueQuestionCount }): OralSessionNextStepDto => ({
        type: reviewNextStep,
        category: Option.getOrNull(category),
        dueQuestionCount,
      }),
      [continueStudyNextStep]: ({ session }): OralSessionNextStepDto => ({
        type: continueStudyNextStep,
        session: toOralStudySessionDto(session),
      }),
      [startStudyNextStep]: ({ preview }): OralSessionNextStepDto => ({
        type: startStudyNextStep,
        preview,
      }),
    }),
  )

export const toOralReviewPreviewDto = (preview: OralReviewPreview): OralReviewPreviewDto => ({
  qualificationPathId: preview.qualificationPathId,
  questionScope: preview.questionScope,
  category: Option.match(preview.category, {
    onNone: () => null,
    onSome: ({ id, name }) => ({ id, name }),
  }),
  dueQuestionCount: preview.queue.dueCount,
  nextDueAt: Option.match(preview.queue.nextDueAt, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
  settings: Option.getOrNull(preview.settings),
})

export const toOralQuizCheckDto = ({
  position,
  format,
  prompt,
  options,
  explanation,
  answer,
}: OralQuizCheck): OralQuizCheckDto => ({
  position,
  format,
  prompt,
  options: options.map(({ id, text }) => ({ id, text })),
  result: Option.match(answer, {
    onNone: () => null,
    onSome: ({ isCorrect, selectedOptionIds, answeredAt }) => ({
      isCorrect,
      selectedOptionIds,
      correctOptionIds: options.filter(option => option.isCorrect).map(option => option.id),
      explanation: toResolvedRichContentDto(explanation),
      answeredAt: dateTimeUtcToUtcIsoDateTime(answeredAt),
    }),
  }),
})

export const toOralSessionQuizDto = ({
  id,
  sessionId,
  checkCount,
  answeredCount,
}: OralSessionQuiz): OralSessionQuizDto => ({
  id,
  sessionId,
  checkCount,
  answeredCount,
  isCompleted: answeredCount === checkCount,
})
