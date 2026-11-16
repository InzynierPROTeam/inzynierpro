import { HttpApi } from 'effect/http-api'
import { ExamCalendarApi } from '~api-contracts/modules/exam-calendar/api.js'
import { HealthCheckApi } from '~api-contracts/modules/health/api.js'
import { IdentityApi } from '~api-contracts/modules/identity/api.js'
import { PreparationApi } from '~api-contracts/modules/preparation/api.js'
import { QualificationPathsApi } from '~api-contracts/modules/qualification-paths/api.js'
import { StudyApi } from '~api-contracts/modules/study/api.js'
import { OralStudyApi } from '~api-contracts/modules/study/oral-api.js'

export class V1Api extends HttpApi.make('v1')
  .add(HealthCheckApi)
  .add(IdentityApi)
  .add(PreparationApi)
  .add(QualificationPathsApi)
  .add(ExamCalendarApi)
  .add(StudyApi)
  .add(OralStudyApi)
  .prefix('/v1') {}
