import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import type {
  ExamBlueprintId,
  ExamBlueprintVersion,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type {
  AttemptQuestionPosition,
  MockExamAttemptId,
  MockExamAttemptStatus,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Context, type Effect, type Option } from 'effect'
import type { CursorPage, CursorPageRequest, InvalidCursor } from '~api/lib/cursor-pagination.js'
import type { MockExamReadError } from '~api/modules/mock-exams/application/errors.js'
import type {
  ExamBlueprint,
  ExamSectionEligibility,
} from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import type {
  AttemptReviewQuestion,
  AttemptScoreCounts,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import type {
  AttemptQuestion,
  CandidateAnswer,
  ExamCandidate,
  MockExamAttempt,
  MockExamAttemptSummary,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

export class MockExamReader extends Context.Service<
  MockExamReader,
  {
    readonly scoreAttempt: (
      userId: UserId,
      pathId: QualificationPathId,
      attemptId: MockExamAttemptId,
    ) => Effect.Effect<Option.Option<AttemptScoreCounts>, MockExamReadError>
    readonly history: (
      userId: UserId,
      pathId: QualificationPathId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<MockExamAttemptSummary>, MockExamReadError | InvalidCursor>
    readonly review: (
      userId: UserId,
      pathId: QualificationPathId,
      attemptId: MockExamAttemptId,
      page: CursorPageRequest,
    ) => Effect.Effect<CursorPage<AttemptReviewQuestion>, MockExamReadError | InvalidCursor>
    readonly pathBlueprint: (
      pathId: QualificationPathId,
    ) => Effect.Effect<Option.Option<ExamBlueprint>, MockExamReadError>
    readonly blueprint: (
      blueprintId: ExamBlueprintId,
    ) => Effect.Effect<Option.Option<ExamBlueprint>, MockExamReadError>
    readonly assignedPaths: (
      blueprintId: ExamBlueprintId,
    ) => Effect.Effect<ReadonlyArray<QualificationPathId>, MockExamReadError>
    readonly pathDocumentIds: (
      pathId: QualificationPathId,
    ) => Effect.Effect<ReadonlyArray<ReferenceDocumentId>, MockExamReadError>
    readonly sectionEligibility: (
      pathId: QualificationPathId,
      blueprintId: ExamBlueprintId,
      version: ExamBlueprintVersion,
    ) => Effect.Effect<ReadonlyArray<ExamSectionEligibility>, MockExamReadError>
    readonly sectionCandidates: (
      pathId: QualificationPathId,
      blueprintId: ExamBlueprintId,
      version: ExamBlueprintVersion,
    ) => Effect.Effect<ReadonlyArray<ExamCandidate>, MockExamReadError>
    readonly candidateAnswers: (
      revisionIds: ReadonlyArray<QuestionRevisionId>,
    ) => Effect.Effect<ReadonlyArray<CandidateAnswer>, MockExamReadError>
    readonly unfinishedAttempt: (
      userId: UserId,
      pathId: QualificationPathId,
    ) => Effect.Effect<Option.Option<MockExamAttemptSummary>, MockExamReadError>
    readonly attempt: (
      userId: UserId,
      pathId: QualificationPathId,
      attemptId: MockExamAttemptId,
    ) => Effect.Effect<Option.Option<MockExamAttempt>, MockExamReadError>
    readonly attemptStatus: (
      userId: UserId,
      pathId: QualificationPathId,
      attemptId: MockExamAttemptId,
    ) => Effect.Effect<Option.Option<MockExamAttemptStatus>, MockExamReadError>
    readonly attemptQuestion: (
      userId: UserId,
      pathId: QualificationPathId,
      attemptId: MockExamAttemptId,
      position: AttemptQuestionPosition,
    ) => Effect.Effect<Option.Option<AttemptQuestion>, MockExamReadError>
  }
>()('api/modules/mock-exams/MockExamReader') {}
