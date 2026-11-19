import { profileSettingsQueryOptions } from '@inzpro/queries/modules/profiles/queries'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { Switch } from '@inzpro/ui/components/switch'
import { toast } from '@inzpro/ui/components/toast'
import { useQuery } from '@tanstack/react-query'
import { EyeOff } from 'lucide-react'
import { useId } from 'react'
import { apiHttpClient } from '~platform/lib/api-client'

import { useSetProfilePrivacy } from '../hooks/useSetProfilePrivacy'
import { profileRouteApi } from '../utils'

export const ProfilePrivacyItem = () => {
  const {
    session: { user },
  } = profileRouteApi.useRouteContext()

  const labelId = useId()
  const { data } = useQuery(profileSettingsQueryOptions(apiHttpClient, user.id))
  const mutation = useSetProfilePrivacy(user.id)

  const changePrivacy = (privateProfile: boolean) =>
    toast.promise(mutation.mutateAsync(privateProfile), {
      loading: { title: 'Zapisywanie ustawień...' },
      success: {
        title: privateProfile ? 'Profil jest teraz prywatny.' : 'Profil jest teraz publiczny.',
      },
      error: { title: 'Nie udało się zmienić widoczności profilu.' },
    })

  return (
    <Item
      variant="background-soft"
      role="listitem"
    >
      <ItemMedia>
        <IconWrapper
          variant="background"
          size="sm"
        >
          <EyeOff />
        </IconWrapper>
      </ItemMedia>
      <ItemContent className="gap-1">
        <ItemTitle
          id={labelId}
          className="line-clamp-none"
        >
          Profil prywatny
        </ItemTitle>
        <ItemDescription className="line-clamp-none text-xs">
          Inni nie zobaczą Twojego profilu. W rankingach nadal widać Twoją nazwę i wynik.
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Switch
          aria-labelledby={labelId}
          checked={data?.privateProfile ?? false}
          disabled={data === undefined || mutation.isPending}
          onCheckedChange={changePrivacy}
        />
      </ItemActions>
    </Item>
  )
}
