import { defineRule } from '@oxlint/plugins'

export const preferCxRule = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      conditional: 'Compose conditional classes inside cx.',
    },
  },
  create(context) {
    return {
      ConditionalExpression(node) {
        let parent = node.parent

        while (parent.type !== 'Program') {
          if (
            parent.type === 'CallExpression' &&
            parent.callee.type === 'Identifier' &&
            parent.callee.name === 'cx'
          ) {
            return
          }

          if (parent.type === 'ArrowFunctionExpression' || parent.type === 'FunctionExpression') {
            return
          }

          if (parent.type === 'JSXAttribute') {
            if (parent.name.type === 'JSXIdentifier' && parent.name.name === 'className') {
              context.report({ node, messageId: 'conditional' })
            }

            return
          }

          parent = parent.parent
        }
      },
    }
  },
})
