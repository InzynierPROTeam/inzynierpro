import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

// Synthetic technical content only. Publication is not subject-matter verification.
// Stable IDs make repeated explicit seeding safe; existing revisions are never rewritten.
export const seedTechnicalCatalogue = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql.withTransaction(
    Effect.gen(function* () {
      yield* sql`INSERT INTO general_chambers (id, name) VALUES
        ('50000000-0000-4000-8000-000000000001','Technical chamber A'),
        ('50000000-0000-4000-8000-000000000002','Technical chamber B') ON CONFLICT DO NOTHING`
      yield* sql`INSERT INTO specializations (id, name, general_chamber_id) VALUES
        ('60000000-0000-4000-8000-000000000001','Technical specialization A','50000000-0000-4000-8000-000000000001'),
        ('60000000-0000-4000-8000-000000000002','Technical specialization B','50000000-0000-4000-8000-000000000002') ON CONFLICT DO NOTHING`
      yield* sql`INSERT INTO qualification_kinds (id, name) VALUES
        ('70000000-0000-4000-8000-000000000001','Technical kind A'),('70000000-0000-4000-8000-000000000002','Technical kind B') ON CONFLICT DO NOTHING`
      yield* sql`INSERT INTO qualification_scopes (id, name) VALUES
        ('80000000-0000-4000-8000-000000000001','Technical scope A'),('80000000-0000-4000-8000-000000000002','Technical scope B') ON CONFLICT DO NOTHING`
      yield* sql`INSERT INTO exam_sessions (id, general_chamber_id, name, written_at, oral_planning_at, selection_closes_at, published) VALUES
        ('90000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Technical future session A', now()+interval '365 days', now()+interval '380 days', now()+interval '400 days',true),
        ('90000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','Technical future session B', now()+interval '365 days', now()+interval '380 days', now()+interval '400 days',true),
        ('90000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','Technical ongoing oral session', now()-interval '1 day', now()+interval '20 days', now()+interval '60 days',true),
        ('90000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000001','Technical closed session', now()-interval '90 days', now()-interval '80 days', now()-interval '60 days',true) ON CONFLICT DO NOTHING`
      yield* sql`INSERT INTO qualification_paths (id,name,specialization_id,qualification_kind_id,qualification_scope_id,published) VALUES
      ('10000000-0000-4000-8000-000000000001','Technical path A — not for study','60000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001',true),
      ('10000000-0000-4000-8000-000000000002','Technical path B — not for study','60000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000002',true)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, specialization_id=EXCLUDED.specialization_id,qualification_kind_id=EXCLUDED.qualification_kind_id,qualification_scope_id=EXCLUDED.qualification_scope_id,published=EXCLUDED.published`
      yield* sql`INSERT INTO reference_documents (id, title) VALUES
      ('20000000-0000-4000-8000-000000000001', 'Technical document A — not an exam reference'),
      ('20000000-0000-4000-8000-000000000002', 'Technical document B — not an exam reference') ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`
      yield* sql`INSERT INTO path_documents (qualification_path_id, document_id) VALUES
      ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
      ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002'),
      ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING`

      for (const n of [1, 2, 3]) {
        const questionId = `30000000-0000-4000-8000-00000000000${n}`
        const revisionId = `41000000-0000-4000-8000-00000000000${n}`
        const documentId = `20000000-0000-4000-8000-00000000000${n === 3 ? 2 : 1}`
        yield* sql`INSERT INTO written_questions (id, document_id) VALUES (${questionId}, ${documentId}) ON CONFLICT DO NOTHING`
        yield* sql`INSERT INTO question_revisions (id,question_id,body,explanation)
        VALUES (${revisionId},${questionId},${`Technical sample ${n}: choose option A. This is not an exam question.`},'Technical explanation: the instruction asks for A. No subject-matter verification.') ON CONFLICT DO NOTHING`

        const revisions =
          yield* sql`SELECT published_at FROM question_revisions WHERE id=${revisionId} LIMIT 1`

        if (revisions[0]?.publishedAt === null) {
          for (const [index, label] of ['A', 'B', 'C'].entries()) {
            const answerNumber = index + 1
            const answerId = `42000000-0000-4000-8000-0000000000${n}${answerNumber}`
            const text = `Technical option ${label}`
            const isCorrect = index === 0
            yield* sql`INSERT INTO question_answers (id,question_revision_id,text,is_correct) VALUES (${answerId},${revisionId},${text},${isCorrect}) ON CONFLICT DO NOTHING`
          }

          yield* sql`UPDATE question_revisions SET published_at=clock_timestamp() WHERE id=${revisionId}`
        }

        yield* sql`UPDATE written_questions SET current_revision_id = ${revisionId} WHERE id = ${questionId} AND current_revision_id IS NULL`
        yield* sql`INSERT INTO path_questions (qualification_path_id, document_id, question_id)
        VALUES ('10000000-0000-4000-8000-000000000001', ${documentId}, ${questionId}) ON CONFLICT DO NOTHING`
      }

      // One question identity and its published revision are shared, with a narrower scope in B.
      yield* sql`INSERT INTO path_questions (qualification_path_id, document_id, question_id)
      VALUES ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING`
    }),
  )
})
