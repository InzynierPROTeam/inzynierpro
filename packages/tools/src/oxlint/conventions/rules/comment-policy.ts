import { defineRule } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

const markedException = /^(EXTERNAL|CONTRACT|SAFETY|TODO(?:\(#\d+\))?|TESTID):\s*\S/

const toolDirective =
  /^(?:oxlint-(?:disable|enable)\b|eslint-(?:disable|enable)\b|@(?:ts-check|ts-nocheck|ts-expect-error|ts-ignore|vitest-environment|deprecated|internal)\b|\/\s*<reference\b|[#@]__(?:PURE|NO_SIDE_EFFECTS)__\b|@vite-ignore\b)/

const legalNotice = /^(?:@license\b|@preserve\b|SPDX-License-Identifier:|Copyright\b)/i

export const commentPolicyRule = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'Keep source comments limited to explicit, reviewed exceptions.' },
    schema: [],
    messages: {
      prose:
        'Express this in names, types or code. Comments require an explicit exception from CODING_STANDARDS.md#comments.',
      internalContract:
        'CONTRACT comments belong at public HTTP boundaries, not internal models, ports or implementations.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (
      filename.includes('/vendor/') ||
      filename.endsWith('/apps/platform/src/routeTree.gen.ts') ||
      filename.endsWith('/apps/platform/src/types/icons.ts')
    ) {
      return {}
    }

    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const text = comment.value.replace(/^\s*\* ?/gm, '').trim()
          const exception = text.match(markedException)

          if (exception?.[1] === 'CONTRACT' && !filename.includes('/packages/api-contracts/src/')) {
            context.report({ loc: comment.loc, messageId: 'internalContract' })
          } else if (
            exception === null &&
            comment.type !== 'Shebang' &&
            !toolDirective.test(text) &&
            !legalNotice.test(text)
          ) {
            context.report({ loc: comment.loc, messageId: 'prose' })
          }
        }
      },
    }
  },
})
