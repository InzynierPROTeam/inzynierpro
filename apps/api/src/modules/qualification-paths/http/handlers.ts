import { Api } from '@inzpro/api-contracts/api'
import { Effect, Option, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { failInvalidCursor } from '~api/lib/invalid-cursor.js'
import { limitByClient, publicReadLimit } from '~api/lib/rate-limit.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'

import { failQualificationPathsRead } from './errors.js'
import { toSpecializationDto } from './mappers.js'

export const QualificationPathsLive = HttpApiBuilder.group(Api, 'QualificationPaths', handlers =>
  Effect.gen(function* () {
    const qualificationPathsReader = yield* QualificationPathsReader

    return handlers
      .handle('ListSpecializations', ({ query }) =>
        limitByClient(publicReadLimit).pipe(
          Effect.andThen(
            qualificationPathsReader.specializations(query).pipe(
              Effect.map(page => mapCursorPage(page, toSpecializationDto)),
              Effect.catchTags({
                QualificationPathsReadError: failQualificationPathsRead,
                InvalidCursor: failInvalidCursor,
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
                QualificationPathsReadError: failQualificationPathsRead,
                InvalidCursor: failInvalidCursor,
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
                  QualificationPathsReadError: failQualificationPathsRead,
                  InvalidCursor: failInvalidCursor,
                }),
              ),
          ),
        ),
      )
      .handle('ResolveQualificationPath', ({ query }) =>
        limitByClient(publicReadLimit).pipe(
          Effect.andThen(
            qualificationPathsReader.resolve(query).pipe(
              Effect.map(path => ({ path: Option.getOrNull(path) })),
              Effect.catchTags({
                QualificationPathsReadError: failQualificationPathsRead,
              }),
            ),
          ),
        ),
      )
  }),
).pipe(Layer.provide(QualificationPathsReaderLive))
