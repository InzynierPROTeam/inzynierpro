import { CurrentSessionResponse } from '@inzpro/api-contracts/modules/identity/responses'
import {
  FlagAttemptQuestionPayload,
  SaveAttemptAnswerPayload,
} from '@inzpro/api-contracts/modules/mock-exams/requests'
import {
  AttemptQuestion,
  AttemptQuestionResponse,
  FinishMockExamAttemptResponse,
  MockExamAttempt,
  MockExamAttemptResponse,
  MockExamPreview,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import type { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { expect } from 'vitest'
import type { TestApi, TestVisitor } from '~api/test/api-server.js'
import { resolveFixturePath } from '~api/test/mock-exam-fixtures.js'
import { learningRequest, loginForPreparation } from '~api/test/preparation.js'

export const decodeResponse =
  <T, E>(schema: Schema.Codec<T, E>) =>
  async (response: Response) => {
    expect(response.status, await response.clone().text()).toBe(200)

    return Schema.decodeUnknownSync(schema)(await response.json())
  }

export const decodeFinishedAttempt = async (response: Response) => {
  const finished = await decodeResponse(FinishMockExamAttemptResponse)(response)

  expect(finished).not.toBeNull()

  return finished!.attempt
}

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

  const { user } = Schema.decodeUnknownSync(CurrentSessionResponse)(
    await (await visitor.session()).json(),
  )

  return { userId: user.id, visitor, ...learnerRequests(api.baseUrl, visitor, pathId) }
}

const learnerRequests = (baseUrl: string, visitor: TestVisitor, pathId: QualificationPathId) => {
  const request = (path: string, method = 'GET') =>
    visitor.jar.fetch(new URL(`/api/v1/mock-exams/paths/${pathId}${path}`, baseUrl), {
      method,
    })

  const write = (
    path: string,
    payload: typeof SaveAttemptAnswerPayload.Encoded | typeof FlagAttemptQuestionPayload.Encoded,
  ) =>
    visitor.jar.fetch(new URL(`/api/v1/mock-exams/paths/${pathId}${path}`, baseUrl), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

  const studyRequest = (path: string) =>
    visitor.jar.fetch(new URL(`/api/v1/study/paths/${pathId}${path}`, baseUrl))

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
    on: (other: TestApi) => learnerRequests(other.baseUrl, visitor, pathId),
  }
}
