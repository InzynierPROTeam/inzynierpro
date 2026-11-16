import { expect } from '@playwright/test'
import { smallPathConfiguration, test } from '~e2e/test/fixtures'

test.describe('a path with seeded oral material', () => {
  test.use({ pathConfiguration: smallPathConfiguration })

  test('lists its oral categories with question counts and progress', async ({
    onboarded: { page },
  }) => {
    await page.goto('/ustny')

    const categories = [
      'Proces inwestycyjny i pozwolenie na budowę',
      'Uczestnicy procesu budowlanego',
      'Warunki techniczne w projektowaniu',
    ]

    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText(categories)
    await expect(page.getByText('Ukończone: 0 / 4 pytań')).toHaveCount(categories.length)

    for (const category of categories) {
      await expect(
        page.getByRole('progressbar', { name: `Postęp nauki: ${category}` }),
      ).toBeVisible()
    }
  })
})

test('a path without oral material shows that none is available yet', async ({
  onboarded: { page },
}) => {
  await page.goto('/ustny')

  await expect(page.getByText('Brak materiałów')).toBeVisible()
})
