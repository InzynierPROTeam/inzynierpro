import type {
  MockExamAttempt as MockExamAttemptDto,
  MockExamAttemptSummary as MockExamAttemptSummaryDto,
  MockExamPreview as MockExamPreviewDto,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import type { MockExamUnavailableReason } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Option } from 'effect'
import type { ExamBlueprintPreview } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import { blueprintQuestionCount } from '~api/modules/mock-exams/domain/exam-blueprint.rules.js'
import type {
  MockExamAttempt,
  MockExamAttemptSummary,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

const toAttemptSummaryDto = (attempt: MockExamAttemptSummary): MockExamAttemptSummaryDto => ({
  id: attempt.id,
  status: attempt.status,
  startedAt: dateTimeUtcToUtcIsoDateTime(attempt.startedAt),
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
})
