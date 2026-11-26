import type { ChamberContacts as ChamberContactsDto } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import type { ExamSessionOption as ExamSessionOptionDto } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Option } from 'effect'
import type { ChamberContacts } from '~api/modules/exam-calendar/domain/chamber-contact.model.js'
import type { ExamSessionOption } from '~api/modules/exam-calendar/domain/exam-session.model.js'

export const toExamSessionOptionDto = (session: ExamSessionOption): ExamSessionOptionDto => ({
  ...session,
  writtenAt: dateTimeUtcToUtcIsoDateTime(session.writtenAt),
})

export const toChamberContactsDto = <T extends ChamberContacts>(
  chamber: T,
): ChamberContactsDto & { readonly id: T['id'] } => ({
  ...chamber,
  offices: chamber.offices.map(office => ({
    ...office,
    openingHours: Option.getOrNull(office.openingHours),
    checkedAt: dateTimeUtcToUtcIsoDateTime(office.checkedAt),
    phones: office.phones.map(contact => ({ ...contact, label: Option.getOrNull(contact.label) })),
    emails: office.emails.map(contact => ({ ...contact, label: Option.getOrNull(contact.label) })),
  })),
  websites: chamber.websites.map(website => ({
    ...website,
    label: Option.getOrNull(website.label),
    checkedAt: dateTimeUtcToUtcIsoDateTime(website.checkedAt),
  })),
})
