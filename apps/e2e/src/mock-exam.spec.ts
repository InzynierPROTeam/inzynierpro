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
