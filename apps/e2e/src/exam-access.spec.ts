import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

test.describe('a path covering only the written exam', () => {
  test.use({ accessScope: 'written' })

  test('offers to extend access before oral study and opens it once extended', async ({
    onboarded: { page },
  }) => {
    await page.goto('/ustny')
    await expect(page).toHaveURL(/\/rozszerz-dostep/)
    await expect(page.getByText('Twoja ścieżka nie obejmuje tej części egzaminu.')).toBeVisible()

    await page
      .getByRole('button', { name: 'Potwierdź dostęp do egzaminu pisemnego i ustnego' })
      .click()

    await expect(page).toHaveURL(/\/ustny/)
    await expect(page.getByRole('heading', { level: 1, name: 'Egzamin ustny' })).toBeVisible()
  })

  test('keeps written study open', async ({ onboarded: { page } }) => {
    await page.goto('/nauka')
    await expect(page.getByRole('heading', { level: 1, name: 'Kategorie' })).toBeVisible()
  })
})

test.describe('a path covering only the oral exam', () => {
  test.use({ accessScope: 'oral' })

  test('offers to extend access before written study', async ({ onboarded: { page } }) => {
    await page.goto('/nauka')
    await expect(page).toHaveURL(/\/rozszerz-dostep/)
    await expect(page.getByText('Twoja ścieżka nie obejmuje tej części egzaminu.')).toBeVisible()
  })
})
