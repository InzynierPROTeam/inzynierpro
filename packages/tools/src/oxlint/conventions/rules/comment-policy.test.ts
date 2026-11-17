import { RuleTester } from 'oxlint/plugins-dev'

import { commentPolicyRule } from './comment-policy.ts'

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } })
const filename = '/repo/apps/platform/src/features/oralSession/components/OralSessionHeader.tsx'
const contract = '/repo/packages/api-contracts/src/modules/study/responses.ts'
const prose = { messageId: 'prose' }

tester.run('conventions/comment-policy', commentPolicyRule, {
  valid: [
    { filename, code: 'const text = "// The question card explains a missing session."' },
    { filename, code: 'const fixture = `/** Describes a fixture function. */`' },
    { filename, code: 'const url = "https://example.com"' },
    {
      filename,
      code: '// EXTERNAL: Router history restores scroll on back navigation.\nconst x = 1',
    },
    { filename, code: '/* EXTERNAL: Provider rejects empty messages. */ const x = 1' },
    {
      filename,
      code: '/* SAFETY: Input was decoded above.\n * Its identifier brand is preserved.\n */\nconst x = input as Id',
    },
    { filename, code: '// TODO: Add the account deletion endpoint.\nconst x = 1' },
    { filename, code: '// TODO(#61): Implement oral reviews.\nconst x = 1' },
    { filename, code: '// TESTID: The canvas has no accessible child elements.\nconst x = 1' },
    {
      filename: contract,
      code: '/** CONTRACT: Null means no review is scheduled. */\nconst x = 1',
    },
    { filename, code: '// @vitest-environment jsdom\nconst x = 1' },
    { filename, code: '/// <reference types="vite/client" />' },
    { filename, code: '// @ts-expect-error Invalid input is intentional.\nconst x = 1' },
    { filename, code: '/** @deprecated Use current instead. */\nconst x = 1' },
    { filename, code: '// oxlint-disable-next-line no-console -- CLI output\nconsole.log(1)' },
    { filename, code: '/* Copyright Example contributors */\nconst x = 1' },
    { filename, code: '/* SPDX-License-Identifier: MIT */\nconst x = 1' },
    { filename, code: 'const x = /*#__PURE__*/ makeValue()' },
    { filename, code: '#!/usr/bin/env node\nconst x = 1' },
    { filename: '/repo/apps/platform/src/routeTree.gen.ts', code: '// Generated route tree' },
    { filename: '/repo/packages/tools/src/vendor/upstream.ts', code: '// Upstream documentation' },
  ],
  invalid: [
    {
      filename: '/repo/packages/api-contracts/src/modules/study/fake.gen.ts',
      code: '// Generated-looking narration\nexport const value = 1',
      errors: [prose],
    },
    {
      filename,
      code: '// The question card explains a missing session.\nconst x = 1',
      errors: [prose],
    },
    {
      filename,
      code: 'const Card = () => <Panel\n// Moving between questions does not add history entries.\nreplace />',
      errors: [prose],
    },
    { filename, code: '/** The material a session covers. */\nconst x = 1', errors: [prose] },
    { filename, code: 'const Card = () => <div>{/* Heading */}</div>', errors: [prose] },
    { filename, code: '// ===== helpers =====\nconst x = 1', errors: [prose] },
    { filename, code: '// EXTERNAL:\nconst x = 1', errors: [prose] },
    { filename, code: '// Because EXTERNAL: this is useful\nconst x = 1', errors: [prose] },
    {
      filename,
      code: '// @vitest-environment jsdom\n// Arrange the account.\nconst x = 1',
      errors: [prose],
    },
    {
      filename,
      code: '// EXTERNAL: Provider needs this.\n\n// Describe the next step.\nconst x = 1',
      errors: [prose],
    },
    {
      filename,
      code: '// EXTERNAL: Provider needs this.\n// Describe the next step.\nconst x = 1',
      errors: [prose],
    },
    {
      filename,
      code: '// SAFETY: Input was decoded.\n// Arrange the user.\nconst x = input as Id',
      errors: [prose],
    },
    {
      filename,
      code: '// CONTRACT: The session counts completed questions.\nconst x = 1',
      errors: [{ messageId: 'internalContract' }],
    },
    {
      filename: contract,
      code: '/** The review preview response. */\nconst x = 1',
      errors: [prose],
    },
  ],
})
