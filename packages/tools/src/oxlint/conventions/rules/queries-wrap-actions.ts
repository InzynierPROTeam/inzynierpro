import { defineRule } from '@oxlint/plugins'

import { isModuleSource } from './path.ts'

export const queriesWrapActionsRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Query modules only wrap api-client actions in query options.',
    },
    schema: [],
    messages: {
      logic:
        'Query modules only pass an api-client action to effectQueryOptions. Put behaviour in the action or in the consumer.',
    },
  },
  create(context) {
    if (!isModuleSource(context.filename, 'queries')) {
      return {}
    }

    return {
      CallExpression(node) {
        const callee = node.callee

        const name =
          callee.type === 'Identifier'
            ? callee.name
            : callee.type === 'MemberExpression' && callee.object.type === 'Identifier'
              ? callee.object.name
              : undefined

        const method =
          callee.type === 'MemberExpression' && callee.property.type === 'Identifier'
            ? callee.property.name
            : undefined

        if (name === 'pipe' || method === 'pipe' || name === 'Effect') {
          context.report({ node, messageId: 'logic' })
        }
      },
    }
  },
})
