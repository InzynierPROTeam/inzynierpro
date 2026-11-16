import { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Schema } from 'effect'
import { CursorPagination } from '~api-contracts/utils/pagination.js'

export const ExamSessionsQuery = Schema.Struct({
  ...CursorPagination.fields,
  specializationId: SpecializationId,
})

export const DistrictChambersQuery = Schema.Struct({
  ...CursorPagination.fields,
  generalChamberId: GeneralChamberId,
})
