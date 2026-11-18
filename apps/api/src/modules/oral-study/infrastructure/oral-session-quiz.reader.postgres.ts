import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import {
  KnowledgeCheckFormat,
  OralKnowledgeCheckOptionId,
  OralKnowledgeCheckRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import {
  OralQuizCheckPosition,
  OralSessionQuizId,
} from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Array as Arr, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { makeCursorPaginator } from '~api/lib/cursor-pagination.js'
import { StudyReadError } from '~api/modules/oral-study/application/errors.js'
import { OralSessionQuizReader } from '~api/modules/oral-study/application/oral-session-quiz.reader.js'
import type {
  KnowledgeCheckCandidate,
  OralQuizCheck,
} from '~api/modules/oral-study/domain/oral-session-quiz.model.js'

const CandidateRow = Schema.Struct({
  questionId: OralQuestionId,
  sessionPosition: SessionQuestionPosition,
  oralRevisionId: OralRevisionId,
  knowledgeCheckRevisionId: OralKnowledgeCheckRevisionId,
  format: KnowledgeCheckFormat,
  prompt: Schema.NonEmptyString,
  optionId: OralKnowledgeCheckOptionId,
})

const QuizRow = Schema.Struct({
  earnedXp: LearningXp,
  id: OralSessionQuizId,
  sessionId: OralStudySessionId,
  checkCount: QuestionCount,
  answeredCount: QuestionCount,
})

const CheckRow = Schema.Struct({
  quizId: OralSessionQuizId,
  position: OralQuizCheckPosition,
  questionId: OralQuestionId,
  oralRevisionId: OralRevisionId,
  format: KnowledgeCheckFormat,
  prompt: Schema.NonEmptyString,
  explanation: RichContent,
  answerIsCorrect: Schema.NullOr(Schema.Boolean),
  earnedXp: Schema.NullOr(LearningXp),
  answeredAt: Schema.NullOr(DateTimeUtc),
})

const OptionRow = Schema.Struct({
  position: OralQuizCheckPosition,
  id: OralKnowledgeCheckOptionId,
  text: Schema.NonEmptyString,
  isCorrect: Schema.Boolean,
  isSelected: Schema.Boolean,
})

const toCandidates = (
  rows: ReadonlyArray<typeof CandidateRow.Type>,
): ReadonlyArray<KnowledgeCheckCandidate> =>
  [...Map.groupBy(rows, row => row.knowledgeCheckRevisionId).values()].flatMap(options =>
    Arr.match(options, {
      onEmpty: () => [],
      onNonEmpty: ([{ optionId: _optionId, ...check }]) => [
        { ...check, optionIds: options.map(option => option.optionId) },
      ],
    }),
  )

const toCheck = (
  { answerIsCorrect, answeredAt, earnedXp, ...check }: typeof CheckRow.Type,
  optionRows: ReadonlyArray<typeof OptionRow.Type>,
): OralQuizCheck => {
  const options = optionRows.filter(option => option.position === check.position)

  return {
    ...check,
    options: options.map(({ id, text, isCorrect }) => ({ id, text, isCorrect })),
    answer:
      answerIsCorrect === null || answeredAt === null
        ? Option.none()
        : Option.some({
            isCorrect: answerIsCorrect,
            earnedXp: earnedXp ?? LearningXp.make(0),
            answeredAt,
            selectedOptionIds: options.flatMap(option => (option.isSelected ? [option.id] : [])),
          }),
  }
}

export const OralSessionQuizReaderLive = Layer.effect(
  OralSessionQuizReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const compatibleChecks = sql`FROM oral_study_session_questions sq
 JOIN oral_revisions pr ON pr.id=sq.oral_revision_id AND pr.withdrawn_at IS NULL
 JOIN oral_knowledge_checks k ON k.question_id=sq.question_id
 JOIN oral_knowledge_check_revisions kr ON kr.id=k.current_revision_id AND kr.published_at IS NOT NULL
 JOIN oral_revisions lr ON lr.id=kr.oral_revision_id AND lr.substantive_revision_id=pr.substantive_revision_id`

    const checksPage = makeCursorPaginator(
      sql,
      Schema.Struct({ position: OralQuizCheckPosition }),
      [['position', sql`c.position`, 'asc']],
    )

    const learnerChecks = (
      userId: UserId,
      pathId: QualificationPathId,
      sessionId: OralStudySessionId,
      conditions: ReadonlyArray<Statement.Fragment>,
      ordering: Statement.Fragment,
      limit: number,
    ) =>
      sql`SELECT z.id AS quiz_id,c.position,sq.question_id,c.oral_revision_id,kr.format,kr.prompt,kr.explanation,a.is_correct AS answer_is_correct,a.answered_at,a.earned_xp
 FROM oral_session_quizzes z
 JOIN oral_study_sessions s ON s.id=z.study_session_id
 JOIN oral_session_quiz_checks c ON c.quiz_id=z.id
 JOIN oral_study_session_questions sq ON sq.study_session_id=c.study_session_id AND sq.position=c.session_position
 JOIN oral_knowledge_check_revisions kr ON kr.id=c.knowledge_check_revision_id
 LEFT JOIN oral_session_quiz_answers a ON a.quiz_id=c.quiz_id AND a.position=c.position
 WHERE ${sql.and([sql`z.study_session_id=${sessionId}`, sql`s.user_id=${userId}`, sql`s.qualification_path_id=${pathId}`, ...conditions])}
 ORDER BY ${ordering} LIMIT ${limit}`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(CheckRow))),
      )

    const withOptions = Effect.fn('OralSessionQuizReader.withOptions')(function* (
      rows: ReadonlyArray<typeof CheckRow.Type>,
    ) {
      const quizId = Arr.head(rows).pipe(Option.map(row => row.quizId))

      if (Option.isNone(quizId)) {
        return []
      }

      const positions = rows.map(row => row.position)

      const optionRows = yield* Schema.decodeUnknownEffect(Schema.Array(OptionRow))(
        yield* sql`SELECT qo.position,qo.option_id AS id,o.text,o.is_correct,(ao.option_id IS NOT NULL) AS is_selected
 FROM oral_session_quiz_options qo
 JOIN oral_knowledge_check_options o ON o.id=qo.option_id
 LEFT JOIN oral_session_quiz_answer_options ao ON ao.quiz_id=qo.quiz_id AND ao.position=qo.position AND ao.option_id=qo.option_id
 WHERE qo.quiz_id=${quizId.value} AND qo.position IN ${sql.in(positions)}
 ORDER BY qo.position,qo.option_position`,
      )

      return rows.map(row => toCheck(row, optionRows))
    })

    return OralSessionQuizReader.of({
      availableFormats: Effect.fn('OralSessionQuizReader.availableFormats')(sessionId =>
        sql`SELECT DISTINCT kr.format ${compatibleChecks} WHERE sq.study_session_id=${sessionId} ORDER BY kr.format`.pipe(
          Effect.flatMap(
            Schema.decodeUnknownEffect(
              Schema.Array(Schema.Struct({ format: KnowledgeCheckFormat })),
            ),
          ),
          Effect.map(rows => rows.map(row => row.format)),
          Effect.mapError(cause => new StudyReadError({ cause })),
        ),
      ),
      candidates: Effect.fn('OralSessionQuizReader.candidates')(
        function* (sessionId, formats) {
          if (!Arr.isReadonlyArrayNonEmpty(formats)) {
            return []
          }

          const rows =
            yield* sql`SELECT sq.question_id,sq.position AS session_position,sq.oral_revision_id,kr.id AS knowledge_check_revision_id,kr.format,kr.prompt,o.id AS option_id
 ${compatibleChecks}
 JOIN oral_knowledge_check_options o ON o.knowledge_check_revision_id=kr.id
 WHERE sq.study_session_id=${sessionId} AND kr.format IN ${sql.in(formats)}
 ORDER BY kr.id,o.option_position`

          return toCandidates(yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      quiz: Effect.fn('OralSessionQuizReader.quiz')(
        function* (userId, pathId, sessionId) {
          const quizRows = yield* Schema.decodeUnknownEffect(Schema.Array(QuizRow))(
            yield* sql`SELECT z.id,z.study_session_id AS session_id,count(c.position)::integer AS check_count,count(a.position)::integer AS answered_count,coalesce(sum(a.earned_xp),0)::integer AS earned_xp
 FROM oral_session_quizzes z
 JOIN oral_study_sessions s ON s.id=z.study_session_id
 JOIN oral_session_quiz_checks c ON c.quiz_id=z.id
 LEFT JOIN oral_session_quiz_answers a ON a.quiz_id=c.quiz_id AND a.position=c.position
 WHERE z.study_session_id=${sessionId} AND s.user_id=${userId} AND s.qualification_path_id=${pathId}
 GROUP BY z.id
 LIMIT 1`,
          )

          const found = Arr.head(quizRows)

          if (Option.isNone(found)) {
            return Option.none()
          }

          const formatRows = yield* Schema.decodeUnknownEffect(
            Schema.Array(Schema.Struct({ format: KnowledgeCheckFormat })),
          )(
            yield* sql`SELECT DISTINCT kr.format FROM oral_session_quiz_checks c
 JOIN oral_knowledge_check_revisions kr ON kr.id=c.knowledge_check_revision_id
 WHERE c.quiz_id=${found.value.id} ORDER BY kr.format`,
          )

          return Option.some({ ...found.value, formats: formatRows.map(row => row.format) })
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
      checks: Effect.fn('OralSessionQuizReader.checks')(
        function* (userId, pathId, sessionId, req) {
          const page = yield* checksPage(
            req,
            window =>
              learnerChecks(
                userId,
                pathId,
                sessionId,
                [window.after],
                window.orderBy,
                window.limit,
              ),
            row => ({ position: row.position }),
          )

          return { ...page, data: yield* withOptions(page.data) }
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new StudyReadError({ cause })),
          SchemaError: cause => Effect.fail(new StudyReadError({ cause })),
        }),
      ),
      check: Effect.fn('OralSessionQuizReader.check')(
        function* (userId, pathId, sessionId, position) {
          const rows = yield* learnerChecks(
            userId,
            pathId,
            sessionId,
            [sql`c.position=${position}`],
            sql`c.position`,
            1,
          )

          return Arr.head(yield* withOptions(rows))
        },
        Effect.mapError(cause => new StudyReadError({ cause })),
      ),
    })
  }),
)
