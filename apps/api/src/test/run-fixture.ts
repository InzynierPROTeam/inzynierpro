import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect, Layer } from 'effect'
import { ExamCalendarRepository } from '~api/modules/exam-calendar/application/exam-calendar.repository.js'
import { ExamCalendarRepositoryLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.repository.postgres.js'
import { LearningContentRepository } from '~api/modules/learning-content/application/learning-content.repository.js'
import { LearningContentRepositoryLive } from '~api/modules/learning-content/infrastructure/learning-content.repository.postgres.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyReaderLive } from '~api/modules/oral-study/infrastructure/oral-study.reader.postgres.js'
import { QualificationPathsReader } from '~api/modules/qualification-paths/application/qualification-paths.reader.js'
import { QualificationPathsReaderLive } from '~api/modules/qualification-paths/infrastructure/qualification-paths.reader.postgres.js'
import { StudyReader } from '~api/modules/written-study/application/study.reader.js'
import { StudyRepository } from '~api/modules/written-study/application/study.repository.js'
import { StudyReaderLive } from '~api/modules/written-study/infrastructure/study.reader.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'

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
