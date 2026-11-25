import { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import {
  includesExamPart,
  oralExamAccess,
  writtenExamAccess,
} from '@inzpro/domain/modules/preparation/exam-access'
import { Effect, Layer, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator } from '~api/lib/cursor-pagination.js'
import { LearningContentReadError } from '~api/modules/learning-content/application/errors.js'
import {
  LinkedQuestionReader,
  type PathDocument,
} from '~api/modules/learning-content/application/linked-question.reader.js'
import {
  LinkedOralQuestion,
  LinkedWrittenQuestion,
  UnitQuestionCount,
} from '~api/modules/learning-content/domain/linked-question.model.js'

export const LinkedQuestionReaderLive = Layer.effect(
  LinkedQuestionReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const linkedReference = (
      { documentId }: PathDocument,
      revisionColumn: Statement.Fragment,
      unitAddress: Statement.Fragment,
    ) =>
      sql`EXISTS (SELECT 1 FROM question_references qr WHERE ${revisionColumn}=r.id AND qr.document_id=${documentId}
   AND (qr.address=${unitAddress} OR starts_with(qr.address,${unitAddress} || '/')))`

    const writtenQuestionsOfUnit = (document: PathDocument, unitAddress: Statement.Fragment) =>
      sql`FROM path_questions pq JOIN written_questions q ON q.id=pq.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE pq.qualification_path_id=${document.pathId} AND ${linkedReference(document, sql`qr.written_revision_id`, unitAddress)}`

    const oralQuestionsOfUnit = (document: PathDocument, unitAddress: Statement.Fragment) =>
      sql`FROM path_oral_questions pq JOIN oral_questions q ON q.id=pq.question_id
 JOIN oral_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 WHERE pq.qualification_path_id=${document.pathId} AND ${linkedReference(document, sql`qr.oral_revision_id`, unitAddress)}`

    const writtenQuestionsPage = makeCursorPaginator(
      sql,
      Schema.Struct({ questionId: WrittenQuestionId }),
      [['questionId', sql`q.id`, 'asc']],
    )

    const oralQuestionsPage = makeCursorPaginator(
      sql,
      Schema.Struct({ questionId: OralQuestionId }),
      [['questionId', sql`q.id`, 'asc']],
    )

    return LinkedQuestionReader.of({
      unitQuestionCounts: Effect.fn('LinkedQuestionReader.unitQuestionCounts')(
        function* (document, accessScope, editionId) {
          const includesWritten = includesExamPart(accessScope, writtenExamAccess)
          const includesOral = includesExamPart(accessScope, oralExamAccess)

          const rows = yield* sql`SELECT * FROM (SELECT s.address,
 CASE WHEN ${includesWritten} THEN (SELECT count(*) ${writtenQuestionsOfUnit(document, sql`s.address`)}) ELSE 0 END::integer AS written_question_count,
 CASE WHEN ${includesOral} THEN (SELECT count(*) ${oralQuestionsOfUnit(document, sql`s.address`)}) ELSE 0 END::integer AS oral_question_count
 FROM document_section_contents s WHERE s.edition_id=${editionId}) counts
 WHERE written_question_count+oral_question_count>0 ORDER BY address`

          return yield* Schema.decodeUnknownEffect(Schema.Array(UnitQuestionCount))(rows)
        },
        Effect.mapError(cause => new LearningContentReadError({ cause })),
      ),
      linkedWrittenQuestions: Effect.fn('LinkedQuestionReader.linkedWrittenQuestions')(
        function* (document, address, req) {
          return yield* writtenQuestionsPage(
            req,
            page =>
              sql`SELECT q.id AS question_id,r.body ${writtenQuestionsOfUnit(document, sql`${address}`)}
 AND ${page.after} ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(LinkedWrittenQuestion))),
              ),
            row => ({ questionId: row.questionId }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new LearningContentReadError({ cause })),
          SchemaError: cause => Effect.fail(new LearningContentReadError({ cause })),
        }),
      ),
      linkedOralQuestions: Effect.fn('LinkedQuestionReader.linkedOralQuestions')(
        function* (document, address, req) {
          return yield* oralQuestionsPage(
            req,
            page =>
              sql`SELECT q.id AS question_id,r.body ${oralQuestionsOfUnit(document, sql`${address}`)}
 AND ${page.after} ORDER BY ${page.orderBy} LIMIT ${page.limit}`.pipe(
                Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(LinkedOralQuestion))),
              ),
            row => ({ questionId: row.questionId }),
          )
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new LearningContentReadError({ cause })),
          SchemaError: cause => Effect.fail(new LearningContentReadError({ cause })),
        }),
      ),
    })
  }),
)
