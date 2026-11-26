import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

const pathOptions = /Opcje ścieżki: Konstrukcyjno-budowlana/

test('the profile shows the account and its configured path', async ({
  onboarded: { page, account },
}) => {
  await page.goto('/profil')

  await expect(page.getByText(account.email)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Twoje ścieżki nauki' })).toBeVisible()
  await expect(page.getByRole('button', { name: pathOptions })).toBeVisible()
})

test('the path menu offers selection and archiving, not removal', async ({
  onboarded: { page },
}) => {
  await page.goto('/profil')
  await page.getByRole('button', { name: pathOptions }).click()

  const menu = page.getByRole('menu', { name: pathOptions })
  await expect(menu.getByRole('menuitem', { name: 'Wybierz', exact: true })).toBeEnabled()
  await expect(menu.getByRole('menuitem', { name: 'Archiwizuj' })).toBeEnabled()
  await expect(menu.getByRole('menuitem', { name: 'Usuń', exact: true })).toBeDisabled()
})

test('a learner chooses, changes and clears the district chamber of a path in the profile', async ({
  onboarded: { page },
}) => {
  await page.goto('/profil')

  const path = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('button', { name: pathOptions }) })

  await expect(path.getByText('Izba okręgowa: nie wybrano')).toBeVisible()

  await page.getByRole('button', { name: pathOptions }).click()
  const menu = page.getByRole('menu', { name: pathOptions })
  await expect(menu.getByRole('menuitem', { name: 'Usuń izbę okręgową' })).toBeDisabled()
  await menu.getByRole('menuitem', { name: 'Wybierz izbę okręgową' }).click()

  const dialog = page.getByRole('dialog', { name: 'Izba okręgowa' })
  await dialog.getByRole('combobox', { name: 'Twoja izba okręgowa' }).click()
  await page
    .getByRole('option', { name: 'Dolnośląska Okręgowa Izba Inżynierów Budownictwa', exact: true })
    .click()
  await dialog.getByRole('button', { name: 'Zapisz izbę', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(
    path.getByText('Izba okręgowa: Dolnośląska Okręgowa Izba Inżynierów Budownictwa'),
  ).toBeVisible()

  await page.getByRole('button', { name: pathOptions }).click()
  await menu.getByRole('menuitem', { name: 'Zmień izbę okręgową' }).click()
  await dialog.getByRole('combobox', { name: 'Twoja izba okręgowa' }).click()
  await expect(page.getByRole('option', { name: /Okręgowa Izba Architektów RP/ })).toHaveCount(0)
  await page
    .getByRole('option', {
      name: 'Kujawsko-Pomorska Okręgowa Izba Inżynierów Budownictwa',
      exact: true,
    })
    .click()
  await dialog.getByRole('button', { name: 'Zapisz izbę', exact: true }).click()
  await expect(
    path.getByText('Izba okręgowa: Kujawsko-Pomorska Okręgowa Izba Inżynierów Budownictwa'),
  ).toBeVisible()

  await page.getByRole('button', { name: pathOptions }).click()
  await menu.getByRole('menuitem', { name: 'Usuń izbę okręgową' }).click()
  await expect(path.getByText('Izba okręgowa: nie wybrano')).toBeVisible()
  await page.reload()
  await expect(path.getByText('Izba okręgowa: nie wybrano')).toBeVisible()
})
