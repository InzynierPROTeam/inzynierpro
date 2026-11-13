import { defineRule, type ESTree } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

export const pageSectionsRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Compose feature pages from sections owned by the feature components folder.',
    },
    schema: [],
    messages: {
      sections:
        'Keep the page as a composition of *Section components imported from this feature’s components folder. Put hooks and markup inside those sections.',
    },
  },
  create(context) {
    const match = /\/apps\/[^/]+\/src\/features\/([^/]+)\/([A-Z][^/]*Page)\.tsx$/.exec(
      normalizedPath(context.filename),
    )

    const feature = match?.[1]
    const page = match?.[2]

    if (feature === undefined || page === undefined) {
      return {}
    }

    const sections = new Set<string>()

    function isSection(node: ESTree.Node): boolean {
      if (node.type === 'JSXElement') {
        return (
          node.openingElement.name.type === 'JSXIdentifier' &&
          sections.has(node.openingElement.name.name) &&
          node.children.every(child =>
            child.type === 'JSXText' ? child.value.trim() === '' : isSection(child),
          )
        )
      }

      if (node.type === 'JSXFragment') {
        return node.children.every(child =>
          child.type === 'JSXText' ? child.value.trim() === '' : isSection(child),
        )
      }

      if (node.type === 'JSXExpressionContainer') {
        return node.expression.type === 'JSXEmptyExpression' || isSection(node.expression)
      }

      if (node.type === 'ConditionalExpression') {
        return isSection(node.consequent) && isSection(node.alternate)
      }

      if (node.type === 'LogicalExpression') {
        return isSection(node.right)
      }

      return false
    }

    function check(fn: ESTree.ArrowFunctionExpression | ESTree.Function) {
      const body = fn.body

      if (body === null) {
        return
      }

      const result =
        body.type === 'BlockStatement' &&
        body.body.length === 1 &&
        body.body[0]?.type === 'ReturnStatement'
          ? body.body[0].argument
          : body

      if (result === null || !isSection(result)) {
        context.report({ node: fn, messageId: 'sections' })
      }
    }

    return {
      ImportDeclaration(node) {
        if (
          !(
            node.source.value.startsWith('./components/') ||
            node.source.value === './components' ||
            node.source.value.startsWith(`~platform/features/${feature}/components/`)
          )
        ) {
          return
        }

        for (const specifier of node.specifiers) {
          if (specifier.local.name.endsWith('Section')) {
            sections.add(specifier.local.name)
          }
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          node.id.name === page &&
          (node.init?.type === 'ArrowFunctionExpression' ||
            node.init?.type === 'FunctionExpression')
        ) {
          check(node.init)
        }
      },
      FunctionDeclaration(node) {
        if (node.id?.name === page) {
          check(node)
        }
      },
      ExportDefaultDeclaration(node) {
        if (
          node.declaration.type === 'ArrowFunctionExpression' ||
          node.declaration.type === 'FunctionExpression' ||
          (node.declaration.type === 'FunctionDeclaration' && node.declaration.id?.name !== page)
        ) {
          check(node.declaration)
        }
      },
    }
  },
})
