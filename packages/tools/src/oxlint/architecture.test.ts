import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { RuleTester } from 'oxlint/plugins-dev'

import { workspaceImports } from './architecture.ts'

const root = fileURLToPath(new URL('../../../..', import.meta.url))
const file = (workspace: string, name = 'example.ts') => resolve(root, workspace, 'src', name)
const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' } } })

tester.run('architecture/workspace-imports', workspaceImports, {
  valid: [
    {
      filename: file('packages/utils'),
      code: 'import "@inzpro/domain/modules/preparation/exam-access"',
    },

    { filename: file('packages/utils'), code: 'export const value = 1' },
    { filename: file('packages/utils'), code: 'import "./string"' },
    { filename: file('packages/utils'), code: 'import "~utils/string"' },
    { filename: file('packages/api-client'), code: 'import "@inzpro/api-contracts/api"' },
    { filename: file('apps/platform'), code: 'import "@inzpro/ui/button"' },
    { filename: file('apps/platform'), code: 'import "@inzpro/auth-client"' },
    { filename: file('apps/api'), code: 'import "@inzpro/auth"' },
    { filename: file('packages/auth'), code: 'import "@inzpro/redis"' },
    {
      filename: file('packages/api-client', 'action.test.ts'),
      code: 'import "@inzpro/testing/http"',
    },
    { filename: file('packages/testing'), code: 'import "./fixture"' },
    {
      filename: file('apps/api', 'test/api-server.ts'),
      code: 'import "@inzpro/testing/cookie-jar"',
    },
    { filename: file('apps/api', 'modules/x.test.ts'), code: 'import "~api/test/api-server"' },
    { filename: file('packages/utils', 'date.test.ts'), code: 'import "node:assert"' },
    { filename: file('apps/api'), code: 'import "node:http"' },
    { filename: file('packages/utils'), code: 'export type X = import("./types").X' },
  ],
  invalid: [
    {
      filename: file('packages/domain'),
      code: 'import "@inzpro/utils/exam-access"',
      errors: [{ messageId: 'dependency' }],
    },

    {
      filename: file('packages/utils'),
      code: 'import "@inzpro/db"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/ui'),
      code: 'export { query } from "@inzpro/queries/modules/health"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/api-client'),
      code: 'import "../../api-contracts/src/api"',
      errors: [{ messageId: 'packagePath' }],
    },
    {
      filename: file('packages/api-client'),
      code: 'import "~api-contracts/api"',
      errors: [{ messageId: 'packagePath' }],
    },
    {
      filename: file('apps/platform'),
      code: 'import "@inzpro/db"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('apps/platform'),
      code: 'import "@inzpro/auth"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('apps/platform'),
      code: 'import "@inzpro/redis"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/auth-client'),
      code: 'import type { BetterAuth } from "@inzpro/auth"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/utils'),
      code: 'import "../../../apps/api/src/api"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('apps/platform'),
      code: 'import "~api/api"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/utils'),
      code: 'import "react"',
      errors: [{ messageId: 'platform' }],
    },
    {
      filename: file('packages/config'),
      code: 'import "node:fs"',
      errors: [{ messageId: 'platform' }],
    },
    {
      filename: file('packages/utils'),
      code: 'import type { X } from "@inzpro/db"',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/utils'),
      code: 'export type X = import("@inzpro/db").X',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/utils'),
      code: 'export const load = () => import("@inzpro/db")',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/utils'),
      code: 'export const load = () => import(`@inzpro/db`)',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/utils'),
      code: 'const value = require("@inzpro/db")',
      errors: [{ messageId: 'dependency' }],
    },
    {
      filename: file('packages/api-client'),
      code: 'import "@inzpro/testing/http"',
      errors: [{ messageId: 'testOnly' }],
    },
    {
      filename: file('packages/utils'),
      code: 'import "./date.test.ts"',
      errors: [{ messageId: 'testOnly' }],
    },
    {
      filename: file('apps/api', 'http.ts'),
      code: 'import "~api/test/api-server"',
      errors: [{ messageId: 'testOnly' }],
    },
    {
      filename: file('apps/api', 'modules/http.ts'),
      code: 'import "../test/api-server"',
      errors: [{ messageId: 'testOnly' }],
    },
  ],
})
