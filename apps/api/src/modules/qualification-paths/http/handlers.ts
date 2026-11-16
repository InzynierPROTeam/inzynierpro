import { Api } from '@inzpro/api-contracts/api'
import { Effect, Option } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { limitByClient, publicReadLimit } from '~api/lib/rate-limit.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'

import { failQualificationPathsRead } from './errors.js'
import { toSpecializationDto } from './mappers.js'

export const QualificationPathsLive = HttpApiBuilder.group(Api, 'QualificationPaths', handlers =>
  handlers
    .handle('ListSpecializations', ({ query }) =>
      limitByClient(publicReadLimit).pipe(
        Effect.andThen(QualificationPathsReader.use(reader => reader.specializations(query))),
        Effect.map(page => mapCursorPage(page, toSpecializationDto)),
        Effect.catchTags({
          QualificationPathsReadError: failQualificationPathsRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('ListQualificationKinds', ({ query }) =>
      limitByClient(publicReadLimit).pipe(
        Effect.andThen(
          QualificationPathsReader.use(reader => reader.kinds(query.specializationId, query)),
        ),
        Effect.catchTags({
          QualificationPathsReadError: failQualificationPathsRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('ListQualificationScopes', ({ query }) =>
      limitByClient(publicReadLimit).pipe(
        Effect.andThen(
          QualificationPathsReader.use(reader =>
            reader.scopes(query.specializationId, query.qualificationKindId, query),
          ),
        ),
        Effect.catchTags({
          QualificationPathsReadError: failQualificationPathsRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('ResolveQualificationPath', ({ query }) =>
      limitByClient(publicReadLimit).pipe(
        Effect.andThen(QualificationPathsReader.use(reader => reader.resolve(query))),
        Effect.map(path => ({ path: Option.getOrNull(path) })),
        Effect.catchTags({ QualificationPathsReadError: failQualificationPathsRead }),
      ),
    ),
)

export const QualificationPathsRequestServices = QualificationPathsReaderLive
