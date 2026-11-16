import { Effect } from 'effect'
import { SecureRandom } from 'effect/crypto'
import { HttpServerResponse } from 'effect/http'

const requestId = Effect.currentParentSpan.pipe(
  Effect.map(span => span.traceId),
  Effect.catchTag('NoSuchElementError', () =>
    Effect.flatMap(SecureRandom.SecureRandom, secureRandom => secureRandom.uuidV4()).pipe(
      Effect.map(uuid => uuid.replaceAll('-', '')),
    ),
  ),
)

export const RequestIdMiddleware = <E, R>(
  httpEffect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
) =>
  Effect.gen(function* () {
    const traceId = yield* requestId

    const response = yield* httpEffect.pipe(Effect.annotateLogs({ traceId }))

    return HttpServerResponse.setHeaders(response, { 'x-request-id': traceId })
  })
