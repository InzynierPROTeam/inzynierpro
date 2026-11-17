import type {
  GetAttemptReviewRequest,
  GetMockExamHistoryRequest,
  GetAttemptQuestionRequest,
  GetMockExamAttemptRequest,
  GetMockExamPreviewRequest,
} from '@inzpro/api-client/modules/mock-exams'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'

export const mockExamKeys = {
  all: ['mock-exams'] as const,
  account: (userId: UserId) => [...mockExamKeys.all, 'account', userId] as const,
  reviewQuestions: (userId: UserId) =>
    [...mockExamKeys.account(userId), 'review-questions'] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...mockExamKeys.account(userId), 'path', id] as const,
  review: (userId: UserId, pathId: QualificationPathId, id: MockExamAttemptId) =>
    [...mockExamKeys.reviewQuestions(userId), pathId, id] as const,
  attempt: (userId: UserId, pathId: QualificationPathId, id: MockExamAttemptId) =>
    [...mockExamKeys.path(userId, pathId), 'attempt', id] as const,
  getAttemptReviewInfinite: (userId: UserId, req: GetAttemptReviewRequest) =>
    [
      ...mockExamKeys.review(userId, req.params.qualificationPathId, req.params.attemptId),
      'getAttemptReviewInfinite',
      req,
    ] as const,
  getMockExamHistoryInfinite: (userId: UserId, req: GetMockExamHistoryRequest) =>
    [
      ...mockExamKeys.path(userId, req.params.qualificationPathId),
      'getMockExamHistoryInfinite',
      req,
    ] as const,
  getMockExamPreview: (userId: UserId, req: GetMockExamPreviewRequest) =>
    [
      ...mockExamKeys.path(userId, req.params.qualificationPathId),
      'getMockExamPreview',
      req,
    ] as const,
  getMockExamAttempt: (userId: UserId, req: GetMockExamAttemptRequest) =>
    [
      ...mockExamKeys.attempt(userId, req.params.qualificationPathId, req.params.attemptId),
      'getMockExamAttempt',
      req,
    ] as const,
  getAttemptQuestion: (userId: UserId, req: GetAttemptQuestionRequest) =>
    [
      ...mockExamKeys.attempt(userId, req.params.qualificationPathId, req.params.attemptId),
      'getAttemptQuestion',
      req,
    ] as const,
}
