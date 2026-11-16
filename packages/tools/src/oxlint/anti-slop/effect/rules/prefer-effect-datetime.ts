import { defineRule, type ESTree, type Scope, type SourceCode } from '@oxlint/plugins'
import { Predicate } from 'effect'

function unwrap(node: ESTree.Node): ESTree.Node {
  while (
    node.type === 'ParenthesizedExpression' ||
    node.type === 'ChainExpression' ||
    node.type === 'TSAsExpression' ||
    node.type === 'TSTypeAssertion' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'TSSatisfiesExpression'
  ) {
    node = node.expression
  }

  return node
}

function memberName(node: ESTree.Node): string | null {
  if (node.type !== 'MemberExpression') {
    return null
  }

  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name
  }

  return node.computed &&
    node.property.type === 'Literal' &&
    Predicate.isString(node.property.value)
    ? node.property.value
    : null
}

function isGlobalIdentifier(sourceCode: SourceCode, node: ESTree.Node, name: string): boolean {
  if (node.type !== 'Identifier' || node.name !== name) {
    return false
  }

  let scope: Scope | null = sourceCode.getScope(node)

  while (scope !== null) {
    const variable = scope.set.get(name)

    if (variable !== undefined) {
      return variable.defs.length === 0
    }

    scope = scope.upper
  }

  return true
}

function isGlobalBuiltin(sourceCode: SourceCode, expression: ESTree.Node, name: string): boolean {
  const node = unwrap(expression)

  if (isGlobalIdentifier(sourceCode, node, name)) {
    return true
  }

  if (node.type !== 'MemberExpression' || memberName(node) !== name) {
    return false
  }

  const owner = unwrap(node.object)

  return ['globalThis', 'window', 'global', 'self'].some(ownerName =>
    isGlobalIdentifier(sourceCode, owner, ownerName),
  )
}

export const preferEffectDateTimeRule = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'Use Effect DateTime and Clock instead of native date/time operations.' },
    messages: {
      nativeDateTime: 'Use Effect DateTime or Clock instead of {{api}} for date/time operations.',
    },
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (node.init && isGlobalBuiltin(context.sourceCode, node.init, 'Date')) {
          context.report({ node, messageId: 'nativeDateTime', data: { api: 'Date' } })
        }
      },
      NewExpression(node) {
        if (isGlobalBuiltin(context.sourceCode, node.callee, 'Date')) {
          context.report({ node, messageId: 'nativeDateTime', data: { api: 'new Date()' } })
        }
      },
      CallExpression(node) {
        if (isGlobalBuiltin(context.sourceCode, node.callee, 'Date')) {
          context.report({ node, messageId: 'nativeDateTime', data: { api: 'Date()' } })
        }
      },
      MemberExpression(node) {
        if (isGlobalBuiltin(context.sourceCode, node.object, 'Date')) {
          context.report({
            node,
            messageId: 'nativeDateTime',
            data: { api: `Date.${memberName(node) ?? '[method]'}` },
          })
        } else if (
          memberName(node) === 'DateTimeFormat' &&
          isGlobalBuiltin(context.sourceCode, node.object, 'Intl')
        ) {
          context.report({
            node,
            messageId: 'nativeDateTime',
            data: { api: 'Intl.DateTimeFormat' },
          })
        }
      },
    }
  },
})
