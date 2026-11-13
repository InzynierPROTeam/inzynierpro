import { Uuid } from '@inzpro/domain/common/id'
import { DocumentQuestionPool } from '@inzpro/domain/modules/learning-content/reference-document'
import { Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { makeCursorPaginator } from '~api/lib/cursor-pagination.js'

import { StudyReadError } from './errors.js'
import { StudyReader } from './study.reader.js'

export const StudyReaderLive = Layer.effect(
  StudyReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const columns = sql`d.id,d.title,count(r.id)::integer AS available_question_count,count(c.question_id)::integer AS completed_question_count`

    const documentsPage = makeCursorPaginator(sql, Schema.Struct({ id: Uuid }), [
      ['id', sql`d.id`, 'asc'],
    ])

    return StudyReader.of({
      documents: Effect.fn('StudyReader.documents')(
        function* (userId, pathId, req) {
          return yield* documentsPage(
            req,
            page =>
              sql`SELECT ${columns} FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pd.qualification_path_id AND c.question_id=q.id AND c.question_revision_id=r.id
 WHERE pd.qualification_path_id=${pathId} AND ${page.after} GROUP BY d.id,d.title ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))),
              ),
            row => ({ id: row.id }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new StudyReadError({ cause })),
          SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
        }),
      ),
      nextDocument: Effect.fn('StudyReader.nextDocument')(
        function* (userId, pathId, afterDocumentId) {
          const after = Option.match(afterDocumentId, {
            onNone: () => sql`true`,
            onSome: id => sql`d.id > ${id}`,
          })

          const rows =
            yield* sql`SELECT ${columns} FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pd.qualification_path_id AND c.question_id=q.id AND c.question_revision_id=r.id
 WHERE pd.qualification_path_id=${pathId} AND ${after} GROUP BY d.id,d.title HAVING count(r.id)>0 ORDER BY d.id LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))(rows)

          return Option.fromNullishOr(data[0])
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      document: Effect.fn('StudyReader.document')(
        function* (userId, pathId, documentId) {
          const rows =
            yield* sql`SELECT ${columns} FROM path_documents pd JOIN reference_documents d ON d.id=pd.document_id
 LEFT JOIN path_questions pq ON pq.qualification_path_id=pd.qualification_path_id AND pq.document_id=d.id
 LEFT JOIN written_questions q ON q.id=pq.question_id
 LEFT JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN written_question_coverage c ON c.user_id=${userId} AND c.qualification_path_id=pd.qualification_path_id AND c.question_id=q.id AND c.question_revision_id=r.id
 WHERE pd.qualification_path_id=${pathId} AND d.id=${documentId} GROUP BY d.id,d.title LIMIT 1`

          const data = yield* Schema.decodeUnknownEffect(Schema.Array(DocumentQuestionPool))(rows)

          return Option.fromNullishOr(data[0])
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
    })
  }),
)
