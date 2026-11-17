import { POLAND_TIME_ZONE, POLISH_LANGUAGE } from '@inzpro/config/localization'
import { unrestrictedQualificationScopeCode } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import { demolitionSpecializationCode } from '@inzpro/domain/modules/qualification-paths/specialization'
import { DateTime, Effect } from 'effect'
import { SqlClient } from 'effect/sql'

import { catalogueId } from './catalogue-id.js'
import { catalogueDistrictChambers, catalogueGeneralChambers } from './chamber-catalogue.js'
import { catalogueSessions } from './exam-session-catalogue.js'
import {
  catalogueSpecializations,
  catalogueKinds,
  catalogueScopes,
} from './qualification-catalogue.js'

export const seedQualificationCatalogue = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  for (const entry of catalogueGeneralChambers) {
    yield* sql`INSERT INTO general_chambers (id,code,name,short_name) VALUES (${entry.id},${entry.code},${entry.name},${entry.shortName}) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code,name=EXCLUDED.name,short_name=EXCLUDED.short_name`
  }

  for (const entry of catalogueDistrictChambers) {
    yield* sql`INSERT INTO district_chambers (id,general_chamber_id,code,name,short_name,sort_order,published) VALUES (${entry.id},${entry.generalChamberId},${entry.code},${entry.name},${entry.shortName},${entry.sortOrder},true) ON CONFLICT (id) DO UPDATE SET general_chamber_id=EXCLUDED.general_chamber_id,code=EXCLUDED.code,name=EXCLUDED.name,short_name=EXCLUDED.short_name,sort_order=EXCLUDED.sort_order,published=EXCLUDED.published`
  }

  for (const entry of catalogueSpecializations) {
    yield* sql`INSERT INTO specializations (id,code,name,description,general_chamber_id) VALUES (${entry.id},${entry.code},${entry.name},${entry.description},${entry.chamberId}) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code,name=EXCLUDED.name,description=EXCLUDED.description,general_chamber_id=EXCLUDED.general_chamber_id`
  }

  for (const entry of catalogueKinds) {
    yield* sql`INSERT INTO qualification_kinds (id,code,name) VALUES (${entry.id},${entry.code},${entry.name}) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code,name=EXCLUDED.name`
  }

  for (const entry of catalogueScopes) {
    yield* sql`INSERT INTO qualification_scopes (id,code,name) VALUES (${entry.id},${entry.code},${entry.name}) ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code,name=EXCLUDED.name`
  }

  for (const entry of catalogueSessions) {
    const written = DateTime.makeZonedUnsafe(`${entry.day}T00:00:00`, {
      timeZone: POLAND_TIME_ZONE,
      adjustForTimeZone: true,
    })

    const writtenAt = DateTime.formatIso(written)
    const oralPlanningAt = DateTime.formatIso(DateTime.add(written, { days: 14 }))
    const selectionClosesAt = DateTime.formatIso(DateTime.add(written, { days: 60 }))
    yield* sql`INSERT INTO exam_sessions (id,general_chamber_id,name,written_at,is_confirmed,oral_planning_at,selection_closes_at,published) VALUES (${entry.id},${entry.chamberId},${entry.name},${writtenAt},${entry.isConfirmed},${oralPlanningAt},${selectionClosesAt},true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,written_at=EXCLUDED.written_at,is_confirmed=EXCLUDED.is_confirmed,oral_planning_at=EXCLUDED.oral_planning_at,selection_closes_at=EXCLUDED.selection_closes_at,published=EXCLUDED.published`
  }

  const cataloguePathIds: string[] = []
  let pathNumber = 3

  for (const specialization of catalogueSpecializations) {
    for (const kind of catalogueKinds) {
      for (const scope of catalogueScopes) {
        if (
          specialization.code === demolitionSpecializationCode &&
          scope.code !== unrestrictedQualificationScopeCode
        ) {
          continue
        }

        let id: string

        if (
          specialization.id === catalogueId('60', 1) &&
          kind.id === catalogueId('70', 1) &&
          scope.id === catalogueId('80', 1)
        ) {
          id = catalogueId('10', 1)
        } else if (
          specialization.id === catalogueId('60', 2) &&
          kind.id === catalogueId('70', 2) &&
          scope.id === catalogueId('80', 2)
        ) {
          id = catalogueId('10', 2)
        } else {
          id = catalogueId('10', pathNumber++)
        }

        cataloguePathIds.push(id)
        const name = `${specialization.name}${specialization.description === null ? '' : ` (${specialization.description})`} — ${kind.pathLabel} ${scope.name.toLocaleLowerCase(POLISH_LANGUAGE)}`
        yield* sql`INSERT INTO qualification_paths (id,name,specialization_id,qualification_kind_id,qualification_scope_id,published) VALUES (${id},${name},${specialization.id},${kind.id},${scope.id},true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,published=EXCLUDED.published`
      }
    }
  }

  return cataloguePathIds
})
