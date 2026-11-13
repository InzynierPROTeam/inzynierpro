import { RuleTester } from 'oxlint/plugins-dev'

import { queriesReadOnlyRule } from './queries-read-only.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })
const filename = '/repo/apps/api/src/modules/study/documents.query.ts'
const error = { messageId: 'write' }

tester.run('conventions/queries-read-only', queriesReadOnlyRule, {
  valid: [
    { filename, code: "import { StudyReader } from './study.reader.js'" },
    { filename, code: "import { requirePathAccess } from '../preparation/path-access.policy.js'" },
    {
      filename: filename.replace('.query.ts', '.command.ts'),
      code: "import { PreparationRepository } from '../preparation/preparation.repository.js'",
    },
    {
      filename: filename.replace('.query.ts', '.query.test.ts'),
      code: "import { PreparationRepository } from '../preparation/preparation.repository.js'",
    },
  ],
  invalid: [
    {
      filename,
      code: "import { PreparationRepository as Repository } from '~api/modules/preparation/preparation.repository.js'",
      errors: [error],
    },
    {
      filename,
      code: "import type { StudyRepository } from './study.repository'",
      errors: [error],
    },
    { filename, code: "import * as write from './study.repository.postgres.ts'", errors: [error] },
    { filename, code: "const write = import('./record-activity.command.js')", errors: [error] },
    { filename, code: "const write = require('./study.repository.js')", errors: [error] },
  ],
})
