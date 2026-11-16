import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { databaseLayerFromConfig } from '@inzpro/db'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { KnowledgeCheckFormat } from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { paragraphs, type RichContent } from '@inzpro/rich-content/rich-content'
import { Effect, Layer, Schema, Option } from 'effect'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.repository.postgres.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import {
  ContentAsset,
  NewOralKnowledgeCheck,
  NewOralQuestion,
  NewOralRevision,
  NewQuestion,
  NewQuestionRevision,
  OralDraftEdit,
  OralQuestionCategory,
  OralRevisionWithdrawal,
  QuestionRevisionWithdrawal,
  type RevisionChangeKind,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'
import { LearningContentRepositoryLive } from '~api/modules/learning-content/infrastructure/learning-content.repository.postgres.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'
import { OralStudyReader } from '~api/modules/study/application/oral-study.reader.js'
import { StudyReader } from '~api/modules/study/application/study.reader.js'
import { StudyRepository } from '~api/modules/study/application/study.repository.js'
import { OralStudyReaderLive } from '~api/modules/study/infrastructure/oral-study.reader.postgres.js'
import { StudyReaderLive } from '~api/modules/study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/study/infrastructure/study.repository.postgres.js'

import { technicalConfiguration } from './preparation.js'

const fixturesLayer = Layer.mergeAll(
  LearningContentRepositoryLive,
  QualificationPathsReaderLive,
  ExamCalendarRepositoryLive,
  StudyRepositoryLive,
  StudyReaderLive,
  OralStudyReaderLive,
).pipe(Layer.provide(databaseLayerFromConfig))

export const runFixture = <A, E>(
  operation: Effect.Effect<
    A,
    E,
    | LearningContentRepository
    | QualificationPathsReader
    | ExamCalendarRepository
    | StudyRepository
    | StudyReader
    | OralStudyReader
  >,
) => Effect.runPromise(operation.pipe(Effect.provide(fixturesLayer), Effect.scoped))

export const studySessionSpecialization = '60000000-0000-4000-8000-000000000011'

const resolveSeededPath = (configuration: typeof CompleteOnboardingPayload.Encoded) =>
  Effect.gen(function* () {
    const qualificationPathsReader = yield* QualificationPathsReader
    const config = yield* Schema.decodeEffect(CompleteOnboardingPayload)(configuration)
    const path = yield* qualificationPathsReader.resolve(config)

    const { id: pathId } = yield* Option.match(path, {
      onNone: () => Effect.die(new Error('Missing seeded fixture path')),
      onSome: Effect.succeed,
    })

    return { pathId, config }
  })

export const seededFixturePath = (configuration: typeof CompleteOnboardingPayload.Encoded) =>
  runFixture(resolveSeededPath(configuration))

export const createStudyFixture = (specializationId = '60000000-0000-4000-8000-000000000003') =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const documentId = yield* Schema.decodeEffect(ReferenceDocumentId)(crypto.randomUUID())

      const { pathId, config } = yield* resolveSeededPath({
        ...technicalConfiguration,
        specializationId,
      })

      yield* learningContentRepository.createDocument({
        id: documentId,
        title: 'Test-only threshold document',
      })
      yield* learningContentRepository.attachDocument(pathId, documentId)

      return { pathId, documentId, config }
    }),
  )

export const addFixtureAsset = () =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const asset = yield* Schema.decodeEffect(ContentAsset)({
        id: crypto.randomUUID(),
        storageKey: `test/${crypto.randomUUID()}.png`,
        mediaType: 'image/png',
        width: 640,
        height: 480,
        size: 2048,
      })

      yield* learningContentRepository.createAsset(asset)

      return asset.id
    }),
  )

export const addFixtureQuestion = (
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
  published = true,
  explanation: typeof RichContent.Encoded = paragraphs('Fixture'),
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const revisionId = crypto.randomUUID()

      const question = yield* Schema.decodeEffect(NewQuestion)({
        id: crypto.randomUUID(),
        revisionId,
        documentId,
        qualificationPathId: pathId,
        body: 'Test-only question',
        answers: [
          {
            id: crypto.randomUUID(),
            questionRevisionId: revisionId,
            text: 'A',
            isCorrect: true,
          },
          {
            id: crypto.randomUUID(),
            questionRevisionId: revisionId,
            text: 'B',
            isCorrect: false,
          },
          {
            id: crypto.randomUUID(),
            questionRevisionId: revisionId,
            text: 'C',
            isCorrect: false,
          },
        ],
        explanation,
        published,
      })

      yield* learningContentRepository.createQuestion(question)

      return question
    }),
  )

export const attachFixtureQuestion = (
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
  questionId: WrittenQuestionId,
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      yield* learningContentRepository.attachDocument(pathId, documentId)
      yield* learningContentRepository.attachQuestion(pathId, documentId, questionId)
    }),
  )

export const publishFixtureRevision = (
  questionId: WrittenQuestionId,
  changeKind: RevisionChangeKind = substantiveChange,
  explanation: typeof RichContent.Encoded = paragraphs('Revised fixture'),
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository
      const revisionId = crypto.randomUUID()

      const revision = yield* Schema.decodeEffect(NewQuestionRevision)({
        questionId,
        revisionId,
        changeKind,
        body: 'Test-only revised question',
        answers: ['D', 'E', 'F'].map((text, index) => ({
          id: crypto.randomUUID(),
          questionRevisionId: revisionId,
          text,
          isCorrect: index === 0,
        })),
        explanation,
      })

      yield* learningContentRepository.publishRevision(revision)

      return revision
    }),
  )

