import { Api } from '@inzpro/api-contracts/api'
import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import { limitByClient, publicReadLimit } from '~api/lib/rate-limit.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/qualification-paths.reader.postgres.js'

export const QualificationPathsLive = HttpApiBuilder.group(Api, 'QualificationPaths', handlers =>
  Effect.gen(function* () {
    const qualificationPathsReader = yield* QualificationPathsReader

    return handlers
      .handle('ListSpecializations', ({ query }) =>
        limitByClient(publicReadLimit).pipe(
          Effect.andThen(
            qualificationPathsReader.specializations(query).pipe(
              Effect.catchTags({
                QualificationPathsReadError: logAndFailInternalServerError(
                  'Could not read qualification paths.',
                ),
                InvalidCursor: () =>
                  Effect.fail(
                    new InvalidRequest({
                      type: 'invalid_request',
                      message: 'Invalid pagination cursor.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('ListQualificationKinds', ({ query }) =>
        limitByClient(publicReadLimit).pipe(
          Effect.andThen(
            qualificationPathsReader.kinds(query.specializationId, query).pipe(
              Effect.catchTags({
                QualificationPathsReadError: logAndFailInternalServerError(
                  'Could not read qualification paths.',
                ),
                InvalidCursor: () =>
                  Effect.fail(
                    new InvalidRequest({
                      type: 'invalid_request',
                      message: 'Invalid pagination cursor.',
                    }),
                  ),
              }),
            ),
          ),
        ),
      )
      .handle('ListQualificationScopes', ({ query }) =>
        limitByClient(publicReadLimit).pipe(
          Effect.andThen(
            qualificationPathsReader
              .scopes(query.specializationId, query.qualificationKindId, query)
              .pipe(
                Effect.catchTags({
                  QualificationPathsReadError: logAndFailInternalServerError(
                    'Could not read qualification paths.',
                  ),
                  InvalidCursor: () =>
                    Effect.fail(
                      new InvalidRequest({
                        type: 'invalid_request',
                        message: 'Invalid pagination cursor.',
                      }),
                    ),
                }),
              ),
          ),
        ),
      )
      .handle('ResolveQualificationPath', ({ query }) =>
        limitByClient(publicReadLimit).pipe(
          Effect.andThen(
            qualificationPathsReader
              .resolve(query)
              .pipe(Effect.map(path => ({ path })))
              .pipe(
                Effect.catchTags({
                  QualificationPathsReadError: logAndFailInternalServerError(
                    'Could not read qualification paths.',
                  ),
                }),
              ),
          ),
        ),
      )
  }),
).pipe(Layer.provide(QualificationPathsReaderLive))
