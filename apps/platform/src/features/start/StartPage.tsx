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
import { Catalogue } from '~platform/features/learning/components/Catalogue'

import { startPageRouteApi } from './utils'

export const StartPage = () => {
  const { user } = startPageRouteApi.useRouteContext()
  const signOut = useSignOutMutation()

  return (
    <section className="layout-section flex-1 items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader className="items-center text-center text-balance">
          <CardTitle>
            <h1>Witaj w {appName}</h1>
          </CardTitle>
          <CardDescription>
            <p>
              Zalogowano jako <span className="text-primary break-all">{user.email}</span>.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            Przykładowe dane techniczne — nie są materiałem egzaminacyjnym i nie zostały
            zweryfikowane merytorycznie.
          </p>
          <Catalogue
            key={user.id}
            userId={user.id}
          />
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
