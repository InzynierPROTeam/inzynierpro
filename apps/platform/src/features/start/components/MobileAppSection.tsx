import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { ChevronRight, Smartphone } from 'lucide-react'
import { ExternalLink } from '~platform/components/ExternalLink'
import { ExternalLinks } from '~platform/config/app'

export const MobileAppSection = () => (
  <section className="app-layout-section @container pt-0!">
    <ExternalLink
      className="group flex-1 rounded-4xl"
      href={ExternalLinks.mobileApp}
    >
      <Card className="gradient-brand-pink text-primary-foreground h-full flex-1 justify-between bg-linear-to-br">
        <CardHeader>
          <IconWrapper
            size="sm"
            className="bg-background/20 text-current"
          >
            <Smartphone />
          </IconWrapper>
          <CardTitle>
            <h2>Pobierz aplikację</h2>
          </CardTitle>
          <CardDescription className="text-current/70">
            Apka mobilna iOS oraz Android
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end">
          <span className="flex items-center gap-0.5 text-xs text-current/60 transition-colors group-hover:text-current/70">
            Pobierz
            <ChevronRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        </CardFooter>
      </Card>
    </ExternalLink>
  </section>
)
