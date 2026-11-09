import { getOAuthErrorMessage } from '@inzpro/auth-client/error'
import { Button } from '@inzpro/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { Separator } from '@inzpro/ui/components/separator'
import { useNavigate } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { ExternalLink } from '~platform/components/ExternalLink'
import { Icon } from '~platform/components/Icon'
import { appName, ExternalLinks } from '~platform/config/app'
import { getIsInAppBrowser } from '~platform/utils/browser'
import { safeRedirectPath } from '~platform/utils/redirect'
import { getAppUrl } from '~platform/utils/url'

import { SignInForm } from './components/SignInForm'
import { useSendOTPMutation } from './hooks/useSendOTPMutation'
import { useSignInWithGoogle } from './hooks/useSignInWithGoogle'
import { signInPageRouteApi } from './utils'

// The user agent is constant for the page lifetime; the server snapshot keeps hydration stable.
const subscribeToBrowser = () => () => undefined

export const SignInPage = () => {
  const { redirect, error } = signInPageRouteApi.useSearch()
  const navigate = useNavigate()
  const signInWithGoogleMutation = useSignInWithGoogle()
  const isInAppBrowser = useSyncExternalStore(subscribeToBrowser, getIsInAppBrowser, () => false)

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

  const disabled = sendSignInVerificationOtpMutation.isPending || signInWithGoogleMutation.isPending

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
              Wybierz Google lub wpisz e-mail, a konto utworzymy automatycznie.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p
              role="alert"
              className="text-destructive text-sm"
            >
              {getOAuthErrorMessage(error)}
            </p>
          )}
          <Button
            variant="outline"
            disabled={disabled || isInAppBrowser}
            onClick={() => {
              const errorCallbackURL = new URL(getAppUrl('/login'))
              errorCallbackURL.searchParams.set('redirect', safeRedirectPath(redirect))
              signInWithGoogleMutation.mutate({
                callbackURL: getAppUrl(safeRedirectPath(redirect)),
                errorCallbackURL: errorCallbackURL.href,
              })
            }}
          >
            {signInWithGoogleMutation.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Icon
                name="Google"
                className="size-4"
              />
            )}
            Kontynuuj z Google
          </Button>
          {isInAppBrowser && (
            <p className="text-muted-foreground text-xs">
              Logowanie Google jest zablokowane w przeglądarce osadzonej (np. Messenger). Otwórz tę
              stronę w Safari/Chrome (opcja „Otwórz w przeglądarce”) i spróbuj ponownie.
            </p>
          )}
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs tracking-wider uppercase">lub</span>
            <Separator className="flex-1" />
          </div>
          <SignInForm
            disabled={disabled}
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
