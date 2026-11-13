import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { useRouter } from '@tanstack/react-router'
import { selectedPathStore } from '~platform/features/examPaths/utils'

export const useSelectPath = (userId: UserId) => {
  const router = useRouter()

  return async (pathId: QualificationPathId) => {
    selectedPathStore.set(userId, pathId)
    await router.invalidate()
  }
}
