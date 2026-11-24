import type { UserId } from '@inzpro/domain/modules/identity/user'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { paragraphs, type RichContent } from '@inzpro/rich-content/rich-content'
import { type DateTime, Effect, Schema, Option } from 'effect'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import {
  NewQuestion,
  NewQuestionReference,
  NewQuestionRevision,
  QuestionRevisionWithdrawal,
  type RevisionChangeKind,
  substantiveChange,
} from '~api/modules/learning-content/domain/learning-content.model.js'
import { studyDayOf } from '~api/modules/learning/domain/study-day.rules.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { runFixture } from '~api/test/run-fixture.js'

export const addFixtureQuestion = (
  pathId: QualificationPathId,
  documentId: ReferenceDocumentId,
  published = true,
  explanation: typeof RichContent.Encoded = paragraphs('Fixture'),
  references: ReadonlyArray<typeof NewQuestionReference.Encoded> = [],
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
        references,
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
        references: [],
      })

      yield* learningContentRepository.publishRevision(revision)

      return revision
    }),
  )

export const addFixtureWrittenReference = (
  revisionId: QuestionRevisionId,
  reference: typeof NewQuestionReference.Encoded,
) =>
  runFixture(
    Effect.gen(function* () {
      const learningContentRepository = yield* LearningContentRepository

      yield* learningContentRepository.addWrittenReference(
        revisionId,
        yield* Schema.decodeEffect(NewQuestionReference)(reference),
      )
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

export const learningEventOnStudyDay = (
  userId: UserId,
  pathId: QualificationPathId,
  questionRevisionId: QuestionRevisionId,
  at: DateTime.Utc,
) =>
  runFixture(
    Effect.gen(function* () {
      const studyReader = yield* StudyReader

      return yield* studyReader.answeredContentOnStudyDay(
        userId,
        pathId,
        questionRevisionId,
        studyDayOf(at),
      )
    }),
  )

export const writtenQuestionStatistics = (questionRevisionId: QuestionRevisionId) =>
  runFixture(StudyReader.use(studyReader => studyReader.questionStatistics(questionRevisionId)))

export const writtenAnswerOptionStatistics = (questionRevisionId: QuestionRevisionId) =>
  runFixture(StudyReader.use(studyReader => studyReader.answerOptionStatistics(questionRevisionId)))
