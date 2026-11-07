import {
  InternalServerError,
  InvalidRequest,
  RouteNotFound,
} from '@inzpro/api-contracts/utils/api-error'
import { Cause, Effect, Schema } from 'effect'
import { HttpServerError, HttpServerResponse } from 'effect/http'

const FrameworkError = Schema.Union([InvalidRequest, RouteNotFound, InternalServerError])

const errorResponse = (error: typeof FrameworkError.Type, status: number) =>
  HttpServerResponse.jsonUnsafe(Schema.encodeSync(FrameworkError)(error), {
    status,
    headers: { 'cache-control': 'no-store' },
  })

const normalizeError = Effect.fn('Http.normalizeError')(function* (
  status: number,
  cause: Cause.Cause<unknown>,
) {
  switch (status) {
    case 400:
      return errorResponse(
        new InvalidRequest({
          type: 'invalid_request',
          message: 'The request contains invalid data.',
        }),
        400,
      )
    case 404:
      return errorResponse(
        new RouteNotFound({
          type: 'route_not_found',
          message: 'The requested API route was not found.',
        }),
        404,
      )
    default:
      yield* Effect.logError('http_internal_error', cause)

      return errorResponse(
        new InternalServerError({
          type: 'internal_server_error',
          message: 'An unexpected server error occurred. Please try again later.',
        }),
        500,
      )
  }
})

export const ApiErrorMiddleware = <E, R>(
  httpEffect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
) =>
  httpEffect.pipe(
    Effect.catchCause(cause => {
      if (Cause.hasInterruptsOnly(cause)) {
        return Effect.failCause(cause)
      }

      return HttpServerError.causeResponse(cause).pipe(
        Effect.flatMap(([response]) => normalizeError(response.status, cause)),
      )
    }),
  )
