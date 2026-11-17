import { defineRule, type ESTree } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

const richSchemas = new Set([
  'Date',
  'DateTimeUtc',
  'DateTimeUtcFromString',
  'DateTimeUtcFromDate',
  'DateTimeZoned',
  'Option',
  'OptionFromNullOr',
  'OptionFromOptional',
  'Class',
])

const decodesNumberFromString = (node: ESTree.MemberExpression) => {
  const decodeTo = node.parent

  if (decodeTo?.type !== 'CallExpression' || decodeTo.callee !== node) {
    return false
  }

  const pipe = decodeTo.parent

  return (
    pipe?.type === 'CallExpression' &&
    pipe.arguments.includes(decodeTo) &&
    pipe.callee.type === 'MemberExpression' &&
    pipe.callee.property.type === 'Identifier' &&
    pipe.callee.property.name === 'pipe' &&
    pipe.callee.object.type === 'MemberExpression' &&
    pipe.callee.object.property.type === 'Identifier' &&
    pipe.callee.object.property.name === 'FiniteFromString'
  )
}

export const dateBoundariesRule = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      json: 'HTTP DTOs must preserve JSON: use UtcIsoDateTime and Schema.NullOr, without runtime transformations.',
      client:
        'Keep date operations in @inzpro/utils/date; client state and query caches contain ISO strings and null.',
      backend:
        'Use the module model with DateTimeUtc and Option inside backend operations; map ISO/null at SQL and HTTP boundaries.',
      serializer:
        'Keep client data JSON-compatible instead of adding a custom serialization adapter.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(filename)) {
      return {}
    }

    const transport =
      filename.includes('/packages/domain/src/modules/') ||
      (filename.includes('/packages/api-contracts/src/') &&
        !/(?:\/errors\.ts$|\/errors\/)/.test(filename))

    const requestSchemas =
      filename.includes('/packages/api-contracts/src/') &&
      (/(?:\/requests\.ts$|\/requests\/)/.test(filename) ||
        filename.endsWith('/utils/pagination.ts'))

    const client = /\/apps\/(platform|web|admin|mobile)\/src\//.test(filename)

    const backend = /\/apps\/api\/src\/modules\/[^/]+\/(?:domain|application)\//.test(filename)

    const schemaNamespaces = new Set<string>()
    const effectNamespaces = new Set<string>()
    const dateNamespaces = new Set<string>()

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') {
            if (/\/common\/date-time(?:\.js)?$/.test(source)) {
              dateNamespaces.add(specifier.local.name)
            }

            if (source === 'effect/Schema') {
              schemaNamespaces.add(specifier.local.name)
            }

            if (source === 'effect') {
              effectNamespaces.add(specifier.local.name)
            }
          }

          if (specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier') {
            continue
          }

          const name = specifier.imported.name

          if (source === 'effect' && name === 'Schema') {
            schemaNamespaces.add(specifier.local.name)
          }

          if (
            transport &&
            (((source.endsWith('/date-time') || source.endsWith('/date-time.js')) &&
              name === 'DateTimeUtc') ||
              (source === 'effect/Schema' && richSchemas.has(name)))
          ) {
            context.report({ node: specifier, messageId: 'json' })
          }

          if (
            client &&
            node.importKind !== 'type' &&
            specifier.importKind !== 'type' &&
            ((source === 'effect' && ['DateTime', 'Clock'].includes(name)) ||
              (/\/common\/date-time(?:\.js)?$/.test(source) && name !== 'UtcIsoDateTime'))
          ) {
            context.report({ node: specifier, messageId: 'client' })
          }

          if (backend && name === 'UtcIsoDateTime') {
            context.report({ node: specifier, messageId: 'backend' })
          }
        }

        if (
          client &&
          ['effect/DateTime', 'effect/Clock'].includes(source) &&
          node.importKind !== 'type'
        ) {
          context.report({ node, messageId: 'client' })
        }
      },
      MemberExpression(node) {
        if (node.property.type !== 'Identifier') {
          return
        }

        const name = node.property.name

        if (
          transport &&
          name === 'DateTimeUtc' &&
          node.object.type === 'Identifier' &&
          dateNamespaces.has(node.object.name)
        ) {
          context.report({ node, messageId: 'json' })
        }

        if (
          transport &&
          node.object.type === 'Identifier' &&
          schemaNamespaces.has(node.object.name) &&
          (richSchemas.has(name) || ['decodeTo', 'encodeTo'].includes(name)) &&
          !(requestSchemas && name === 'decodeTo' && decodesNumberFromString(node))
        ) {
          context.report({ node, messageId: 'json' })
        }

        if (
          client &&
          node.object.type === 'Identifier' &&
          effectNamespaces.has(node.object.name) &&
          ['DateTime', 'Clock'].includes(name)
        ) {
          context.report({ node, messageId: 'client' })
        }
      },
      TSPropertySignature(node) {
        const annotation = node.typeAnnotation?.typeAnnotation

        if (
          backend &&
          node.key.type === 'Identifier' &&
          /(?:At|Date|Until|Timestamp)$/.test(node.key.name) &&
          (annotation?.type === 'TSStringKeyword' ||
            (annotation?.type === 'TSTypeReference' &&
              annotation.typeName.type === 'Identifier' &&
              annotation.typeName.name === 'Date'))
        ) {
          context.report({ node, messageId: 'backend' })
        }
      },
      Property(node) {
        if (
          backend &&
          node.key.type === 'Identifier' &&
          /(?:At|Date|Until|Timestamp)$/.test(node.key.name) &&
          node.value.type === 'MemberExpression' &&
          node.value.property.type === 'Identifier' &&
          node.value.property.name === 'String' &&
          node.value.object.type === 'Identifier' &&
          schemaNamespaces.has(node.value.object.name)
        ) {
          context.report({ node, messageId: 'backend' })
        }

        if (
          (client || filename.includes('/packages/react-utils/src/')) &&
          node.key.type === 'Identifier' &&
          node.key.name === 'serializationAdapters'
        ) {
          context.report({ node, messageId: 'serializer' })
        }
      },
    }
  },
})
