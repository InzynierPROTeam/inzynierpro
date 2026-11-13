import type { Specialization as SpecializationDto } from '@inzpro/api-contracts/modules/qualification-paths/responses'
import { Option } from 'effect'
import type { Specialization } from '~api/modules/qualification-paths/domain/qualification-path.model.js'

export const toSpecializationDto = (specialization: Specialization): SpecializationDto => ({
  ...specialization,
  description: Option.getOrNull(specialization.description),
})
