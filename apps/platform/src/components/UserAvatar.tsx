import type { UserId } from '@inzpro/domain/modules/identity/user'
import { Avatar, AvatarFallback, AvatarImage } from '@inzpro/ui/components/avatar'
import type { ComponentProps } from 'react'
import { getAvatarColor } from '~platform/utils/avatar'

type UserAvatarProps = {
  user: { readonly id: UserId; readonly name: string; readonly image?: string | null }
  size?: ComponentProps<typeof Avatar>['size']
  className?: string
}

export const UserAvatar = ({ user, size, className }: UserAvatarProps) => (
  <Avatar
    size={size}
    className={className}
    role="img"
    aria-label={user.name || 'Avatar użytkownika'}
  >
    {user.image && (
      <AvatarImage
        src={user.image}
        alt=""
      />
    )}
    <AvatarFallback style={{ backgroundColor: getAvatarColor(user.id) }}>
      <img
        src="/images/shared/logo-figure.png"
        alt=""
        aria-hidden="true"
        width={300}
        height={319}
        className="size-4/7 object-contain"
      />
    </AvatarFallback>
  </Avatar>
)
