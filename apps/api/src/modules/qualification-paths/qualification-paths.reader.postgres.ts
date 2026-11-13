import { Uuid } from '@inzpro/domain/common/id'
import { QualificationKind } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import { QualificationPath } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  QualificationScope,
  restrictedQualificationScopeCode,
} from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { Specialization } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { makeCursorPaginator } from '~api/lib/cursor-pagination.js'

import { QualificationPathsReadError } from './errors.js'
import { QualificationPathsReader } from './qualification-paths.reader.js'

export const QualificationPathsReaderLive = Layer.effect(
  QualificationPathsReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const specializationsPage = makeCursorPaginator(sql, Schema.Struct({ id: Uuid }), [
      ['id', sql`s.id`, 'asc'],
    ])

    const kindsPage = makeCursorPaginator(sql, Schema.Struct({ id: Uuid }), [
      ['id', sql`k.id`, 'asc'],
    ])

    // The restricted scope is listed first.
    const scopesPage = makeCursorPaginator(sql, Schema.Struct({ order: Schema.Int, id: Uuid }), [
      ['order', sql`CASE WHEN s.code=${restrictedQualificationScopeCode} THEN 0 ELSE 1 END`, 'asc'],
      ['id', sql`s.id`, 'asc'],
    ])

    return QualificationPathsReader.of({
      specializations: Effect.fn('QualificationPathsReader.specializations')(
        function* (req) {
          return yield* specializationsPage(
            req,
            page =>
              sql`SELECT s.id,s.code,s.name,s.description FROM specializations s WHERE EXISTS (SELECT 1 FROM qualification_paths p WHERE p.specialization_id=s.id AND p.published) AND ${page.after} ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(Specialization))),
              ),
            row => ({ id: row.id }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
          SchemaError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
        }),
      ),
      kinds: Effect.fn('QualificationPathsReader.kinds')(
        function* (specializationId, req) {
          return yield* kindsPage(
            req,
            page =>
              sql`SELECT k.id,k.code,k.name FROM qualification_kinds k WHERE EXISTS (SELECT 1 FROM qualification_paths p WHERE p.qualification_kind_id=k.id AND p.specialization_id=${specializationId} AND p.published) AND ${page.after} ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(QualificationKind))),
              ),
            row => ({ id: row.id }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
          SchemaError: cause => Effect.fail(new QualificationPathsReadError({ cause })),
        }),
      ),
      scopes: Effect.fn('QualificationPathsReader.scopes')(
        function* (specializationId, kindId, req) {
          return yield* scopesPage(
            req,
            page =>
              sql`SELECT s.id,s.code,s.name FROM qualification_scopes s WHERE EXISTS (SELECT 1 FROM qualification_paths p WHERE p.qualification_scope_id=s.id AND p.specialization_id=${specializationId} AND p.qualification_kind_id=${kindId} AND p.published) AND ${page.after} ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(QualificationScope))),
              ),
            row => ({
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
