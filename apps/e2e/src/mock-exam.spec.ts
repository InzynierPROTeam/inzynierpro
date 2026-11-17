import { expect } from '@playwright/test'
import { smallPathConfiguration, test } from '~e2e/test/fixtures'

test('a learner starts the seeded mock exam from Start, browses its questions and resumes it', async ({
  onboarded: { page },
}) => {
  const mockExamTile = page.getByRole('region', { name: 'Egzamin próbny' })

  await page.goto('/start')
  await expect(mockExamTile).toContainText('10 pytań • 10 min')
  await mockExamTile.getByRole('button', { name: 'Przejdź do egzaminu' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Egzamin próbny' })).toBeVisible()
  await expect(page.getByText('6 z 10 poprawnych odpowiedzi')).toBeVisible()
  await expect(page.getByText('Prawo budowlane: 5 pytań')).toBeVisible()
  await expect(page.getByText('Warunki techniczne: 5 pytań')).toBeVisible()
  await page.getByRole('button', { name: 'Rozpocznij egzamin' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 10' })).toBeVisible()
  await expect(page.getByText('Prawo budowlane', { exact: true })).toBeVisible()

  const answers = page.getByRole('radiogroup', { name: 'Wybierz odpowiedź' }).getByRole('radio')

  await expect(answers).toHaveCount(3)
  await answers.first().click()
  await expect(answers.first()).toBeChecked()

  await page
    .getByRole('navigation', { name: 'Pytania egzaminu' })
    .getByRole('link', { name: 'Pytanie 7' })
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 7 z 10' })).toBeVisible()
  await expect(page.getByText('Warunki techniczne', { exact: true })).toBeVisible()

  await page.goto('/start')
  await expect(mockExamTile).toContainText('Masz rozpoczęty egzamin próbny.')
  await mockExamTile.getByRole('button', { name: 'Wróć do egzaminu' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 10' })).toBeVisible()
})

test('a learner saves, changes and flags answers that survive a reload', async ({
  onboarded: { page },
}) => {
  await page.goto('/egzamin-probny')
  await page.getByRole('button', { name: 'Rozpocznij egzamin' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 10' })).toBeVisible()

  const answers = page.getByRole('radiogroup', { name: 'Wybierz odpowiedź' }).getByRole('radio')
  const navigator = page.getByRole('navigation', { name: 'Pytania egzaminu' })
  const save = page.getByRole('button', { name: 'Zapisz odpowiedź' })
  const next = page.getByRole('button', { name: 'Następne pytanie' })
  const flag = page.getByRole('button', { name: 'Wróć do tego pytania później' })

  await answers.first().click()
  await save.click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 2 z 10' })).toBeVisible()
  await expect(navigator.getByRole('link', { name: 'Pytanie 1, z odpowiedzią' })).toBeVisible()

  await flag.click()
  await expect(page.getByText('Pytanie 2 oznaczono do powrotu.')).toBeVisible()
  await expect(flag).toHaveAttribute('aria-pressed', 'true')
  await expect(
    navigator.getByRole('link', { name: 'Pytanie 2, bez odpowiedzi, do powrotu' }),
  ).toBeVisible()

  await page.reload()
  await expect(
    navigator.getByRole('link', { name: 'Pytanie 2, bez odpowiedzi, do powrotu' }),
  ).toBeVisible()
  await expect(flag).toHaveAttribute('aria-pressed', 'true')

  await navigator.getByRole('link', { name: 'Pytanie 1,' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 10' })).toBeVisible()
  await expect(answers.first()).toBeChecked()
  await expect(next).toBeVisible()

  await answers.nth(1).click()
  await expect(next).toBeHidden()
  await save.click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 2 z 10' })).toBeVisible()

  await page.reload()
  await navigator.getByRole('link', { name: 'Pytanie 1,' }).click()
  await expect(answers.nth(1)).toBeChecked()
})

test.describe('on a path without a blueprint', () => {
  test.use({ pathConfiguration: smallPathConfiguration })

  test('the mock exam is shown as unavailable', async ({ onboarded: { page } }) => {
    await page.goto('/start')
    await expect(page.getByRole('region', { name: 'Egzamin próbny' })).toContainText(
      'Egzamin próbny nie jest jeszcze dostępny na Twojej ścieżce.',
    )

    await page.goto('/egzamin-probny')
    await expect(page.getByRole('heading', { level: 1, name: 'Egzamin próbny' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rozpocznij egzamin' })).toBeHidden()
  })
})
