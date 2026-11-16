import { expect } from '@playwright/test'
import { smallPathConfiguration, test } from '~e2e/test/fixtures'

const category = 'Proces inwestycyjny i pozwolenie na budowę'

test.use({ pathConfiguration: smallPathConfiguration })

test('a learner studies an oral category with the answer revealed and sees their self-assessments', async ({
  onboarded: { page },
}) => {
  await page.goto('/ustny')
  await page.getByRole('link', { name: new RegExp(category) }).click()

  await expect(page).toHaveURL(/\/ustny\/start/)
  await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki ustnej' })).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: category })).toBeVisible()

  await page.getByRole('button', { name: 'Zacznij sesję' }).click()

  await expect(page).toHaveURL(/\/ustny\/sesja\/[^/]+\/1\/?$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 4' })).toBeVisible()

  const answer = page.getByRole('button', { name: /^Odpowiedź/ })
  await expect(answer).toHaveAttribute('aria-expanded', 'false')

  await answer.click()
  await expect(answer).toHaveAttribute('aria-expanded', 'true')

  const scaleExplanation = page.getByRole('note', { name: 'Jak działa skala trudności' })
  await expect(scaleExplanation).toBeVisible()

  const selfAssessment = page.getByRole('group', { name: 'Oceń trudność pytania' })

  await selfAssessment.getByRole('button', { name: 'Łatwe' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 2 z 4' })).toBeVisible()
  await expect(answer).toHaveAttribute('aria-expanded', 'true')
  await expect(scaleExplanation).toBeHidden()

  await page.getByRole('button', { name: 'Jak działa skala trudności' }).click()
  await expect(page.getByRole('dialog', { name: 'Skala trudności' })).toBeVisible()
  await page.keyboard.press('Escape')

  await selfAssessment.getByRole('button', { name: 'Średnie' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 3 z 4' })).toBeVisible()

  await selfAssessment.getByRole('button', { name: 'Trudne' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 4 z 4' })).toBeVisible()

  await selfAssessment.getByRole('button', { name: 'Łatwe' }).click()

  await expect(page).toHaveURL(/\/ustny\/sesja\/[^/]+\/podsumowanie\/?$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Podsumowanie sesji' })).toBeVisible()

  const counts = page.getByRole('listitem')
  await expect(counts.filter({ hasText: /^Łatwe/ })).toContainText('2 z 4')
  await expect(counts.filter({ hasText: /^Średnie/ })).toContainText('1 z 4')
  await expect(counts.filter({ hasText: /^Trudne/ })).toContainText('1 z 4')

  const questions = page.getByRole('list', { name: 'Pytania sesji' })
  await expect(questions.getByRole('link')).toHaveCount(4)
  await expect(questions.getByRole('link', { name: 'Pytanie 3: Trudne' })).toBeVisible()

  await questions.getByRole('link', { name: 'Pytanie 2: Średnie' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 2 z 4' })).toBeVisible()
  await expect(selfAssessment.getByRole('button', { name: 'Średnie' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(selfAssessment.getByRole('button', { name: 'Łatwe' })).toBeDisabled()
})

test('the start page continues an unfinished oral session', async ({ onboarded: { page } }) => {
  await page.goto(`/ustny`)
  await page.getByRole('link', { name: new RegExp(category) }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()

  await page
    .getByRole('group', { name: 'Oceń trudność pytania' })
    .getByRole('button', { name: 'Średnie' })
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 2 z 4' })).toBeVisible()

  await page.goto('/start')

  const tile = page.getByRole('region', { name: 'Nauka do egzaminu ustnego' })
  await expect(tile).toContainText(category)
  await tile.getByRole('button', { name: 'Kontynuuj' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 2 z 4' })).toBeVisible()
})
