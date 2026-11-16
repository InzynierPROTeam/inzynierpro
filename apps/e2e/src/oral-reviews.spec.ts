import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { CurrentSessionResponse } from '@inzpro/api-contracts/modules/identity/responses'
import { QualificationPathsResponse } from '@inzpro/api-contracts/modules/preparation/responses'
import { expect } from '@playwright/test'
import { Schema } from 'effect'
import { apiUrl } from '~e2e/environment'
import { smallPathConfiguration, test } from '~e2e/test/fixtures'

const category = 'Proces inwestycyjny i pozwolenie na budowę'

test.use({ pathConfiguration: smallPathConfiguration })

test('a learner opens oral reviews from the tile, resumes a category review and finishes with a next step', async ({
  onboarded: { page },
}) => {
  const identity = Schema.decodeUnknownSync(CurrentSessionResponse)(
    await (await page.request.get(`${apiUrl}/api/v1/identity/session`)).json(),
  )

  const paths = Schema.decodeUnknownSync(Schema.toCodecJson(QualificationPathsResponse))(
    await (await page.request.get(`${apiUrl}/api/v1/preparation/paths`)).json(),
  )

  const path = paths.data[0]!
  await promisify(execFile)(
    'pnpm',
    [
      '--filter',
      '@inzpro/api',
      'exec',
      'tsx',
      'src/test/prepare-oral-review.ts',
      identity.user.id,
      path.id,
      '32000000-0000-4000-8000-000000000001',
    ],
    {
      cwd: fileURLToPath(new URL('../../..', import.meta.url)),
      env: { ...process.env, NODE_ENV: 'test' },
    },
  )
  await page.goto('/start')
  const tile = page.getByRole('region', { name: 'Powtórka ustna', exact: true })
  await expect(tile).toContainText('Pytania do powtórki: 4')
  await tile.getByRole('button', { name: 'Powtórz pytania' }).click()
  await expect(page.getByRole('heading', { name: 'Zacznij powtórkę', exact: true })).toBeVisible()
  await page.goto('/ustny')
  await page
    .getByRole('region', { name: category, exact: true })
    .getByRole('button', { name: 'Powtórz pytania' })
    .click()
  await page.getByRole('button', { name: 'Zacznij powtórkę', exact: true }).click()
  const scale = page.getByRole('group', { name: 'Oceń trudność pytania' })
  await scale.getByRole('button', { name: 'Łatwe' }).click()
  await expect(page.getByRole('heading', { name: 'Pytanie 2 z 4', exact: true })).toBeVisible()
  await page.goto('/ustny/powtorka?kategoria=32000000-0000-4000-8000-000000000001')
  await page.getByRole('button', { name: 'Przejdź do powtórki' }).click()

  for (const position of [2, 3, 4]) {
    await expect(
      page.getByRole('heading', { name: `Pytanie ${position} z 4`, exact: true }),
    ).toBeVisible()
    await scale.getByRole('button', { name: 'Łatwe' }).click()
  }

  await expect(page.getByRole('heading', { name: 'Podsumowanie sesji', exact: true })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: /^Łatwe/ })).toContainText('4 z 4')
  await expect(page.getByRole('heading', { name: 'Co dalej?', exact: true })).toBeVisible()
  await page.goto('/start')
  await expect(tile).toContainText('Najbliższa powtórka:')
})
