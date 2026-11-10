import { CursorPagination } from '@inzpro/domain/common/pagination'
import { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Schema } from 'effect'

export const ExamSessionsQuery = Schema.Struct({
  ...CursorPagination.fields,
  specializationId: SpecializationId,
})
