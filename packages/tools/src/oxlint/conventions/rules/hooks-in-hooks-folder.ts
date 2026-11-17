import { defineRule } from '@oxlint/plugins'

import { normalizedPath, pathSegments } from './path.ts'

const hookFile = /^use[A-Z0-9]/

export const hooksInHooksFolderRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Keep application hooks in src/hooks or features/<feature>/hooks.',
    },
    schema: [],
    messages: {
      misplaced:
        'Move this hook into a hooks folder: src/hooks for app-wide hooks, features/<feature>/hooks for feature hooks.',
    },
  },
  create(context) {
    const segments = pathSegments(context.filename)
    const name = segments.at(-1) ?? ''

    return {
      Program(node) {
        if (
          /\/apps\/[^/]+\/src\//.test(normalizedPath(context.filename)) &&
          hookFile.test(name) &&
          !/(?:\/src\/hooks\/|\/src\/features\/[^/]+\/hooks\/)/.test(
            normalizedPath(context.filename),
          )
        ) {
          context.report({ node, messageId: 'misplaced' })
        }
      },
    }
  },
})
