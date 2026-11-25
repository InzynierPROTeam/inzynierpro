import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, Effect, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StudyReadError } from '~api/modules/written-study/application/errors.js'
import type { QuestionDetails } from '~api/modules/written-study/domain/question-details.model.js'

const QuestionDetailsRow = Schema.Struct({
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  body: Schema.NonEmptyString,
  explanation: RichContent,
  isFavorite: Schema.Boolean,
  noteText: Schema.NullOr(QuestionNoteText),
  noteUpdatedAt: Schema.NullOr(DateTimeUtc),
  noteRefersToEarlierWording: Schema.NullOr(Schema.Boolean),
})

const AnswerRow = Schema.Struct({
  id: QuestionAnswerId,
  text: Schema.NonEmptyString,
  isCorrect: Schema.Boolean,
})

const toQuestionDetails = (
  {
    noteText,
    noteUpdatedAt,
    noteRefersToEarlierWording,
    ...details
  }: typeof QuestionDetailsRow.Type,
  answers: ReadonlyArray<typeof AnswerRow.Type>,
): QuestionDetails => ({
  ...details,
  answers,
  note:
    noteText === null || noteUpdatedAt === null || noteRefersToEarlierWording === null
      ? Option.none()
      : Option.some({
          text: noteText,
          updatedAt: noteUpdatedAt,
          refersToEarlierWording: noteRefersToEarlierWording,
        }),
})

export const writtenQuestionDetailsReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return {
    questionDetails: Effect.fn('StudyReader.questionDetails')(
      function* (userId: UserId, pathId: QualificationPathId, questionId: WrittenQuestionId) {
        const rows =
          yield* sql`SELECT q.id AS question_id,r.id AS question_revision_id,r.body,r.explanation,
 EXISTS (SELECT 1 FROM written_favorite_questions f WHERE f.user_id=${userId} AND f.question_id=q.id) AS is_favorite,
 n.body AS note_text,n.updated_at AS note_updated_at,
 CASE WHEN n.user_id IS NOT NULL THEN coalesce(nr.substantive_revision_id<>r.substantive_revision_id,false) END AS note_refers_to_earlier_wording
 FROM path_questions pq JOIN written_questions q ON q.id=pq.question_id
 JOIN question_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN written_question_notes n ON n.user_id=${userId} AND n.question_id=q.id
 LEFT JOIN question_revisions nr ON nr.id=n.question_revision_id
 WHERE pq.qualification_path_id=${pathId} AND pq.question_id=${questionId} LIMIT 1`

        const found = Arr.head(
          yield* Schema.decodeUnknownEffect(Schema.Array(QuestionDetailsRow))(rows),
        )

        if (Option.isNone(found)) {
          return Option.none()
        }

        const answers =
          yield* sql`SELECT id,text,is_correct FROM question_answers WHERE question_revision_id=${found.value.questionRevisionId} ORDER BY created_at,id`.pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(AnswerRow))),
          )

        return Option.some(toQuestionDetails(found.value, answers))
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
