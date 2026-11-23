import { RuleTester } from 'oxlint/plugins-dev'

import { moduleLayersRule } from './module-layers.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const file = (name: string) => `/repo/apps/api/src/modules/preparation/${name}`

tester.run('conventions/module-layers', moduleLayersRule, {
  valid: [
    { filename: file('domain/nested/goal.model.ts'), code: '' },
    { filename: file('domain/goal-changed.event.ts'), code: '' },
    { filename: file('application/reminders/send.job.ts'), code: '' },
    { filename: file('application/reminders/goal-changed.event-handler.ts'), code: '' },
    {
      filename: file('infrastructure/editor/content.client.http.ts'),
      code: "import { HttpClient } from 'effect/http'",
    },
    { filename: file('infrastructure/cache/goal.reader.redis.ts'), code: '' },
    { filename: file('infrastructure/profile.repository.auth.ts'), code: '' },
    { filename: file('infrastructure/file-storage.service.s3.ts'), code: '' },
    { filename: file('http/goal/goal.mappers.ts'), code: '' },
    { filename: file('http/goal/goal.errors.ts'), code: '' },

    { filename: file('domain/preparation.model.ts'), code: "import { Schema } from 'effect'" },
    {
      filename: file('domain/preparation.model.ts'),
      code: "import { Specialization } from '~api/modules/qualification-paths/domain/qualification-path.model.js'",
    },
    { filename: file('domain/errors.ts'), code: 'export const value = 1' },
    {
      filename: '/repo/apps/api/src/modules/written-study/domain/session-preview.rules.ts',
      code: '',
    },
    {
      filename: file('application/change-goal.command.ts'),
      code: "import { GoalChange } from '../domain/preparation.model.js'; import { ExamCalendarReader } from '~api/modules/exam-calendar/application/exam-calendar.reader.js'",
    },
    {
      filename: file('application/errors.ts'),
      code: "import type { SqlError } from 'effect/sql'",
    },
    {
      filename: file('application/preparation.reader.ts'),
      code: "import type { CursorPage } from '~api/lib/cursor-pagination.js'",
    },
    {
      filename: file('infrastructure/preparation.reader.postgres.ts'),
      code: "import { SqlClient } from 'effect/sql'; import { PreparationReader } from '../application/preparation.reader.js'",
    },
    {
      filename: file('http/handlers.ts'),
      code: "import { Api } from '@inzpro/api-contracts/api'; import { HttpApiBuilder } from 'effect/http-api'; import { ExamCalendarReaderLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.reader.postgres.js'",
    },
    {
      filename: file('http/mappers.ts'),
      code: "import { toSpecializationDto } from '~api/modules/qualification-paths/http/mappers.js'",
    },
    { filename: file('http/account.handlers.ts'), code: '' },
    {
      filename: file('http/errors.ts'),
      code: "import { PathAccessDenied } from '@inzpro/api-contracts/modules/preparation/errors'",
    },
    {
      filename: file('http/onboarding.test.ts'),
      code: "import { SqlClient } from 'effect/sql'",
    },
    {
      filename: file('domain/preparation.model.test.ts'),
      code: "import { UserExamGoal } from '@inzpro/api-contracts/modules/preparation/responses'",
    },
    { filename: '/repo/apps/api/src/lib/cursor-pagination.ts', code: "import 'effect/sql'" },
    {
      filename: '/repo/apps/api/src/modules/written-study/application/start-session.command.ts',
      code: "import { PreparationPolicy } from '~api/modules/preparation/application/preparation.policy.js'",
    },
    {
      filename: '/repo/apps/api/src/modules/written-study/http/handlers.ts',
      code: "import { PreparationReaderLive } from '../../preparation/infrastructure/preparation.reader.postgres.js'",
    },
    {
      filename: '/repo/apps/api/src/modules/exam-calendar/http/handlers.test.ts',
      code: "import { startTestApi } from '~api/modules/written-study/http/handlers.js'",
    },
  ],
  invalid: [
    {
      filename: file('application/goals/change.command.ts'),
      code: "import { Goal } from '../../infrastructure/goals/goal.repository.postgres.js'",
      errors: [{ messageId: 'inward' }],
    },
    {
      filename: file('domain/goals/change.rules.ts'),
      code: "import { Goal } from '../../application/goals/goal.query.js'",
      errors: [{ messageId: 'inward' }],
    },
    {
      filename: file('infrastructure/editor/content.client.http.ts'),
      code: "import { HttpApiBuilder } from 'effect/http-api'",
      errors: [{ messageId: 'transport' }],
    },

    { filename: file('preparation.model.ts'), code: '', errors: [{ messageId: 'layer' }] },
    { filename: file('models/preparation.ts'), code: '', errors: [{ messageId: 'layer' }] },
    { filename: file('domain/archive-path.command.ts'), code: '', errors: [{ messageId: 'role' }] },
    {
      filename: file('application/preparation.model.ts'),
      code: '',
      errors: [{ messageId: 'role' }],
    },
    {
      filename: file('infrastructure/preparation.reader.ts'),
      code: '',
      errors: [{ messageId: 'role' }],
    },
    {
      filename: file('infrastructure/profile.repository.better-auth.ts'),
      code: '',
      errors: [{ messageId: 'role' }],
    },
    {
      filename: file('infrastructure/file-storage.service.r2.ts'),
      code: '',
      errors: [{ messageId: 'role' }],
    },
    { filename: file('http/presentation.ts'), code: '', errors: [{ messageId: 'role' }] },
    { filename: file('http/http.ts'), code: '', errors: [{ messageId: 'role' }] },
    {
      filename: file('domain/preparation.model.ts'),
      code: "import { UserExamGoal } from '@inzpro/api-contracts/modules/preparation/responses'",
      errors: [{ messageId: 'contracts' }],
    },
    {
      filename: file('application/goal-history.query.ts'),
      code: "import type { CursorPagination } from '@inzpro/api-contracts/utils/pagination'",
      errors: [{ messageId: 'contracts' }],
    },
    {
      filename: file('infrastructure/preparation.reader.postgres.ts'),
      code: "import { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'",
      errors: [{ messageId: 'contracts' }],
    },
    {
      filename: file('domain/preparation.model.ts'),
      code: "import { PreparationReader } from '../application/preparation.reader.js'",
      errors: [{ messageId: 'inward' }],
    },
    {
      filename: file('domain/preparation.model.ts'),
      code: "import { mapCursorPage } from '~api/lib/cursor-pagination.js'",
      errors: [{ messageId: 'inward' }],
    },
    {
      filename: file('application/change-goal.command.ts'),
      code: "import { PreparationRepositoryLive } from '../infrastructure/preparation.repository.postgres.js'",
      errors: [{ messageId: 'inward' }],
    },
    {
      filename: file('application/change-goal.command.ts'),
      code: "import { toGoalChange } from '../http/mappers.js'",
      errors: [{ messageId: 'inward' }],
    },
    {
      filename: file('infrastructure/preparation.reader.postgres.ts'),
      code: "import { ExamCalendarReaderLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.reader.postgres.js'",
      errors: [{ messageId: 'inward' }],
    },
    {
      filename: file('domain/errors.ts'),
      code: "import type { SqlError } from 'effect/sql'",
      errors: [{ messageId: 'sql' }],
    },
    {
      filename: file('application/preparation.reader.ts'),
      code: "import { SqlClient } from 'effect/sql'",
      errors: [{ messageId: 'sql' }],
    },
    {
      filename: file('application/archive-path.command.ts'),
      code: "import { HttpApiBuilder } from 'effect/http-api'",
      errors: [{ messageId: 'transport' }],
    },
    {
      filename: file('application/archive-path.command.ts'),
      code: "import { AuthenticationLive } from '~api/middleware/authentication.js'",
      errors: [{ messageId: 'transport' }],
    },
    {
      filename: file('application/archive-path.command.ts'),
      code: "import { StudyReader } from '~api/modules/written-study/application/study.reader.js'",
      errors: [{ messageId: 'module', data: { module: 'preparation', target: 'written-study' } }],
    },
    {
      filename: file('domain/preparation.model.ts'),
      code: "import type { SessionId } from '../../written-study/domain/study-session.model.js'",
      errors: [{ messageId: 'module', data: { module: 'preparation', target: 'written-study' } }],
    },
    {
      filename: '/repo/apps/api/src/modules/exam-calendar/http/handlers.ts',
      code: "import { pathAccessDenied } from '~api/modules/preparation/http/errors.js'",
      errors: [{ messageId: 'module', data: { module: 'exam-calendar', target: 'preparation' } }],
    },
    {
      filename: '/repo/apps/api/src/modules/billing/domain/errors.ts',
      code: '',
      errors: [{ messageId: 'undeclared', data: { module: 'billing' } }],
    },
  ],
})
