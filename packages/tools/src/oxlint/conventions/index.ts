import { eslintCompatPlugin } from '@oxlint/plugins'

import { hooksInHooksFolderRule } from './rules/hooks-in-hooks-folder.ts'
import { noFeaturePrefixRule } from './rules/no-feature-prefix.ts'
import { noSpreadRouteHooksRule } from './rules/no-spread-route-hooks.ts'
import { noTryCatchRule } from './rules/no-try-catch.ts'
import { queriesWrapActionsRule } from './rules/queries-wrap-actions.ts'

/** Workspace conventions for file placement, route state, failure handling and query modules. */
const conventionsPlugin = eslintCompatPlugin({
  meta: { name: 'conventions' },
  rules: {
    'hooks-in-hooks-folder': hooksInHooksFolderRule,
    'no-feature-prefix': noFeaturePrefixRule,
    'no-spread-route-hooks': noSpreadRouteHooksRule,
    'no-try-catch': noTryCatchRule,
    'queries-wrap-actions': queriesWrapActionsRule,
  },
})

export default conventionsPlugin
