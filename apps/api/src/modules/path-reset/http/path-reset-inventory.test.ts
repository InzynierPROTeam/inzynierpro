import { databaseLayerFromConfig } from '@inzpro/db'
import { Effect } from 'effect'
import { expect, test } from 'vitest'
import { privatePathTables } from '~api/test/sql/database-catalogue.js'

const resetTables = [
  'mock_exam_attempts',
  'oral_daily_plan_settings',
  'oral_daily_plans',
  'oral_learning_events',
  'oral_learning_rounds',
  'oral_question_coverage',
  'oral_review_states',
  'oral_study_sessions',
  'written_daily_plan_settings',
  'written_daily_plans',
  'written_learning_events',
  'written_learning_rounds',
  'written_question_coverage',
  'written_review_states',
  'written_study_sessions',
]

const keptTables = ['user_exam_goals', 'user_qualification_paths', 'xp_events']

test('every private per-path table is either reset or deliberately kept', async () => {
  const tables = await Effect.runPromise(
    privatePathTables.pipe(Effect.provide(databaseLayerFromConfig), Effect.scoped),
  )

  expect(tables).toEqual([...resetTables, ...keptTables].sort())
})
