import { Api } from '@inzpro/api-contracts/api'
import { Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { ExamCalendarLive } from '~api/modules/exam-calendar/http.js'
import { HealthLive } from '~api/modules/health/http.js'
import { IdentityLive } from '~api/modules/identity/http.js'
import { PreparationLive } from '~api/modules/preparation/http.js'
import { QualificationPathsLive } from '~api/modules/qualification-paths/http.js'
import { StudyLive } from '~api/modules/study/http.js'

export const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(
    Layer.mergeAll(
      HealthLive,
      IdentityLive,
      PreparationLive,
      StudyLive,
      QualificationPathsLive,
      ExamCalendarLive,
    ),
  ),
)
