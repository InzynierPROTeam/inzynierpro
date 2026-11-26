import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const ChamberOfficeId = Uuid.pipe(Schema.brand('ChamberOfficeId'))

export type ChamberOfficeId = typeof ChamberOfficeId.Type

export const ChamberWebsiteId = Uuid.pipe(Schema.brand('ChamberWebsiteId'))

export type ChamberWebsiteId = typeof ChamberWebsiteId.Type

export const websiteKind = 'website'
export const bipWebsiteKind = 'bip'
export const facebookWebsiteKind = 'facebook'
export const linkedinWebsiteKind = 'linkedin'
export const otherWebsiteKind = 'other'

export const chamberWebsiteKinds = [
  websiteKind,
  bipWebsiteKind,
  facebookWebsiteKind,
  linkedinWebsiteKind,
  otherWebsiteKind,
] as const

export const ChamberWebsiteKind = Schema.Literals(chamberWebsiteKinds)

export type ChamberWebsiteKind = typeof ChamberWebsiteKind.Type
