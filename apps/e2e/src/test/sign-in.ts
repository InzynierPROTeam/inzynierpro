import { expect, type Page } from '@playwright/test'

import { latestSignInCode, sentEmailCount } from './outbox'

export const requestSignInCode = async (page: Page, email: string) => {
  const previousEmailCount = await sentEmailCount(email)

  await page.getByRole('textbox', { name: 'Email' }).fill(email)
  await page.getByRole('button', { name: 'Kontynuuj z Emailem' }).click()
  await expect(page.getByRole('heading', { name: 'Wprowadź kod' })).toBeVisible()

  return latestSignInCode(email, previousEmailCount)
}

export const enterSignInCode = (page: Page, code: string) =>
  page.getByRole('textbox', { name: 'Kod weryfikacyjny' }).fill(code)

export const signInThroughUi = async (page: Page, email: string) =>
  enterSignInCode(page, await requestSignInCode(page, email))
