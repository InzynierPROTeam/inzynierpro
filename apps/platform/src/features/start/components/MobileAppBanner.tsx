import { Button } from '@inzpro/ui/components/button'
import { Card, CardHeader, CardTitle, CardFooter } from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Smartphone } from 'lucide-react'
import { ExternalLink } from '~platform/components/ExternalLink'
import { ExternalLinks } from '~platform/config/app'
import { mobileAppBannerStore } from '~platform/features/start/stores'

import { useMobileAppBannerDismissed } from '../hooks/useMobileAppBannerDismissed'

export const MobileAppBanner = () => {
  const dismissed = useMobileAppBannerDismissed()

  if (dismissed) {
    return null
  }

  return (
    <Card
      size="sm"
      className="gradient-brand text-primary-foreground @container flex-row items-center justify-between bg-linear-to-br max-sm:flex-col max-sm:items-stretch"
    >
      <CardHeader className="min-w-0 flex-1">
        <CardTitle className="flex items-center gap-3 max-sm:flex-col max-sm:items-start">
          <IconWrapper
            size="sm"
            className="bg-background/20 text-current"
          >
            <Smartphone aria-hidden="true" />
          </IconWrapper>
          <p>Pobierz aplikację mobilną na iOS lub Android i ucz się gdziekolwiek jesteś.</p>
        </CardTitle>
      </CardHeader>
      <CardFooter className="gap-2 max-sm:self-end">
        <Button
          type="button"
          onClick={mobileAppBannerStore.dismiss}
          aria-label="Zamknij"
          variant="ghost"
          size="sm"
        >
          Zamknij
        </Button>
        <Button
          nativeButton={false}
          render={<ExternalLink href={ExternalLinks.mobileApp} />}
          variant="outline"
          size="sm"
          className="text-foreground"
        >
          Pobierz aplikację
        </Button>
      </CardFooter>
    </Card>
  )
}
