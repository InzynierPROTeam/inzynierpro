import { Uuid } from '@inzpro/domain/common/id'
import {
  decodeCursor,
  makeCursorPage,
  resolveCursorPagination,
} from '@inzpro/domain/common/pagination'
import { QualificationKind } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationPath } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  QualificationScope,
  restrictedQualificationScopeCode,
} from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { Specialization } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'

import { QualificationPathsReadError } from './errors.js'
import { QualificationPathsReader } from './qualification-paths.reader.js'

const ScopeCursor = Schema.fromJsonString(Schema.Struct({ order: Schema.Int, id: Uuid }))

export const QualificationPathsReaderLive = Layer.effect(
  QualificationPathsReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return QualificationPathsReader.of({
      specializations: Effect.fn('QualificationPathsReader.specializations')(
        function* (req) {
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(Uuid, req.cursor)

          const afterCursor = cursor === undefined ? sql`true` : sql`s.id > ${cursor}`

          const rows =
            yield* sql`SELECT s.id,s.code,s.name,s.description FROM specializations s WHERE EXISTS (SELECT 1 FROM qualification_paths p WHERE p.specialization_id=s.id AND p.published) AND ${afterCursor} ORDER BY s.id LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(Specialization))(rows)

          return makeCursorPage(data, limit, row => row.id)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
          SchemaError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
        }),
      ),
      kinds: Effect.fn('QualificationPathsReader.kinds')(
        function* (specializationId, req) {
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(Uuid, req.cursor)

          const afterCursor = cursor === undefined ? sql`true` : sql`k.id > ${cursor}`

          const rows =
            yield* sql`SELECT k.id,k.code,k.name FROM qualification_kinds k WHERE EXISTS (SELECT 1 FROM qualification_paths p WHERE p.qualification_kind_id=k.id AND p.specialization_id=${specializationId} AND p.published) AND ${afterCursor} ORDER BY k.id LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(QualificationKind))(rows)

          return makeCursorPage(data, limit, row => row.id)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
          SchemaError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
        }),
      ),
      scopes: Effect.fn('QualificationPathsReader.scopes')(
        function* (specializationId, kindId, req) {
          const { limit } = resolveCursorPagination(req)
          const fetchLimit = limit + 1
          const cursor = yield* decodeCursor(ScopeCursor, req.cursor)

          const order = sql`CASE WHEN s.code=${restrictedQualificationScopeCode} THEN 0 ELSE 1 END`

          const afterCursor =
            cursor === undefined ? sql`true` : sql`(${order},s.id) > (${cursor.order},${cursor.id})`

          const rows =
            yield* sql`SELECT s.id,s.code,s.name FROM qualification_scopes s WHERE EXISTS (SELECT 1 FROM qualification_paths p WHERE p.qualification_scope_id=s.id AND p.specialization_id=${specializationId} AND p.qualification_kind_id=${kindId} AND p.published) AND ${afterCursor} ORDER BY ${order},s.id LIMIT ${fetchLimit}`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(QualificationScope))(rows)

          return makeCursorPage(data, limit, row =>
            Schema.encodeSync(ScopeCursor)({
              order: row.code === restrictedQualificationScopeCode ? 0 : 1,
              id: row.id,
            }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
          SchemaError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
        }),
      ),
      resolve: Effect.fn('QualificationPathsReader.resolve')(
        function* (filters) {
          const rows =
            yield* sql`SELECT id,name FROM qualification_paths WHERE published AND specialization_id=${filters.specializationId} AND qualification_kind_id=${filters.qualificationKindId} AND qualification_scope_id=${filters.qualificationScopeId} LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(QualificationPath))(rows)

          return Option.fromNullishOr(data[0])
        },
        Effect.mapError(cause => new QualificationPathsReadError({ cause })),
      ),
    })
  }),
)
