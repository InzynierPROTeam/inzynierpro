import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import { QuestionNoteText } from '@inzpro/domain/modules/learning/question-note'
import { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import {
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, Effect, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator } from '~api/lib/cursor-pagination.js'
import { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import {
  type OralSessionQuestion,
  OralSessionResultCounts,
  OralStudySession,
} from '~api/modules/oral-study/domain/oral-study-session.model.js'

const SessionQuestionRow = Schema.Struct({
  sessionId: OralStudySessionId,
  position: SessionQuestionPosition,
  questionId: OralQuestionId,
  oralRevisionId: OralRevisionId,
  body: RichContent,
  answer: RichContent,
  isFavorite: Schema.Boolean,
  noteText: Schema.NullOr(QuestionNoteText),
  noteUpdatedAt: Schema.NullOr(DateTimeUtc),
  noteRefersToEarlierWording: Schema.NullOr(Schema.Boolean),
  isWithdrawn: Schema.Boolean,
  selfAssessment: Schema.NullOr(OralSelfAssessment),
  assessedAt: Schema.NullOr(DateTimeUtc),
})

const toSessionQuestion = ({
  selfAssessment,
  assessedAt,
  noteText,
  noteUpdatedAt,
  noteRefersToEarlierWording,
  ...question
}: typeof SessionQuestionRow.Type): OralSessionQuestion => ({
  ...question,
  note:
    noteText === null || noteUpdatedAt === null || noteRefersToEarlierWording === null
      ? Option.none()
      : Option.some({
          text: noteText,
          updatedAt: noteUpdatedAt,
          refersToEarlierWording: noteRefersToEarlierWording,
        }),
  selfAssessment:
    selfAssessment === null || assessedAt === null
      ? Option.none()
      : Option.some({ value: selfAssessment, assessedAt }),
})

const SessionQuestionResultRow = Schema.Struct({
  position: SessionQuestionPosition,
  selfAssessment: Schema.OptionFromNullOr(OralSelfAssessment),
  isWithdrawn: Schema.Boolean,
})

export const oralSessionReader = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const findSession = (
    userId: UserId,
    pathId: QualificationPathId,
    conditions: ReadonlyArray<Statement.Fragment>,
  ) =>
    sql`SELECT s.id,s.kind,s.category_id,c.name AS category_name,s.user_exam_goal_version AS goal_version,s.question_count,s.current_position,
 (SELECT count(*)::integer FROM oral_study_self_assessments a WHERE a.study_session_id=s.id) AS answered_count,
 (SELECT count(*)::integer FROM oral_study_session_questions sq JOIN oral_revisions r ON r.id=sq.oral_revision_id WHERE sq.study_session_id=s.id AND r.withdrawn_at<coalesce(s.ended_at,'infinity') AND NOT EXISTS (SELECT 1 FROM oral_study_self_assessments a WHERE a.study_session_id=sq.study_session_id AND a.position=sq.position)) AS skipped_count,
 s.created_at,s.ended_at
 FROM oral_study_sessions s LEFT JOIN oral_question_categories c ON c.id=s.category_id
 WHERE ${sql.and([sql`s.user_id=${userId}`, sql`s.qualification_path_id=${pathId}`, ...conditions])}
 ORDER BY s.last_activity_at DESC,s.id DESC LIMIT 1`.pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(OralStudySession))),
      Effect.map(Arr.head),
      Effect.mapError(cause => new StudyReadError({ cause })),
    )

  const resultsPage = makeCursorPaginator(
    sql,
    Schema.Struct({ position: SessionQuestionPosition }),
    [['position', sql`sq.position`, 'asc']],
  )

  return {
    unfinishedFavoritesSession: Effect.fn('OralStudyReader.unfinishedFavoritesSession')(
      (userId, pathId) =>
        findSession(userId, pathId, [
          sql`s.kind='favourites'`,
          sql`s.category_id IS NULL`,
          sql`s.ended_at IS NULL`,
        ]),
    ),
    unfinishedSession: Effect.fn('OralStudyReader.unfinishedSession')(
      (userId, pathId, categoryId) =>
        findSession(userId, pathId, [
          sql`s.kind='study'`,
          sql`s.category_id=${categoryId}`,
          sql`s.ended_at IS NULL`,
        ]),
    ),
    latestSession: Effect.fn('OralStudyReader.latestSession')((userId, pathId, categoryId) =>
      findSession(userId, pathId, [
        sql`s.kind='study'`,
        ...Option.match(categoryId, {
          onNone: () => [],
          onSome: id => [sql`s.category_id=${id}`],
        }),
      ]),
    ),
    latestUnfinishedSession: Effect.fn('OralStudyReader.latestUnfinishedSession')(
      (userId, pathId) =>
        findSession(userId, pathId, [sql`s.kind='study'`, sql`s.ended_at IS NULL`]),
    ),
    session: Effect.fn('OralStudyReader.session')((userId, pathId, sessionId) =>
      findSession(userId, pathId, [sql`s.id=${sessionId}`]),
    ),
    sessionQuestion: Effect.fn('OralStudyReader.sessionQuestion')(
      function* (userId, pathId, sessionId, position) {
        const rows =
          yield* sql`SELECT s.id AS session_id,sq.position,sq.question_id,sq.oral_revision_id,r.body,r.answer,r.withdrawn_at IS NOT NULL AS is_withdrawn,
 a.self_assessment,a.created_at AS assessed_at,
 EXISTS (SELECT 1 FROM oral_favorite_questions f WHERE f.user_id=${userId} AND f.question_id=sq.question_id) AS is_favorite,
 n.body AS note_text,n.updated_at AS note_updated_at,CASE WHEN n.user_id IS NOT NULL THEN coalesce(nr.substantive_revision_id<>cr.substantive_revision_id,false) END AS note_refers_to_earlier_wording
 FROM oral_study_sessions s JOIN oral_study_session_questions sq ON sq.study_session_id=s.id
 JOIN oral_revisions r ON r.id=sq.oral_revision_id
 LEFT JOIN oral_study_self_assessments a ON a.study_session_id=sq.study_session_id AND a.position=sq.position
 LEFT JOIN oral_question_notes n ON n.user_id=${userId} AND n.question_id=sq.question_id
 LEFT JOIN oral_revisions nr ON nr.id=n.oral_revision_id
 LEFT JOIN oral_questions q ON q.id=sq.question_id
 LEFT JOIN oral_revisions cr ON cr.id=q.current_revision_id
 WHERE s.id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId} AND sq.position=${position}
 LIMIT 1`

        const data = yield* Schema.decodeUnknownEffect(Schema.Array(SessionQuestionRow))(rows)

        return Option.map(Arr.head(data), toSessionQuestion)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    nextOpenPosition: Effect.fn('OralStudyReader.nextOpenPosition')(
      function* (sessionId, position) {
        const rows =
          yield* sql`SELECT sq.position FROM oral_study_session_questions sq JOIN oral_revisions r ON r.id=sq.oral_revision_id
 LEFT JOIN oral_study_self_assessments a ON a.study_session_id=sq.study_session_id AND a.position=sq.position
 WHERE sq.study_session_id=${sessionId} AND a.position IS NULL AND r.withdrawn_at IS NULL
 ORDER BY sq.position<=${position},sq.position LIMIT 1`

        const data = yield* Schema.decodeUnknownEffect(
          Schema.Array(Schema.Struct({ position: SessionQuestionPosition })),
        )(rows)

        return Option.map(Arr.head(data), ({ position: next }) => next)
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    sessionResultCounts: Effect.fn('OralStudyReader.sessionResultCounts')(
      function* (sessionId) {
        const rows =
          yield* sql`SELECT count(*) FILTER (WHERE self_assessment='hard')::integer AS hard,
 count(*) FILTER (WHERE self_assessment='medium')::integer AS medium,
 count(*) FILTER (WHERE self_assessment='easy')::integer AS easy
 FROM oral_study_self_assessments WHERE study_session_id=${sessionId}`

        const [counts] = yield* Schema.decodeUnknownEffect(Schema.Tuple([OralSessionResultCounts]))(
          rows,
        )

        return counts
      },
      Effect.mapError(cause => new StudyReadError({ cause })),
    ),
    sessionResults: Effect.fn('OralStudyReader.sessionResults')(
      function* (userId, pathId, sessionId, req) {
        return yield* resultsPage(
          req,
          window =>
            sql`SELECT sq.position,a.self_assessment,r.withdrawn_at IS NOT NULL AS is_withdrawn
 FROM oral_study_sessions s JOIN oral_study_session_questions sq ON sq.study_session_id=s.id
 JOIN oral_revisions r ON r.id=sq.oral_revision_id
 LEFT JOIN oral_study_self_assessments a ON a.study_session_id=sq.study_session_id AND a.position=sq.position
 WHERE s.id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId} AND ${window.after}
 ORDER BY ${window.orderBy} LIMIT ${window.limit}`.pipe(
              Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(SessionQuestionResultRow))),
            ),
          row => ({ position: row.position }),
        )
      },
      Effect.catchTags({
        SqlError: cause => Effect.fail(new StudyReadError({ cause })),
        SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
      }),
    ),
  }
})
