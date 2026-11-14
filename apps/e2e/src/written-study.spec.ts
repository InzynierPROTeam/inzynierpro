import { expect, type Page } from '@playwright/test'
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

  const order = await answers.allTextContents()
  const sessionUrl = page.url()

  await page.reload()

  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 2' })).toBeVisible()
  await expect(answers).toHaveText(order)
  // An unchecked selection is only a draft in the form, so a reload clears it.
  await expect(answers.first()).not.toBeChecked()

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

// Starts a session over the Building Law category and returns the first question's options.
const startBuildingLawSession = async (page: Page) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 2' })).toBeVisible()

  return page.getByRole('radiogroup', { name: 'Wybierz odpowiedź' }).getByRole('radio')
}

// The hint's text, read from its dialog, is the explanation shown after answering.
const readHint = async (page: Page) => {
  await page.getByRole('button', { name: 'Podpowiedź' }).click()
  const dialog = page.getByRole('dialog', { name: 'Podpowiedź' })
  await expect(dialog).toBeVisible()
  const hint = (await dialog.getByRole('paragraph').first().textContent()) ?? ''
  await dialog.getByRole('button', { name: 'Zamknij' }).first().click()
  await expect(dialog).toBeHidden()

  return hint
}

test('checking an answer locks it and shows its result and explanation, also after reload', async ({
  onboarded: { page },
}) => {
  const answers = await startBuildingLawSession(page)

  await answers.nth(1).click()
  await page.getByRole('button', { name: 'Sprawdź' }).click()

  // The chosen option is marked correct or incorrect, and the correct one is always marked.
  await expect(answers.nth(1)).toHaveAttribute('data-tone', /^(correct|incorrect)$/)
  await expect(answers.and(page.locator('[data-tone="correct"]'))).toHaveCount(1)
  const tone = await answers.nth(1).getAttribute('data-tone')
  await expect(answers.nth(1)).toBeChecked()
  await expect(answers.nth(1)).toBeDisabled()
  // The question was answered once, so it cannot be checked again.
  await expect(page.getByRole('button', { name: 'Sprawdź' })).toBeHidden()

  const hint = await readHint(page)
  await expect(page.getByRole('main').getByText(hint, { exact: true })).toBeVisible()

  await page.reload()

  await expect(answers.nth(1)).toHaveAttribute('data-tone', tone ?? '')
  await expect(answers.nth(1)).toBeChecked()
  await expect(page.getByRole('main').getByText(hint, { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Następne pytanie' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 2 z 2' })).toBeVisible()
  await expect(answers.first()).not.toBeChecked()
  await expect(page.getByRole('button', { name: 'Sprawdź' })).toBeVisible()
})

test('the hint can be read before answering and the explanation is shown only after', async ({
  onboarded: { page },
}) => {
  const answers = await startBuildingLawSession(page)

  const hint = await readHint(page)
  await expect(page.getByRole('main').getByText(hint, { exact: true })).toBeHidden()

  await answers.first().click()
  await page.getByRole('button', { name: 'Sprawdź' }).click()

  await expect(answers.first()).toBeDisabled()
  await expect(page.getByRole('main').getByText(hint, { exact: true })).toBeVisible()
})
