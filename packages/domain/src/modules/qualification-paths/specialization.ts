import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const SpecializationId = Uuid.pipe(Schema.brand('SpecializationId'))

export type SpecializationId = typeof SpecializationId.Type

export const architecturalSpecializationCode = 'architektoniczna'
export const structuralSpecializationCode = 'konstrukcyjno-budowlana'
export const roadSpecializationCode = 'inzynieryjna-drogowa'
export const bridgeSpecializationCode = 'inzynieryjna-mostowa'
export const railwayStructuresSpecializationCode = 'inzynieryjna-kolejowa-obiekty-budowlane'
export const railwayControlSpecializationCode = 'inzynieryjna-kolejowa-sterowanie-ruchem'
export const hydrotechnicalSpecializationCode = 'inzynieryjna-hydrotechniczna'
export const demolitionSpecializationCode = 'inzynieryjna-wyburzeniowa'
export const electricalSpecializationCode = 'instalacyjna-elektryczna'
export const sanitarySpecializationCode = 'instalacyjna-sanitarna'
export const telecommunicationsSpecializationCode = 'instalacyjna-teletechniczna'

export const specializationCodes = [
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
] as const

export const SpecializationCode = Schema.Literals(specializationCodes)

export type SpecializationCode = typeof SpecializationCode.Type

export const Specialization = Schema.Struct({
  code: SpecializationCode,
  id: SpecializationId,
  name: Schema.NonEmptyString,
  description: Schema.NullOr(Schema.NonEmptyString),
})

export type Specialization = typeof Specialization.Type
