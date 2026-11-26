import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect, Layer } from 'effect'
import { Transaction, TransactionLive } from '~api/lib/transaction.js'
import { ChamberContactsRepository } from '~api/modules/exam-calendar/application/chamber-contacts.repository.js'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { ChamberContactsRepositoryLive } from '~api/modules/exam-calendar/infrastructure/chamber-contacts.repository.postgres.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.repository.postgres.js'
import type { FileStorage } from '~api/modules/learning-content/application/file-storage.service.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { fileStorageS3LayerFromConfig } from '~api/modules/learning-content/infrastructure/file-storage.service.s3.js'
import { LearningContentRepositoryLive } from '~api/modules/learning-content/infrastructure/learning-content.repository.postgres.js'
import { XpReader } from '~api/modules/learning-xp/application/learning-xp.reader.js'
import { XpRepository } from '~api/modules/learning-xp/application/learning-xp.repository.js'
import { XpReaderLive } from '~api/modules/learning-xp/infrastructure/learning-xp.reader.postgres.js'
import { XpRepositoryLive } from '~api/modules/learning-xp/infrastructure/learning-xp.repository.postgres.js'
import {
  ReviewScheduler,
  ReviewSchedulerLive,
} from '~api/modules/learning/application/review-scheduler.service.js'
import { MockExamReader } from '~api/modules/mock-exams/application/mock-exam.reader.js'
import { MockExamRepository } from '~api/modules/mock-exams/application/mock-exam.repository.js'
import { MockExamReaderLive } from '~api/modules/mock-exams/infrastructure/mock-exam.reader.postgres.js'
import { MockExamRepositoryLive } from '~api/modules/mock-exams/infrastructure/mock-exam.repository.postgres.js'
import { OralSessionQuizReader } from '~api/modules/oral-study/application/oral-session-quiz.reader.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralSessionQuizReaderLive } from '~api/modules/oral-study/infrastructure/oral-session-quiz.reader.postgres.js'
import { OralStudyReaderLive } from '~api/modules/oral-study/infrastructure/oral-study.reader.postgres.js'
import { PreparationReader } from '~api/modules/preparation/application/preparation.reader.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsRepository } from '~api/modules/qualification-paths/application/qualification-paths.repository.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'
import { QualificationPathsRepositoryLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.repository.postgres.js'
import { StreakReader } from '~api/modules/streak/application/streak.reader.js'
import { StreakRepository } from '~api/modules/streak/application/streak.repository.js'
import { StreakReaderLive } from '~api/modules/streak/infrastructure/streak.reader.postgres.js'
import { StreakRepositoryLive } from '~api/modules/streak/infrastructure/streak.repository.postgres.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'

const fixturesLayer = Layer.mergeAll(
  ChamberContactsRepositoryLive,
  TransactionLive,
  LearningContentRepositoryLive,
  QualificationPathsReaderLive,
  QualificationPathsRepositoryLive,
  ExamCalendarRepositoryLive,
  StudyRepositoryLive,
  StudyReaderLive,
  OralStudyReaderLive,
  OralSessionQuizReaderLive,
  MockExamReaderLive,
  MockExamRepositoryLive,
  PreparationRepositoryLive,
  PreparationReaderLive,
  ReviewSchedulerLive,
  StreakReaderLive,
  StreakRepositoryLive,
  XpReaderLive,
  XpRepositoryLive,
  fileStorageS3LayerFromConfig,
).pipe(Layer.provide(databaseLayerFromConfig))

export const runFixture = <A, E>(
  operation: Effect.Effect<
    A,
    E,
    | LearningContentRepository
    | FileStorage
    | QualificationPathsReader
    | QualificationPathsRepository
    | ChamberContactsRepository
    | ExamCalendarRepository
    | StudyRepository
    | StudyReader
    | OralStudyReader
    | OralSessionQuizReader
    | MockExamReader
    | MockExamRepository
    | XpReader
    | XpRepository
    | PreparationReader
    | PreparationRepository
    | ReviewScheduler
    | StreakReader
    | StreakRepository
    | Transaction
  >,
) => Effect.runPromise(operation.pipe(Effect.provide(fixturesLayer), Effect.scoped))
