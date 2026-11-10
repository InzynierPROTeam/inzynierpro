import { defineRule } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

export const domainIdentifiersRule = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'Build domain identifiers from the shared branded Uuid schema.' },
    schema: [],
    messages: {
      uuid: 'Reuse Uuid from domain/common/id and apply the semantic brand instead of redefining UUID validation.',
      filename: 'Keep identifiers with their concept in <concept>.ts, without the -id suffix.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (
      !filename.includes('/packages/domain/src/modules/') ||
      /\.(test|spec)\.ts$/.test(filename)
    ) {
      return {}
    }

    const uuidNames = new Set<string>()

    return {
      ImportDeclaration(node) {
        if (!/\/common\/id(\.js)?$/.test(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.type === 'Identifier' &&
            specifier.imported.name === 'Uuid'
          ) {
            uuidNames.add(specifier.local.name)
          }
        }
      },
      ExportNamedDeclaration(node) {
        if (node.declaration?.type !== 'VariableDeclaration') {
          return
        }

        for (const declaration of node.declaration.declarations) {
          const init = declaration.init
          const name = declaration.id.type === 'Identifier' ? declaration.id.name : undefined

          if (
            declaration.id.type === 'Identifier' &&
            declaration.id.name.endsWith('Id') &&
            (init?.type !== 'CallExpression' ||
              init.callee.type !== 'MemberExpression' ||
              init.callee.object.type !== 'Identifier' ||
              !uuidNames.has(init.callee.object.name) ||
              init.callee.property.type !== 'Identifier' ||
              init.callee.property.name !== 'pipe' ||
              !init.arguments.some(
                argument =>
                  argument.type === 'CallExpression' &&
                  argument.callee.type === 'MemberExpression' &&
                  argument.callee.property.type === 'Identifier' &&
                  argument.callee.property.name === 'brand' &&
                  argument.arguments[0]?.type === 'Literal' &&
                  argument.arguments[0].value === name,
              ))
          ) {
            context.report({ node: declaration, messageId: 'uuid' })
          }
        }
      },
      Program(node) {
        if (filename.endsWith('-id.ts')) {
          context.report({ node, messageId: 'filename' })
        }
      },
    }
  },
})
