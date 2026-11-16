import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

const buildingLaw = 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'

test('a learner marks a favourite, completes a favourites session and sees its summary', async ({
  onboarded: { page },
}) => {
  const favoritesTile = page.getByRole('region', { name: 'Ulubione pytania' })

  // With nothing marked the tile explains how to mark questions and offers no session.
  await page.goto('/start')
  await expect(favoritesTile).toContainText('Nie masz jeszcze ulubionych pytań.')

  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 5' })).toBeVisible()

  await page.getByRole('button', { name: 'Dodaj do ulubionych' }).click()
  await expect(page.getByRole('button', { name: 'Usuń z ulubionych' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // The category offers its own favourites as well.
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await expect(page.getByRole('region', { name: 'Ulubione z kategorii' })).toContainText(
    'Ulubione pytania: 1',
  )

  await page.goto('/start')
  await expect(favoritesTile).toContainText('Ulubione pytania: 1')
  await favoritesTile.getByRole('button', { name: 'Ucz się ulubionych' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Zacznij sesję ulubionych' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij sesję ulubionych' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 1' })).toBeVisible()

  const firstAnswer = page
    .getByRole('radiogroup', { name: 'Wybierz odpowiedź' })
    .getByRole('radio')
    .first()

  await firstAnswer.click()
  await page.getByRole('button', { name: 'Sprawdź' }).click()
  await expect(firstAnswer).toBeDisabled()

  await page.getByRole('button', { name: 'Zobacz podsumowanie' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Podsumowanie sesji' })).toBeVisible()
  await expect(page.getByText('Ulubione pytania', { exact: true })).toBeVisible()

  // The next step goes back to regular study: the unfinished category session.
  await page.getByRole('button', { name: 'Kontynuuj sesję' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 5' })).toBeVisible()
})
