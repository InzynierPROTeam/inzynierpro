import { Schema } from 'effect'

export const recollectionRegionalSource = 'recollection'
export const officialRegionalSource = 'official'

export const regionalSourceKindValues = [
  recollectionRegionalSource,
  officialRegionalSource,
] as const

export const RegionalSourceKind = Schema.Literals(regionalSourceKindValues)

export type RegionalSourceKind = typeof RegionalSourceKind.Type
