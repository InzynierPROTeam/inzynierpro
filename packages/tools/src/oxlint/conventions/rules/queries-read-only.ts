import { defineRule } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { normalizedPath } from './path.ts'

const writes = /\.(?:repository(?:\.postgres)?|command)(?:\.[cm]?[jt]s)?$/

export const queriesReadOnlyRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Query operations depend on readers, not write repositories or commands.',
    },
    schema: [],
    messages: {
      write:
        'Use readers and read-only policies in queries. Write repositories and commands belong in command operations.',
    },
  },
  create(context) {
    if (!/\/apps\/api\/src\/modules\/.*\.query\.ts$/.test(normalizedPath(context.filename))) {
      return {}
    }

    return {
      ImportDeclaration(node) {
        if (writes.test(node.source.value)) {
          context.report({ node, messageId: 'write' })
        }
      },
      ImportExpression(node) {
        if (
          node.source.type === 'Literal' &&
          Predicate.isString(node.source.value) &&
          writes.test(node.source.value)
        ) {
          context.report({ node, messageId: 'write' })
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments[0]?.type === 'Literal' &&
          Predicate.isString(node.arguments[0].value) &&
          writes.test(node.arguments[0].value)
        ) {
          context.report({ node, messageId: 'write' })
        }
      },
    }
  },
})
