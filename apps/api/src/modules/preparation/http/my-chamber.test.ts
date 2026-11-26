import { MyChamberResponse } from '@inzpro/api-contracts/modules/preparation/responses'
import { Effect, Option, Schema, Result } from 'effect'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { ChamberContactsRepository } from '~api/modules/exam-calendar/application/chamber-contacts.repository.js'
import { startTestApi, type TestApi, type TestVisitor } from '~api/test/api-server.js'
import {
  createChamberContactFixture,
  fixtureChamberOffice,
  fixtureChamberWebsite,
  fixtureContactsDistrict,
  fixtureGeneralChamberId,
} from '~api/test/chamber-contact-fixtures.js'
import {
  learningRequest,
  loginForPreparation,
  technicalConfiguration,
  technicalPathA,
  technicalPathB,
} from '~api/test/preparation.js'
import { runFixture } from '~api/test/run-fixture.js'

let api: TestApi

beforeAll(async () => {
  api = await startTestApi()
})

afterAll(() => api.close())

const decode = Schema.decodeUnknownSync(Schema.toCodecJson(MyChamberResponse))

const onboard = async () => {
  const learner = await loginForPreparation(api)
  expect((await learningRequest(api, learner, '/onboarding', technicalConfiguration)).status).toBe(
    200,
  )

  return learner
}

const read = async (learner: TestVisitor) =>
  decode(await (await learningRequest(api, learner, `/paths/${technicalPathA}/chamber`)).json())

const choose = (learner: TestVisitor, id: string | null) =>
  learningRequest(api, learner, `/paths/${technicalPathA}/district-chamber`, {
    districtChamberId: id,
  })

test('the chamber page read follows the learner selection and includes sourced national and district contacts', async () => {
  const learner = await onboard()
  const initial = await read(learner)
  expect(initial.districtChamber).toBeNull()
  expect(initial.generalChamber).toMatchObject({
    name: 'Polska Izba Inżynierów Budownictwa',
    offices: [
      {
        address: 'ul. Kujawska 1, 00-793 Warszawa',
        phones: [{ value: '+48 22 828 31 89', label: null }],
        emails: [{ value: 'biuro@piib.org.pl', label: null }],
        sourceUrl: 'https://www.piib.org.pl/kontakt',
        checkedAt: '2026-11-26T11:00:00.000Z',
      },
    ],
  })
  expect((await choose(learner, '51000000-0000-4000-8000-000000000001')).status).toBe(200)
  const chosen = await read(learner)
  expect(chosen.districtChamber).toMatchObject({
    offices: [
      {
        address: 'ul. Odrzańska 22, 50-114 Wrocław',
        sourceUrl: 'https://www.dos.piib.org.pl/kontakt',
      },
    ],
  })
  expect(chosen.generalChamber).toEqual(initial.generalChamber)
  expect((await choose(learner, '51000000-0000-4000-8000-000000000002')).status).toBe(200)
  expect((await read(learner)).districtChamber).toMatchObject({ offices: [], websites: [] })
  expect((await choose(learner, null)).status).toBe(200)
  expect((await read(learner)).districtChamber).toBeNull()
})

test('only published contacts are read with primary offices first and stable contact and website order', async () => {
  const fixture = await createChamberContactFixture()
  const learner = await onboard()
  await choose(learner, fixtureContactsDistrict)
  const result = (await read(learner)).districtChamber
  expect(result?.offices.map(office => office.id)).toEqual([
    fixture.primaryOffice.id,
    fixture.earlierOffice.id,
    fixture.laterOffice.id,
  ])
  expect(result?.websites.map(website => website.id)).toEqual([
    fixture.earlierWebsite.id,
    fixture.laterWebsite.id,
  ])
  expect(result?.offices[0]).toMatchObject({
    openingHours: 'Monday 9–15',
    phones: [
      { value: '+48 111 111 111', label: 'Reception' },
      { value: '+48 222 222 222', label: null },
    ],
    emails: [{ value: 'office@example.com', label: null }],
    checkedAt: '2026-11-20T12:00:00.000Z',
  })
})

test('contact reads require the owner of an active assignment', async () => {
  const learner = await onboard()
  const stranger = await loginForPreparation(api)
  expect(
    (await learningRequest(api, api.visitor(), `/paths/${technicalPathA}/chamber`)).status,
  ).toBe(401)
  expect((await learningRequest(api, stranger, `/paths/${technicalPathA}/chamber`)).status).toBe(
    403,
  )
  expect((await learningRequest(api, learner, `/paths/${technicalPathB}/chamber`)).status).toBe(403)
  await learningRequest(api, learner, `/paths/${technicalPathA}/archive`, {})
  expect((await learningRequest(api, learner, `/paths/${technicalPathA}/chamber`)).status).toBe(403)
})

test.each([
  { generalChamberId: Option.none(), districtChamberId: Option.none() },
  {
    generalChamberId: Option.some(fixtureGeneralChamberId),
    districtChamberId: Option.some(fixtureContactsDistrict),
  },
])('contact ownership rejects zero or two chambers: %j', async owner => {
  const office = await runFixture(
    ChamberContactsRepository.use(repository =>
      repository.createOffice({ ...fixtureChamberOffice(), ...owner }),
    ).pipe(Effect.result),
  )

  expect(Result.isFailure(office)).toBe(true)

  if (Result.isFailure(office)) {
    expect(office.failure._tag).toBe('ExamCalendarWriteError')
  }

  const website = await runFixture(
    ChamberContactsRepository.use(repository =>
      repository.createWebsite({ ...fixtureChamberWebsite(), ...owner }),
    ).pipe(Effect.result),
  )

  expect(Result.isFailure(website)).toBe(true)

  if (Result.isFailure(website)) {
    expect(website.failure._tag).toBe('ExamCalendarWriteError')
  }
})
