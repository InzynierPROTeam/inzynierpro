import { appName } from '@inzpro/config/app'
import { SocialsLinks } from '@inzpro/config/social'
import { getCurrentFullYear } from '@inzpro/utils/date'
import { Img, Link, Section, Text } from 'react-email'
import { links } from '~email/lib/links.js'

const socials = [
  { name: 'Facebook', href: SocialsLinks.Facebook, icon: links.facebookIcon },
  { name: 'Instagram', href: SocialsLinks.Instagram, icon: links.instagramIcon },
  { name: 'TikTok', href: SocialsLinks.TikTok, icon: links.tiktokIcon },
]

export const Footer = () => (
  <Section className="border-border bg-muted rounded-b-lg border-0 border-t border-solid px-10 py-7.5">
    <Text className="text-foreground mb-5 text-center text-sm font-semibold">
      Przygotuj się skutecznie do egzaminu na uprawnienia budowlane
      <br />
      <Link
        href={links.mainPage}
        className="text-primary"
      >
        Odwiedź inzynier.pro
      </Link>
    </Text>

    <Section className="mb-5 text-center">
      {socials.map(social => (
        <Link
          key={social.name}
          href={social.href}
          className="mx-2.5 inline-block"
        >
          <Img
            src={social.icon}
            alt={social.name}
            className="size-7.5"
          />
        </Link>
      ))}
    </Section>

    <Text className="text-muted-foreground m-0 text-center text-xs">
      © {getCurrentFullYear()} {appName}. Wszystkie prawa zastrzeżone.
    </Text>
  </Section>
)
