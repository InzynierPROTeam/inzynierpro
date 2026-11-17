import type { MockExamUnavailableReason } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Data } from 'effect'
import type { InvalidExamBlueprintReason } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'

export class InvalidExamBlueprint extends Data.TaggedError('InvalidExamBlueprint')<{
  readonly reason: InvalidExamBlueprintReason
}> {}

export class ExamBlueprintNotFound extends Data.TaggedError('ExamBlueprintNotFound') {}

export class MockExamUnavailable extends Data.TaggedError('MockExamUnavailable')<{
  readonly reason: MockExamUnavailableReason
}> {}

export class MockExamAttemptNotFound extends Data.TaggedError('MockExamAttemptNotFound') {}
