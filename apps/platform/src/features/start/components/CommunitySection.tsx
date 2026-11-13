import { SocialsLinks } from '@inzpro/config/social'
import { Card, CardContent } from '@inzpro/ui/components/card'
import { ExternalLink } from '~platform/components/ExternalLink'
import { Icon } from '~platform/components/Icon'

export const CommunitySection = () => (
  <section className="app-layout-section @container pt-0!">
    <h2 className="sr-only">Dołącz do naszej społeczności</h2>
    <div className="grid grid-cols-3 gap-8 max-sm:gap-4 @max-xl:grid-cols-1">
      <ExternalLink
        className="group h-full rounded-4xl"
        href={SocialsLinks.Instagram}
      >
        <Card className="h-full justify-center">
          <CardContent className="flex flex-col items-center gap-2">
            <Icon
              name="Instagram"
              className="text-primary size-8"
            />
            <p className="text-primary/50 group-hover:text-primary text-sm tracking-widest uppercase transition-colors">
              Instagram
            </p>
          </CardContent>
        </Card>
      </ExternalLink>
      <ExternalLink
        className="group h-full rounded-4xl"
        href={SocialsLinks.Facebook}
      >
        <Card className="h-full justify-center">
          <CardContent className="flex flex-col items-center gap-2">
            <Icon
              name="Facebook"
              className="text-primary size-8"
            />
            <p className="text-primary/50 group-hover:text-primary text-sm tracking-widest uppercase transition-colors">
              Facebook
            </p>
          </CardContent>
        </Card>
      </ExternalLink>
      <ExternalLink
        className="group h-full rounded-4xl"
        href={SocialsLinks.TikTok}
      >
        <Card className="h-full justify-center">
          <CardContent className="flex flex-col items-center gap-2">
            <Icon
              name="Tiktok"
              className="text-primary size-8"
            />
            <p className="text-primary/50 group-hover:text-primary text-sm tracking-widest uppercase transition-colors">
              TikTok
            </p>
          </CardContent>
        </Card>
      </ExternalLink>
    </div>
  </section>
)
