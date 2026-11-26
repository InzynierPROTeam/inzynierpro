import type {
  OralReviewPreview as OralReviewPreviewDto,
  OralSessionPreview as OralSessionPreviewDto,
} from '@inzpro/api-contracts/modules/oral-study/responses'
import type {
  OralQuestionDetails as OralQuestionDetailsDto,
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
import type { ContentAssetAddresses } from '~api/modules/learning-content/application/content-asset-addresses.service.js'
import type { WithQuestionReferences } from '~api/modules/learning-content/application/question-references.service.js'
import {
  toQuestionReferenceDto,
  toResolvedRichContentDto,
} from '~api/modules/learning-content/http/mappers.js'
import {
  answeredPercent,
  studySessionStatus,
} from '~api/modules/learning/domain/session-progress.rules.js'
import { toQuestionNoteDto } from '~api/modules/learning/http/mappers.js'
import type { OralQuestionDetails } from '~api/modules/oral-study/domain/oral-question-details.model.js'
import type { OralReviewPreview } from '~api/modules/oral-study/domain/oral-review-session.model.js'
import type { OralSessionNextStep } from '~api/modules/oral-study/domain/oral-session-next-step.model.js'
import type { OralSessionPreview } from '~api/modules/oral-study/domain/oral-session-preview.rules.js'
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

export const toOralSessionQuestionDto = (
  {
    question: { body, answer, note, selfAssessment, ...question },
    references,
  }: WithQuestionReferences<OralSessionQuestion>,
  addresses: ContentAssetAddresses,
): OralSessionQuestionDto => ({
  ...question,
  body: toResolvedRichContentDto(body, addresses),
  answer: toResolvedRichContentDto(answer, addresses),
  references: references.map(reference => toQuestionReferenceDto(reference, addresses)),
  note: Option.match(note, { onNone: () => null, onSome: toQuestionNoteDto }),
  selfAssessment: Option.match(selfAssessment, {
    onNone: () => null,
    onSome: ({ value, assessedAt }) => ({
      value,
      assessedAt: dateTimeUtcToUtcIsoDateTime(assessedAt),
    }),
  }),
})

export const toOralQuestionDetailsDto = (
  {
    question: { body, answer, note, ...question },
    references,
  }: WithQuestionReferences<OralQuestionDetails>,
  addresses: ContentAssetAddresses,
): OralQuestionDetailsDto => ({
  ...question,
  body: toResolvedRichContentDto(body, addresses),
  answer: toResolvedRichContentDto(answer, addresses),
  references: references.map(reference => toQuestionReferenceDto(reference, addresses)),
  note: Option.match(note, { onNone: () => null, onSome: toQuestionNoteDto }),
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

export const toOralSessionPreviewDto = ({
  reportedInMyChamberQuestionCount,
  ...preview
}: OralSessionPreview): OralSessionPreviewDto => ({
  ...preview,
  reportedInMyChamberQuestionCount: Option.getOrNull(reportedInMyChamberQuestionCount),
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
        preview: toOralSessionPreviewDto(preview),
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
  reportedInMyChamberQuestionCount: Option.getOrNull(preview.reportedInMyChamberQuestionCount),
})

export const toOralQuizCheckDto = (
  { position, format, prompt, options, explanation, answer }: OralQuizCheck,
  addresses: ContentAssetAddresses,
): OralQuizCheckDto => ({
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
      explanation: toResolvedRichContentDto(explanation, addresses),
      answeredAt: dateTimeUtcToUtcIsoDateTime(answeredAt),
    }),
  }),
})

export const revealedQuizCheckContents = (checks: ReadonlyArray<OralQuizCheck>) =>
  checks.flatMap(check => (Option.isSome(check.answer) ? [check.explanation] : []))

export const toOralSessionQuizDto = ({
  id,
  sessionId,
  checkCount,
  answeredCount,
  earnedXp,
}: OralSessionQuiz): OralSessionQuizDto => ({
  id,
  sessionId,
  checkCount,
  answeredCount,
  isCompleted: answeredCount === checkCount,
  earnedXp,
})
