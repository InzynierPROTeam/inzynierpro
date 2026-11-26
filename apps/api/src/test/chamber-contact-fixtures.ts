import {
  ChamberOfficeId,
  ChamberWebsiteId,
  websiteKind,
} from '@inzpro/domain/modules/exam-calendar/chamber-contact'
import { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { DateTime, Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import {
  ChamberContactsRepository,
  type ChamberContactPublication,
} from '~api/modules/exam-calendar/application/chamber-contacts.repository.js'
import type { ChamberWebsite } from '~api/modules/exam-calendar/domain/chamber-contact.model.js'

import { runFixture } from './run-fixture.js'

export const fixtureContactsDistrict = DistrictChamberId.make(
  '51000000-0000-4000-8000-000000000011',
)

export const fixtureContactPublication: ChamberContactPublication = {
  generalChamberId: Option.none(),
  districtChamberId: Option.some(fixtureContactsDistrict),
  sortOrder: 1,
  published: true,
}

export const fixtureChamberOffice = () => ({
  id: ChamberOfficeId.make(crypto.randomUUID()),
  name: 'Fixture office',
  address: 'Fixture address',
  isPrimary: false,
  openingHours: Option.some('Monday 9–15'),
  sourceUrl: 'https://example.com/office',
  checkedAt: DateTime.makeUnsafe('2026-11-20T12:00:00.000Z'),
  phones: [
    { value: '+48 111 111 111', label: Option.some('Reception') },
    { value: '+48 222 222 222', label: Option.none() },
  ],
  emails: [{ value: 'office@example.com', label: Option.none() }],
  ...fixtureContactPublication,
})

export const fixtureChamberWebsite = (): ChamberWebsite & ChamberContactPublication => ({
  id: ChamberWebsiteId.make(crypto.randomUUID()),
  url: 'https://example.com/',
  label: Option.none<string>(),
  kind: websiteKind,
  sourceUrl: 'https://example.com/source',
  checkedAt: DateTime.makeUnsafe('2026-11-21T12:00:00.000Z'),
  ...fixtureContactPublication,
})

export const createChamberContactFixture = () =>
  runFixture(
    Transaction.use(transaction =>
      transaction.run(
        Effect.gen(function* () {
          const chamberContactsRepository = yield* ChamberContactsRepository

          const hiddenOffice = {
            ...fixtureChamberOffice(),
            published: false,
            name: 'Hidden office',
            sortOrder: -1,
          }

          const laterOffice = { ...fixtureChamberOffice(), name: 'Later office', sortOrder: 2 }

          const primaryOffice = {
            ...fixtureChamberOffice(),
            name: 'Primary office',
            isPrimary: true,
            sortOrder: 100,
          }

          const earlierOffice = { ...fixtureChamberOffice(), name: 'Earlier office', sortOrder: 1 }

          for (const office of [hiddenOffice, laterOffice, primaryOffice, earlierOffice]) {
            yield* chamberContactsRepository.createOffice(office)
          }

          const hiddenWebsite = { ...fixtureChamberWebsite(), published: false, sortOrder: -1 }

          const laterWebsite = {
            ...fixtureChamberWebsite(),
            url: 'https://example.com/later',
            sortOrder: 2,
          }

          const earlierWebsite = {
            ...fixtureChamberWebsite(),
            url: 'https://example.com/earlier',
            sortOrder: 1,
          }

          for (const website of [hiddenWebsite, laterWebsite, earlierWebsite]) {
            yield* chamberContactsRepository.createWebsite(website)
          }

          return { primaryOffice, earlierOffice, laterOffice, earlierWebsite, laterWebsite }
        }),
      ),
    ),
  )

export const fixtureGeneralChamberId = GeneralChamberId.make('50000000-0000-4000-8000-000000000001')
