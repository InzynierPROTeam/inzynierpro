import { MockExamUnavailableReason } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Schema } from 'effect'
import { AttemptQuestion } from '~api-contracts/modules/mock-exams/responses.js'
import {
  ConflictAnnotations,
  errorFields,
  NotFoundAnnotations,
  UnprocessableEntityAnnotations,
} from '~api-contracts/utils/api-error.js'

export class MockExamUnavailable extends Schema.TaggedError<
  MockExamUnavailable,
  { readonly brand: unique symbol }
>()(
  'MockExamUnavailable',
  { ...errorFields('mock_exam_unavailable'), reason: MockExamUnavailableReason },
  ConflictAnnotations(),
) {}

export class AttemptQuestionNotFound extends Schema.TaggedError<
  AttemptQuestionNotFound,
  { readonly brand: unique symbol }
>()('AttemptQuestionNotFound', errorFields('attempt_question_not_found'), NotFoundAnnotations()) {}

export class MockExamAttemptNotInProgress extends Schema.TaggedError<
  MockExamAttemptNotInProgress,
  { readonly brand: unique symbol }
>()(
  'MockExamAttemptNotInProgress',
  errorFields('mock_exam_attempt_not_in_progress'),
  ConflictAnnotations(),
) {}

export class MockExamAttemptPaused extends Schema.TaggedError<
  MockExamAttemptPaused,
  { readonly brand: unique symbol }
>()('MockExamAttemptPaused', errorFields('mock_exam_attempt_paused'), ConflictAnnotations()) {}

export class AttemptQuestionWithdrawn extends Schema.TaggedError<
  AttemptQuestionWithdrawn,
  { readonly brand: unique symbol }
>()('AttemptQuestionWithdrawn', errorFields('attempt_question_withdrawn'), ConflictAnnotations()) {}

export class InvalidAttemptAnswer extends Schema.TaggedError<
  InvalidAttemptAnswer,
  { readonly brand: unique symbol }
>()(
  'InvalidAttemptAnswer',
  errorFields('invalid_attempt_answer'),
  UnprocessableEntityAnnotations(),
) {}

export class AttemptQuestionConflict extends Schema.TaggedError<
  AttemptQuestionConflict,
  { readonly brand: unique symbol }
>()(
  'AttemptQuestionConflict',
  // CONTRACT: question is the current state the stale write was refused against.
  { ...errorFields('attempt_question_conflict'), question: AttemptQuestion },
  ConflictAnnotations(),
) {}
