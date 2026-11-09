import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { useNavigate } from '@tanstack/react-router'
import { ExternalLink } from '~platform/components/ExternalLink'
import { appName, ExternalLinks } from '~platform/config/app'

import { SignInForm } from './components/SignInForm'
import { useSendOTPMutation } from './hooks/useSendOTPMutation'
import { signInPageRouteApi } from './utils'

export const SignInPage = () => {
  const { redirect } = signInPageRouteApi.useSearch()
  const navigate = useNavigate()

  const sendSignInVerificationOtpMutation = useSendOTPMutation({
    onSuccess: email => {
      navigate({
        to: '/zweryfikuj-otp',
        search: {
          email,
          redirect,
        },
      })
    },
  })

  return (
    <section className="layout-section flex-1 items-center justify-center gap-12">
      <Card className="w-full max-w-xl">
        <CardHeader className="items-center text-center text-balance">
          <CardTitle>
            <h1>Witaj na platformie {appName}</h1>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            <p>Zaloguj się lub utwórz konto, aby kontynuować.</p>
            <p className="mt-1">
              <span className="font-bold">Pierwszy raz? Nie musisz się osobno rejestrować.</span>{' '}
              Wpisz e-mail, a konto utworzymy automatycznie.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignInForm
            disabled={sendSignInVerificationOtpMutation.isPending}
            isLoading={sendSignInVerificationOtpMutation.isPending}
            onSubmit={data =>
              sendSignInVerificationOtpMutation
                .mutateAsync({
                  email: data.email,
                })
                .then(() => undefined)
            }
            buttonLabel="Kontynuuj z Emailem"
          />

          <p className="text-xs text-current/50">
            Kontynuując, akceptujesz{' '}
            <ExternalLink
              href={ExternalLinks.termsAndConditionsPolicy}
              className="underline"
            >
              Regulamin
            </ExternalLink>{' '}
            oraz zapoznajesz się z{' '}
            <ExternalLink
              href={ExternalLinks.privacyPolicy}
              className="underline"
            >
              Polityką prywatności
            </ExternalLink>
            .
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
