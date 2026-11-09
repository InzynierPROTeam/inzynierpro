import { defineRule } from '@oxlint/plugins'

const routeHooks = new Set([
  'useSearch',
  'useParams',
  'useRouteContext',
  'useLoaderData',
  'useLoaderDeps',
])

export const noSpreadRouteHooksRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Read route state where it is used instead of spreading it into props.',
    },
    schema: [],
    messages: {
      spread:
        'Pass the route component directly and read `{{hook}}` inside it through a getRouteApi constant in features/<feature>/utils.ts.',
    },
  },
  create(context) {
    return {
      JSXSpreadAttribute(node) {
        const argument = node.argument

        if (
          argument.type === 'CallExpression' &&
          argument.callee.type === 'MemberExpression' &&
          argument.callee.property.type === 'Identifier' &&
          routeHooks.has(argument.callee.property.name)
        ) {
          context.report({
            node,
            messageId: 'spread',
            data: { hook: argument.callee.property.name },
          })
        }
      },
    }
  },
})
