import { MockExamUnavailable } from '@inzpro/api-contracts/modules/mock-exams/errors'
import { Effect } from 'effect'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import type { MockExamUnavailable as UnavailableMockExam } from '~api/modules/mock-exams/domain/errors.js'

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
