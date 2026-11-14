import { defineRule } from '@oxlint/plugins'

import { normalizedPath } from './path.ts'

const defectFunctions = new Set(['die', 'dieMessage', 'orDie', 'orDieWith'])

const moduleLayer = /\/apps\/api\/src\/modules\/[^/]+\/(?:domain|application|http)\//

export const noModuleDefectsRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Report expected API module failures, such as missing data, as typed errors instead of defects.',
    },
    schema: [],
    messages: {
      defect:
        "Fail with a typed error from the module's domain/errors.ts and map it in http/errors.ts; a missing row is an expected outcome, not a defect.",
    },
  },
  create(context) {
    const filename = normalizedPath(context.filename)

    // Test doubles may stand in for a dependency with a defect.
    if (!moduleLayer.test(filename) || /\.test\.tsx?$/.test(filename)) {
      return {}
    }

    return {
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Effect' &&
          node.property.type === 'Identifier' &&
          defectFunctions.has(node.property.name)
        ) {
          context.report({ node, messageId: 'defect' })
        }
      },
    }
  },
})
