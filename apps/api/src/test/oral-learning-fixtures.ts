import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  KnowledgeCheckFormat,
  OralKnowledgeCheckRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { paragraphs, type RichContent } from '@inzpro/rich-content/rich-content'
import { Effect, Schema } from 'effect'
import { assignOralQuestion } from '~api/modules/learning-content/application/assign-oral-question.command.js'
import { createOralQuestion } from '~api/modules/learning-content/application/create-oral-question.command.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import {
  NewOralKnowledgeCheck,
  NewOralQuestion,
  NewOralRevision,
  type NewQuestionReference,
  OralDraftEdit,
  type OralQuestionAssignment,
  OralQuestionCategory,
  OralRevisionWithdrawal,
  RegionalQuestionLink,
  type RegionalSourceKind,
  recollectionRegionalSource,
  type RevisionChangeKind,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'
import { OralSessionQuizReader } from '~api/modules/oral-study/application/oral-session-quiz.reader.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { runFixture } from '~api/test/run-fixture.js'

export const storedOralLearningRound = (userId: UserId, pathId: QualificationPathId) =>
  runFixture(
    Effect.gen(function* () {
      const oralStudyReader = yield* OralStudyReader
      const progress = yield* oralStudyReader.learningRound(userId, pathId)

      return progress.round
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

export const addFixtureOralCategory = (name = 'Test-only oral category') =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const category = yield* Schema.decodeEffect(OralQuestionCategory)({
        id: crypto.randomUUID(),
        name,
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
  references: ReadonlyArray<typeof NewQuestionReference.Encoded> = [],
) =>
  runFixture(
    Effect.gen(function* () {
      const question = yield* Schema.decodeEffect(NewOralQuestion)({
        id: crypto.randomUUID(),
        revisionId: crypto.randomUUID(),
        categoryId,
        position,
        qualificationPathId: pathId,
        body: paragraphs('Test-only oral question'),
        answer,
        references,
        published,
      })

      yield* createOralQuestion(question)

      return question
    }),
  )

export const assignFixtureOralQuestion = (
  pathId: QualificationPathId,
  question: OralQuestionAssignment,
) => runFixture(assignOralQuestion(pathId, question))

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
        references: [],
      })

      yield* learningContentRepository.publishOralRevision(revision)

      return revision
    }),
  )

export const linkFixtureOralQuestionToChamber = (
  questionId: OralQuestionId,
  districtChamberId: string,
  sourceKind: RegionalSourceKind = recollectionRegionalSource,
  recordedAt = '2026-06-12T10:00:00.000Z',
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      const link = yield* Schema.decodeEffect(RegionalQuestionLink)({
        questionId,
        districtChamberId,
        sourceKind,
        recordedAt,
      })

      yield* learningContentRepository.linkOralQuestionToChamber(link)
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
  explanation: typeof RichContent.Encoded = paragraphs('Test-only check explanation'),
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
        explanation,
        published,
      })

      yield* learningContentRepository.createKnowledgeCheck(check)

      return check
    }),
  )

export const oralSelfAssessmentStatistics = (oralRevisionId: OralRevisionId) =>
  runFixture(
    OralStudyReader.use(oralStudyReader =>
      oralStudyReader.selfAssessmentStatistics(oralRevisionId),
    ),
  )

export const oralKnowledgeCheckStatistics = (
  knowledgeCheckRevisionId: OralKnowledgeCheckRevisionId,
) =>
  runFixture(
    OralSessionQuizReader.use(oralSessionQuizReader =>
      oralSessionQuizReader.checkStatistics(knowledgeCheckRevisionId),
    ),
  )
