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
  await expect(menu.getByRole('menuitem', { name: 'Wybierz' })).toBeEnabled()
  await expect(menu.getByRole('menuitem', { name: 'Archiwizuj' })).toBeEnabled()
  await expect(menu.getByRole('menuitem', { name: 'Usuń' })).toBeDisabled()
})
