import {
  FlagAttemptQuestionPayload,
  SaveAttemptAnswerPayload,
} from '@inzpro/api-contracts/modules/mock-exams/requests'
import {
  AttemptQuestion,
  AttemptQuestionResponse,
  MockExamAttempt,
  MockExamAttemptResponse,
  MockExamPreview,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import type { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { Schema } from 'effect'
import { expect } from 'vitest'
import type { TestApi } from '~api/test/api-server.js'
import { resolveFixturePath } from '~api/test/mock-exam-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

export const decodeResponse =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) =>
    Schema.decodeUnknownSync(schema)(await response.json())

export const mockExamLearner = async (
  api: TestApi,
  configuration: typeof CompleteOnboardingPayload.Encoded,
  accessScope: typeof CompleteOnboardingPayload.Encoded.accessScope = 'written',
) => {
  const visitor = await loginForPreparation(api)
  const pathId = await resolveFixturePath(configuration)

  const onboarded = await learningRequest(api, visitor, '/onboarding', {
    ...configuration,
    accessScope,
  })

  expect(onboarded.ok).toBe(true)

  const request = (path: string, method = 'GET') =>
    visitor.jar.fetch(new URL(`/api/v1/mock-exams/paths/${pathId}${path}`, api.baseUrl), {
      method,
    })

  const write = (
    path: string,
    payload: typeof SaveAttemptAnswerPayload.Encoded | typeof FlagAttemptQuestionPayload.Encoded,
  ) =>
    visitor.jar.fetch(new URL(`/api/v1/mock-exams/paths/${pathId}${path}`, api.baseUrl), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

  const studyRequest = (path: string) =>
    visitor.jar.fetch(new URL(`/api/v1/study/paths/${pathId}${path}`, api.baseUrl))

  const questionPath = (attemptId: string, position: number) =>
    `/attempts/${attemptId}/questions/${position}`

  return {
    pathId,
    preview: async () => decodeResponse(MockExamPreview)(await request('/preview')),
    start: () => request('/attempts', 'POST'),
    started: async () => decodeResponse(MockExamAttempt)(await request('/attempts', 'POST')),
    attempt: async (attemptId: string) =>
      decodeResponse(MockExamAttemptResponse)(await request(`/attempts/${attemptId}`)),
    question: async (attemptId: string, position: number) =>
      decodeResponse(AttemptQuestionResponse)(await request(questionPath(attemptId, position))),
    questions: async (attempt: MockExamAttempt) => {
      const questions: Array<AttemptQuestion> = []

      for (let position = 1; position <= attempt.questionCount; position++) {
        questions.push(
          await decodeResponse(AttemptQuestion)(await request(questionPath(attempt.id, position))),
        )
      }

      return questions
    },
    saveAnswer: (
      attemptId: string,
      position: number,
      payload: typeof SaveAttemptAnswerPayload.Encoded,
    ) => write(`${questionPath(attemptId, position)}/answer`, payload),
    flag: (
      attemptId: string,
      position: number,
      payload: typeof FlagAttemptQuestionPayload.Encoded,
    ) => write(`${questionPath(attemptId, position)}/flag`, payload),
    request,
    studyRequest,
  }
}
