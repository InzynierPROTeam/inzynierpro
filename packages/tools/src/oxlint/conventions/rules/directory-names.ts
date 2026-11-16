import { defineRule } from '@oxlint/plugins'

import { pathSegments } from './path.ts'

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const camel = /^[a-z][a-zA-Z0-9]*$/

const route = /^(?:\([a-z0-9-]+\)|_{1,2}[a-zA-Z0-9]+|\$[a-zA-Z0-9]+|[a-z0-9-]+)$/

export const directoryNamesRule = defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Name workspace folders in kebab-case; app feature folders are camelCase and route folders follow TanStack Router syntax.',
    },
    schema: [],
    messages: {
      kebab: 'Rename folder `{{name}}` to kebab-case.',
      feature: 'Rename feature folder `{{name}}` to camelCase, as in features/learningSession/.',
      route:
        'Route folder `{{name}}` must be kebab-case or TanStack route syntax: (group), _pathless or $param.',
    },
  },
  create(context) {
    const segments = pathSegments(context.filename)

    const workspace = segments.findLastIndex(
      (segment, index) =>
        (segment === 'apps' || segment === 'packages') && segments[index + 1] !== undefined,
    )

    if (workspace === -1) {
      return {}
    }

    const isApp = segments[workspace] === 'apps'
    const folders = segments.slice(workspace + 2, -1)

    const violation = () => {
      for (const [index, name] of folders.entries()) {
        const parent = folders[index - 1]
        const inRoutes = isApp && folders[0] === 'src' && folders[1] === 'routes' && index > 1

        if (isApp && parent === 'features' && folders[index - 2] === 'src') {
          if (!camel.test(name)) {
            return { messageId: 'feature' as const, name }
          }
        } else if (inRoutes) {
          if (!route.test(name)) {
            return { messageId: 'route' as const, name }
          }
        } else if (!kebab.test(name)) {
          return { messageId: 'kebab' as const, name }
        }
      }

      return undefined
    }

    return {
      Program(node) {
        const found = violation()

        if (found !== undefined) {
          context.report({ node, messageId: found.messageId, data: { name: found.name } })
        }
      },
    }
  },
})
