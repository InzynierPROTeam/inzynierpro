import type { UserId } from '@inzpro/domain/modules/identity/user'
import { DailyAnswerCount } from '@inzpro/domain/modules/streak/streak'
import type { DateTime } from 'effect'
import { recordStreakAnswers } from '~api/modules/streak/application/streak-activity.service.js'
import { runFixture } from '~api/test/run-fixture.js'

export const qualifyFixtureDay = (userId: UserId, at: DateTime.Utc) =>
  runFixture(recordStreakAnswers(userId, at, DailyAnswerCount.make(5)))
