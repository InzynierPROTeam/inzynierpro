import { defineRule, type ESTree } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

const operationFile = /\/apps\/api\/src\/modules\/([^/]+)\/application\/[^/]+\.(command|query)\.ts$/

const adapterFile =
  /\/apps\/api\/src\/modules\/[^/]+\/infrastructure\/[^/]+\.(reader|repository)\.postgres\.ts$/

const pascalCase = (kebab: string) =>
  kebab
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const effectFnSpanName = (node: ESTree.Node | null | undefined) => {
  if (node?.type !== 'CallExpression' || node.callee.type !== 'CallExpression') {
    return undefined
  }

  const { callee, arguments: args } = node.callee

  if (
    callee.type !== 'MemberExpression' ||
    callee.object.type !== 'Identifier' ||
    callee.object.name !== 'Effect' ||
    callee.property.type !== 'Identifier' ||
    callee.property.name !== 'fn'
  ) {
    return undefined
  }

  const [name] = args

  return name?.type === 'Literal' ? String(name.value) : ''
}

export const tracedBackendOperationsRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Build API commands, queries and PostgreSQL adapter methods with Effect.fn so each call gets a span.',
    },
    schema: [],
    messages: {
      untraced: "Build `{{name}}` with `Effect.fn('{{span}}')` so the operation gets a span.",
      misnamed: 'Name the span of `{{name}}` after its owner, for example `{{span}}`.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    const check = (
      node: ESTree.Node,
      name: string,
      value: ESTree.Node | null | undefined,
      span: string,
    ) => {
      if (value?.type === 'ArrowFunctionExpression' || value?.type === 'FunctionExpression') {
        context.report({ node, messageId: 'untraced', data: { name, span } })

        return
      }

      const actual = effectFnSpanName(value)

      if (actual !== undefined && !actual.endsWith(`.${name}`)) {
        context.report({ node, messageId: 'misnamed', data: { name, span } })
      }
    }

    const operation = filename.match(operationFile)

    if (operation !== null) {
      const owner = pascalCase(operation[1] ?? '')

      return {
        ExportNamedDeclaration(node) {
          if (node.declaration?.type !== 'VariableDeclaration') {
            return
          }

          for (const declarator of node.declaration.declarations) {
            if (declarator.id.type === 'Identifier') {
              const { name } = declarator.id

              check(declarator, name, declarator.init, `${owner}.${name}`)
            }
          }
        },
      }
    }

    if (!adapterFile.test(filename)) {
      return {}
    }

    return {
      CallExpression(node) {
        const { callee } = node
        const [implementation] = node.arguments

        if (
          callee.type !== 'MemberExpression' ||
          callee.object.type !== 'Identifier' ||
          callee.property.type !== 'Identifier' ||
          callee.property.name !== 'of' ||
          implementation?.type !== 'ObjectExpression'
        ) {
          return
        }

        for (const property of implementation.properties) {
          if (property.type === 'Property' && property.key.type === 'Identifier') {
            const { name } = property.key

            check(property, name, property.value, `${callee.object.name}.${name}`)
          }
        }
      },
    }
  },
})
