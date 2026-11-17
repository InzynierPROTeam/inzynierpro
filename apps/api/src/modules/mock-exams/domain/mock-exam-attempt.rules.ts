import {
  inProgressAttempt,
  type MockExamAttemptStatus,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'

export const acceptsDraftWrites = (status: MockExamAttemptStatus) => status === inProgressAttempt
