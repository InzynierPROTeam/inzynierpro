import { Button } from '@inzpro/ui/components/button'
import {
  type AnyRouter,
  type RegisteredRouter,
  type UseLinkPropsOptions,
  useLinkProps,
  useLocation,
  useRouter,
} from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { type BackOrigin, getBackOrigin, subscribeBackOrigins } from '~platform/lib/back-navigation'

const backLabelOf = (router: AnyRouter, href: string | undefined) => {
  if (href === undefined) {
    return undefined
  }

  const [, , destination] = router.getMatchedRoutes(href.split(/[?#]/)[0] ?? href)

  return destination?.options.staticData?.backLabel
}

type BackLinkProps<TTo extends string> = {
  /**
   * Where to go when the user did not come from a back target of the app (direct entry, new tab,
   * sign-in). Without a fallback the link is hidden in that case.
   */
  fallback?: UseLinkPropsOptions<RegisteredRouter, string, TTo>
}

/**
 * Goes back to the page the user came from when that page is a back target, i.e. declares
 * `staticData.backLabel`, labelled with it. Otherwise it links to the fallback.
 */
export function BackLink<const TTo extends string>({ fallback }: BackLinkProps<TTo>) {
  const router = useRouter()
  const location = useLocation()

  const origin = useSyncExternalStore(
    subscribeBackOrigins,
    () => getBackOrigin(location),
    () => undefined,
  )

  const originLabel = backLabelOf(router, origin?.href)

  if (origin !== undefined && originLabel !== undefined) {
    return (
      <OriginBackLink
        origin={origin}
        label={originLabel}
      />
    )
  }

  return fallback === undefined ? null : <FallbackBackLink fallback={fallback} />
}

type BackLinkButtonProps = { link: React.ReactElement; label: string }

const BackLinkButton: React.FC<BackLinkButtonProps> = ({ link, label }) => (
  <Button
    variant="ghost"
    nativeButton={false}
    className="-ml-3 self-start"
    render={link}
  >
    <ChevronLeft /> {label}
  </Button>
)

type OriginBackLinkProps = { origin: BackOrigin; label: string }

const OriginBackLink: React.FC<OriginBackLinkProps> = ({ origin, label }) => {
  const router = useRouter()
  const location = useLocation()

  return (
    <BackLinkButton
      label={label}
      link={
        <a
          href={origin.href}
          onClick={event => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            ) {
              return
            }

            event.preventDefault()
            const steps = origin.index - location.state.__TSR_index

            // Stepping back restores the origin entry together with its scroll position.
            if (steps < 0) {
              router.history.go(steps)
            } else {
              router.history.push(origin.href)
            }
          }}
        />
      }
    />
  )
}

type FallbackBackLinkProps<TTo extends string> = {
  fallback: UseLinkPropsOptions<RegisteredRouter, string, TTo>
}

function FallbackBackLink<const TTo extends string>({ fallback }: FallbackBackLinkProps<TTo>) {
  const router = useRouter()
  const linkProps = useLinkProps(fallback)
  const label = backLabelOf(router, linkProps.href) ?? 'Wróć'

  return (
    <BackLinkButton
      label={label}
      link={<a {...linkProps} />}
    />
  )
}
