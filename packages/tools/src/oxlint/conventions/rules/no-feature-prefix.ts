import { defineRule } from '@oxlint/plugins'

import { baseName, pathSegments } from './path.ts'

export const noFeaturePrefixRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Name files inside features/<feature> without repeating the feature name.',
    },
    schema: [],
    messages: {
      prefixed:
        'The folder already names the feature: rename `{{name}}` to `{{suggestion}}` (for example actions.ts, validation.ts).',
    },
  },
  create(context) {
    const segments = pathSegments(context.filename)
    const featuresIndex = segments.lastIndexOf('features')
    const feature = featuresIndex === -1 ? undefined : segments[featuresIndex + 1]
    const name = baseName(context.filename)
    const prefix = `${feature}-`

    return {
      Program(node) {
        if (feature !== undefined && name.startsWith(prefix) && name.length > prefix.length) {
          context.report({
            node,
            messageId: 'prefixed',
            data: { name, suggestion: name.slice(prefix.length) },
          })
        }
      },
    }
  },
})
