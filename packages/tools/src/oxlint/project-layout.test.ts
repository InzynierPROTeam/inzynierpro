import { RuleTester } from 'oxlint/plugins-dev'

import plugin from './project-layout.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })

tester.run('project-layout/blank-line-before-return', plugin.rules['blank-line-before-return']!, {
  valid: [
    'function value() { return 1 }',
    'function value() {\n  const result = 1\n\n  return result\n}',
    'const value = () => 1',
  ],
  invalid: [
    {
      code: 'function value() {\n  const result = 1\n  return result\n}',
      output: 'function value() {\n  const result = 1\n\n  return result\n}',
      errors: [{ messageId: 'missing' }],
    },
    {
      code: 'function value() {\n  const result = 1\n  // Keep with return.\n  return result\n}',
      output:
        'function value() {\n  const result = 1\n\n  // Keep with return.\n  return result\n}',
      errors: [{ messageId: 'missing' }],
    },
  ],
})

tester.run(
  'project-layout/blank-lines-around-control-flow',
  plugin.rules['blank-lines-around-control-flow']!,
  {
    valid: [
      'function value(flag: boolean) {\n  if (flag) {}\n}',
      'if (first) {}\nif (second) {}',
      'const before = 1\n\nif (before) {}\n\nconst after = 2',
    ],
    invalid: [
      {
        code: 'const before = 1\nif (before) {}\nconst after = 2',
        output: 'const before = 1\n\nif (before) {}\n\nconst after = 2',
        errors: [{ messageId: 'before' }, { messageId: 'after' }],
      },
      {
        code: 'if (flag) {}\n// Attached to after.\nconst after = 2',
        output: 'if (flag) {}\n\n// Attached to after.\nconst after = 2',
        errors: [{ messageId: 'after' }],
      },
      {
        code: 'const before = 1\n// Attached to loop.\nwhile (flag) {}',
        output: 'const before = 1\n\n// Attached to loop.\nwhile (flag) {}',
        errors: [{ messageId: 'before' }],
      },
    ],
  },
)

tester.run('project-layout/imports-first', plugin.rules['imports-first']!, {
  valid: [
    "'use client'\nimport { value } from 'module'\nexport { value }",
    "import type { Value } from 'module'\nimport { value } from 'other'\nexport { value }",
    'export const value = 1',
  ],
  invalid: [
    {
      code: "const value = 1\nimport { other } from 'module'",
      errors: [{ messageId: 'misplaced' }],
    },
    {
      code: "import { value } from 'module'\nexport { value }\nimport { other } from 'other'",
      errors: [{ messageId: 'misplaced' }],
    },
  ],
})

tester.run('project-layout/blank-line-after-imports', plugin.rules['blank-line-after-imports']!, {
  valid: [
    "import { value } from 'module'",
    "'use client'\nimport { value } from 'module'\n\nexport { value }",
    "import type { Value } from 'module'\nimport { value } from 'other'\n\nexport { value }",
  ],
  invalid: [
    {
      code: "import { value } from 'module'\nexport { value }",
      output: "import { value } from 'module'\n\nexport { value }",
      errors: [{ messageId: 'missing' }],
    },
    {
      code: "import { value } from 'module'\n// Attached to export.\nexport { value }",
      output: "import { value } from 'module'\n\n// Attached to export.\nexport { value }",
      errors: [{ messageId: 'missing' }],
    },
  ],
})
