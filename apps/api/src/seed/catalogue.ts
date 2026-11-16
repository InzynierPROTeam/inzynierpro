import {
  iarpDolnoslaskaDistrictChamberCode,
  iarpKujawskoPomorskaDistrictChamberCode,
  iarpLubelskaDistrictChamberCode,
  iarpLubuskaDistrictChamberCode,
  iarpLodzkaDistrictChamberCode,
  iarpMalopolskaDistrictChamberCode,
  iarpMazowieckaDistrictChamberCode,
  iarpOpolskaDistrictChamberCode,
  iarpPodkarpackaDistrictChamberCode,
  iarpPodlaskaDistrictChamberCode,
  iarpPomorskaDistrictChamberCode,
  iarpSlaskaDistrictChamberCode,
  iarpSwietokrzyskaDistrictChamberCode,
  iarpWarminskoMazurskaDistrictChamberCode,
  iarpWielkopolskaDistrictChamberCode,
  iarpZachodniopomorskaDistrictChamberCode,
  piibDolnoslaskaDistrictChamberCode,
  piibKujawskoPomorskaDistrictChamberCode,
  piibLubelskaDistrictChamberCode,
  piibLubuskaDistrictChamberCode,
  piibLodzkaDistrictChamberCode,
  piibMalopolskaDistrictChamberCode,
  piibMazowieckaDistrictChamberCode,
  piibOpolskaDistrictChamberCode,
  piibPodkarpackaDistrictChamberCode,
  piibPodlaskaDistrictChamberCode,
  piibPomorskaDistrictChamberCode,
  piibSlaskaDistrictChamberCode,
  piibSwietokrzyskaDistrictChamberCode,
  piibWarminskoMazurskaDistrictChamberCode,
  piibWielkopolskaDistrictChamberCode,
  piibZachodniopomorskaDistrictChamberCode,
} from '@inzpro/domain/modules/exam-calendar/district-chamber'
import {
  architectsGeneralChamberCode,
  engineersGeneralChamberCode,
} from '@inzpro/domain/modules/exam-calendar/general-chamber'
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

export const catalogueId = (prefix: string, index: number) =>
  `${prefix}000000-0000-4000-8000-${String(index).padStart(12, '0')}`

export const catalogueGeneralChambers = [
  {
    id: catalogueId('50', 1),
    code: engineersGeneralChamberCode,
    name: 'Polska Izba Inżynierów Budownictwa',
    shortName: 'PIIB',
  },
  {
    id: catalogueId('50', 2),
    code: architectsGeneralChamberCode,
    name: 'Izba Architektów Rzeczypospolitej Polskiej',
    shortName: 'IARP',
  },
] as const

const districtRegions = [
  {
    name: 'Dolnośląska',
    engineersCode: piibDolnoslaskaDistrictChamberCode,
    architectsCode: iarpDolnoslaskaDistrictChamberCode,
  },
  {
    name: 'Kujawsko-Pomorska',
    engineersCode: piibKujawskoPomorskaDistrictChamberCode,
    architectsCode: iarpKujawskoPomorskaDistrictChamberCode,
  },
  {
    name: 'Lubelska',
    engineersCode: piibLubelskaDistrictChamberCode,
    architectsCode: iarpLubelskaDistrictChamberCode,
  },
  {
    name: 'Lubuska',
    engineersCode: piibLubuskaDistrictChamberCode,
    architectsCode: iarpLubuskaDistrictChamberCode,
  },
  {
    name: 'Łódzka',
    engineersCode: piibLodzkaDistrictChamberCode,
    architectsCode: iarpLodzkaDistrictChamberCode,
  },
  {
    name: 'Małopolska',
    engineersCode: piibMalopolskaDistrictChamberCode,
    architectsCode: iarpMalopolskaDistrictChamberCode,
  },
  {
    name: 'Mazowiecka',
    engineersCode: piibMazowieckaDistrictChamberCode,
    architectsCode: iarpMazowieckaDistrictChamberCode,
  },
  {
    name: 'Opolska',
    engineersCode: piibOpolskaDistrictChamberCode,
    architectsCode: iarpOpolskaDistrictChamberCode,
  },
  {
    name: 'Podkarpacka',
    engineersCode: piibPodkarpackaDistrictChamberCode,
    architectsCode: iarpPodkarpackaDistrictChamberCode,
  },
  {
    name: 'Podlaska',
    engineersCode: piibPodlaskaDistrictChamberCode,
    architectsCode: iarpPodlaskaDistrictChamberCode,
  },
  {
    name: 'Pomorska',
    engineersCode: piibPomorskaDistrictChamberCode,
    architectsCode: iarpPomorskaDistrictChamberCode,
  },
  {
    name: 'Śląska',
    engineersCode: piibSlaskaDistrictChamberCode,
    architectsCode: iarpSlaskaDistrictChamberCode,
  },
  {
    name: 'Świętokrzyska',
    engineersCode: piibSwietokrzyskaDistrictChamberCode,
    architectsCode: iarpSwietokrzyskaDistrictChamberCode,
  },
  {
    name: 'Warmińsko-Mazurska',
    engineersCode: piibWarminskoMazurskaDistrictChamberCode,
    architectsCode: iarpWarminskoMazurskaDistrictChamberCode,
  },
  {
    name: 'Wielkopolska',
    engineersCode: piibWielkopolskaDistrictChamberCode,
    architectsCode: iarpWielkopolskaDistrictChamberCode,
  },
  {
    name: 'Zachodniopomorska',
    engineersCode: piibZachodniopomorskaDistrictChamberCode,
    architectsCode: iarpZachodniopomorskaDistrictChamberCode,
  },
] as const

