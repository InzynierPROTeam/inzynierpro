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
  LearningXpLive,
  LearningXpRequestServices,
} from '~api/modules/learning-xp/http/handlers.js'
import { MockExamsLive, MockExamsRequestServices } from '~api/modules/mock-exams/http/handlers.js'
import { OralStudyLive, OralStudyRequestServices } from '~api/modules/oral-study/http/handlers.js'
import {
  PreparationLive,
  PreparationRequestServices,
} from '~api/modules/preparation/http/handlers.js'
import { ProfilesLive, ProfilesRequestServices } from '~api/modules/profiles/http/handlers.js'
import {
  QualificationPathsLive,
  QualificationPathsRequestServices,
} from '~api/modules/qualification-paths/http/handlers.js'
import { StreakLive, StreakRequestServices } from '~api/modules/streak/http/handlers.js'
import { StudyLive, StudyRequestServices } from '~api/modules/written-study/http/handlers.js'

// EXTERNAL: Effect request services must be provided on the route-registration layer; group provision type-checks but does not reach handlers.
export const ApiLive = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(
    Layer.mergeAll(
      HealthLive,
      IdentityLive,
      PreparationLive,
      StudyLive,
      OralStudyLive,
      MockExamsLive,
      QualificationPathsLive,
      ExamCalendarLive,
      StreakLive,
      LearningXpLive,
      ProfilesLive,
    ),
  ),
  HttpRouter.provideRequest(
    Layer.mergeAll(
      HealthRequestServices,
      PreparationRequestServices,
      StudyRequestServices,
      OralStudyRequestServices,
      MockExamsRequestServices,
      QualificationPathsRequestServices,
      ExamCalendarRequestServices,
      StreakRequestServices,
      LearningXpRequestServices,
      ProfilesRequestServices,
    ),
  ),
)
