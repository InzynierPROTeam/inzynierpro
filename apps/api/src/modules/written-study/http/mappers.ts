import type { QuestionNoteResult } from '@inzpro/api-contracts/modules/written-study/responses'
import type {
  FavoritesPreview,
  LatestStudySession,
  ReviewPreview,
  SessionNextStep as SessionNextStepDto,
  SessionQuestion as SessionQuestionDto,
  SessionQuestionResult as SessionQuestionResultDto,
  StudySession as StudySessionDto,
  StudySessionSummary,
} from '@inzpro/api-contracts/modules/written-study/responses'
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
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'
import {
  answeredPercent,
  correctPercent,
  studySessionStatus,
} from '~api/modules/learning/domain/session-progress.rules.js'
import { toQuestionNoteDto } from '~api/modules/learning/http/mappers.js'
import type { FavoritesPreview as FavoritesPreviewModel } from '~api/modules/written-study/domain/favorites-session.model.js'
import type { ReviewPreview as ReviewPreviewModel } from '~api/modules/written-study/domain/review-session.model.js'
import type { SessionNextStep } from '~api/modules/written-study/domain/session-next-step.model.js'
import type { SessionDocument } from '~api/modules/written-study/domain/study-document.model.js'
import type {
  SessionQuestion,
  SessionQuestionResult,
  StudySession,
  StudySessionResultCounts,
} from '~api/modules/written-study/domain/study-session.model.js'

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

export const toSessionQuestionDto = (
  {
    question: { explanation, explanationOpenedAt, noteOpenedAt, note, answer, ...question },
    references,
  }: WithQuestionReferences<SessionQuestion>,
  addresses: ContentAssetAddresses,
): SessionQuestionDto => ({
  ...question,
  explanation: toResolvedRichContentDto(explanation, addresses),
  references: references.map(reference => toQuestionReferenceDto(reference, addresses)),
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

export const toQuestionNoteResultDto = (result: {
  questionId: QuestionNoteResult['questionId']
  note: Option.Option<QuestionNote>
}): QuestionNoteResult => ({
  questionId: result.questionId,
  note: Option.match(result.note, { onNone: () => null, onSome: toQuestionNoteDto }),
})
