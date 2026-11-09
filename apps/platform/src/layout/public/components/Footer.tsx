import { POLAND_TIME_ZONE } from '@inzpro/config/localization'
import { Separator } from '@inzpro/ui/components/separator'
import { getCurrentFullYear } from '@inzpro/utils/date'
import { Link } from '@tanstack/react-router'
import { appName, ExternalLinks } from '~platform/config/app'
import { Logo } from '~platform/layout/components/Logo'

import { FooterLinksColumn, type FooterLink } from './FooterLinksColumn'

export const Footer = () => (
  <footer className="layout-section bg-card border-border @container max-w-[calc(1280px-2*2rem)]! gap-6 rounded-t-3xl border border-b-0 pt-12! pb-6!">
    <div className="flex flex-wrap gap-8 max-md:flex-col">
      <div className="flex flex-1 shrink-0 flex-col items-start gap-6">
        <div className="flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <Logo className="size-6" />
            <span className="leading-6 font-bold">{appName}</span>
          </Link>
          <p className="text-muted-foreground max-w-md text-sm">
            Zdobądź uprawnienia budowlane za pierwszym podejściem
          </p>
        </div>
      </div>

      <nav
        aria-label="Linki stopki"
        className="flex flex-1 shrink-0 flex-wrap gap-x-12 gap-y-6"
      >
        <FooterLinksColumn
          title="Zobacz więcej"
          links={seeMoreLinks}
        />
        <FooterLinksColumn
          title="Informacje prawne"
          links={legalInfoLinks}
        />
      </nav>
    </div>

    <Separator />

    <small className="text-foreground/50 text-xs">
      © {getCurrentFullYear(undefined, POLAND_TIME_ZONE)} {appName}. Wszystkie prawa zastrzeżone.
    </small>
  </footer>
)

const seeMoreLinks: Array<FooterLink> = [
  {
    label: 'Baza wiedzy',
    href: ExternalLinks.knowledge,
  },
  {
    label: 'Kontakt',
    href: ExternalLinks.contact,
  },
  {
    label: 'FAQ',
    href: ExternalLinks.faq,
  },
  {
    label: 'Strona główna',
    href: ExternalLinks.homepage,
  },
]

const legalInfoLinks: Array<FooterLink> = [
  {
    label: 'Polityka prywatności',
    href: ExternalLinks.privacyPolicy,
  },
  {
    label: 'Regulamin',
    href: ExternalLinks.termsAndConditionsPolicy,
  },
  {
    label: 'Polityka cookies',
    href: ExternalLinks.cookiesPolicy,
  },
]
