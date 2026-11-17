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

import { catalogueId } from './catalogue-id.js'

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
