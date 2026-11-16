import { OralSessionAlreadyStarted } from '@inzpro/api-contracts/modules/study/errors'
import { OralReviewPreview, OralStudySession } from '@inzpro/api-contracts/modules/study/responses'
import { withHttpServer } from '@inzpro/testing/http'
import { Effect, Schema } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'

import { getOralReviewPreview, getOralReviewSession, startOralReviewSession } from './study.js'

const preview = Schema.decodeSync(OralReviewPreview)({
  qualificationPathId: '10000000-0000-4000-8000-000000000001',
  category: { id: '32000000-0000-4000-8000-000000000001', name: 'Test category' },
  dueQuestionCount: 3,
  nextDueAt: null,
  settings: {
    defaultQuestionCount: 3,
    minimumQuestionCount: 1,
    maximumQuestionCount: 3,
    canChangeQuestionCount: true,
  },
})

const session = Schema.decodeSync(OralStudySession)({
  id: '10000000-0000-4000-8000-000000000002',
  kind: 'review',
  category: null,
  status: 'active',
  progress: { total: 2, answered: 0, skipped: 0, percent: 0, currentQuestion: 1 },
  createdAt: '2026-11-13T12:00:00.000Z',
  endedAt: null,
})

const path = `/api/v1/study/paths/${preview.qualificationPathId}/oral` as const

test('oral review actions forward category scope and the chosen count and decode nullable whole-path sessions', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'GET',
        `${path}/review-preview`,
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          expect(new URL(request.url, 'http://localhost').searchParams.get('categoryId')).toBe(
            preview.category?.id,
          )

          return HttpServerResponse.jsonUnsafe(preview)
        }),
      ),
      HttpRouter.route('GET', `${path}/review-session`, HttpServerResponse.jsonUnsafe(null)),
      HttpRouter.route(
        'POST',
        `${path}/review-sessions`,
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          expect(yield* request.json.pipe(Effect.orDie)).toEqual({ questionCount: 2 })

          return HttpServerResponse.jsonUnsafe(session)
        }),
      ),
    ],
    async ({ httpClient }) => {
      const params = { qualificationPathId: preview.qualificationPathId }
      expect(
        await runApi(
          getOralReviewPreview({ params, query: { categoryId: preview.category?.id } }),
          httpClient,
        ),
      ).toEqual(preview)
      expect(await runApi(getOralReviewSession({ params, query: {} }), httpClient)).toBeNull()
      expect(
        await runApi(
          startOralReviewSession({ params, payload: { questionCount: session.progress.total } }),
          httpClient,
        ),
      ).toEqual(session)
    },
  ))

test('a competing oral review start preserves the typed resume location', () => {
  const failure = new OralSessionAlreadyStarted({
    type: 'oral_session_already_started',
    message: 'A session already exists.',
    sessionId: session.id,
    currentPosition: session.progress.currentQuestion,
  })

  return withHttpServer(
    [
      HttpRouter.route(
        'POST',
        `${path}/review-sessions`,
        HttpServerResponse.jsonUnsafe(Schema.encodeSync(OralSessionAlreadyStarted)(failure), {
          status: 409,
        }),
      ),
    ],
    async ({ httpClient }) => {
      await expect(
        runApi(
          startOralReviewSession({
            params: { qualificationPathId: preview.qualificationPathId },
            payload: { questionCount: session.progress.total },
          }),
          httpClient,
        ),
      ).rejects.toMatchObject({
        sessionId: session.id,
        currentPosition: 1,
      })
    },
  )
})
