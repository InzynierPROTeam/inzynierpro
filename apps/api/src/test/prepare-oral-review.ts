import { databaseLayerFromConfig } from '@inzpro/db'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import { pathOralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Layer, Option, Schema } from 'effect'
import { ReviewSchedulerLive } from '~api/modules/learning/application/review-scheduler.service.js'
import { endOralSession } from '~api/modules/oral-study/application/end-oral-session.command.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { startOralSession } from '~api/modules/oral-study/application/start-oral-session.command.js'
import { submitOralSelfAssessment } from '~api/modules/oral-study/application/submit-oral-self-assessment.command.js'
import { OralStudyReaderLive } from '~api/modules/oral-study/infrastructure/oral-study.reader.postgres.js'
import { OralStudyRepositoryLive } from '~api/modules/oral-study/infrastructure/oral-study.repository.postgres.js'
import { PreparationReaderLive } from '~api/modules/preparation/infrastructure/preparation.reader.postgres.js'
import { PreparationRepositoryLive } from '~api/modules/preparation/infrastructure/preparation.repository.postgres.js'
import { StudyRepositoryLive } from '~api/modules/written-study/infrastructure/study.repository.postgres.js'

import { catalogueTestTime, fixedWallClockLayer } from './clock.js'

const [userId, pathId, categoryId] = Schema.decodeUnknownSync(
  Schema.Tuple([UserId, QualificationPathId, OralQuestionCategoryId]),
)(process.argv.slice(2))

const services = Layer.mergeAll(
  PreparationReaderLive,
  PreparationRepositoryLive,
  OralStudyReaderLive,
  OralStudyRepositoryLive,
  StudyRepositoryLive,
  ReviewSchedulerLive,
).pipe(Layer.provide(databaseLayerFromConfig))

await Effect.runPromise(
  Effect.gen(function* () {
    const session = yield* startOralSession(
      userId,
      pathId,
      categoryId,
      QuestionCount.make(4),
      pathOralQuestionScope,
    )

    const oralStudyReader = yield* OralStudyReader

    for (let index = 1; index <= session.questionCount; index++) {
      const position = SessionQuestionPosition.make(index)

      const question = Option.getOrThrow(
        yield* oralStudyReader.sessionQuestion(userId, pathId, session.id, position),
      )

      yield* submitOralSelfAssessment(
        userId,
        pathId,
        session.id,
        position,
        question.oralRevisionId,
        'hard',
      )
    }

    yield* endOralSession(userId, pathId, session.id)
  }).pipe(
    Effect.provide(
      Layer.merge(services, fixedWallClockLayer(DateTime.subtract(catalogueTestTime, { days: 2 }))),
    ),
    Effect.scoped,
  ),
)
