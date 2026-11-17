import {
  AttemptQuestionConflict,
  AttemptQuestionNotFound,
  AttemptQuestionWithdrawn,
  InvalidAttemptAnswer,
  MockExamAttemptNotInProgress,
  MockExamAttemptPaused,
  MockExamUnavailable,
} from '@inzpro/api-contracts/modules/mock-exams/errors'
import { Effect } from 'effect'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import type {
  AttemptQuestionConflict as StaleAttemptQuestion,
  MockExamUnavailable as UnavailableMockExam,
} from '~api/modules/mock-exams/domain/errors.js'
import { toAttemptQuestionDto } from '~api/modules/mock-exams/http/mappers.js'

export const failMockExamRead = logAndFailInternalServerError('Could not read the mock exam.')

export const failMockExamWrite = logAndFailInternalServerError('Could not save the mock exam.')

export const failMissingMockExamAttempt = logAndFailInternalServerError(
  'Could not read the started mock exam attempt.',
)

export const mockExamUnavailable = (error: UnavailableMockExam) =>
  Effect.fail(
    new MockExamUnavailable({
      type: 'mock_exam_unavailable',
      message: 'The mock exam is not available on this path.',
      reason: error.reason,
    }),
  )

export const attemptQuestionNotFound = Effect.fail(
  new AttemptQuestionNotFound({
    type: 'attempt_question_not_found',
    message: 'This mock exam question does not exist.',
  }),
)

export const mockExamAttemptNotInProgress = Effect.fail(
  new MockExamAttemptNotInProgress({
    type: 'mock_exam_attempt_not_in_progress',
    message: 'This mock exam attempt has already ended or its time is up.',
  }),
)

export const mockExamAttemptPaused = Effect.fail(
  new MockExamAttemptPaused({
    type: 'mock_exam_attempt_paused',
    message: 'This mock exam attempt is paused. Resume it to see and answer questions.',
  }),
)

export const attemptQuestionWithdrawn = Effect.fail(
  new AttemptQuestionWithdrawn({
    type: 'attempt_question_withdrawn',
    message: 'This question was withdrawn and can no longer be answered.',
  }),
)

export const invalidAttemptAnswer = Effect.fail(
  new InvalidAttemptAnswer({
    type: 'invalid_attempt_answer',
    message: 'The selected answer does not belong to this question.',
  }),
)

export const attemptQuestionConflict = (error: StaleAttemptQuestion) =>
  Effect.fail(
    new AttemptQuestionConflict({
      type: 'attempt_question_conflict',
      message: 'This question changed elsewhere. Review its current state.',
      question: toAttemptQuestionDto(error.current),
    }),
  )
