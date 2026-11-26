import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  ExamBlueprintId,
  ExamDurationMinutes,
  ExamSectionName,
  type ExamBlueprintVersion,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { RichContent } from '@inzpro/rich-content/rich-content'
import { Effect, Option, Schema } from 'effect'
import { attachPathDocument } from '~api/modules/learning-content/application/attach-path-document.command.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import type { NewQuestionReference } from '~api/modules/learning-content/domain/learning-content.model.js'
import { assignBlueprint } from '~api/modules/mock-exams/application/assign-blueprint.command.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { publishBlueprintVersion } from '~api/modules/mock-exams/application/publish-blueprint-version.command.js'
import type { ExamBlueprintDraft } from '~api/modules/mock-exams/domain/exam-blueprint.model.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { fixtureReferenceDocument } from '~api/test/content-fixtures.js'
import { technicalConfiguration } from '~api/test/preparation.js'
import { runFixture } from '~api/test/run-fixture.js'
import { addFixtureQuestion } from '~api/test/written-learning-fixtures.js'

const combinedKind = '70000000-0000-4000-8000-000000000003'
const restrictedScope = '80000000-0000-4000-8000-000000000002'

export const mockExamPathConfiguration = (specializationId: string) =>
  ({
    ...technicalConfiguration,
    specializationId,
    qualificationKindId: combinedKind,
    qualificationScopeId: restrictedScope,
  }) satisfies typeof CompleteOnboardingPayload.Encoded

export const resolveFixturePath = (configuration: typeof CompleteOnboardingPayload.Encoded) =>
  runFixture(
    Effect.gen(function* () {
      const qualificationPathsReader = yield* QualificationPathsReader
      const config = yield* Schema.decodeEffect(CompleteOnboardingPayload)(configuration)
      const path = yield* qualificationPathsReader.resolve(config)

      return yield* Option.match(path, {
        onNone: () => Effect.die(new Error('Missing seeded fixture path')),
        onSome: ({ id }) => Effect.succeed(id),
      })
    }),
  )

export const addFixtureDocument = (pathId: QualificationPathId) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const documentId = yield* Schema.decodeEffect(ReferenceDocumentId)(crypto.randomUUID())

      yield* learningContentRepository.createDocument(
        fixtureReferenceDocument(documentId, `Test-only exam document ${documentId}`),
      )
      yield* attachPathDocument(pathId, documentId)

      return documentId
    }),
  )

export const fixtureBlueprintDraft = (
  sections: ReadonlyArray<{
    readonly documentIds: ReadonlyArray<ReferenceDocumentId>
    readonly questionCount: number
  }>,
  passThreshold: number,
  durationMinutes = 10,
): ExamBlueprintDraft => ({
  durationMinutes: ExamDurationMinutes.make(durationMinutes),
  passThreshold: QuestionCount.make(passThreshold),
  sections: sections.map((section, index) => ({
    name: ExamSectionName.make(`Test-only section ${index + 1}`),
    questionCount: QuestionCount.make(section.questionCount),
    documentIds: section.documentIds,
  })),
})

export const publishFixtureBlueprint = (blueprintId: ExamBlueprintId, draft: ExamBlueprintDraft) =>
  runFixture(publishBlueprintVersion(blueprintId, draft))

export const assignFixtureBlueprint = (blueprintId: ExamBlueprintId, pathId: QualificationPathId) =>
  runFixture(assignBlueprint(blueprintId, pathId))

export const createMockExamFixture = async (
  pathId: QualificationPathId,
  sections: ReadonlyArray<{ readonly questionCount: number; readonly eligibleQuestions: number }>,
  passThreshold: number,
  explanation?: typeof RichContent.Encoded,
  references?: ReadonlyArray<typeof NewQuestionReference.Encoded>,
) => {
  const documents = await Promise.all(
    sections.map(async section => {
      const documentId = await addFixtureDocument(pathId)

      const questions = await Promise.all(
        Array.from({ length: section.eligibleQuestions }, () =>
          addFixtureQuestion(pathId, documentId, true, explanation, references),
        ),
      )

      return { documentId, questions }
    }),
  )

  const blueprintId = ExamBlueprintId.make(crypto.randomUUID())

  await publishFixtureBlueprint(
    blueprintId,
    fixtureBlueprintDraft(
      sections.map((section, index) => ({
        documentIds: [documents[index]?.documentId].filter(id => id !== undefined),
        questionCount: section.questionCount,
      })),
      passThreshold,
    ),
  )
  await assignFixtureBlueprint(blueprintId, pathId)

  return { blueprintId, documents }
}

export const mockExamStatistics = (blueprintId: ExamBlueprintId, version: ExamBlueprintVersion) =>
  runFixture(
    MockExamReader.use(mockExamReader => mockExamReader.attemptStatistics(blueprintId, version)),
  )

export const mockExamScoreStatistics = (
  blueprintId: ExamBlueprintId,
  version: ExamBlueprintVersion,
) =>
  runFixture(
    MockExamReader.use(mockExamReader => mockExamReader.scoreStatistics(blueprintId, version)),
  )
