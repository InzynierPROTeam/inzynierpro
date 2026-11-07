import { Context, Effect } from 'effect'
import { SecureRandom } from 'effect/crypto'
import { HttpServerResponse } from 'effect/http'

export const RequestId = Context.Reference<string>('api/RequestId', {
  defaultValue: SecureRandom.uuidV4Unsafe,
})

export const RequestIdMiddleware = <E, R>(
  httpEffect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
) =>
  Effect.gen(function* () {
    const random = yield* SecureRandom.SecureRandom
    const requestId = yield* random.uuidV4()

    const response = yield* httpEffect.pipe(
      Effect.provideService(RequestId, requestId),
      Effect.annotateLogs({ requestId }),
    )

    return HttpServerResponse.setHeaders(response, {
      'x-request-id': requestId,
    })
  })
