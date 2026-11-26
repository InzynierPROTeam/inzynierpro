import { Effect } from 'effect'
import { SqlClient } from 'effect/sql'

import { catalogueId } from './catalogue-id.js'

const checkedAt = '2026-11-26T11:00:00.000Z'

const contacts = [
  {
    generalChamberId: catalogueId('50', 1),
    districtChamberId: null,
    name: 'Biuro PIIB',
    address: 'ul. Kujawska 1, 00-793 Warszawa',
    phone: '+48 22 828 31 89',
    email: 'biuro@piib.org.pl',
    openingHours: null,
    sourceUrl: 'https://www.piib.org.pl/kontakt',
    url: 'https://www.piib.org.pl/',
  },
  {
    generalChamberId: catalogueId('50', 2),
    districtChamberId: null,
    name: 'Krajowa Rada Izby Architektów',
    address: 'ul. Stawki 2A, 00-193 Warszawa',
    phone: '+48 22 827 85 14',
    email: 'izba@izbaarchitektow.pl',
    openingHours: null,
    sourceUrl: 'https://www.izbaarchitektow.pl/kontakt/',
    url: 'https://www.izbaarchitektow.pl/',
  },
  {
    generalChamberId: null,
    districtChamberId: catalogueId('51', 1),
    name: 'Biuro DOIIB',
    address: 'ul. Odrzańska 22, 50-114 Wrocław',
    phone: '+48 71 337 62 30',
    email: 'dos@dos.piib.org.pl',
    openingHours:
      'Przyjmowanie interesantów: poniedziałek, wtorek, czwartek i piątek 10:00–14:00; środa 10:00–17:00.',
    sourceUrl: 'https://www.dos.piib.org.pl/kontakt',
    url: 'https://www.dos.piib.org.pl/',
  },
  {
    generalChamberId: null,
    districtChamberId: catalogueId('51', 7),
    name: 'Biuro MOIIB Warszawa',
    address: 'ul. Bluszczańska 71, 00-712 Warszawa',
    phone: '+48 22 868 35 35',
    email: 'biuro@maz.piib.org.pl',
    openingHours:
      'Poniedziałek i czwartek 9:00–18:00; wtorek i środa 8:00–16:00; piątek 8:00–14:00.',
    sourceUrl: 'https://maz.piib.org.pl/kontakt',
    url: 'https://maz.piib.org.pl/',
  },
  {
    generalChamberId: null,
    districtChamberId: catalogueId('51', 22),
    name: 'Biuro MPOIA RP',
    address: 'ul. Karmelicka 9/3 (I piętro), 31-133 Kraków',
    phone: '+48 12 427 26 47',
    email: null,
    openingHours: 'Poniedziałek–piątek 9:00–16:00.',
    sourceUrl: 'https://www.mpoia.pl/index.php/kontakt',
    url: 'https://www.mpoia.pl/',
  },
]

export const seedChamberContacts = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  for (const [index, contact] of contacts.entries()) {
    const officeId = catalogueId('52', index + 1)
    const phoneId = catalogueId('53', index + 1)
    const emailId = catalogueId('54', index + 1)
    const websiteId = catalogueId('55', index + 1)
    yield* sql`INSERT INTO chamber_offices (id,general_chamber_id,district_chamber_id,name,address,is_primary,opening_hours,sort_order,published,source_url,checked_at)
   VALUES (${officeId},${contact.generalChamberId},${contact.districtChamberId},${contact.name},${contact.address},true,${contact.openingHours},1,true,${contact.sourceUrl},${checkedAt})
   ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,address=EXCLUDED.address,is_primary=EXCLUDED.is_primary,opening_hours=EXCLUDED.opening_hours,sort_order=EXCLUDED.sort_order,published=EXCLUDED.published,source_url=EXCLUDED.source_url,checked_at=EXCLUDED.checked_at`
    yield* sql`INSERT INTO chamber_office_phones (id,office_id,value,label,sort_order) VALUES (${phoneId},${officeId},${contact.phone},NULL,1) ON CONFLICT (id) DO UPDATE SET value=EXCLUDED.value`

    if (contact.email !== null) {
      yield* sql`INSERT INTO chamber_office_emails (id,office_id,value,label,sort_order) VALUES (${emailId},${officeId},${contact.email},NULL,1) ON CONFLICT (id) DO UPDATE SET value=EXCLUDED.value`
    }

    yield* sql`INSERT INTO chamber_websites (id,general_chamber_id,district_chamber_id,url,label,kind,sort_order,published,source_url,checked_at)
   VALUES (${websiteId},${contact.generalChamberId},${contact.districtChamberId},${contact.url},NULL,'website',1,true,${contact.sourceUrl},${checkedAt})
   ON CONFLICT (id) DO UPDATE SET url=EXCLUDED.url,published=EXCLUDED.published,source_url=EXCLUDED.source_url,checked_at=EXCLUDED.checked_at`
  }
})
