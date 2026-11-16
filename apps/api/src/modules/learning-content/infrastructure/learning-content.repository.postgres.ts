import { Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'
import { LearningContentWriteError } from '~api/modules/learning-content/application/errors.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import {
  initialRevision,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'

export const LearningContentRepositoryLive = Layer.effect(
  LearningContentRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return LearningContentRepository.of({
      createDocument: Effect.fn('LearningContentRepository.createDocument')(function* (document) {
        return yield* sql`INSERT INTO reference_documents (id,title) VALUES (${document.id},${document.title})`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new LearningContentWriteError({ cause })),
        )
      }),
      attachDocument: Effect.fn('LearningContentRepository.attachDocument')(
        function* (pathId, documentId) {
          return yield* sql`INSERT INTO path_documents (qualification_path_id,document_id) VALUES (${pathId},${documentId})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      attachQuestion: Effect.fn('LearningContentRepository.attachQuestion')(
        function* (pathId, documentId, questionId) {
          return yield* sql`INSERT INTO path_questions (qualification_path_id,document_id,question_id) VALUES (${pathId},${documentId},${questionId})`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
      createQuestion: Effect.fn('LearningContentRepository.createQuestion')(function* (question) {
        return yield* sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`INSERT INTO written_questions (id,document_id) VALUES (${question.id},${question.documentId})`
              yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation,change_kind,substantive_revision_id) VALUES (${question.revisionId},${question.id},${question.body},${question.explanation},${initialRevision},${question.revisionId})`

              for (const answer of question.answers) {
                yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answer.id},${answer.questionRevisionId},${answer.text},${answer.isCorrect})`
              }

              if (question.published) {
                yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${question.revisionId}`
              }

              yield* sql`UPDATE written_questions SET current_revision_id=${question.revisionId} WHERE id=${question.id}`
              yield* sql`INSERT INTO path_questions (qualification_path_id,document_id,question_id) VALUES (${question.qualificationPathId},${question.documentId},${question.id})`
            }),
          )
          .pipe(Effect.mapError(cause => new LearningContentWriteError({ cause })))
      }),
      publishRevision: Effect.fn('LearningContentRepository.publishRevision')(function* (revision) {
        return yield* sql
          .withTransaction(
            Effect.gen(function* () {
              // A cosmetic revision carries the substantive content of the revision it replaces.
              const substantiveRevisionId =
                revision.changeKind === substantiveChange
                  ? sql`${revision.revisionId}::uuid`
                  : sql`(SELECT r.substantive_revision_id FROM written_questions q JOIN question_revisions r ON r.id=q.current_revision_id WHERE q.id=${revision.questionId})`

              yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation,change_kind,substantive_revision_id) VALUES (${revision.revisionId},${revision.questionId},${revision.body},${revision.explanation},${revision.changeKind},${substantiveRevisionId})`

              for (const answer of revision.answers) {
                yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answer.id},${answer.questionRevisionId},${answer.text},${answer.isCorrect})`
              }

              yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${revision.revisionId}`
              yield* sql`UPDATE written_questions SET current_revision_id=${revision.revisionId} WHERE id=${revision.questionId}`
            }),
          )
          .pipe(Effect.mapError(cause => new LearningContentWriteError({ cause })))
      }),
      withdrawRevision: Effect.fn('LearningContentRepository.withdrawRevision')(
        function* (withdrawal) {
          return yield* sql`UPDATE question_revisions SET withdrawn_at=clock_timestamp(),withdrawal_reason=${withdrawal.reason}
 WHERE id=${withdrawal.revisionId} AND published_at IS NOT NULL AND withdrawn_at IS NULL`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new LearningContentWriteError({ cause })),
          )
        },
      ),
    })
  }),
)
