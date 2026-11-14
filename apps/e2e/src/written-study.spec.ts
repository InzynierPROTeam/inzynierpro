import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

const buildingLaw = 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'

test('the written categories show the path documents and their progress', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')

  const categories = page.getByRole('main').getByRole('list')
  await expect(categories.getByRole('link')).toHaveCount(2)
  await expect(categories.getByRole('link', { name: new RegExp(buildingLaw) })).toContainText(
    'Ukończone: 0 / 2 pytań',
  )
})

test('a category leads to the details of a study session for it', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()

  await expect(page.getByRole('heading', { level: 1, name: buildingLaw })).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()

  await expect(page).toHaveURL(/\/nauka\/start/)
  await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki' })).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: buildingLaw })).toBeVisible()
})

test('the start page leads to the next written study session', async ({ onboarded: { page } }) => {
  await page.goto('/start')
  await page
    .getByRole('region', { name: 'Nauka do egzaminu pisemnego' })
    .getByRole('button', { name: 'Zacznij naukę' })
    .click()

  await expect(page).toHaveURL(/\/nauka\/start/)
  await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki' })).toBeVisible()
})

test('the start page leads to oral study', async ({ onboarded: { page } }) => {
  await page.goto('/start')
  await page
    .getByRole('region', { name: 'Nauka do egzaminu ustnego' })
    .getByRole('button', { name: 'Zacznij naukę' })
    .click()

  await expect(page).toHaveURL(/\/ustny$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Egzamin ustny' })).toBeVisible()
})

test('a started session keeps its question and answer order and every entry point resumes it', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  const categoryUrl = page.url()
  const categoryId = new URL(categoryUrl).pathname.split('/').at(-1)

  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()

  await expect(page).toHaveURL(/\/nauka\/sesja\/[^/]+\/1\/?$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 2' })).toBeVisible()

  const answers = page.getByRole('radiogroup', { name: 'Wybierz odpowiedź' }).getByRole('radio')
  await expect(answers).toHaveCount(3)

  // Checking requires a selected answer.
  await page.getByRole('button', { name: 'Sprawdź' }).click()
  await expect(page.getByRole('alert')).toHaveText('Wybierz odpowiedź.')

  await answers.first().click()
  await expect(answers.first()).toBeChecked()
  await expect(page.getByRole('alert')).toBeHidden()

  // Until answers are recorded, checking only confirms the selection.
  let confirmation = ''
  // The click resolves only once the alert is closed, so it is handled before clicking.
  page.once('dialog', dialog => {
    confirmation = dialog.message()
    void dialog.dismiss()
  })
  await page.getByRole('button', { name: 'Sprawdź' }).click()
  // The option's accessible text also holds its letter, so only the answer text is compared.
  expect(await answers.first().textContent()).toContain(
    confirmation.replace('Wybrana odpowiedź: ', ''),
  )
  expect(confirmation).toMatch(/^Wybrana odpowiedź: \S/)

  const order = await answers.allTextContents()
  const sessionUrl = page.url()

  await page.reload()

  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 2' })).toBeVisible()
  await expect(answers).toHaveText(order)

  // The session replaced the preview, so going back returns to the category.
  await page.getByRole('button', { name: 'Kategoria' }).click()
  await expect(page).toHaveURL(categoryUrl)

  await page.getByRole('button', { name: 'Kontynuuj' }).click()
  await expect(page).toHaveURL(sessionUrl)
  await expect(answers).toHaveText(order)

  await page.goBack()
  await expect(page).toHaveURL(categoryUrl)

  await page.goto(`/nauka/start?akt-prawny=${categoryId}`)
  await expect(page.getByRole('heading', { name: 'Masz trwającą sesję' })).toBeVisible()
  await page.getByRole('button', { name: 'Przejdź do sesji' }).click()
  await expect(page).toHaveURL(sessionUrl)

  await page.goto('/start')
  await page
    .getByRole('region', { name: 'Nauka do egzaminu pisemnego' })
    .getByRole('button', { name: 'Kontynuuj' })
    .click()
  await expect(page).toHaveURL(sessionUrl)
})
