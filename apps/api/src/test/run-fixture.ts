import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect, Layer } from 'effect'
import { Transaction, TransactionLive } from '~api/lib/transaction.js'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.repository.postgres.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { LearningContentRepositoryLive } from '~api/modules/learning-content/infrastructure/learning-content.repository.postgres.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { MockExamReaderLive } from '~api/modules/mock-exams/infrastructure/mock-exam.reader.postgres.js'
import { MockExamRepositoryLive } from '~api/modules/mock-exams/infrastructure/mock-exam.repository.postgres.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyReaderLive } from '~api/modules/oral-study/infrastructure/oral-study.reader.postgres.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'

const fixturesLayer = Layer.mergeAll(
  TransactionLive,
  LearningContentRepositoryLive,
  QualificationPathsReaderLive,
  ExamCalendarRepositoryLive,
  StudyRepositoryLive,
  StudyReaderLive,
  OralStudyReaderLive,
  MockExamReaderLive,
  MockExamRepositoryLive,
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
    | MockExamReader
    | MockExamRepository
    | Transaction
  >,
) => Effect.runPromise(operation.pipe(Effect.provide(fixturesLayer), Effect.scoped))
