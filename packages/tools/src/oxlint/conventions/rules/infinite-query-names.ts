import { defineRule } from '@oxlint/plugins'

import { isModuleSource } from './path.ts'

export const infiniteQueryNamesRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: { description: 'Name infinite query factories with the InfiniteQueryOptions suffix.' },
    schema: [],
    messages: {
      name: 'Name this factory {{name}}InfiniteQueryOptions so its cache shape is explicit.',
    },
  },
  create(context) {
    if (!isModuleSource(context.filename, 'queries')) {
      return {}
    }

    const factories = new Set<string>()
    const namespaces = new Set<string>()

    return {
      ImportDeclaration(node) {
        if (!/\/effect-query-options(?:\.js)?$/.test(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'effectInfiniteQueryOptions'
          ) {
            factories.add(specifier.local.name)
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            namespaces.add(specifier.local.name)
          }
        }
      },
      CallExpression(node) {
        const callee = node.callee

        const matches =
          (callee.type === 'Identifier' && factories.has(callee.name)) ||
          (callee.type === 'MemberExpression' &&
            !callee.computed &&
            callee.object.type === 'Identifier' &&
            namespaces.has(callee.object.name) &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'effectInfiniteQueryOptions')

        if (!matches) {
          return
        }

        let owner = node.parent

        while (owner !== null && owner.type !== 'Program') {
          if (
            owner.type === 'VariableDeclarator' &&
            owner.id.type === 'Identifier' &&
            (owner.init?.type === 'ArrowFunctionExpression' ||
              owner.init?.type === 'FunctionExpression')
          ) {
            if (!owner.id.name.endsWith('InfiniteQueryOptions')) {
              context.report({
                node: owner.id,
                messageId: 'name',
                data: { name: owner.id.name.replace(/QueryOptions$/, '') },
              })
            }

            return
          }

          if (owner.type === 'FunctionDeclaration' && owner.id !== null) {
            if (!owner.id.name.endsWith('InfiniteQueryOptions')) {
              context.report({
                node: owner.id,
                messageId: 'name',
                data: { name: owner.id.name.replace(/QueryOptions$/, '') },
              })
            }

            return
          }

          owner = owner.parent
        }
      },
    }
  },
})
