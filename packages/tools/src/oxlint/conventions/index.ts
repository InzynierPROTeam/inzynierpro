import { eslintCompatPlugin } from '@oxlint/plugins'

import { apiClientContractsRule } from './rules/api-client-contracts.ts'
import { backendBoundariesRule } from './rules/backend-boundaries.ts'
import { dateBoundariesRule } from './rules/date-boundaries.ts'
import { directoryNamesRule } from './rules/directory-names.ts'
import { domainIdentifiersRule } from './rules/domain-identifiers.ts'
import { domainVocabularyRule } from './rules/domain-vocabulary.ts'
import { hooksInHooksFolderRule } from './rules/hooks-in-hooks-folder.ts'
import { infiniteQueryNamesRule } from './rules/infinite-query-names.ts'
import { moduleLayersRule } from './rules/module-layers.ts'
import { namedComponentPropsRule } from './rules/named-component-props.ts'
import { noFeaturePrefixRule } from './rules/no-feature-prefix.ts'
import { noModuleDefectsRule } from './rules/no-module-defects.ts'
import { noSpreadRouteHooksRule } from './rules/no-spread-route-hooks.ts'
import { noTryCatchRule } from './rules/no-try-catch.ts'
import { pageSectionsRule } from './rules/page-sections.ts'
import { preferCxRule } from './rules/prefer-cx.ts'
import { preferDurationRule } from './rules/prefer-duration.ts'
import { preferGapRule } from './rules/prefer-gap.ts'
import { queriesReadOnlyRule } from './rules/queries-read-only.ts'
import { queriesWrapActionsRule } from './rules/queries-wrap-actions.ts'
import { queryKeysRule } from './rules/query-keys.ts'
import { requestSchemasRule } from './rules/request-schemas.ts'
import { tracedBackendOperationsRule } from './rules/traced-backend-operations.ts'

const conventionsPlugin = eslintCompatPlugin({
  meta: { name: 'conventions' },
  rules: {
    'query-keys': queryKeysRule,
    'infinite-query-names': infiniteQueryNamesRule,
    'named-component-props': namedComponentPropsRule,
    'prefer-gap': preferGapRule,
    'prefer-cx': preferCxRule,
    'page-sections': pageSectionsRule,
    'queries-read-only': queriesReadOnlyRule,
    'api-client-contracts': apiClientContractsRule,
    'backend-boundaries': backendBoundariesRule,
    'domain-identifiers': domainIdentifiersRule,
    'directory-names': directoryNamesRule,
    'domain-vocabulary': domainVocabularyRule,
    'module-layers': moduleLayersRule,
    'date-boundaries': dateBoundariesRule,
    'prefer-duration': preferDurationRule,
    'hooks-in-hooks-folder': hooksInHooksFolderRule,
    'no-feature-prefix': noFeaturePrefixRule,
    'no-module-defects': noModuleDefectsRule,
    'no-spread-route-hooks': noSpreadRouteHooksRule,
    'no-try-catch': noTryCatchRule,
    'queries-wrap-actions': queriesWrapActionsRule,
    'request-schemas': requestSchemasRule,
    'traced-backend-operations': tracedBackendOperationsRule,
  },
})

export default conventionsPlugin
