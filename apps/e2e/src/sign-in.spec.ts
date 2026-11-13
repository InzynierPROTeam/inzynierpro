import { expect } from '@playwright/test'
import { platformUrl } from '~e2e/environment'
import { test, uniqueEmail } from '~e2e/test/fixtures'
import { enterSignInCode, requestSignInCode, signInThroughUi } from '~e2e/test/sign-in'

test('a new visitor signs in with an e-mail code and is asked to choose a path', async ({
  visitor: page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Zaloguj się' }).click()
  await signInThroughUi(page, uniqueEmail('sign-in'))

  await expect(page).toHaveURL(/\/pierwsze-kroki/)
  await expect(page.getByRole('radiogroup', { name: 'Wybierz specjalność' })).toBeVisible()
})

test('a wrong code is refused and the visitor stays signed out', async ({ visitor: page }) => {
  await page.goto('/logowanie')
  const code = await requestSignInCode(page, uniqueEmail('wrong-code'))

  await enterSignInCode(page, code === '000000' ? '111111' : '000000')

  await expect(
    page.getByText('Niepoprawny kod weryfikacyjny. Sprawdź go i spróbuj ponownie.'),
  ).toBeVisible()

  await page.goto('/profil')
  await expect(page).toHaveURL(/\/logowanie/)
})

test('a signed-out visitor is sent to sign in and returned to the requested page', async ({
  visitor: page,
}) => {
  const email = uniqueEmail('return')

  await page.goto('/profil')
  await expect(page).toHaveURL(/\/logowanie\?redirect=/)

  await signInThroughUi(page, email)

  await expect(page).toHaveURL(/\/profil$/)
  await expect(page.getByText(email)).toBeVisible()
})

test('signing out ends the session', async ({ onboarded: { page } }) => {
  await page.goto('/profil')
  await page.getByRole('main').getByRole('button', { name: 'Wyloguj się' }).click()
  await expect(page).toHaveURL(`${platformUrl}/`)

  await page.goto('/start')
  await expect(page).toHaveURL(/\/logowanie\?redirect=/)
})