export const withdrawFixtureRevision = (
  revisionId: QuestionRevisionId,
  reason = 'Test-only fault in the answer key',
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const withdrawal = yield* Schema.decodeEffect(QuestionRevisionWithdrawal)({
        revisionId,
        reason,
      })

      yield* learningContentRepository.withdrawRevision(withdrawal)
    }),
  )

export const sessionGoalVersion = (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: StudySessionId,
) =>
  runFixture(
    Effect.gen(function* () {
      const studyReader = yield* StudyReader
      const session = yield* studyReader.session(userId, pathId, sessionId)

      return Option.map(session, ({ goalVersion }) => goalVersion).pipe(Option.getOrUndefined)
    }),
  )

export const storedLearningRound = (userId: UserId, pathId: QualificationPathId) =>
  runFixture(
    Effect.gen(function* () {
      const studyReader = yield* StudyReader
      const progress = yield* studyReader.learningRound(userId, pathId)

      return progress.round
    }),
  )

export const storedOralLearningRound = (userId: UserId, pathId: QualificationPathId) =>
  runFixture(
    Effect.gen(function* () {
      const oralStudyReader = yield* OralStudyReader
      const progress = yield* oralStudyReader.learningRound(userId, pathId)

      return progress.round
    }),
  )

export const currentReviewState = (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: WrittenQuestionId,
) =>
  runFixture(
    Effect.gen(function* () {
      const studyReader = yield* StudyReader

      return yield* studyReader.reviewState(userId, pathId, questionId)
    }),
  )

export const currentOralReviewState = (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: OralQuestionId,
) =>
  runFixture(
    Effect.gen(function* () {
      const oralStudyReader = yield* OralStudyReader

      return yield* oralStudyReader.reviewState(userId, pathId, questionId)
    }),
  )

export const addFixtureOralCategory = (name = 'Test-only oral category', sortOrder = 0) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const category = yield* Schema.decodeEffect(OralQuestionCategory)({
        id: crypto.randomUUID(),
        name,
        sortOrder,
      })

      yield* learningContentRepository.createOralCategory(category)

      return category.id
    }),
  )

export const addFixtureOralQuestion = (
  pathId: QualificationPathId,
  categoryId: OralQuestionCategoryId,
  position: number,
  published = true,
  answer: typeof RichContent.Encoded = paragraphs('Test-only oral answer'),
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const question = yield* Schema.decodeEffect(NewOralQuestion)({
        id: crypto.randomUUID(),
        revisionId: crypto.randomUUID(),
        categoryId,
        position,
        qualificationPathId: pathId,
        body: paragraphs('Test-only oral question'),
        answer,
        published,
      })

      yield* learningContentRepository.createOralQuestion(question)

      return question
    }),
  )

export const assignFixtureOralQuestion = (
  pathId: QualificationPathId,
  questionId: OralQuestionId,
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      yield* learningContentRepository.assignOralQuestion(pathId, questionId)
    }),
  )

export const editFixtureOralDraft = (
  revisionId: OralRevisionId,
  answer: typeof RichContent.Encoded = paragraphs('Edited oral answer'),
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const edit = yield* Schema.decodeEffect(OralDraftEdit)({
        revisionId,
        body: paragraphs('Edited oral question'),
        answer,
      })

      yield* learningContentRepository.editOralDraft(edit)
    }),
  )

export const publishFixtureOralRevision = (
  questionId: OralQuestionId,
  changeKind: RevisionChangeKind = substantiveChange,
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const revision = yield* Schema.decodeEffect(NewOralRevision)({
        questionId,
        revisionId: crypto.randomUUID(),
        changeKind,
        body: paragraphs('Test-only revised oral question'),
        answer: paragraphs('Test-only revised oral answer'),
      })

      yield* learningContentRepository.publishOralRevision(revision)

      return revision
    }),
  )

export const withdrawFixtureOralRevision = (
  revisionId: OralRevisionId,
  reason = 'Test-only fault in the oral answer',
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const withdrawal = yield* Schema.decodeEffect(OralRevisionWithdrawal)({ revisionId, reason })

      yield* learningContentRepository.withdrawOralRevision(withdrawal)
    }),
  )

type FixtureKnowledgeCheckOption = { readonly text: string; readonly isCorrect: boolean }

export const addFixtureKnowledgeCheck = (
  questionId: OralQuestionId,
  oralRevisionId: OralRevisionId,
  format: KnowledgeCheckFormat,
  options: ReadonlyArray<FixtureKnowledgeCheckOption>,
  published = true,
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const check = yield* Schema.decodeEffect(NewOralKnowledgeCheck)({
        id: crypto.randomUUID(),
        revisionId: crypto.randomUUID(),
        questionId,
        oralRevisionId,
        format,
        prompt: `Test-only ${format} check`,
        options: options.map(option => ({ id: crypto.randomUUID(), ...option })),
        explanation: paragraphs('Test-only check explanation'),
        published,
      })

      yield* learningContentRepository.createKnowledgeCheck(check)

      return check
    }),
  )
