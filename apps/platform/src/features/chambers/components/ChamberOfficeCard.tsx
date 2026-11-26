import type { ChamberOffice } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import { Card, CardContent, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { ExternalLink } from '~platform/components/ExternalLink'

import { getGoogleMapsSearchUrl } from '../utils'

type ChamberOfficeCardProps = { office: ChamberOffice }

export const ChamberOfficeCard = ({ office }: ChamberOfficeCardProps) => (
  <Card size="sm">
    <CardHeader>
      <CardTitle>
        <h3>{office.name}</h3>
      </CardTitle>
      {office.isPrimary && <p className="text-muted-foreground text-sm">Siedziba główna</p>}
    </CardHeader>
    <CardContent className="gap-3 text-sm">
      <ExternalLink
        className="text-primary underline underline-offset-4"
        href={getGoogleMapsSearchUrl(office.address)}
      >
        {office.address}
      </ExternalLink>
      {office.openingHours && <p className="whitespace-pre-line">{office.openingHours}</p>}
      {office.phones.map((contact, index) => (
        <p key={index}>
          <ExternalLink
            className="text-primary underline underline-offset-4"
            href={`tel:${contact.value.replace(/\s/g, '')}`}
            openInNewTab={false}
          >
            {contact.value}
          </ExternalLink>
          {contact.label && ` — ${contact.label}`}
        </p>
      ))}
      {office.emails.map((contact, index) => (
        <p key={index}>
          <ExternalLink
            className="text-primary underline underline-offset-4"
            href={`mailto:${contact.value}`}
            openInNewTab={false}
          >
            {contact.value}
          </ExternalLink>
          {contact.label && ` — ${contact.label}`}
        </p>
      ))}
    </CardContent>
  </Card>
)
