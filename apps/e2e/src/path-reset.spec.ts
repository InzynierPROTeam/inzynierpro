import { expect, type Page } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

const buildingLaw = 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'

const streakDailyAnswers = 5

const pathOptions = /Opcje ścieżki: Konstrukcyjno-budowlana/

const writtenPlan = (page: Page) =>
  page.getByRole('region', { name: 'Plan na dziś' }).getByRole('region', {
    name: 'Egzamin pisemny',
  })

const dailyTarget = async (page: Page) => {
  await page.goto('/start')
  const label = writtenPlan(page).getByText(/Pytania na dziś: \d+ \/ \d+/)
  await expect(label).toBeVisible()
  const [, target] = /\/ (\d+)/.exec((await label.textContent()) ?? '') ?? []

  return Number(target)
}

const answerQuestions = async (page: Page, count: number) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()

  for (let answered = 1; answered <= count; answered++) {
    const answers = page.getByRole('radiogroup', { name: 'Wybierz odpowiedź' }).getByRole('radio')
    await answers.first().click()
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(answers.first()).toBeDisabled()

    if (answered < count) {
      await page.getByRole('button', { name: 'Następne pytanie' }).click()
    }
  }
}

test('a learner meets the daily target, sees XP, streak and ranking, then resets the path', async ({
  onboarded: { page },
}) => {
  const target = await dailyTarget(page)
  const answered = Math.max(target, streakDailyAnswers)

  await expect(page.getByLabel('Punkty za naukę: 0 XP')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Seria dni nauki: 0 dni' })).toBeVisible()

  await answerQuestions(page, answered)

  await page.goto('/start')
  await expect(writtenPlan(page)).toContainText(`Pytania na dziś: ${answered} / ${target}`)

  const learningXp = page.getByLabel(/Punkty za naukę: [1-9]\d* XP/)
  await expect(learningXp).toBeVisible()
  const earned = await learningXp.getAttribute('aria-label')
  await expect(page.getByRole('button', { name: 'Seria dni nauki: 1 dzień' })).toBeVisible()

  await page.getByRole('link', { name: 'Ranking' }).first().click()
  await page.getByRole('listitem').filter({ hasText: '(Ty)' }).getByRole('link').click()
  await expect(page).toHaveURL(/\/uzytkownik\//)

  await page.goto('/profil')
  await page.getByRole('button', { name: pathOptions }).click()
  await page.getByRole('menuitem', { name: 'Resetuj postęp' }).click()

  const dialog = page.getByRole('dialog', { name: 'Zresetować postęp ścieżki?' })
  await expect(dialog).toContainText('egzaminy próbne, także niedokończone')
  await expect(dialog).toContainText('zdobyte XP, odznaki i miejsce w rankingu')
  await dialog.getByLabel('Wpisz RESETUJ, aby potwierdzić').fill('RESETUJ')
  await dialog.getByRole('button', { name: 'Resetuj postęp' }).click()
  await expect(page.getByText('Postęp ścieżki został zresetowany.')).toBeVisible()
  await expect(dialog).toBeHidden()

  await page.goto('/start')
  await expect(writtenPlan(page)).toContainText(`Pytania na dziś: 0 / ${target}`)
  await expect(page.getByLabel(earned ?? '')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Seria dni nauki: 1 dzień' })).toBeVisible()
})
