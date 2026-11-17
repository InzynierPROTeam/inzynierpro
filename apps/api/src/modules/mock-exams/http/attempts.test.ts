import { MockExamUnavailable } from '@inzpro/api-contracts/modules/mock-exams/errors'
import { MockExamAttempt } from '@inzpro/api-contracts/modules/mock-exams/responses'
import type { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { ExamBlueprintId } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Schema } from 'effect'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { publishBlueprintVersion } from '~api/modules/mock-exams/application/publish-blueprint-version.command.js'
import { InvalidExamBlueprint } from '~api/modules/mock-exams/domain/errors.js'
import { startTestApi, type TestApi } from '~api/test/api-server.js'
import {
  addFixtureDocument,
  assignFixtureBlueprint,
  createMockExamFixture,
  fixtureBlueprintDraft,
  mockExamPathConfiguration,
  publishFixtureBlueprint,
  resolveFixturePath,
} from '~api/test/mock-exam-fixtures.js'
import { mockExamLearner } from '~api/test/mock-exam-learner.js'
import { smallPathConfiguration } from '~api/test/preparation.js'
import { runFixture } from '~api/test/run-fixture.js'
import { addFixtureQuestion, withdrawFixtureRevision } from '~api/test/written-learning-fixtures.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const examPath = mockExamPathConfiguration('60000000-0000-4000-8000-000000000004')

const learnerOn = (
  configuration: typeof CompleteOnboardingPayload.Encoded,
  accessScope: typeof CompleteOnboardingPayload.Encoded.accessScope = 'written',
) => mockExamLearner(api, configuration, accessScope)

const first = <T>(items: ReadonlyArray<T>) => {
  const [item] = items

  if (item === undefined) {
    throw new Error('Expected at least one fixture item')
  }

  return item
}

const sectionQuestionIds = (
  documents: ReadonlyArray<{ readonly questions: ReadonlyArray<{ readonly id: string }> }>,
  index: number,
) => documents[index]?.questions.map(question => question.id) ?? []

describe('mock exam preview', () => {
  it('shows the duration, sections, question count and threshold of the path blueprint', async () => {
    const pathId = await resolveFixturePath(examPath)

    await createMockExamFixture(
      pathId,
      [
        { questionCount: 3, eligibleQuestions: 4 },
        { questionCount: 2, eligibleQuestions: 3 },
      ],
      3,
    )

    const learner = await learnerOn(examPath)

    expect(await learner.preview()).toMatchObject({
      qualificationPathId: pathId,
      blueprint: {
        durationMinutes: 10,
        questionCount: 5,
        passThreshold: 3,
        sections: [
          { position: 1, name: 'Test-only section 1', questionCount: 3, availableQuestionCount: 4 },
          { position: 2, name: 'Test-only section 2', questionCount: 2, availableQuestionCount: 3 },
        ],
      },
      unavailableReason: null,
      unfinishedAttempt: null,
    })
  })

  it('shows the exam as unavailable on a path without a blueprint', async () => {
    const learner = await learnerOn(smallPathConfiguration)

    expect(await learner.preview()).toMatchObject({
      blueprint: null,
      unavailableReason: 'no-blueprint',
      unfinishedAttempt: null,
    })
  })

  it('counts only published, non-withdrawn questions and shows too few as unavailable', async () => {
    const pathId = await resolveFixturePath(examPath)

    const { documents } = await createMockExamFixture(
      pathId,
      [{ questionCount: 3, eligibleQuestions: 3 }],
      2,
    )

    const { documentId, questions } = first(documents)
    await addFixtureQuestion(pathId, documentId, false)
    await withdrawFixtureRevision(first(questions).revisionId)

    const learner = await learnerOn(examPath)

    expect(await learner.preview()).toMatchObject({
      blueprint: { sections: [{ questionCount: 3, availableQuestionCount: 2 }] },
      unavailableReason: 'too-few-questions',
    })
    const refused = await learner.start()

    expect(refused.status).toBe(409)
    expect(Schema.decodeUnknownSync(MockExamUnavailable)(await refused.json()).reason).toBe(
      'too-few-questions',
    )
  })

  it('requires written access on the assignment', async () => {
    const learner = await learnerOn(examPath, 'oral')

    expect((await learner.request('/preview')).status).toBe(403)
    expect((await learner.start()).status).toBe(403)
  })
})

