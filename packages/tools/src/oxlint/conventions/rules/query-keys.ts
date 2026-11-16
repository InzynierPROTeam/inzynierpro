import { defineRule } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

export const queryKeysRule = defineRule({
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      factory: 'Get the query key from a function on the module XKeys object.',
      extension:
        'Define key arrays inside XKeys; consumers call its functions instead of extending keys.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (!/\.[cm]?[jt]sx?$/.test(filename) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(filename)) {
      return {}
    }

    const factories = new Set(['effectQueryOptions', 'effectInfiniteQueryOptions'])
    const aliases = new Set<string>()

    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier') {
            continue
          }

          if (specifier.imported.name.endsWith('Keys')) {
            aliases.add(specifier.local.name)
          }

          if (
            /\/effect-query-options(?:\.[cm]?[jt]s)?$/.test(node.source.value) &&
            factories.has(specifier.imported.name)
          ) {
            factories.add(specifier.local.name)
          }
        }
      },
      CallExpression(node) {
        if (
          !filename.includes('/packages/queries/src/modules/') ||
          node.callee.type !== 'Identifier' ||
          !factories.has(node.callee.name)
        ) {
          return
        }

        const key = node.arguments[0]

        if (
          key?.type !== 'CallExpression' ||
          key.callee.type !== 'MemberExpression' ||
          key.callee.object.type !== 'Identifier' ||
          !(key.callee.object.name.endsWith('Keys') || aliases.has(key.callee.object.name))
        ) {
          context.report({ node: key ?? node, messageId: 'factory' })
        }
      },
      ArrayExpression(node) {
        const extendsKeys = node.elements.some(element => {
          if (element?.type !== 'SpreadElement') {
            return false
          }

          let source = element.argument

          if (source.type === 'CallExpression') {
            source = source.callee
          }

          return (
            source.type === 'MemberExpression' &&
            source.object.type === 'Identifier' &&
            (source.object.name.endsWith('Keys') || aliases.has(source.object.name))
          )
        })

        if (!extendsKeys) {
          return
        }

        let parent = node.parent

        if (
          parent.type === 'CallExpression' &&
          parent.callee.type === 'Identifier' &&
          factories.has(parent.callee.name) &&
          filename.includes('/packages/queries/src/modules/')
        ) {
          return
        }

        while (parent.type !== 'Program') {
          if (parent.type === 'VariableDeclarator') {
            if (
              parent.id.type === 'Identifier' &&
              parent.id.name.endsWith('Keys') &&
              parent.init?.type === 'ObjectExpression'
            ) {
              return
            }

            break
          }

          parent = parent.parent
        }

        context.report({ node, messageId: 'extension' })
      },
    }
  },
})
