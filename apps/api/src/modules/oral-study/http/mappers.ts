import type { OralReviewPreview as OralReviewPreviewDto } from '@inzpro/api-contracts/modules/oral-study/responses'
import type {
  OralQuizCheck as OralQuizCheckDto,
  OralSessionQuiz as OralSessionQuizDto,
  OralSessionNextStep as OralSessionNextStepDto,
  OralSessionQuestion as OralSessionQuestionDto,
  OralSessionQuestionResult as OralSessionQuestionResultDto,
  OralStudySession as OralStudySessionDto,
  OralStudySessionSummary,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  continueStudyNextStep,
  reviewNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/learning/study-session'
import { Match, Option } from 'effect'
import { toResolvedRichContentDto } from '~api/modules/learning-content/http/mappers.js'
import {
  answeredPercent,
  studySessionStatus,
} from '~api/modules/learning/domain/session-progress.rules.js'
import { toQuestionNoteDto } from '~api/modules/learning/http/mappers.js'
import type { OralReviewPreview } from '~api/modules/oral-study/domain/oral-review-session.model.js'
import type { OralSessionNextStep } from '~api/modules/oral-study/domain/oral-session-next-step.model.js'
import type {
  OralQuizCheck,
  OralSessionQuiz,
} from '~api/modules/oral-study/domain/oral-session-quiz.model.js'
import type {
  OralSessionQuestion,
  OralSessionQuestionResult,
  OralSessionResultCounts,
  OralStudySession,
} from '~api/modules/oral-study/domain/oral-study-session.model.js'

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