describe('starting a mock exam attempt', () => {
  it('draws each section count from its documents without repeating a question', async () => {
    const pathId = await resolveFixturePath(examPath)

    const { documents } = await createMockExamFixture(
      pathId,
      [
        { questionCount: 3, eligibleQuestions: 5 },
        { questionCount: 2, eligibleQuestions: 4 },
      ],
      3,
    )

    const learner = await learnerOn(examPath)
    const attempt = await learner.started()

    expect(attempt).toMatchObject({
      status: 'in-progress',
      durationMinutes: 10,
      passThreshold: 3,
      questionCount: 5,
      sections: [
        { position: 1, name: 'Test-only section 1', questionCount: 3 },
        { position: 2, name: 'Test-only section 2', questionCount: 2 },
      ],
    })

    const questions = await learner.questions(attempt)

    expect(questions.map(question => question.position)).toStrictEqual([1, 2, 3, 4, 5])
    expect(questions.filter(question => question.section === 1)).toHaveLength(3)
    expect(questions.filter(question => question.section === 2)).toHaveLength(2)
    expect(await learner.questions(attempt)).toStrictEqual(questions)
    expect(new Set(questions.map(question => question.questionId)).size).toBe(5)
    expect(await learner.question(attempt.id, 6)).toBeNull()

    for (const question of questions) {
      expect(sectionQuestionIds(documents, question.section - 1)).toContain(question.questionId)
      expect(question.answers).toHaveLength(3)
    }
  })

  it('reads one question at a time without correctness, explanations or notes, in a stable option order', async () => {
    const pathId = await resolveFixturePath(examPath)
    await createMockExamFixture(pathId, [{ questionCount: 3, eligibleQuestions: 3 }], 2)

    const learner = await learnerOn(examPath)
    const started: unknown = await (await learner.start()).json()
    const { id } = Schema.decodeUnknownSync(MockExamAttempt)(started)
    const read: unknown = await (await learner.request(`/attempts/${id}`)).json()

    expect(read).toStrictEqual(started)

    for (const position of [1, 2, 3]) {
      const path = `/attempts/${id}/questions/${position}`
      const shown: unknown = await (await learner.request(path)).json()

      expect(await (await learner.request(path)).json()).toStrictEqual(shown)
      expect(JSON.stringify(shown)).not.toMatch(/isCorrect|explanation|note/)
    }
  })

  it('returns the same unfinished attempt on a second start', async () => {
    const pathId = await resolveFixturePath(examPath)
    await createMockExamFixture(pathId, [{ questionCount: 2, eligibleQuestions: 4 }], 1)

    const learner = await learnerOn(examPath)
    const first = await learner.started()
    const second = await learner.started()

    expect(second).toStrictEqual(first)
    expect((await learner.preview()).unfinishedAttempt).toStrictEqual({
      id: first.id,
      status: 'in-progress',
      startedAt: first.startedAt,
      finishedAt: null,
      result: null,
    })
  })

  it('draws only published, non-withdrawn questions of the path', async () => {
    const pathId = await resolveFixturePath(examPath)

    const { documents } = await createMockExamFixture(
      pathId,
      [{ questionCount: 3, eligibleQuestions: 4 }],
      2,
    )

    const { documentId, questions } = first(documents)
    const unpublished = await addFixtureQuestion(pathId, documentId, false)
    const withdrawn = first(questions)
    await withdrawFixtureRevision(withdrawn.revisionId)

    const learner = await learnerOn(examPath)

    const drawn = (await learner.questions(await learner.started())).map(
      question => question.questionId,
    )

    expect(drawn).toHaveLength(3)
    expect(drawn).not.toContain(unpublished.id)
    expect(drawn).not.toContain(withdrawn.id)
  })

  it('starts new attempts on the latest blueprint version while a started one keeps its version', async () => {
    const pathId = await resolveFixturePath(examPath)

    const { blueprintId, documents } = await createMockExamFixture(
      pathId,
      [{ questionCount: 2, eligibleQuestions: 4 }],
      1,
    )

    const early = await learnerOn(examPath)
    const earlyAttempt = await early.started()

    await publishFixtureBlueprint(
      blueprintId,
      fixtureBlueprintDraft(
        [{ documentIds: documents.map(({ documentId }) => documentId), questionCount: 3 }],
        2,
        20,
      ),
    )

    const late = await learnerOn(examPath)

    expect(await late.started()).toMatchObject({
      durationMinutes: 20,
      passThreshold: 2,
      sections: [{ questionCount: 3 }],
    })
    expect(await early.attempt(earlyAttempt.id)).toMatchObject({
      durationMinutes: 10,
      passThreshold: 1,
      sections: [{ questionCount: 2 }],
    })
  })

  it('refuses to start on a path without a blueprint', async () => {
    const learner = await learnerOn(smallPathConfiguration)
    const response = await learner.start()

    expect(response.status).toBe(409)
    expect(Schema.decodeUnknownSync(MockExamUnavailable)(await response.json()).reason).toBe(
      'no-blueprint',
    )
  })

  it('shows an attempt only to its owner', async () => {
    const pathId = await resolveFixturePath(examPath)
    await createMockExamFixture(pathId, [{ questionCount: 1, eligibleQuestions: 1 }], 1)

    const owner = await learnerOn(examPath)
    const attempt = await owner.started()
    const other = await learnerOn(examPath)

    expect(await other.attempt(attempt.id)).toBeNull()
    expect(await other.question(attempt.id, 1)).toBeNull()
  })
})

describe('publishing an exam blueprint', () => {
  it('refuses a version whose documents are missing from an assigned path', async () => {
    const pathId = await resolveFixturePath(examPath)

    const { blueprintId } = await createMockExamFixture(
      pathId,
      [{ questionCount: 1, eligibleQuestions: 1 }],
      1,
    )

    const elsewhere = await resolveFixturePath(
      mockExamPathConfiguration('60000000-0000-4000-8000-000000000005'),
    )

    const outside = await addFixtureDocument(elsewhere)

    const refused = await runFixture(
      Effect.flip(
        publishBlueprintVersion(
          blueprintId,
          fixtureBlueprintDraft([{ documentIds: [outside], questionCount: 1 }], 1),
        ),
      ),
    )

    expect(refused).toStrictEqual(new InvalidExamBlueprint({ reason: 'document-outside-path' }))
  })

  it('refuses to assign a path that lacks the documents of the latest version', async () => {
    const pathId = await resolveFixturePath(examPath)
    const documentId = await addFixtureDocument(pathId)
    const blueprintId = ExamBlueprintId.make(crypto.randomUUID())

    await publishFixtureBlueprint(
      blueprintId,
      fixtureBlueprintDraft([{ documentIds: [documentId], questionCount: 1 }], 1),
    )

    const elsewhere: QualificationPathId = await resolveFixturePath(
      mockExamPathConfiguration('60000000-0000-4000-8000-000000000006'),
    )

    await expect(assignFixtureBlueprint(blueprintId, elsewhere)).rejects.toThrow()
  })
})
