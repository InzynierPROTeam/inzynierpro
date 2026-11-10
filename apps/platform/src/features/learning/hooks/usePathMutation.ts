import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { preparationKeys } from '@inzpro/queries/modules/preparation'
import { studyKeys } from '@inzpro/queries/modules/study'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  archiveQualificationPath,
  restoreQualificationPath,
  extendQualificationPath,
} from '../actions'

export const usePathMutation = (userId: UserId) => {
  const client = useQueryClient()

  const invalidate = async (receipt: { qualificationPathId: QualificationPathId }) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: preparationKeys.paths(userId) }),
      client.invalidateQueries({ queryKey: preparationKeys.selection(userId) }),
      client.invalidateQueries({
        queryKey: preparationKeys.path(userId, receipt.qualificationPathId),
      }),
      client.invalidateQueries({ queryKey: studyKeys.path(userId, receipt.qualificationPathId) }),
    ])
  }

  const archive = useMutation({
    mutationFn: archiveQualificationPath,
    onSuccess: invalidate,
  })

  const restore = useMutation({
    mutationFn: restoreQualificationPath,
    onSuccess: invalidate,
  })

  const extend = useMutation({
    mutationFn: extendQualificationPath,
    onSuccess: invalidate,
  })

  return { archive, restore, extend }
}
