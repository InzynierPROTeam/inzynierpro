import { defineRule } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

const requestParts = new Set(['params', 'query', 'payload', 'headers'])

export const requestSchemasRule = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'Keep endpoint request schemas in the module requests.ts.' },
    schema: [],
    messages: {
      misplaced: 'Define request schemas in the module requests.ts and import them into api.ts.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (!/\/packages\/api-contracts\/src\/modules\/[^/]+\/api\.ts$/.test(filename)) {
      return {}
    }

    const requestSchemas = new Set<string>()
    const endpointFactories = new Set<string>()

    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (/(^|\/)requests(\.js)?$/.test(node.source.value)) {
            requestSchemas.add(specifier.local.name)
          }

          if (
            node.source.value === 'effect/http-api' &&
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'HttpApiEndpoint'
          ) {
            endpointFactories.add(specifier.local.name)
          }
        }
      },
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          node.callee.object.type !== 'Identifier' ||
          !endpointFactories.has(node.callee.object.name)
        ) {
          return
        }

        for (const argument of node.arguments) {
          if (argument.type !== 'ObjectExpression') {
            continue
          }

          for (const property of argument.properties) {
            if (
              property.type === 'Property' &&
              property.key.type === 'Identifier' &&
              requestParts.has(property.key.name) &&
              (property.value.type !== 'Identifier' || !requestSchemas.has(property.value.name))
            ) {
              context.report({ node: property, messageId: 'misplaced' })
            }
          }
        }
      },
    }
  },
})
