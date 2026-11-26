import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { ChamberOfficeId } from '@inzpro/domain/modules/exam-calendar/chamber-contact'
import { DistrictChamberId } from '@inzpro/domain/modules/exam-calendar/district-chamber'
import { GeneralChamberId } from '@inzpro/domain/modules/exam-calendar/general-chamber'
import { Effect, Layer, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { ChamberContactsReader } from '~api/modules/exam-calendar/application/chamber-contacts.reader.js'
import { ExamCalendarReadError } from '~api/modules/exam-calendar/application/errors.js'
import {
  ChamberOffice,
  ChamberWebsite,
} from '~api/modules/exam-calendar/domain/chamber-contact.model.js'

const ChamberRow = Schema.Struct({
  id: Schema.Union([GeneralChamberId, DistrictChamberId]),
  name: Schema.NonEmptyString,
  shortName: Schema.NonEmptyString,
})

const OfficeRow = Schema.Struct({
  id: ChamberOfficeId,
  name: Schema.NonEmptyString,
  address: Schema.NonEmptyString,
  isPrimary: Schema.Boolean,
  openingHours: Schema.OptionFromNullOr(Schema.NonEmptyString),
  sourceUrl: Schema.NonEmptyString,
  checkedAt: DateTimeUtc,
})

const ContactRow = Schema.Struct({
  officeId: ChamberOfficeId,
  value: Schema.NonEmptyString,
  label: Schema.OptionFromNullOr(Schema.NonEmptyString),
})

export const ChamberContactsReaderLive = Layer.effect(
  ChamberContactsReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const contacts = Effect.fn('ChamberContactsReader.contacts')(function* <
      T extends typeof ChamberRow.Type,
    >(chamber: T, district: boolean) {
      const officeOwner = district ? sql`o.district_chamber_id` : sql`o.general_chamber_id`
      const websiteOwner = district ? sql`w.district_chamber_id` : sql`w.general_chamber_id`

      const offices =
        yield* sql`SELECT o.id,o.name,o.address,o.is_primary,o.opening_hours,o.source_url,o.checked_at FROM chamber_offices o WHERE ${officeOwner}=${chamber.id} AND o.published ORDER BY o.is_primary DESC,o.sort_order,o.id`.pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(OfficeRow))),
        )

      const phones =
        yield* sql`SELECT c.office_id,c.value,c.label FROM chamber_office_phones c JOIN chamber_offices o ON o.id=c.office_id WHERE ${officeOwner}=${chamber.id} AND o.published ORDER BY c.sort_order,c.id`.pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ContactRow))),
        )

      const emails =
        yield* sql`SELECT c.office_id,c.value,c.label FROM chamber_office_emails c JOIN chamber_offices o ON o.id=c.office_id WHERE ${officeOwner}=${chamber.id} AND o.published ORDER BY c.sort_order,c.id`.pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ContactRow))),
        )

      const websites =
        yield* sql`SELECT w.id,w.url,w.label,w.kind,w.source_url,w.checked_at FROM chamber_websites w WHERE ${websiteOwner}=${chamber.id} AND w.published ORDER BY w.sort_order,w.id`.pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(ChamberWebsite))),
        )

      return {
        ...chamber,
        offices: offices.map((office): ChamberOffice => ({
          ...office,
          phones: phones
            .filter(c => c.officeId === office.id)
            .map(({ value, label }) => ({ value, label })),
          emails: emails
            .filter(c => c.officeId === office.id)
            .map(({ value, label }) => ({ value, label })),
        })),
        websites,
      }
    })

    return ChamberContactsReader.of({
      generalForPath: Effect.fn('ChamberContactsReader.generalForPath')(
        function* (pathId) {
          const rows =
            yield* sql`SELECT g.id,g.name,g.short_name FROM general_chambers g JOIN specializations s ON s.general_chamber_id=g.id JOIN qualification_paths p ON p.specialization_id=s.id WHERE p.id=${pathId} LIMIT 1`

          const chamber = yield* Schema.decodeUnknownEffect(
            Schema.Struct({ ...ChamberRow.fields, id: GeneralChamberId }),
          )(rows[0])

          return yield* contacts(chamber, false)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
          SchemaError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
        }),
      ),
      district: Effect.fn('ChamberContactsReader.district')(
        function* (id) {
          const rows =
            yield* sql`SELECT id,name,short_name FROM district_chambers WHERE id=${id} LIMIT 1`

          const chamber = yield* Schema.decodeUnknownEffect(
            Schema.Struct({ ...ChamberRow.fields, id: DistrictChamberId }),
          )(rows[0])

          return yield* contacts(chamber, true)
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
          SchemaError: cause => Effect.fail(new ExamCalendarReadError({ cause })),
        }),
      ),
    })
  }),
)
