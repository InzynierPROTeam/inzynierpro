import { defineRule, type ESTree } from '@oxlint/plugins'
import { Predicate } from 'effect'

import { normalizedPath } from './path.ts'

function isClassContext(node: ESTree.Node): boolean {
  let parent = node.parent

  while (parent !== null) {
    if (parent.type === 'JSXAttribute') {
      return (
        parent.name.type === 'JSXIdentifier' &&
        (parent.name.name === 'className' || parent.name.name === 'class')
      )
    }

    if (
      parent.type === 'CallExpression' &&
      parent.callee.type === 'Identifier' &&
      ['cn', 'cx', 'tv', 'clsx'].includes(parent.callee.name)
    ) {
      return true
    }

    if (parent.type === 'VariableDeclarator') {
      return parent.id.type === 'Identifier' && /class(?:es|Name)?$/i.test(parent.id.name)
    }

    if (parent.type === 'Program') {
      return false
    }

    parent = parent.parent
  }

  return false
}

const hasSpaceUtility = (text: string) =>
  text.split(/\s+/).some(token => /(?:^|:)!?-?space-[xy]-/.test(token))

export const preferGapRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: { description: 'Use flex or grid with gap utilities for layout spacing.' },
    schema: [],
    messages: {
      gap: 'Use a flex or grid container with gap utilities instead of space-x/space-y. Use child margins when overlap is intentional.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (
      !/\/(apps\/[^/]+|packages\/ui)\/src\/.*\.[jt]sx?$/.test(filename) ||
      /\.(test|spec)\.[jt]sx?$/.test(filename)
    ) {
      return {}
    }

    return {
      Literal(node) {
        if (Predicate.isString(node.value) && hasSpaceUtility(node.value) && isClassContext(node)) {
          context.report({ node, messageId: 'gap' })
        }
      },
      TemplateElement(node) {
        if (hasSpaceUtility(node.value.raw) && isClassContext(node)) {
          context.report({ node, messageId: 'gap' })
        }
      },
    }
  },
})
