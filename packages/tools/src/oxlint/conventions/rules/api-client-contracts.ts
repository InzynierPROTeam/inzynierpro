import { defineRule, type ESTree } from '@oxlint/plugins'

import { isModuleSource } from './path.ts'

export const apiClientContractsRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Group client actions with endpoint-derived request, response and error types.',
    },
    schema: [],
    messages: {
      group:
        'Keep {{action}} followed immediately by {{prefix}}Request, {{prefix}}Res and {{prefix}}Error.',
      request:
        'Use one argument named req, annotated with {{prefix}}Request. An empty default must retain that annotation.',
      inferred:
        'Derive {{prefix}}Request with InferEndpointRequest<typeof Endpoint> imported from api-contracts.',
      forward:
        'Pass req directly to the generated endpoint instead of assembling its request by hand.',
    },
  },
  create(context) {
    if (!isModuleSource(context.filename, 'api-client')) {
      return {}
    }

    return {
      Program(program) {
        const actions = new Set<string>()
        const inference = new Set<string>()
        const endpoints = new Set<string>()

        for (const statement of program.body) {
          if (statement.type !== 'ImportDeclaration') {
            continue
          }

          for (const specifier of statement.specifiers) {
            if (specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier') {
              continue
            }

            if (
              /\/api-action(\.js)?$/.test(statement.source.value) &&
              specifier.imported.name === 'apiAction'
            ) {
              actions.add(specifier.local.name)
            }

            if (
              /\/types(\.js)?$/.test(statement.source.value) &&
              specifier.imported.name === 'InferEndpointRequest'
            ) {
              inference.add(specifier.local.name)
            }

            if (statement.source.value.startsWith('@inzpro/api-contracts/')) {
              endpoints.add(specifier.local.name)
            }
          }
        }

        for (const [index, statement] of program.body.entries()) {
          if (
            statement.type !== 'ExportNamedDeclaration' ||
            statement.declaration?.type !== 'VariableDeclaration'
          ) {
            continue
          }

          for (const declaration of statement.declaration.declarations) {
            const fn = declaration.init

            if (
              declaration.id.type === 'Identifier' &&
              fn?.type === 'CallExpression' &&
              fn.callee.type === 'Identifier' &&
              actions.has(fn.callee.name)
            ) {
              const prefix =
                declaration.id.name.charAt(0).toUpperCase() + declaration.id.name.slice(1)

              context.report({ node: declaration, messageId: 'request', data: { prefix } })
            }

            if (
              declaration.id.type !== 'Identifier' ||
              fn?.type !== 'ArrowFunctionExpression' ||
              fn.body.type !== 'CallExpression' ||
              fn.body.callee.type !== 'Identifier' ||
              !actions.has(fn.body.callee.name)
            ) {
              continue
            }

            const action = declaration.id.name
            const prefix = action.charAt(0).toUpperCase() + action.slice(1)
            const data = { action, prefix }
            const types: ESTree.TSTypeAliasDeclaration[] = []

            for (const [offset, suffix] of ['Request', 'Res', 'Error'].entries()) {
              const next = program.body[index + offset + 1]

              if (
                next?.type === 'ExportNamedDeclaration' &&
                next.declaration?.type === 'TSTypeAliasDeclaration' &&
                next.declaration.id.name === `${prefix}${suffix}`
              ) {
                types.push(next.declaration)
              }
            }

            if (types.length !== 3) {
              context.report({ node: statement, messageId: 'group', data })
            }

            const parameter = fn.params[0]
            const req = parameter?.type === 'AssignmentPattern' ? parameter.left : parameter

            const annotation =
              req?.type === 'Identifier' ? req.typeAnnotation?.typeAnnotation : undefined

            if (
              fn.params.length !== 1 ||
              req?.type !== 'Identifier' ||
              req.name !== 'req' ||
              req.optional ||
              annotation?.type !== 'TSTypeReference' ||
              annotation.typeName.type !== 'Identifier' ||
              annotation.typeName.name !== `${prefix}Request`
            ) {
              context.report({ node: fn, messageId: 'request', data })
            }

            const request = types.find(type => type.id.name === `${prefix}Request`)
            const inferred = request?.typeAnnotation

            const endpoint =
              inferred?.type === 'TSTypeReference' ? inferred.typeArguments?.params[0] : undefined

            if (
              request &&
              (inferred?.type !== 'TSTypeReference' ||
                inferred.typeName.type !== 'Identifier' ||
                !inference.has(inferred.typeName.name) ||
                endpoint?.type !== 'TSTypeQuery' ||
                endpoint.exprName.type !== 'Identifier' ||
                !endpoints.has(endpoint.exprName.name))
            ) {
              context.report({ node: request, messageId: 'inferred', data })
            }

            const callback = fn.body.arguments[0]
            const call = callback?.type === 'ArrowFunctionExpression' ? callback.body : undefined

            if (
              call?.type !== 'CallExpression' ||
              call.arguments.length !== 1 ||
              call.arguments[0]?.type !== 'Identifier' ||
              call.arguments[0].name !== 'req'
            ) {
              context.report({ node: fn.body, messageId: 'forward' })
            }
          }
        }
      },
    }
  },
})
