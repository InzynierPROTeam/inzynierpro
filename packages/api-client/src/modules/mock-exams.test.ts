import {
  AttemptQuestionConflict,
  MockExamAttemptNotInProgress,
} from '@inzpro/api-contracts/modules/mock-exams/errors'
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

import {
  abandonMockExamAttempt,
  finishMockExamAttempt,
  flagAttemptQuestion,
  pauseMockExamAttempt,
  resumeMockExamAttempt,
  saveAttemptAnswer,
} from './mock-exams.js'

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

test('finishing an attempt decodes the saved score, dates and nullable pass result', () => {
  const finished = {
    id: params.attemptId,
    status: 'finished',
    earnedXp: 22,
    pauseCount: 0,
    pauseSeconds: 0,
    startedAt: '2026-11-13T12:00:00.000Z',
    finishedAt: '2026-11-13T12:03:00.000Z',
    endReason: 'submitted',
    deadline: '2026-11-13T12:10:00.000Z',
    serverTime: '2026-11-13T12:03:00.000Z',
    durationMinutes: 10,
    questionCount: 2,
    passThreshold: 1,
    sections: [{ position: 1, name: 'Section', questionCount: 2 }],
    questions: [],
    result: {
      correct: 1,
      incorrect: 1,
      unanswered: 1,
      percent: 50,
      passed: null,
      activeSeconds: 180,
      pauseCount: 0,
      pauseSeconds: 0,
      sections: [{ position: 1, name: 'Section', questionCount: 2, correct: 1 }],
    },
  }

  return withHttpServer(
    [
      HttpRouter.route(
        'POST',
        `/api/v1/mock-exams/paths/${params.qualificationPathId}/attempts/${params.attemptId}/finish`,
        HttpServerResponse.jsonUnsafe(finished),
      ),
    ],
    async ({ httpClient }) => {
      expect(await runApi(finishMockExamAttempt({ params }), httpClient)).toStrictEqual(finished)
    },
  )
})

test('pausing and resuming an attempt post to their commands and decode the attempt clock', () => {
  const attempt = {
    id: params.attemptId,
    status: 'paused',
    earnedXp: 0,
    pauseCount: 0,
    pauseSeconds: 0,
    startedAt: '2026-11-13T12:00:00.000Z',
    finishedAt: null,
    endReason: null,
    deadline: '2026-11-13T12:13:00.000Z',
    serverTime: '2026-11-13T12:05:00.000Z',
    durationMinutes: 10,
    questionCount: 2,
    passThreshold: 1,
    sections: [{ position: 1, name: 'Section', questionCount: 2 }],
    questions: [],
    result: null,
  }

  const attemptPath =
    '/api/v1/mock-exams/paths/10000000-0000-4000-8000-000000000001/attempts/b0000000-0000-4000-8000-000000000001' as const

  return withHttpServer(
    [
      HttpRouter.route('POST', `${attemptPath}/pause`, HttpServerResponse.jsonUnsafe(attempt)),
      HttpRouter.route(
        'POST',
        `${attemptPath}/resume`,
        HttpServerResponse.jsonUnsafe({ ...attempt, status: 'in-progress' }),
      ),
    ],
    async ({ httpClient }) => {
      expect(await runApi(pauseMockExamAttempt({ params }), httpClient)).toStrictEqual(attempt)
      expect(await runApi(resumeMockExamAttempt({ params }), httpClient)).toMatchObject({
        status: 'in-progress',
        deadline: '2026-11-13T12:13:00.000Z',
      })
    },
  )
})

test('abandoning posts to the command and decodes a scoreless attempt or its typed conflict', () => {
  const abandoned = {
    id: params.attemptId,
    status: 'abandoned',
    earnedXp: 0,
    startedAt: '2026-11-13T12:00:00.000Z',
    finishedAt: '2026-11-13T12:05:00.000Z',
    endReason: null,
    deadline: '2026-11-13T12:13:00.000Z',
    serverTime: '2026-11-13T12:05:00.000Z',
    durationMinutes: 10,
    questionCount: 2,
    passThreshold: 1,
    pauseCount: 1,
    pauseSeconds: 180,
    sections: [{ position: 1, name: 'Section', questionCount: 2 }],
    questions: [],
    result: null,
  }

  const failure = new MockExamAttemptNotInProgress({
    type: 'mock_exam_attempt_not_in_progress',
    message: 'This attempt has already finished.',
  })

  const encodedFailure = Schema.encodeSync(MockExamAttemptNotInProgress)(failure)
  let finished = false

  return withHttpServer(
    [
      HttpRouter.route(
        'POST',
        `/api/v1/mock-exams/paths/${params.qualificationPathId}/attempts/${params.attemptId}/abandon`,
        Effect.sync(() =>
          finished
            ? HttpServerResponse.jsonUnsafe(encodedFailure, { status: 409 })
            : HttpServerResponse.jsonUnsafe(abandoned),
        ),
      ),
    ],
    async ({ httpClient }) => {
      expect(await runApi(abandonMockExamAttempt({ params }), httpClient)).toStrictEqual(abandoned)
      finished = true
      await expect(runApi(abandonMockExamAttempt({ params }), httpClient)).rejects.toStrictEqual(
        failure,
      )
    },
  )
})
