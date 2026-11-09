import { Button } from '@inzpro/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { LoaderCircle } from 'lucide-react'
import { appName } from '~platform/config/app'
import { useSignOutMutation } from '~platform/features/auth/hooks/useSignOutMutation'

import { startPageRouteApi } from './utils'

export const StartPage = () => {
  const { user } = startPageRouteApi.useRouteContext()
  const signOut = useSignOutMutation()

  return (
    <section className="layout-section flex-1 items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader className="items-center text-center text-balance">
          <CardTitle>
            <h1>Witaj w {appName}</h1>
          </CardTitle>
          <CardDescription>
            <p>
              Jesteś zalogowany jako <span className="text-primary break-all">{user.email}</span>.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            {signOut.isPending && <LoaderCircle className="animate-spin" />}
            Wyloguj się
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
