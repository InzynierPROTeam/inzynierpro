import { HttpApi } from 'effect/http-api'
import { ExamCalendarApi } from '~api-contracts/modules/exam-calendar/api.js'
import { HealthCheckApi } from '~api-contracts/modules/health/api.js'
import { IdentityApi } from '~api-contracts/modules/identity/api.js'
import { LearningXpApi } from '~api-contracts/modules/learning-xp/api.js'
import { MockExamsApi } from '~api-contracts/modules/mock-exams/api.js'
import { OralStudyApi } from '~api-contracts/modules/oral-study/api.js'
import { PreparationApi } from '~api-contracts/modules/preparation/api.js'
import { ProfilesApi } from '~api-contracts/modules/profiles/api.js'
import { QualificationPathsApi } from '~api-contracts/modules/qualification-paths/api.js'
import { StreakApi } from '~api-contracts/modules/streak/api.js'
import { StudyApi } from '~api-contracts/modules/written-study/api.js'

export class V1Api extends HttpApi.make('v1')
  .add(HealthCheckApi)
  .add(IdentityApi)
  .add(PreparationApi)
  .add(QualificationPathsApi)
  .add(ExamCalendarApi)
  .add(StudyApi)
  .add(OralStudyApi)
  .add(MockExamsApi)
  .add(StreakApi)
  .add(LearningXpApi)
  .add(ProfilesApi)
  .prefix('/v1') {}
