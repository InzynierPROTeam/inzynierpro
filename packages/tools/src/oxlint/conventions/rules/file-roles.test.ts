import { RuleTester } from 'oxlint/plugins-dev'

import { fileRolesRule } from './file-roles.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })
const code = 'export const value = 1'

const accepted = [
  'apps/platform/src/lib/env.server.ts',
  'apps/platform/src/features/editor/lib/editor.client.ts',
  'apps/platform/src/types/environment.d.ts',
  'packages/api-contracts/src/modules/oral-study/requests/session/preview.ts',
  'packages/api-contracts/src/modules/oral-study/responses/session.ts',
  'packages/api-contracts/src/modules/oral-study/errors/quiz.ts',
  'packages/api-contracts/src/modules/oral-study/endpoints/quiz.ts',
  'packages/queries/src/modules/oral-study/queries/quiz/checks.ts',
  'packages/domain/src/common/quantities/question-count.ts',
  'apps/platform/src/hooks/events/useInteraction.ts',
  'apps/platform/src/stores/session.ts',
  'apps/platform/src/providers/session/SessionProvider.tsx',
  'apps/platform/src/features/oralSession/stores/answer/visibility.ts',
  'apps/platform/src/features/oralSession/types.ts',
  'apps/platform/src/features/oralSession/config/quiz/formats.ts',
  'apps/platform/src/features/oralSession/actions/quiz/start.ts',
  'apps/platform/src/features/oralSession/validation/quiz/formats.ts',
  'apps/platform/src/features/oralSession/hooks/quiz/useQuiz.ts',
  'apps/platform/src/features/oralSession/lib/editor/create-editor.ts',
  'apps/platform/src/features/oralSession/providers/quiz/QuizProvider.tsx',
  'apps/platform/src/features/oralSession/test/fixtures/quiz.ts',

  'apps/platform/src/features/oralSession/components/nested/QuizCard.tsx',
  'packages/domain/src/modules/learning/nested/question.ts',
  'packages/api-contracts/src/modules/oral-study/api.ts',
  'packages/api-contracts/src/modules/learning/responses.ts',
  'packages/api-contracts/src/modules/oral-study/api.test.ts',
  'packages/api-contracts/src/utils/pagination.ts',
  'packages/api-contracts/src/v1-api.ts',
  'packages/api-contracts/src/middleware/authentication/api.ts',
  'packages/api-contracts/src/middleware/authentication/current-user.ts',
  'packages/api-contracts/src/middleware/authentication/errors.ts',
  'packages/api-client/src/modules/oral-study.ts',
  'packages/api-client/src/modules/oral-study.test.ts',
  'packages/api-client/src/modules/oral-study/get-session.ts',
  'packages/api-client/src/modules/oral-study/quiz/answers.ts',
  'packages/queries/src/modules/oral-study/keys.ts',
  'packages/queries/src/modules/oral-study/queries.ts',
  'packages/queries/src/modules/oral-study/queries.test.ts',
  'packages/utils/src/date.ts',
  'packages/ui/src/components/containers/in-view.tsx',
  'packages/domain/src/modules/learning/study-session.ts',
  'apps/platform/src/features/oralSession/StartOralSessionPage.tsx',
  'apps/platform/src/features/oralSession/actions.ts',
  'apps/platform/src/features/oralSession/stores.test.ts',
  'apps/platform/src/features/oralSession/components/OralQuizCard.tsx',
  'apps/platform/src/features/oralSession/components/OralQuizCard.test.tsx',
  'apps/platform/src/features/oralSession/hooks/useQuiz.ts',
  'apps/platform/src/features/onboarding/utils/route-api.ts',
  'apps/platform/src/features/onboarding/types/draft.ts',
  'apps/platform/src/routes/(app)/_authenticated/$id.tsx',
  'apps/platform/src/routeTree.gen.ts',
  'apps/platform/src/vite-env.d.ts',
  'apps/api/src/migrations/0007_oral_study.ts',
  'apps/api/src/seed/oral/questions.ts',
]

const rejected = [
  'apps/platform/src/features/oralSession/components/QuizPage.tsx',
  'apps/platform/src/features/oralSession/utils/QuizPage.tsx',
  'apps/platform/src/components/QuizPage.tsx',
  'apps/platform/src/features/oralSession/hooks.ts',
  'apps/platform/src/features/oralSession/components.tsx',
  'apps/platform/src/features/oralSession/store.ts',
  'packages/api-contracts/src/modules/oral-study/endpoints/quiz-api.tsx',

  'packages/api-contracts/src/modules/oral-study/oral-api.ts',
  'packages/api-contracts/src/modules/oral-study/api.gen.ts',
  'packages/api-contracts/src/modules/oral-study/helpers/api.ts',
  'packages/api-contracts/src/modules/oral-study/helpers.test.ts',
  'packages/api-contracts/src/oral-api.ts',
  'packages/api-contracts/src/shared/responses.ts',
  'packages/api-contracts/src/middleware/authentication/oral-api.ts',
  'packages/api-contracts/src/middleware/authentication/nested/api.ts',
  'packages/api-client/src/modules/oral-study/actions.ts',
  'packages/api-client/src/modules/oral-study/nested/actions.ts',
  'packages/queries/src/modules/oral-study/actions.ts',
  'packages/queries/src/modules/oral-study/extra/queries.ts',
  'packages/queries/src/modules/oral-study.ts',
  'packages/utils/src/random/date.ts',
  'packages/ui/src/rogue/button.tsx',
  'apps/platform/src/features/oralSession/quiz-api.ts',
  'apps/platform/src/features/oralSession/QuizCard.tsx',
  'apps/platform/src/features/oralSession/components/api.ts',
  'apps/platform/src/features/oralSession/hooks/quiz.ts',
  'apps/platform/src/features/oralSession/extra/actions.ts',
  'apps/platform/src/extra/actions.ts',
  'apps/api/src/lib/transaction.repository.postgres.ts',
  'apps/api/src/lib/nested/mail.client.http.ts',
  'apps/api/src/migrations/nested/0007_study.ts',
  'apps/api/src/migrations/study.ts',
]

tester.run('conventions/file-roles', fileRolesRule, {
  valid: accepted.map(path => ({ code, filename: `/repo/${path}` })),
  invalid: rejected.map(path => ({
    code,
    filename: `/repo/${path}`,
    errors: [{ messageId: 'role' }],
  })),
})

tester.run('conventions/file-roles page declarations', fileRolesRule, {
  valid: [
    {
      filename: '/repo/apps/platform/src/features/study/utils.ts',
      code: 'export const getNextPage = () => 1',
    },
    {
      filename: '/repo/apps/platform/src/features/study/StudyPage.tsx',
      code: 'export const StudyPage = () => null',
    },
  ],
  invalid: [
    {
      filename: '/repo/apps/platform/src/features/study/components/StudySection.tsx',
      code: 'export const StudyPage = () => null',
      errors: [{ messageId: 'page' }],
    },
    {
      filename: '/repo/apps/platform/src/features/study/components/StudySection.tsx',
      code: 'export function StudyPage() { return null }',
      errors: [{ messageId: 'page' }],
    },
  ],
})
