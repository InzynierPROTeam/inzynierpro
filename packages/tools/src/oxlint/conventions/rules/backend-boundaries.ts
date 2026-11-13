import { defineRule } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

export const backendBoundariesRule = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'Keep API SQL in PostgreSQL adapters, migrations and explicit seeds.' },
    schema: [],
    messages: {
      sql: 'Keep SQL in a *.reader.postgres.ts or *.repository.postgres.ts adapter, migration or seed. Tests prepare data through repositories.',
      filename:
        'Name backend operations <concept>.<role>.ts; transport belongs in the module http/handlers.ts.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (!filename.includes('/apps/api/src/')) {
      return {}
    }

    const sqlAllowed =
      /\/src\/(migrations|seed)\//.test(filename) ||
      /\.(reader|repository)\.postgres\.ts$/.test(filename)

    const inModule = filename.includes('/src/modules/')
    const httpBuilders = new Set<string>()

    return {
      Program(node) {
        if (
          inModule &&
          (/\/(service|reader|repository|query|command|policy|rules)(\.postgres)?\.ts$/.test(
            filename,
          ) ||
            /[^/]\.http\.ts$/.test(filename))
        ) {
          context.report({ node, messageId: 'filename' })
        }
      },
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (
            node.source.value === 'effect/http-api' &&
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'HttpApiBuilder'
          ) {
            httpBuilders.add(specifier.local.name)
          }
        }

        if (
          !sqlAllowed &&
          (node.source.value === 'effect/sql/SqlClient' ||
            (node.source.value === 'effect/sql' &&
              node.specifiers.some(
                specifier =>
                  specifier.type === 'ImportNamespaceSpecifier' ||
                  (specifier.type === 'ImportSpecifier' &&
                    specifier.imported.type === 'Identifier' &&
                    specifier.imported.name === 'SqlClient'),
              )))
        ) {
          context.report({ node, messageId: 'sql' })
        }
      },
      CallExpression(node) {
        if (
          inModule &&
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          httpBuilders.has(node.callee.object.name) &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'group' &&
          !/\/src\/modules\/[^/]+\/http\/(?:[a-z0-9-]+\.)?handlers\.ts$/.test(filename)
        ) {
          context.report({ node, messageId: 'filename' })
        }
      },
      TaggedTemplateExpression(node) {
        const first = node.quasi.quasis[0]?.value.raw ?? ''

        if (
          !sqlAllowed &&
          /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP|SET\s+TRANSACTION)\b/i.test(
            first,
          )
        ) {
          context.report({ node, messageId: 'sql' })
        }
      },
    }
  },
})
