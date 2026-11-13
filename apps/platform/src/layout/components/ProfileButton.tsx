import { Button } from '@inzpro/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@inzpro/ui/components/dropdown-menu'
import { Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { UserAvatar } from '~platform/components/UserAvatar'
import { useSignOutMutation } from '~platform/features/auth/hooks/useSignOutMutation'
import { authenticatedRouteApi } from '~platform/features/auth/utils'

export const ProfileButton = () => {
  const {
    session: { user },
  } = authenticatedRouteApi.useRouteContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="primary"
            size="icon-lg"
            aria-label="Menu konta"
          />
        }
      >
        <UserAvatar
          user={user}
          className="size-9"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem render={<Link to="/profil" />}>Profil</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <SignOutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SignOutButton = () => {
  const signOut = useSignOutMutation()

  return (
    <DropdownMenuItem
      disabled={signOut.isPending}
      onClick={() => signOut.mutate()}
    >
      <LogOut className="size-4" />
      Wyloguj się
    </DropdownMenuItem>
  )
}
