import { expect } from '@playwright/test'
import { smallPathConfiguration, test } from '~e2e/test/fixtures'

test.use({ pathConfiguration: smallPathConfiguration })

test('a learner marks an oral favourite, keeps a note, completes favourites and edits the note from results', async ({
  onboarded: { page },
}) => {
  await page.goto('/start')
  const tile = page.getByRole('region', { name: 'Ulubione pytania ustne', exact: true })
  await expect(tile).toContainText('Nie masz jeszcze ulubionych pytań ustnych.')
  await page.goto('/ustny')
  await page
    .getByRole('region', { name: 'Proces inwestycyjny i pozwolenie na budowę', exact: true })
    .getByRole('link')
    .click()
  await page.getByRole('button', { name: 'Zacznij sesję', exact: true }).click()
  await page.getByRole('button', { name: 'Dodaj do ulubionych' }).click()
  await expect(page.getByRole('button', { name: 'Usuń z ulubionych' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Dodaj notatkę' }).click()
  const dialog = page.getByRole('dialog', { name: 'Twoja notatka' })
  await dialog
    .getByRole('textbox', { name: 'Treść notatki' })
    .fill('Pamiętaj o uczestnikach procesu.')
  await dialog.getByRole('button', { name: 'Zapisz notatkę' }).click()
  await expect(dialog.getByText('Pamiętaj o uczestnikach procesu.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Zamknij' }).first().click()
  await page.goto('/start')
  await expect(tile).toContainText('Ulubione pytania: 1')
  await tile.getByRole('button', { name: 'Ucz się ulubionych' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję ulubionych', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Pytanie 1 z 1', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Twoja notatka' }).click()
  await expect(dialog.getByText('Pamiętaj o uczestnikach procesu.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Zamknij' }).first().click()
  await page
    .getByRole('group', { name: 'Oceń trudność pytania' })
    .getByRole('button', { name: 'Łatwe' })
    .click()
  await expect(page.getByRole('heading', { name: 'Podsumowanie sesji', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Pytanie 1: Łatwe' }).click()
  await page.getByRole('button', { name: 'Twoja notatka' }).click()
  await dialog.getByRole('button', { name: 'Edytuj notatkę' }).click()
  await dialog.getByRole('textbox', { name: 'Treść notatki' }).fill('')
  await dialog.getByRole('button', { name: 'Zapisz notatkę' }).click()
  await expect(dialog.getByRole('textbox', { name: 'Treść notatki' })).toHaveValue('')
})
