import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

const buildingLaw = 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'

test('XP earned while studying places the learner in the ranking with a link to their profile', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await page
    .getByRole('radiogroup', { name: 'Wybierz odpowiedź' })
    .getByRole('radio')
    .first()
    .click()
  await page.getByRole('button', { name: 'Sprawdź' }).click()
  await expect(page.getByText(/\+\d+ XP/)).toBeVisible()

  await page.getByRole('link', { name: 'Ranking' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Ranking' })).toBeVisible()

  const periods = page.getByRole('navigation', { name: 'Okres rankingu' })
  await expect(periods.getByRole('link', { name: 'Ten tydzień' })).toHaveAttribute(
    'aria-current',
    'true',
  )

  const ownRow = page.getByRole('listitem').filter({ hasText: '(Ty)' })
  const summary = page.getByRole('region', { name: 'Twój wynik' })
  await expect(ownRow).toBeVisible()
  await expect(summary).toContainText(/Twoje miejsce: \d+\./)

  await periods.getByRole('link', { name: 'Moja sesja' }).click()
  await expect(page).toHaveURL(/okres=sesja/)
  await expect(ownRow).toBeVisible()

  await periods.getByRole('link', { name: 'Poprzedni miesiąc' }).click()
  await expect(page).toHaveURL(/okres=poprzedni-miesiac/)
  await expect(ownRow).toBeHidden()

  await periods.getByRole('link', { name: 'Ten miesiąc' }).click()
  await ownRow.getByRole('link').click()
  await expect(page).toHaveURL(/\/uzytkownik\//)
})
