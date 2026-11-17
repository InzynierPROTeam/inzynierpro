import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

const buildingLaw = 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'

test('before any answer the reviews tile and a category explain how reviews get scheduled', async ({
  onboarded: { page },
}) => {
  await page.goto('/start')
  await expect(page.getByRole('region', { name: 'Powtórka', exact: true })).toContainText(
    'Brak zaplanowanych powtórek.',
  )

  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await expect(page.getByRole('region', { name: 'Powtórka z kategorii' })).toContainText(
    'Brak zaplanowanych powtórek.',
  )
})

test('after an answer the reviews tile, the category and the review preview say reviews come later', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()

  const firstAnswer = page
    .getByRole('radiogroup', { name: 'Wybierz odpowiedź' })
    .getByRole('radio')
    .first()

  await firstAnswer.click()
  await page.getByRole('button', { name: 'Sprawdź' }).click()
  await expect(firstAnswer).toBeDisabled()

  await page.goto('/start')
  await expect(page.getByRole('region', { name: 'Powtórka', exact: true })).toContainText(
    'Na teraz nie masz pytań do powtórki. Wróć do nich później.',
  )
  await expect(
    page
      .getByRole('region', { name: 'Nauka do egzaminu pisemnego' })
      .getByRole('button', { name: 'Kontynuuj' }),
  ).toBeVisible()

  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await expect(page.getByRole('region', { name: 'Powtórka z kategorii' })).toContainText(
    'Na teraz nie masz pytań do powtórki.',
  )

  await page.goto('/nauka/powtorka')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Brak pytań do powtórki' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Ucz się dalej' }).click()
  await expect(page).toHaveURL(/\/nauka\/start/)
})