// EXTERNAL: Verified 2026-11-16 against the national chambers' lists of district chambers: PIIB: https://www.piib.org.pl/kontakt/dane-adresowe-oiib IARP: https://www.izbaarchitektow.pl/okregowe_izby_architektow/ Neither list publishes per-chamber abbreviations, so the short name is the region.
export const catalogueDistrictChambers = [
  ...districtRegions.map((region, index) => ({
    id: catalogueId('51', index + 1),
    generalChamberId: catalogueId('50', 1),
    code: region.engineersCode,
    name: `${region.name} Okręgowa Izba Inżynierów Budownictwa`,
    shortName: region.name,
    sortOrder: index + 1,
  })),
  ...districtRegions.map((region, index) => ({
    id: catalogueId('51', districtRegions.length + index + 1),
    generalChamberId: catalogueId('50', 2),
    code: region.architectsCode,
    name: `${region.name} Okręgowa Izba Architektów RP`,
    shortName: region.name,
    sortOrder: index + 1,
  })),
]

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

// EXTERNAL: Verified 2026-11-13 against the official national chamber publications: PIIB: https://www.piib.org.pl/organy/krajowa-komisja-kwalifikacyjna/terminarz-posiedzen-kkk IARP: https://www.izbaarchitektow.pl/kategoria/uprawnienia_egzamin-na-uprawnienia-budowlane-w-specjalnosci-architektonicznej,287 PIIB 2029–2030 are planning estimates, not published exam dates.
export const catalogueSessions = [
  {
    id: catalogueId('90', 1),
    chamberId: catalogueId('50', 1),
    name: 'Sesja Wiosenna',
    day: '2027-05-21',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 2),
    chamberId: catalogueId('50', 2),
    name: 'Sesja Wiosenna',
    day: '2027-05-14',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 3),
    chamberId: catalogueId('50', 1),
    name: 'Sesja Jesienna',
    day: '2027-11-19',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 4),
    chamberId: catalogueId('50', 2),
    name: 'Sesja Jesienna',
    day: '2027-11-19',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 5),
    chamberId: catalogueId('50', 1),
    name: 'Sesja Wiosenna',
    day: '2028-05-26',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 6),
    chamberId: catalogueId('50', 2),
    name: 'Sesja Wiosenna',
    day: '2028-05-19',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 7),
    chamberId: catalogueId('50', 1),
    name: 'Sesja Jesienna',
    day: '2028-11-17',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 8),
    chamberId: catalogueId('50', 2),
    name: 'Sesja Jesienna',
    day: '2028-11-17',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 9),
    chamberId: catalogueId('50', 1),
    name: 'Sesja Wiosenna',
    day: '2029-05-18',
    isConfirmed: false,
  },
  {
    id: catalogueId('90', 10),
    chamberId: catalogueId('50', 2),
    name: 'Sesja Wiosenna',
    day: '2029-05-18',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 11),
    chamberId: catalogueId('50', 1),
    name: 'Sesja Jesienna',
    day: '2029-11-16',
    isConfirmed: false,
  },
  {
    id: catalogueId('90', 12),
    chamberId: catalogueId('50', 2),
    name: 'Sesja Jesienna',
    day: '2029-11-16',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 13),
    chamberId: catalogueId('50', 1),
    name: 'Sesja Wiosenna',
    day: '2030-05-17',
    isConfirmed: false,
  },
  {
    id: catalogueId('90', 14),
    chamberId: catalogueId('50', 2),
    name: 'Sesja Wiosenna',
    day: '2030-05-17',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 15),
    chamberId: catalogueId('50', 1),
    name: 'Sesja Jesienna',
    day: '2026-11-20',
    isConfirmed: true,
  },
  {
    id: catalogueId('90', 16),
    chamberId: catalogueId('50', 2),
    name: 'Sesja Jesienna',
    day: '2026-11-20',
    isConfirmed: true,
  },
] as const
