import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'

import { SendOTPAgainButton } from './components/SendOTPAgainButton'
import { VerifyOTPForm } from './components/VerifyOTPForm'
import { verifyOTPPageRouteApi } from './utils'

export const VerifyOTPPage = () => {
  const { email } = verifyOTPPageRouteApi.useSearch()

  return (
    <section className="layout-section flex-1 items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader className="items-center text-center text-balance">
          <CardTitle>
            <h1>Wprowadź kod</h1>
          </CardTitle>
          <CardDescription>
            <p>
              Sprawdź swoją skrzynkę pocztową i wpisz kod, który został wysłany na adres{' '}
              <span className="text-primary break-all">{email}</span>.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerifyOTPForm />
        </CardContent>
        <CardFooter className="items-center justify-center text-center">
          <p className="text-sm text-current/70">
            Kod nie dotarł? <SendOTPAgainButton /> lub sprawdź folder spam.
          </p>
        </CardFooter>
      </Card>
    </section>
  )
}
