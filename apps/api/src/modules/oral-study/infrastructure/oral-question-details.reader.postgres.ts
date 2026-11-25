import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, Effect, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import type { OralQuestionDetails } from '~api/modules/oral-study/domain/oral-question-details.model.js'

const QuestionDetailsRow = Schema.Struct({
  questionId: OralQuestionId,
  oralRevisionId: OralRevisionId,
  body: RichContent,
  answer: RichContent,
  isFavorite: Schema.Boolean,
  noteText: Schema.NullOr(QuestionNoteText),
  noteUpdatedAt: Schema.NullOr(DateTimeUtc),
  noteRefersToEarlierWording: Schema.NullOr(Schema.Boolean),
})

const toQuestionDetails = ({
  noteText,
  noteUpdatedAt,
  noteRefersToEarlierWording,
  ...details
}: typeof QuestionDetailsRow.Type): OralQuestionDetails => ({
  ...details,
  note:
    noteText === null || noteUpdatedAt === null || noteRefersToEarlierWording === null
      ? Option.none()
      : Option.some({
          text: noteText,
          updatedAt: noteUpdatedAt,
          refersToEarlierWording: noteRefersToEarlierWording,
        }),
})

export const oralQuestionDetailsReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  return {
    questionDetails: Effect.fn('OralStudyReader.questionDetails')(
      function* (userId: UserId, pathId: QualificationPathId, questionId: OralQuestionId) {
        const rows = yield* sql`SELECT q.id AS question_id,r.id AS oral_revision_id,r.body,r.answer,
 EXISTS (SELECT 1 FROM oral_favorite_questions f WHERE f.user_id=${userId} AND f.question_id=q.id) AS is_favorite,
 n.body AS note_text,n.updated_at AS note_updated_at,
 CASE WHEN n.user_id IS NOT NULL THEN coalesce(nr.substantive_revision_id<>r.substantive_revision_id,false) END AS note_refers_to_earlier_wording
 FROM path_oral_questions pq JOIN oral_questions q ON q.id=pq.question_id
 JOIN oral_revisions r ON r.id=q.current_revision_id AND r.published_at IS NOT NULL AND r.withdrawn_at IS NULL
 LEFT JOIN oral_question_notes n ON n.user_id=${userId} AND n.question_id=q.id
 LEFT JOIN oral_revisions nr ON nr.id=n.oral_revision_id
 WHERE pq.qualification_path_id=${pathId} AND pq.question_id=${questionId} LIMIT 1`

        return Option.map(
          Arr.head(yield* Schema.decodeUnknownEffect(Schema.Array(QuestionDetailsRow))(rows)),
          toQuestionDetails,
        )
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
  }
})
