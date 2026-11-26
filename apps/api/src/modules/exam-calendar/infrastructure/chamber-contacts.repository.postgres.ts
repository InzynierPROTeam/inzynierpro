import { DateTime, Effect, Layer, Option } from 'effect'
import { SqlClient } from 'effect/sql'
import { ChamberContactsRepository } from '~api/modules/exam-calendar/application/chamber-contacts.repository.js'
import { ExamCalendarWriteError } from '~api/modules/exam-calendar/application/errors.js'

export const ChamberContactsRepositoryLive = Layer.effect(
  ChamberContactsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return ChamberContactsRepository.of({
      createOffice: Effect.fn('ChamberContactsRepository.createOffice')(
        function* (office) {
          const generalChamberId = Option.getOrNull(office.generalChamberId)
          const districtChamberId = Option.getOrNull(office.districtChamberId)
          const openingHours = Option.getOrNull(office.openingHours)
          const checkedAt = DateTime.formatIso(office.checkedAt)
          yield* sql`INSERT INTO chamber_offices (id,general_chamber_id,district_chamber_id,name,address,is_primary,opening_hours,sort_order,published,source_url,checked_at) VALUES (${office.id},${generalChamberId},${districtChamberId},${office.name},${office.address},${office.isPrimary},${openingHours},${office.sortOrder},${office.published},${office.sourceUrl},${checkedAt})`

          for (const [index, contact] of office.phones.entries()) {
            const id = crypto.randomUUID()
            const label = Option.getOrNull(contact.label)
            yield* sql`INSERT INTO chamber_office_phones (id,office_id,value,label,sort_order) VALUES (${id},${office.id},${contact.value},${label},${index})`
          }

          for (const [index, contact] of office.emails.entries()) {
            const id = crypto.randomUUID()
            const label = Option.getOrNull(contact.label)
            yield* sql`INSERT INTO chamber_office_emails (id,office_id,value,label,sort_order) VALUES (${id},${office.id},${contact.value},${label},${index})`
          }
        },
        Effect.mapError(cause => new ExamCalendarWriteError({ cause })),
      ),
      createWebsite: Effect.fn('ChamberContactsRepository.createWebsite')(
        function* (website) {
          const generalChamberId = Option.getOrNull(website.generalChamberId)
          const districtChamberId = Option.getOrNull(website.districtChamberId)
          const label = Option.getOrNull(website.label)
          const checkedAt = DateTime.formatIso(website.checkedAt)
          yield* sql`INSERT INTO chamber_websites (id,general_chamber_id,district_chamber_id,url,label,kind,sort_order,published,source_url,checked_at) VALUES (${website.id},${generalChamberId},${districtChamberId},${website.url},${label},${website.kind},${website.sortOrder},${website.published},${website.sourceUrl},${checkedAt})`
        },
        Effect.mapError(cause => new ExamCalendarWriteError({ cause })),
      ),
    })
  }),
)
