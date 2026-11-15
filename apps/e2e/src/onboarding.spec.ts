import { expect, type Page } from '@playwright/test'
import { test, uniqueEmail } from '~e2e/test/fixtures'
import { chooseTechnicalPath } from '~e2e/test/paths'
import { signInThroughUi } from '~e2e/test/sign-in'

const expectTechnicalPathOnStart = async (page: Page) => {
  await expect(page.getByRole('heading', { name: 'Konstrukcyjno-budowlana' })).toBeVisible()
  await expect(page.getByText('Kierowania robotami • Bez ograniczeń')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sesja Wiosenna' })).toBeVisible()
}

test('a signed-in account configures its first path and can start learning', async ({
  signedIn: { page },
}) => {
  await page.goto('/start')
  await expect(page).toHaveURL(/\/pierwsze-kroki/)

  await chooseTechnicalPath(page)
  await page.getByRole('button', { name: 'Rozpocznij' }).click()

  await expect(page).toHaveURL(/\/start$/)
  await expectTechnicalPathOnStart(page)
})

test('a guest chooses a path before signing in and keeps the choice after', async ({
  visitor: page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Rozpocznij przygotowania' }).click()
  await expect(page).toHaveURL(/\/zacznij/)

  await chooseTechnicalPath(page)
  await page.getByRole('main').getByRole('button', { name: 'Zaloguj się' }).click()
  await signInThroughUi(page, uniqueEmail('guest'))

  await expect(page).toHaveURL(/\/zacznij/)
  await expect(page.getByRole('radio', { name: /Sesja Wiosenna/ })).toBeChecked()
  await page.getByRole('button', { name: 'Rozpocznij' }).click()

  await expect(page).toHaveURL(/\/start$/)
  await expectTechnicalPathOnStart(page)
})
