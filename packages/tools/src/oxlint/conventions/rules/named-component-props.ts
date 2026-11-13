import { defineRule, type ESTree } from '@oxlint/plugins'

import { functionParameterTypeAnnotation } from '../../anti-slop/shared/function-parameters.ts'
import { normalizedPath } from './path.ts'

function containsInlineProps(type: ESTree.TSType): boolean {
  if (type.type === 'TSParenthesizedType') {
    return containsInlineProps(type.typeAnnotation)
  }

  if (type.type === 'TSTypeLiteral') {
    return true
  }

  if (type.type === 'TSIntersectionType' || type.type === 'TSUnionType') {
    return type.types.some(containsInlineProps)
  }

  if (type.type === 'TSTypeReference') {
    return type.typeArguments?.params.some(containsInlineProps) ?? false
  }

  return false
}

export const namedComponentPropsRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: { description: 'Declare component props as a named type beside the component.' },
    schema: [],
    messages: {
      props:
        'Declare {{name}}Props above the component and use that named type instead of inline object props.',
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    if (
      !/\/(apps\/[^/]+|packages\/ui)\/src\/.*\.tsx$/.test(filename) ||
      /\.(test|spec)\.tsx$/.test(filename)
    ) {
      return {}
    }

    function check(name: string, fn: ESTree.ArrowFunctionExpression | ESTree.Function) {
      if (!/^[A-Z]/.test(name)) {
        return
      }

      const parameter = fn.params[0]

      if (parameter === undefined) {
        return
      }

      const annotation = functionParameterTypeAnnotation(parameter)?.typeAnnotation

      if (annotation !== undefined && containsInlineProps(annotation)) {
        context.report({ node: parameter, messageId: 'props', data: { name } })
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id !== null) {
          check(node.id.name, node)
        }
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'Identifier') {
          return
        }

        const fn = node.init

        if (fn?.type === 'ArrowFunctionExpression' || fn?.type === 'FunctionExpression') {
          check(node.id.name, fn)
          const annotation = node.id.typeAnnotation?.typeAnnotation

          if (
            /^[A-Z]/.test(node.id.name) &&
            annotation?.type === 'TSTypeReference' &&
            containsInlineProps(annotation)
          ) {
            context.report({ node: node.id, messageId: 'props', data: { name: node.id.name } })
          }
        }
      },
    }
  },
})
