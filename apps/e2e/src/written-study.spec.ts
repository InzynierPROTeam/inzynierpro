import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

const buildingLaw = 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'

test('the written categories show the path documents and their progress', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')

  const categories = page.getByRole('main').getByRole('list')
  await expect(categories.getByRole('link')).toHaveCount(2)
  await expect(categories.getByRole('link', { name: new RegExp(buildingLaw) })).toContainText(
    'Ukończone: 0 / 2 pytań',
  )
})

test('a category leads to the details of a study session for it', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()

  await expect(page.getByRole('heading', { level: 1, name: buildingLaw })).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()

  await expect(page).toHaveURL(/\/nauka\/start/)
  await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki' })).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: buildingLaw })).toBeVisible()
})

test('the start page leads to the next written study session', async ({ onboarded: { page } }) => {
  await page.goto('/start')
  await page
    .getByRole('region', { name: 'Nauka do egzaminu pisemnego' })
    .getByRole('button', { name: 'Zacznij naukę' })
    .click()

  await expect(page).toHaveURL(/\/nauka\/start/)
  await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki' })).toBeVisible()
})

test('the start page leads to oral study', async ({ onboarded: { page } }) => {
  await page.goto('/start')
  await page
    .getByRole('region', { name: 'Nauka do egzaminu ustnego' })
    .getByRole('button', { name: 'Zacznij naukę' })
    .click()

  await expect(page).toHaveURL(/\/ustny$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Egzamin ustny' })).toBeVisible()
})
