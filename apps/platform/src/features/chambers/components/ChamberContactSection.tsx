import type { ChamberContacts } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import { Card, CardContent } from '@inzpro/ui/components/card'
import { formatDate } from '@inzpro/utils/date'
import { ExternalLink } from '~platform/components/ExternalLink'

import { ChamberOfficeCard } from './ChamberOfficeCard'

type ChamberContactSectionProps = { title: string; chamber: ChamberContacts }

export const ChamberContactSection = ({ title, chamber }: ChamberContactSectionProps) => {
  const records = [...chamber.offices, ...chamber.websites]

  const latest = records
    .map(record => record.checkedAt)
    .sort((a, b) => a.localeCompare(b))
    .at(-1)

  const sources = [...new Set(records.map(record => record.sourceUrl))]

  return (
    <section
      className="flex flex-col gap-4"
      aria-label={title}
    >
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground">{chamber.name}</p>
      </div>
      {records.length === 0 ? (
        <Card size="sm">
          <CardContent>Nie mamy jeszcze danych kontaktowych tej izby.</CardContent>
        </Card>
      ) : (
        <>
          {chamber.offices.map(office => (
            <ChamberOfficeCard
              key={office.id}
              office={office}
            />
          ))}
          {chamber.websites.length > 0 && (
            <Card size="sm">
              <CardContent className="gap-3">
                <h3 className="font-semibold">Strony WWW i media społecznościowe</h3>
                <ul className="flex flex-col gap-2">
                  {chamber.websites.map(website => (
                    <li key={website.id}>
                      <ExternalLink
                        className="text-primary break-all underline underline-offset-4"
                        href={website.url}
                      >
                        {website.label ?? website.url}
                      </ExternalLink>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <div className="text-muted-foreground flex flex-col gap-2 text-sm">
            {latest && (
              <p>
                Ostatnio sprawdzono: <time dateTime={latest}>{formatDate(latest)}</time>
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {sources.map((source, index) => (
                <li key={source}>
                  <ExternalLink
                    className="underline underline-offset-4"
                    href={source}
                  >
                    Źródło {index + 1}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
