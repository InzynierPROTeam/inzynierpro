import { SocialsLinks } from '@inzpro/config/social'
import { Icon } from '~platform/components/Icon'
import { SocialIcon } from '~platform/components/SocialIcon'

import { NavLinks } from './NavLinks'
import { SidebarSpecialty } from './SidebarSpecialty'

export const Sidebar = () => (
  <aside className="absolute top-20 left-8 w-68 py-12 max-lg:hidden">
    <div className="border-border bg-background/50 scrollbar-hidden flex max-h-[calc(100dvh-12rem)] flex-col gap-8 overflow-auto rounded-3xl border p-8 backdrop-blur-lg">
      <SidebarSpecialty />
      <nav aria-label="Nawigacja boczna">
        <NavLinks />
      </nav>
      <div className="mt-8 flex gap-x-4 self-center">
        <SocialIcon
          href={SocialsLinks.Instagram}
          icon={
            <Icon
              name="Instagram"
              className="fill-primary size-5"
            />
          }
          label="Instagram"
          className="text-primary bg-background/90 hover:bg-background"
        />
        <SocialIcon
          href={SocialsLinks.Facebook}
          icon={
            <Icon
              name="Facebook"
              className="size-5"
            />
          }
          label="Facebook"
          className="text-primary bg-background/90 hover:bg-background"
        />
        <SocialIcon
          href={SocialsLinks.TikTok}
          icon={
            <Icon
              name="Tiktok"
              className="size-4.25"
            />
          }
          label="TikTok"
          className="text-primary bg-background/90 hover:bg-background"
        />
      </div>
    </div>
  </aside>
)
