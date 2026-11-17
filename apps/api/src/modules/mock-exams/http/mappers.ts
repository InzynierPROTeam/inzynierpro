import type {
  AttemptReviewQuestion as AttemptReviewQuestionDto,
  AttemptQuestion as AttemptQuestionDto,
  MockExamAttempt as MockExamAttemptDto,
  MockExamAttemptSummary as MockExamAttemptSummaryDto,
  MockExamPreview as MockExamPreviewDto,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import type { MockExamUnavailableReason } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Option } from 'effect'
import type { CursorPage } from '~api/lib/cursor-pagination.js'
import { toResolvedRichContentDto } from '~api/modules/learning-content/http/mappers.js'
import { toQuestionNoteDto } from '~api/modules/learning/http/mappers.js'
import type { ExamBlueprintPreview } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import { blueprintQuestionCount } from '~api/modules/mock-exams/domain/exam-blueprint.rules.js'
import type {
  AttemptReviewQuestion,
  AttemptQuestion,
  MockExamAttempt,
  MockExamAttemptSummary,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

export const toAttemptSummaryDto = (
  attempt: MockExamAttemptSummary,
): MockExamAttemptSummaryDto => ({
  id: attempt.id,
  status: attempt.status,
  startedAt: dateTimeUtcToUtcIsoDateTime(attempt.startedAt),
  finishedAt: Option.match(attempt.finishedAt, {
    onNone: () => null,
    onSome: dateTimeUtcToUtcIsoDateTime,
  }),
  result: Option.match(attempt.result, {
    onNone: () => null,
    onSome: result => ({ ...result, passed: Option.getOrNull(result.passed) }),
  }),
})

export const toMockExamPreviewDto = (preview: {
  readonly qualificationPathId: QualificationPathId
  readonly blueprint: Option.Option<ExamBlueprintPreview>
  readonly unavailableReason: Option.Option<MockExamUnavailableReason>
  readonly unfinishedAttempt: Option.Option<MockExamAttemptSummary>
}): MockExamPreviewDto => ({
  qualificationPathId: preview.qualificationPathId,
  blueprint: Option.match(preview.blueprint, {
    onNone: () => null,
    onSome: blueprint => ({
      durationMinutes: blueprint.durationMinutes,
      questionCount: blueprintQuestionCount(blueprint.sections),
      passThreshold: blueprint.passThreshold,
      sections: blueprint.sections,
    }),
  }),
  unavailableReason: Option.getOrNull(preview.unavailableReason),
  unfinishedAttempt: Option.match(preview.unfinishedAttempt, {
    onNone: () => null,
    onSome: toAttemptSummaryDto,
  }),
})

export const toMockExamAttemptDto = (attempt: MockExamAttempt): MockExamAttemptDto => ({
  ...toAttemptSummaryDto(attempt),
  durationMinutes: attempt.durationMinutes,
  passThreshold: attempt.passThreshold,
  questionCount: attempt.questionCount,
  sections: attempt.sections,
  questions: attempt.questions,
})

export const toAttemptQuestionDto = (question: AttemptQuestion): AttemptQuestionDto => ({
  ...question,
  selectedAnswerId: Option.getOrNull(question.selectedAnswerId),
})

export const toAttemptReviewQuestionDto = (
  question: AttemptReviewQuestion,
): AttemptReviewQuestionDto => ({
  ...toAttemptQuestionDto(question),
  correctAnswerId: question.correctAnswerId,
  explanation: toResolvedRichContentDto(question.explanation),
  isFavorite: question.isFavorite,
  note: Option.match(question.note, { onNone: () => null, onSome: toQuestionNoteDto }),
})

export const toMockExamPageDto = <A, B>(
  page: CursorPage<A>,
  map: (item: A) => B,
): CursorPage<B> => ({
  data: page.data.map(map),
  meta: page.meta.nextCursor === undefined ? { hasMore: page.meta.hasMore } : page.meta,
})
