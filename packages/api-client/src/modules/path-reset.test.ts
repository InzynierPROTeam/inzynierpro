import { PathResetConflict } from '@inzpro/api-contracts/modules/path-reset/errors'
import { ResetPathPayload } from '@inzpro/api-contracts/modules/path-reset/requests'
import { PathParams } from '@inzpro/api-contracts/modules/preparation/requests'
import { withHttpServer } from '@inzpro/testing/http'
import { Effect, Schema } from 'effect'
import { HttpRouter, HttpServerRequest, HttpServerResponse } from 'effect/http'
import { expect, test } from 'vitest'
import { runApi } from '~api-client/lib/run-api.js'
import { resetPath } from '~api-client/modules/path-reset.js'

const params = Schema.decodeSync(PathParams)({
  qualificationPathId: '10000000-0000-4000-8000-000000000001',
})

const payload = Schema.decodeSync(ResetPathPayload)({
  confirmation: 'RESETUJ',
  expectedVersion: 3,
})

const encodedPayload = Schema.encodeSync(ResetPathPayload)(payload)

test('a path reset sends the confirmation and expected version', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'POST',
        `/api/v1/path-reset/paths/${params.qualificationPathId}`,
        Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest
          expect(yield* request.json.pipe(Effect.orDie)).toEqual(encodedPayload)

          return HttpServerResponse.jsonUnsafe({
            qualificationPathId: params.qualificationPathId,
            version: 4,
          })
        }),
      ),
    ],
    async ({ httpClient }) => {
      expect(await runApi(resetPath({ params, payload }), httpClient)).toEqual({
        qualificationPathId: params.qualificationPathId,
        version: 4,
      })
    },
  ))

test('a reset of a changed path fails with PathResetConflict', () =>
  withHttpServer(
    [
      HttpRouter.route(
        'POST',
        `/api/v1/path-reset/paths/${params.qualificationPathId}`,
        HttpServerResponse.jsonUnsafe(
          Schema.encodeSync(PathResetConflict)(
            new PathResetConflict({
              type: 'path_reset_conflict',
              message: 'Your path changed elsewhere. Reload before resetting it.',
            }),
          ),
          { status: 409 },
        ),
      ),
    ],
    async ({ httpClient }) => {
      await expect(runApi(resetPath({ params, payload }), httpClient)).rejects.toBeInstanceOf(
        PathResetConflict,
      )
    },
  ))
