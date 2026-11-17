import { AttemptQuestionConflict } from '@inzpro/api-contracts/modules/mock-exams/errors'
import {
  FlagAttemptQuestionPayload,
  MockExamAttemptParams,
  SaveAttemptAnswerPayload,
} from '@inzpro/api-contracts/modules/mock-exams/requests'
import { AttemptQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { withHttpServer } from '@inzpro/testing/http'
import { Effect, Schema } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'

import { flagAttemptQuestion, saveAttemptAnswer } from './mock-exams.js'

const firstAnswerId = '22000000-0000-4000-8000-000000000001'
const secondAnswerId = '22000000-0000-4000-8000-000000000002'

const question = Schema.decodeSync(AttemptQuestion)({
  position: 1,
  section: 1,
  questionId: '20000000-0000-4000-8000-000000000001',
  questionRevisionId: '21000000-0000-4000-8000-000000000001',
  body: 'Test-only question',
  answers: [
    { id: firstAnswerId, text: 'A' },
    { id: secondAnswerId, text: 'B' },
  ],
  isWithdrawn: false,
  selectedAnswerId: firstAnswerId,
  isFlagged: false,
  version: 2,
})

const params = {
  ...Schema.decodeSync(MockExamAttemptParams)({
    qualificationPathId: '10000000-0000-4000-8000-000000000001',
    attemptId: 'b0000000-0000-4000-8000-000000000001',
  }),
  position: question.position,
}

const saveAnswer = Schema.decodeSync(SaveAttemptAnswerPayload)
const flag = Schema.decodeSync(FlagAttemptQuestionPayload)

const questionPath =
  '/api/v1/mock-exams/paths/10000000-0000-4000-8000-000000000001/attempts/b0000000-0000-4000-8000-000000000001/questions/1' as const

test('draft answer and flag writes send the expected version and decode the saved question', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'PUT',
        `${questionPath}/answer`,
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          expect(yield* request.json.pipe(Effect.orDie)).toEqual({
            answerId: firstAnswerId,
            expectedVersion: 1,
          })

          return HttpServerResponse.jsonUnsafe(question)
        }),
      ),
      HttpRouter.route(
        'PUT',
        `${questionPath}/flag`,
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          expect(yield* request.json.pipe(Effect.orDie)).toEqual({
            isFlagged: true,
            expectedVersion: 2,
          })

          return HttpServerResponse.jsonUnsafe({ ...question, isFlagged: true, version: 3 })
        }),
      ),
    ],
    async ({ httpClient }) => {
      expect(
        await runApi(
          saveAttemptAnswer({
            params,
            payload: saveAnswer({ answerId: firstAnswerId, expectedVersion: 1 }),
          }),
          httpClient,
        ),
      ).toEqual(question)
      expect(
        await runApi(
          flagAttemptQuestion({
            params,
            payload: flag({ isFlagged: true, expectedVersion: 2 }),
          }),
          httpClient,
        ),
      ).toEqual({ ...question, isFlagged: true, version: 3 })
    },
  ))

test('a stale draft answer preserves the current question for the client to show', () => {
  const failure = new AttemptQuestionConflict({
    type: 'attempt_question_conflict',
    message: 'This question changed elsewhere.',
    question,
  })

  return withHttpServer(
    [
      HttpRouter.route(
        'PUT',
        `${questionPath}/answer`,
        HttpServerResponse.jsonUnsafe(Schema.encodeSync(AttemptQuestionConflict)(failure), {
          status: 409,
        }),
      ),
    ],
    async ({ httpClient }) => {
      await expect(
        runApi(
          saveAttemptAnswer({
            params,
            payload: saveAnswer({ answerId: secondAnswerId, expectedVersion: 1 }),
          }),
          httpClient,
        ),
      ).rejects.toStrictEqual(failure)
    },
  )
})
