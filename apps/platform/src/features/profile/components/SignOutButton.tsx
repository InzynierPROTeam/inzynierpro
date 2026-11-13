import { Button } from '@inzpro/ui/components/button'
import { LoaderCircle, LogOut } from 'lucide-react'
import { useSignOutMutation } from '~platform/features/auth/hooks/useSignOutMutation'

export const SignOutButton = () => {
  const signOut = useSignOutMutation()

  return (
    <Button
      variant="outline"
      disabled={signOut.isPending}
      onClick={() => signOut.mutate()}
    >
      {signOut.isPending ? <LoaderCircle className="animate-spin" /> : <LogOut />}
      Wyloguj się
    </Button>
  )
}
