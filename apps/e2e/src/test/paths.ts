import type { Page } from '@playwright/test'

// Answers the first four onboarding steps (building construction, site management, full scope,
// both exams) and picks the spring exam session.
export const chooseTechnicalPath = async (page: Page) => {
  const choices = [
    ['Wybierz specjalność', 'Konstrukcyjno-budowlana'],
    ['Wybierz rodzaj uprawnień', 'Kierowania robotami'],
    ['Wybierz zakres uprawnień', 'Bez ograniczeń'],
    ['Wybierz rodzaj egzaminu', 'Pisemny i ustny'],
  ] as const

  for (const [step, choice] of choices) {
    await page.getByRole('radiogroup', { name: step }).getByRole('radio', { name: choice }).click()
    await page.getByRole('button', { name: 'Dalej' }).click()
  }

  await page
    .getByRole('radiogroup', { name: 'Wybierz sesję' })
    .getByRole('radio', { name: /Sesja Wiosenna/ })
    .click()
}
