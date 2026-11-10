import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const SpecializationId = Uuid.pipe(Schema.brand('SpecializationId'))

export type SpecializationId = typeof SpecializationId.Type

export const Specialization = Schema.Struct({ id: SpecializationId, name: Schema.NonEmptyString })

export type Specialization = typeof Specialization.Type
