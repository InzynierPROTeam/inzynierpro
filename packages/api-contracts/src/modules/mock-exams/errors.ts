import { MockExamUnavailableReason } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { Schema } from 'effect'
import { ConflictAnnotations, errorFields } from '~api-contracts/utils/api-error.js'

export class MockExamUnavailable extends Schema.TaggedError<
  MockExamUnavailable,
  { readonly brand: unique symbol }
>()(
  'MockExamUnavailable',
  { ...errorFields('mock_exam_unavailable'), reason: MockExamUnavailableReason },
  ConflictAnnotations(),
) {}
