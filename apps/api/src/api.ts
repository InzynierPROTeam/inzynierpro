import { Api } from '@inzpro/api-contracts/api'
import { Layer } from 'effect'
import { HttpRouter } from 'effect/http'
import { HttpApiBuilder } from 'effect/http-api'
import {
  ExamCalendarLive,
  ExamCalendarRequestServices,
} from '~api/modules/exam-calendar/http/handlers.js'
import { HealthLive, HealthRequestServices } from '~api/modules/health/http/handlers.js'
import { IdentityLive } from '~api/modules/identity/http/handlers.js'
import {
  PreparationLive,
  PreparationRequestServices,
} from '~api/modules/preparation/http/handlers.js'
import {
  QualificationPathsLive,
  QualificationPathsRequestServices,
} from '~api/modules/qualification-paths/http/handlers.js'
import { StudyLive, StudyRequestServices } from '~api/modules/study/http/handlers.js'

// Handlers read module services per request. They must be provided here, on the layer that
// registers routes: provided on a group layer they would type-check but never reach a handler.
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
  HttpRouter.provideRequest(
    Layer.mergeAll(
      HealthRequestServices,
      PreparationRequestServices,
      StudyRequestServices,
      QualificationPathsRequestServices,
      ExamCalendarRequestServices,
    ),
  ),
)
