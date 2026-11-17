import type { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Option, Schema } from 'effect'

const key = (userId: UserId) => `inzynierpro.selected-path.${userId}`

type SelectionCookies = {
  read: (name: string) => string | null | undefined
  write: (name: string, value: string) => void
  clear: (name: string) => void
}

export const resolveSelectedPath = (
  paths: ReadonlyArray<UserQualificationPath>,
  selectedId: QualificationPathId | undefined,
) =>
  paths.find(path => path.id === selectedId && !path.archived) ?? paths.find(path => !path.archived)

export const createSelectedPathStore = (cookies: SelectionCookies) => {
  const get = (userId: UserId) =>
    Option.getOrUndefined(
      Schema.decodeUnknownOption(QualificationPathId)(cookies.read(key(userId))),
    )

  const set = (userId: UserId, pathId: QualificationPathId) => {
    if (get(userId) === pathId) {
      return
    }

    cookies.write(key(userId), pathId)
  }

  const remove = (userId: UserId) => {
    if (cookies.read(key(userId)) == null) {
      return
    }

    cookies.clear(key(userId))
  }

  return {
    get,
    set,
    remove,
    synchronize: (userId: UserId, paths: ReadonlyArray<UserQualificationPath>) => {
      const path = resolveSelectedPath(paths, get(userId))

      if (path === undefined) {
        remove(userId)
      } else {
        set(userId, path.id)
      }

      return path
    },
  }
}
