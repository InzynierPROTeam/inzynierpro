import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import {
  dailyCountPlanPreference,
  targetDatePlanPreference,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import {
  OralSelfAssessment,
  type OralStudySessionId,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Array as Arr, DateTime, Effect, Layer, Option, Predicate, Schema } from 'effect'
import { SqlClient, type Statement } from 'effect/sql'
import { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'
import { LearningEventId } from '~api/modules/learning/domain/review-state.model.js'
import {
  QuestionNoteWriteError,
  StudyWriteError,
} from '~api/modules/oral-study/application/errors.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import { OralReviewEvidence } from '~api/modules/oral-study/domain/oral-review-state.model.js'
import { OralStudySession } from '~api/modules/oral-study/domain/oral-study-session.model.js'

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
      sql`WITH s AS (${statement} RETURNING id,kind,category_id,user_exam_goal_version AS goal_version,question_count,current_position,created_at,ended_at)
 SELECT s.*,c.name AS category_name,(SELECT count(*)::integer FROM oral_study_self_assessments a WHERE a.study_session_id=s.id) AS answered_count,
 (SELECT count(*)::integer FROM oral_study_session_questions sq JOIN oral_revisions r ON r.id=sq.oral_revision_id WHERE sq.study_session_id=s.id AND r.withdrawn_at<coalesce(s.ended_at,'infinity') AND NOT EXISTS (SELECT 1 FROM oral_study_self_assessments a WHERE a.study_session_id=sq.study_session_id AND a.position=sq.position)) AS skipped_count
 FROM s LEFT JOIN oral_question_categories c ON c.id=s.category_id`.pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(Schema.Tuple([OralStudySession]))),
        Effect.map(([session]) => session),
      )

    return OralStudyRepository.of({
      saveNote: Effect.fn('OralStudyRepository.saveNote')(
        function* (userId, questionId, text) {
          const rows =
            yield* sql`INSERT INTO oral_question_notes (user_id,question_id,oral_revision_id,body)
 SELECT ${userId},q.id,q.current_revision_id,${text} FROM oral_questions q WHERE q.id=${questionId}
 ON CONFLICT (user_id,question_id) DO UPDATE SET body=EXCLUDED.body,oral_revision_id=EXCLUDED.oral_revision_id
 RETURNING body AS text,updated_at,false AS refers_to_earlier_wording`

          const [stored] = yield* Schema.decodeUnknownEffect(Schema.Tuple([QuestionNote]))(rows)

          return stored
        },
        Effect.mapError(
          error =>
            new QuestionNoteWriteError({
              reason: Predicate.isTagged(error, 'SqlError') ? error.reason._tag : error._tag,
            }),
        ),
      ),
      clearNote: Effect.fn('OralStudyRepository.clearNote')((userId, questionId) =>
        sql`DELETE FROM oral_question_notes WHERE user_id=${userId} AND question_id=${questionId}`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        ),
      ),

      markFavorite: Effect.fn('OralStudyRepository.markFavorite')((userId, questionId) =>
        sql`INSERT INTO oral_favorite_questions (user_id,question_id) VALUES (${userId},${questionId}) ON CONFLICT DO NOTHING`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        ),
      ),
      unmarkFavorite: Effect.fn('OralStudyRepository.unmarkFavorite')((userId, questionId) =>
        sql`DELETE FROM oral_favorite_questions WHERE user_id=${userId} AND question_id=${questionId}`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        ),
      ),
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
        const { card, evidence } = state

        const { learningEventId, quizId, quizPosition } = OralReviewEvidence.$match(evidence, {
          SelfAssessment: ({ learningEventId }) => ({
            learningEventId,
            quizId: null,
            quizPosition: null,
          }),
          QuizAnswer: ({ quizId, position }) => ({
            learningEventId: null,
            quizId,
            quizPosition: position,
          }),
        })

        const dueAt = DateTime.formatIso(card.dueAt)

        const lastReviewAt = Option.map(card.lastReviewAt, DateTime.formatIso).pipe(
          Option.getOrNull,
        )

        return yield* sql`INSERT INTO oral_review_states (user_id,qualification_path_id,question_id,substantive_revision_id,learning_event_id,quiz_id,quiz_position,rules_version,due_at,last_review_at,stability,stability_fast,difficulty,state,schedule_status,reps,lapses,scheduled_days,learning_step)
 SELECT ${state.userId},${state.qualificationPathId},${state.questionId},r.substantive_revision_id,${learningEventId},${quizId},${quizPosition},${state.rulesVersion},${dueAt},${lastReviewAt},${card.stability},${card.stabilityFast},${card.difficulty},${card.state},${card.scheduleStatus},${card.reps},${card.lapses},${card.scheduledDays},${card.learningStep}
 FROM oral_revisions r WHERE r.id=${state.oralRevisionId} AND r.question_id=${state.questionId}
 ON CONFLICT (user_id,qualification_path_id,question_id) DO UPDATE SET substantive_revision_id=EXCLUDED.substantive_revision_id,learning_event_id=EXCLUDED.learning_event_id,quiz_id=EXCLUDED.quiz_id,quiz_position=EXCLUDED.quiz_position,rules_version=EXCLUDED.rules_version,due_at=EXCLUDED.due_at,last_review_at=EXCLUDED.last_review_at,stability=EXCLUDED.stability,stability_fast=EXCLUDED.stability_fast,difficulty=EXCLUDED.difficulty,state=EXCLUDED.state,schedule_status=EXCLUDED.schedule_status,reps=EXCLUDED.reps,lapses=EXCLUDED.lapses,scheduled_days=EXCLUDED.scheduled_days,learning_step=EXCLUDED.learning_step
 RETURNING 1`.pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Tuple([Schema.Unknown]))),
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        )
      }),

      createSession: Effect.fn('OralStudyRepository.createSession')(
        function* (session) {
          const created = yield* returningSession(
            sql`INSERT INTO oral_study_sessions (user_id,qualification_path_id,kind,category_id,user_exam_goal_version,question_count)
 VALUES (${session.userId},${session.qualificationPathId},${session.kind},${Option.getOrNull(session.categoryId)},${session.goalVersion},${session.questions.length})`,
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
        function* (sessionId, position, oralRevisionId, selfAssessment, earnedXp) {
          const rows =
            yield* sql`INSERT INTO oral_study_self_assessments (study_session_id,position,oral_revision_id,self_assessment,earned_xp)
 VALUES (${sessionId},${position},${oralRevisionId},${selfAssessment},${earnedXp})
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
      createDailyPlan: Effect.fn('OralStudyRepository.createDailyPlan')(
        function* (userId, pathId, plan) {
          return yield* sql`INSERT INTO oral_daily_plans (user_id,qualification_path_id,study_day,round_number,target_date,remaining_question_count,target_question_count,plan_settings_version)
 VALUES (${userId},${pathId},${DateTime.formatIso(plan.studyDay)},${plan.round},${DateTime.formatIso(plan.targetDate)},${plan.remainingQuestionCount},${plan.targetQuestionCount},${plan.settingsVersion})
 ON CONFLICT (user_id,qualification_path_id,study_day) DO NOTHING`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          )
        },
      ),
      replanDailyPlan: Effect.fn('OralStudyRepository.replanDailyPlan')(
        function* (userId, pathId, plan) {
          return yield* sql`UPDATE oral_daily_plans SET target_date=${DateTime.formatIso(plan.targetDate)},target_question_count=${plan.targetQuestionCount},plan_settings_version=${plan.settingsVersion}
 WHERE user_id=${userId} AND qualification_path_id=${pathId} AND study_day=${DateTime.formatIso(plan.studyDay)}`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          )
        },
      ),
      appendDailyPlanSettings: Effect.fn('OralStudyRepository.appendDailyPlanSettings')(function* (
        userId,
        pathId,
        { version, preference },
      ) {
        const targetDate =
          preference.mode === targetDatePlanPreference
            ? DateTime.formatIso(preference.targetDate)
            : null

        const dailyQuestionCount =
          preference.mode === dailyCountPlanPreference ? preference.dailyQuestionCount : null

        return yield* sql`INSERT INTO oral_daily_plan_settings (user_id,qualification_path_id,version,mode,target_date,daily_question_count)
 VALUES (${userId},${pathId},${version},${preference.mode},${targetDate},${dailyQuestionCount})`.pipe(
          Effect.asVoid,
          Effect.mapError(cause => new StudyWriteError({ cause })),
        )
      }),
      countDailyPlanAnswer: Effect.fn('OralStudyRepository.countDailyPlanAnswer')(
        function* (userId, pathId, studyDay) {
          return yield* sql`UPDATE oral_daily_plans SET completed_question_count=completed_question_count+1
 WHERE user_id=${userId} AND qualification_path_id=${pathId} AND study_day=${DateTime.formatIso(studyDay)}`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          )
        },
      ),
      completeDailyPlanRound: Effect.fn('OralStudyRepository.completeDailyPlanRound')(
        function* (userId, pathId, studyDay) {
          return yield* sql`UPDATE oral_daily_plans SET round_completed_at=coalesce(round_completed_at,clock_timestamp())
 WHERE user_id=${userId} AND qualification_path_id=${pathId} AND study_day=${DateTime.formatIso(studyDay)}`.pipe(
            Effect.asVoid,
            Effect.mapError(cause => new StudyWriteError({ cause })),
          )
        },
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
