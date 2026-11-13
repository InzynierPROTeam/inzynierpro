import { defineRule, type ESTree } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { normalizedPath } from './path.ts'

const factors = (node: ESTree.Node): number[] => {
  if (node.type === 'Literal' && Predicate.isNumber(node.value)) {
    return [node.value]
  }

  if (node.type === 'BinaryExpression' && node.operator === '*') {
    return [...factors(node.left), ...factors(node.right)]
  }

  return []
}

export const preferDurationRule = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      duration:
        'Use Effect Duration constructors and conversions for time intervals instead of manual unit arithmetic or an unexplained numeric timeout.',
    },
  },
  create(context) {
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(normalizedPath(context.filename))) {
      return {}
    }

    return {
      BinaryExpression(node) {
        const values = factors(node)

        if (
          node.operator === '*' &&
          !(node.parent.type === 'BinaryExpression' && node.parent.operator === '*') &&
          (values.filter(value => value === 60).length >= 2 ||
            (values.includes(1000) && values.some(value => [60, 24].includes(value))) ||
            (values.includes(24) && values.includes(60)))
        ) {
          context.report({ node, messageId: 'duration' })
        }
      },
      Property(node) {
        if (
          node.key.type === 'Identifier' &&
          /^(maxAge|staleTime|gcTime|timeout|timeoutMs|ttl)$/.test(node.key.name) &&
          node.value.type === 'Literal' &&
          Predicate.isNumber(node.value.value) &&
          node.value.value > 0
        ) {
          context.report({ node, messageId: 'duration' })
        }
      },
      CallExpression(node) {
        const delay = node.arguments[1]

        if (
          node.callee.type === 'Identifier' &&
          ['setTimeout', 'setInterval'].includes(node.callee.name) &&
          delay?.type === 'Literal' &&
          Predicate.isNumber(delay.value) &&
          delay.value > 0
        ) {
          context.report({ node: delay, messageId: 'duration' })
        }
      },
    }
  },
})
