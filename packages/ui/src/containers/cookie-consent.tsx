import * as React from 'react'
import {
  CookieManager,
  type CookieCategories,
  type DetailedCookieConsent,
} from 'react-cookie-manager'
import { cx } from 'tailwind-variants'
import { buttonVariants } from '~ui/components/button.js'
import { useTheme } from '~ui/providers/theme-provider.js'

export type TrackingConsent = {
  analytics: boolean
  advertising: boolean
}

type CookieConsentProps = {
  children: React.ReactNode
  onConsentChange?: (consent: TrackingConsent) => void
  privacyPolicyUrl?: string
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  children,
  onConsentChange,
  privacyPolicyUrl = '/dokumenty/polityka-prywatnosci',
}) => {
  const { resolvedTheme } = useTheme()

  return (
    <CookieManager
      googleConsentMode
      // Tracker callbacks own loading; the host blocker also blocks analytics-only GTM.
      disableAutomaticBlocking
      onConsentLoaded={(consent: DetailedCookieConsent | null) =>
        onConsentChange?.({
          analytics: consent?.Analytics.consented === true,
          advertising: consent?.Advertising.consented === true,
        })
      }
      onAccept={() => onConsentChange?.({ analytics: true, advertising: true })}
      onDecline={() => onConsentChange?.({ analytics: false, advertising: false })}
      onManage={(preferences?: CookieCategories) =>
        onConsentChange?.({
          analytics: preferences?.Analytics === true,
          advertising: preferences?.Advertising === true,
        })
      }
      theme={resolvedTheme}
      translations={{
        title: 'Ustawienia plików cookies',
        message:
          'Korzystamy z plików cookies, które są niezbędne do działania serwisu. Za Twoją zgodą używamy także cookies analitycznych i marketingowych, aby ulepszać platformę i wyświetlać dopasowane treści.',
        buttonText: 'Akceptuję wszystkie',
        declineButtonText: 'Odrzuć opcjonalne',
        privacyPolicyText: 'Polityka cookies',
      }}
      cookieCategories={{
        Analytics: true,
        Social: false,
        Advertising: true,
      }}
      showManageButton={false}
      privacyPolicyUrl={privacyPolicyUrl}
      classNames={{
        acceptButton: cx(buttonVariants(), 'bg-primary! text-primary-foreground! px-3! py-1.25!'),
        declineButton: cx(
          buttonVariants({ variant: 'ghost' }),
          'text-foreground/60! px-3! py-1.25!',
        ),
        popupContainer:
          'fixed! bottom-6! left-1/2! z-50! w-[calc(100vw-2rem)]! max-w-xl! -translate-x-1/2! rounded-2xl! border! border-border! bg-background/95!',
        popupContent: 'flex! flex-col! gap-4! p-6!',
        popupTitle: 'text-lg! font-semibold! text-foreground!',
        popupMessage: 'mb-4! text-sm! text-foreground/75!',
        privacyPolicyLink: 'text-xs! text-foreground/70! underline!',
        poweredByLink: 'hidden!',
      }}
      displayType="popup"
    >
      {children}
    </CookieManager>
  )
}
