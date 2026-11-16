import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import {
  OralSelfAssessment,
  type OralStudySessionId,
} from '@inzpro/domain/modules/study/oral-study-session'
import { Array as Arr, DateTime, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { StudyWriteError } from '~api/modules/study/application/errors.js'
import { OralStudyRepository } from '~api/modules/study/application/oral-study.repository.js'
import { OralStudySession } from '~api/modules/study/domain/oral-study-session.model.js'
import { LearningEventId } from '~api/modules/study/domain/review-state.model.js'

const SelfAssessmentRow = Schema.Struct({ value: OralSelfAssessment, assessedAt: DateTimeUtc })

type SessionQuestionInsert = {
  readonly studySessionId: OralStudySessionId
  readonly position: number
  readonly questionId: OralQuestionId
  readonly oralRevisionId: OralRevisionId
}

export const OralStudyRepositoryLive = Layer.effect(
  OralStudyRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const returningSession = (statement: Statement.Fragment) =>
      sql`WITH s AS (${statement} RETURNING id,category_id,user_exam_goal_version AS goal_version,question_count,current_position,created_at,ended_at)
 SELECT s.*,c.name AS category_name,(SELECT count(*)::integer FROM oral_study_self_assessments a WHERE a.study_session_id=s.id) AS answered_count,
 (SELECT count(*)::integer FROM oral_study_session_questions sq JOIN oral_revisions r ON r.id=sq.oral_revision_id WHERE sq.study_session_id=s.id AND r.withdrawn_at<coalesce(s.ended_at,'infinity') AND NOT EXISTS (SELECT 1 FROM oral_study_self_assessments a WHERE a.study_session_id=sq.study_session_id AND a.position=sq.position)) AS skipped_count
 FROM s JOIN oral_question_categories c ON c.id=s.category_id`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Tuple([OralStudySession]))),
        Effect.map(([session]) => session),
      )

    return OralStudyRepository.of({
      recordLearningEvent: Effect.fn('OralStudyRepository.recordLearningEvent')(
        function* (evidence) {
          const answeredAt = DateTime.formatIso(evidence.answeredAt)

          const rows =
            yield* sql`INSERT INTO oral_learning_events (user_id,qualification_path_id,user_exam_goal_version,question_id,oral_revision_id,mode,self_assessment,answered_at,study_session_id,position)
 VALUES (${evidence.userId},${evidence.qualificationPathId},${evidence.goalVersion},${evidence.questionId},${evidence.oralRevisionId},${evidence.mode},${evidence.selfAssessment},${answeredAt},${evidence.sessionId},${evidence.position}) RETURNING id`

          const [event] = yield* Schema.decodeUnknownEffect(
            Schema.Tuple([Schema.Struct({ id: LearningEventId })]),
          )(rows)

          return event.id
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      storeReviewState: Effect.fn('OralStudyRepository.storeReviewState')(function* (state) {
        const { card } = state
        const dueAt = DateTime.formatIso(card.dueAt)

        const lastReviewAt = Option.map(card.lastReviewAt, DateTime.formatIso).pipe(
          Option.getOrNull,
        )

        return yield* sql`INSERT INTO oral_review_states (user_id,qualification_path_id,question_id,substantive_revision_id,learning_event_id,rules_version,due_at,last_review_at,stability,stability_fast,difficulty,state,schedule_status,reps,lapses,scheduled_days,learning_step)
 SELECT ${state.userId},${state.qualificationPathId},${state.questionId},r.substantive_revision_id,${state.learningEventId},${state.rulesVersion},${dueAt},${lastReviewAt},${card.stability},${card.stabilityFast},${card.difficulty},${card.state},${card.scheduleStatus},${card.reps},${card.lapses},${card.scheduledDays},${card.learningStep}
 FROM oral_revisions r WHERE r.id=${state.oralRevisionId} AND r.question_id=${state.questionId}
 ON CONFLICT (user_id,qualification_path_id,question_id) DO UPDATE SET substantive_revision_id=EXCLUDED.substantive_revision_id,learning_event_id=EXCLUDED.learning_event_id,rules_version=EXCLUDED.rules_version,due_at=EXCLUDED.due_at,last_review_at=EXCLUDED.last_review_at,stability=EXCLUDED.stability,stability_fast=EXCLUDED.stability_fast,difficulty=EXCLUDED.difficulty,state=EXCLUDED.state,schedule_status=EXCLUDED.schedule_status,reps=EXCLUDED.reps,lapses=EXCLUDED.lapses,scheduled_days=EXCLUDED.scheduled_days,learning_step=EXCLUDED.learning_step
 RETURNING 1`.pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Tuple([Schema.Unknown]))),
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        )
      }),

      createSession: Effect.fn('OralStudyRepository.createSession')(
        function* (session) {
          const created = yield* returningSession(
            sql`INSERT INTO oral_study_sessions (user_id,qualification_path_id,category_id,user_exam_goal_version,question_count)
 VALUES (${session.userId},${session.qualificationPathId},${session.categoryId},${session.goalVersion},${session.questions.length})`,
          )

          const questions: ReadonlyArray<SessionQuestionInsert> = session.questions.map(
            (question, index) => ({
              studySessionId: created.id,
              position: index + 1,
              questionId: question.questionId,
              oralRevisionId: question.oralRevisionId,
            }),
          )

          if (Arr.isReadonlyArrayNonEmpty(questions)) {
            yield* sql`INSERT INTO oral_study_session_questions ${sql.insert(questions)}`
          }

          return created
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      recordSelfAssessment: Effect.fn('OralStudyRepository.recordSelfAssessment')(
        function* (sessionId, position, oralRevisionId, selfAssessment) {
          const rows =
            yield* sql`INSERT INTO oral_study_self_assessments (study_session_id,position,oral_revision_id,self_assessment)
 VALUES (${sessionId},${position},${oralRevisionId},${selfAssessment})
 RETURNING self_assessment AS value,created_at AS assessed_at`

          const [stored] = yield* Schema.decodeUnknownEffect(Schema.Tuple([SelfAssessmentRow]))(
            rows,
          )

          return stored
        },
        Effect.mapError(cause => new StudyWriteError({ cause })),
      ),
      moveSession: Effect.fn('OralStudyRepository.moveSession')((sessionId, currentPosition) =>
        returningSession(
          sql`UPDATE oral_study_sessions SET current_position=${currentPosition},last_activity_at=now() WHERE id=${sessionId}`,
        ).pipe(Effect.mapError(cause => new StudyWriteError({ cause }))),
      ),
      endSession: Effect.fn('OralStudyRepository.endSession')(sessionId =>
        returningSession(
          sql`UPDATE oral_study_sessions SET ended_at=now() WHERE id=${sessionId} AND ended_at IS NULL`,
        ).pipe(Effect.mapError(cause => new StudyWriteError({ cause }))),
      ),
      recordCoverage: Effect.fn('OralStudyRepository.recordCoverage')(
        (userId, pathId, questionId, revisionId, round) =>
          sql`INSERT INTO oral_question_coverage (user_id,qualification_path_id,question_id,oral_revision_id,round_number) VALUES (${userId},${pathId},${questionId},${revisionId},${round})
 ON CONFLICT (user_id,qualification_path_id,question_id) DO UPDATE SET oral_revision_id=EXCLUDED.oral_revision_id,round_number=EXCLUDED.round_number,covered_at=clock_timestamp()`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          ),
      ),
      storeLearningRound: Effect.fn('OralStudyRepository.storeLearningRound')(
        (userId, pathId, round) =>
          sql`INSERT INTO oral_learning_rounds (user_id,qualification_path_id,round_number) VALUES (${userId},${pathId},${round})
 ON CONFLICT (user_id,qualification_path_id) DO UPDATE SET round_number=EXCLUDED.round_number`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          ),
      ),
    })
  }),
)
