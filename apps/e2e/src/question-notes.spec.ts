import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

const buildingLaw = 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'

test('a learner writes a note, reads it again after reload and the answer counts as assisted', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 8' })).toBeVisible()

  await page.getByRole('button', { name: 'Dodaj notatkę' }).click()
  const dialog = page.getByRole('dialog', { name: 'Twoja notatka' })
  await dialog.getByRole('textbox', { name: 'Treść notatki' }).fill('Pozwolenie, nie zgłoszenie.')
  await dialog.getByRole('button', { name: 'Zapisz notatkę' }).click()
  await expect(dialog.getByText('Pozwolenie, nie zgłoszenie.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Zamknij' }).first().click()
  await expect(dialog).toBeHidden()

  await page.reload()
  await page.getByRole('button', { name: 'Twoja notatka' }).click()
  await expect(dialog.getByText('Pozwolenie, nie zgłoszenie.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Zamknij' }).first().click()
  await expect(dialog).toBeHidden()

  const firstAnswer = page
    .getByRole('radiogroup', { name: 'Wybierz odpowiedź' })
    .getByRole('radio')
    .first()

  await firstAnswer.click()
  await page.getByRole('button', { name: 'Sprawdź' }).click()
  await expect(firstAnswer).toBeDisabled()

  await page.getByRole('button', { name: 'Opcje sesji' }).click()
  await page.getByRole('menuitem', { name: 'Zakończ sesję' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Podsumowanie sesji' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Bez podpowiedzi' })).toContainText(
    '0 z 1',
  )
})
