import {
  constructionQualificationKindCode,
  designQualificationKindCode,
  combinedQualificationKindCode,
} from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import {
  unrestrictedQualificationScopeCode,
  restrictedQualificationScopeCode,
} from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import {
  architecturalSpecializationCode,
  structuralSpecializationCode,
  roadSpecializationCode,
  bridgeSpecializationCode,
  railwayStructuresSpecializationCode,
  railwayControlSpecializationCode,
  hydrotechnicalSpecializationCode,
  demolitionSpecializationCode,
  electricalSpecializationCode,
  sanitarySpecializationCode,
  telecommunicationsSpecializationCode,
} from '@inzpro/domain/modules/qualification-paths/specialization'

import { catalogueId } from './catalogue-id.js'

export const catalogueSpecializations = [
  {
    id: catalogueId('60', 1),
    code: structuralSpecializationCode,
    name: 'Konstrukcyjno-budowlana',
    description: null,
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 2),
    code: architecturalSpecializationCode,
    name: 'Architektoniczna',
    description: null,
    chamberId: catalogueId('50', 2),
  },
  {
    id: catalogueId('60', 3),
    code: roadSpecializationCode,
    name: 'Inżynieryjna drogowa',
    description: null,
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 4),
    code: bridgeSpecializationCode,
    name: 'Inżynieryjna mostowa',
    description: null,
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 5),
    code: railwayStructuresSpecializationCode,
    name: 'Inżynieryjna kolejowa',
    description: 'obiekty budowlane',
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 6),
    code: railwayControlSpecializationCode,
    name: 'Inżynieryjna kolejowa',
    description: 'sterowanie ruchem',
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 7),
    code: hydrotechnicalSpecializationCode,
    name: 'Inżynieryjna hydrotechniczna',
    description: null,
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 8),
    code: demolitionSpecializationCode,
    name: 'Inżynieryjna wyburzeniowa',
    description: null,
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 9),
    code: electricalSpecializationCode,
    name: 'Instalacyjna elektryczna',
    description: null,
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 10),
    code: sanitarySpecializationCode,
    name: 'Instalacyjna sanitarna',
    description: null,
    chamberId: catalogueId('50', 1),
  },
  {
    id: catalogueId('60', 11),
    code: telecommunicationsSpecializationCode,
    name: 'Instalacyjna teletechniczna',
    description: null,
    chamberId: catalogueId('50', 1),
  },
] as const

export const catalogueKinds = [
  {
    id: catalogueId('70', 1),
    code: constructionQualificationKindCode,
    name: 'Kierowania robotami',
    pathLabel: 'kierowanie robotami',
  },
  {
    id: catalogueId('70', 2),
    code: designQualificationKindCode,
    name: 'Projektowanie',
    pathLabel: 'projektowanie',
  },
  {
    id: catalogueId('70', 3),
    code: combinedQualificationKindCode,
    name: 'Projektowanie i kierowanie',
    pathLabel: 'projektowanie i kierowanie robotami',
  },
] as const

export const catalogueScopes = [
  { id: catalogueId('80', 1), code: unrestrictedQualificationScopeCode, name: 'Bez ograniczeń' },
  {
    id: catalogueId('80', 2),
    code: restrictedQualificationScopeCode,
    name: 'W ograniczonym zakresie',
  },
] as const
