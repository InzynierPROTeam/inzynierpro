import { defineRule, type ESTree, type Scope } from '@oxlint/plugins'

export const noReexports = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require consumers to import directly from the module that owns an export.',
    },
    schema: [],
    messages: {
      reexport: 'Import directly from the owning module instead of re-exporting its bindings.',
    },
  },
  create(context) {
    const isImportedBinding = (local: Extract<ESTree.Node, { type: 'Identifier' }>): boolean => {
      let scope: Scope | null = context.sourceCode.getScope(local)

      while (scope !== null) {
        const variable = scope.set.get(local.name)

        if (variable !== undefined) {
          return variable.defs.some(definition => definition.type === 'ImportBinding')
        }

        scope = scope.upper
      }

      return false
    }

    return {
      ExportAllDeclaration(node) {
        context.report({ node, messageId: 'reexport' })
      },
      ExportDefaultDeclaration(node) {
        if (node.declaration.type === 'Identifier' && isImportedBinding(node.declaration)) {
          context.report({ node, messageId: 'reexport' })
        }
      },
      ExportNamedDeclaration(node) {
        if (
          node.source ||
          node.specifiers.some(
            specifier =>
              specifier.local.type === 'Identifier' && isImportedBinding(specifier.local),
          )
        ) {
          context.report({ node, messageId: 'reexport' })
        }
      },
    }
  },
})
