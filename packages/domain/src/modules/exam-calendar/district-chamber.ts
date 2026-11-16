import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const DistrictChamberId = Uuid.pipe(Schema.brand('DistrictChamberId'))

export type DistrictChamberId = typeof DistrictChamberId.Type

export const piibDolnoslaskaDistrictChamberCode = 'piib-dolnoslaska'
export const piibKujawskoPomorskaDistrictChamberCode = 'piib-kujawsko-pomorska'
export const piibLubelskaDistrictChamberCode = 'piib-lubelska'
export const piibLubuskaDistrictChamberCode = 'piib-lubuska'
export const piibLodzkaDistrictChamberCode = 'piib-lodzka'
export const piibMalopolskaDistrictChamberCode = 'piib-malopolska'
export const piibMazowieckaDistrictChamberCode = 'piib-mazowiecka'
export const piibOpolskaDistrictChamberCode = 'piib-opolska'
export const piibPodkarpackaDistrictChamberCode = 'piib-podkarpacka'
export const piibPodlaskaDistrictChamberCode = 'piib-podlaska'
export const piibPomorskaDistrictChamberCode = 'piib-pomorska'
export const piibSlaskaDistrictChamberCode = 'piib-slaska'
export const piibSwietokrzyskaDistrictChamberCode = 'piib-swietokrzyska'
export const piibWarminskoMazurskaDistrictChamberCode = 'piib-warminsko-mazurska'
export const piibWielkopolskaDistrictChamberCode = 'piib-wielkopolska'
export const piibZachodniopomorskaDistrictChamberCode = 'piib-zachodniopomorska'

export const iarpDolnoslaskaDistrictChamberCode = 'iarp-dolnoslaska'
export const iarpKujawskoPomorskaDistrictChamberCode = 'iarp-kujawsko-pomorska'
export const iarpLubelskaDistrictChamberCode = 'iarp-lubelska'
export const iarpLubuskaDistrictChamberCode = 'iarp-lubuska'
export const iarpLodzkaDistrictChamberCode = 'iarp-lodzka'
export const iarpMalopolskaDistrictChamberCode = 'iarp-malopolska'
export const iarpMazowieckaDistrictChamberCode = 'iarp-mazowiecka'
export const iarpOpolskaDistrictChamberCode = 'iarp-opolska'
export const iarpPodkarpackaDistrictChamberCode = 'iarp-podkarpacka'
export const iarpPodlaskaDistrictChamberCode = 'iarp-podlaska'
export const iarpPomorskaDistrictChamberCode = 'iarp-pomorska'
export const iarpSlaskaDistrictChamberCode = 'iarp-slaska'
export const iarpSwietokrzyskaDistrictChamberCode = 'iarp-swietokrzyska'
export const iarpWarminskoMazurskaDistrictChamberCode = 'iarp-warminsko-mazurska'
export const iarpWielkopolskaDistrictChamberCode = 'iarp-wielkopolska'
export const iarpZachodniopomorskaDistrictChamberCode = 'iarp-zachodniopomorska'

export const districtChamberCodes = [
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
] as const

export const DistrictChamberCode = Schema.Literals(districtChamberCodes)

export type DistrictChamberCode = typeof DistrictChamberCode.Type
