import { defineRule } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

const objectSchemas = new Set([
  'Struct',
  'TaggedStruct',
  'Class',
  'TaggedClass',
  'TaggedError',
  'ErrorClass',
])

export const domainVocabularyRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep @inzpro/domain to vocabulary; object shapes belong to api-contracts or API module models.',
    },
    schema: [],
    messages: {
      object:
        '@inzpro/domain holds vocabulary only. Define HTTP shapes in @inzpro/api-contracts and backend models in the owning API module domain/ folder.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (!filename.includes('/packages/domain/src/') || /\.(test|spec)\.ts$/.test(filename)) {
      return {}
    }

    const schemaNamespaces = new Set<string>()

    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (
            node.source.value === 'effect/Schema' &&
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            objectSchemas.has(specifier.imported.name)
          ) {
            context.report({ node: specifier, messageId: 'object' })
          }

          if (
            (node.source.value === 'effect' &&
              specifier.type === 'ImportSpecifier' &&
              specifier.imported.type === 'Identifier' &&
              specifier.imported.name === 'Schema') ||
            (node.source.value === 'effect/Schema' && specifier.type === 'ImportNamespaceSpecifier')
          ) {
            schemaNamespaces.add(specifier.local.name)
          }
        }
      },
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          schemaNamespaces.has(node.object.name) &&
          node.property.type === 'Identifier' &&
          objectSchemas.has(node.property.name)
        ) {
          context.report({ node, messageId: 'object' })
        }
      },
    }
  },
})
