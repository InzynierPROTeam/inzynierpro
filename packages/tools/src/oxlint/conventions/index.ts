import { eslintCompatPlugin } from '@oxlint/plugins'

import { apiClientContractsRule } from './rules/api-client-contracts.ts'
import { backendBoundariesRule } from './rules/backend-boundaries.ts'
import { domainIdentifiersRule } from './rules/domain-identifiers.ts'
import { hooksInHooksFolderRule } from './rules/hooks-in-hooks-folder.ts'
import { noFeaturePrefixRule } from './rules/no-feature-prefix.ts'
import { noSpreadRouteHooksRule } from './rules/no-spread-route-hooks.ts'
import { noTryCatchRule } from './rules/no-try-catch.ts'
import { queriesWrapActionsRule } from './rules/queries-wrap-actions.ts'
import { requestSchemasRule } from './rules/request-schemas.ts'

/** Workspace conventions for file placement, route state, failure handling and query modules. */
const conventionsPlugin = eslintCompatPlugin({
  meta: { name: 'conventions' },
  rules: {
    'api-client-contracts': apiClientContractsRule,
    'backend-boundaries': backendBoundariesRule,
    'domain-identifiers': domainIdentifiersRule,
    'hooks-in-hooks-folder': hooksInHooksFolderRule,
    'no-feature-prefix': noFeaturePrefixRule,
    'no-spread-route-hooks': noSpreadRouteHooksRule,
    'no-try-catch': noTryCatchRule,
    'queries-wrap-actions': queriesWrapActionsRule,
    'request-schemas': requestSchemasRule,
  },
})

export default conventionsPlugin
