import { expect } from '@playwright/test'
import { smallPathConfiguration, test } from '~e2e/test/fixtures'

const category = 'Proces inwestycyjny i pozwolenie na budowę'

test.use({ pathConfiguration: smallPathConfiguration })

test('a learner finishes an oral session and takes the mini-quiz in the summary with feedback after each check', async ({
  onboarded: { page },
}) => {
  await page.goto('/ustny')
  await page.getByRole('link', { name: new RegExp(category) }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()

  for (let position = 1; position <= 4; position++) {
    await expect(
      page.getByRole('heading', { level: 1, name: `Pytanie ${position} z 4` }),
    ).toBeVisible()
    await page
      .getByRole('group', { name: 'Oceń trudność pytania' })
      .getByRole('button', { name: 'Łatwe' })
      .click()
  }

  await expect(page.getByRole('heading', { name: 'Podsumowanie sesji', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sprawdź wiedzę' }).click()

  const summaryUrl = page.url()
  const quiz = page.getByRole('region', { name: 'Sprawdź swoją wiedzę' })
  const checkButtons = quiz.getByRole('button', { name: 'Sprawdź', exact: true })

  await expect(quiz.getByRole('form')).toHaveCount(4)
  await expect(checkButtons).toHaveCount(4)
  expect(page.url()).toBe(summaryUrl)

  for (const position of [2, 3, 4, 1]) {
    const check = quiz.getByRole('form', { name: `Pytanie ${position}`, exact: true })

    await check.getByRole('radio').or(check.getByRole('checkbox')).first().click()
    await check.getByRole('button', { name: 'Sprawdź', exact: true }).click()
    await expect(check.getByRole('alert')).toHaveText(/Dobra odpowiedź|Niepoprawna odpowiedź/)
    await expect(check.getByRole('button', { name: 'Sprawdź', exact: true })).toBeHidden()
  }

  await expect(quiz.getByRole('alert')).toHaveCount(4)
  await expect(quiz.getByText('Odpowiedziano 4 / 4')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Co dalej?' })).toBeVisible()

  await page.reload()
  await expect(quiz.getByRole('alert')).toHaveCount(4)
  await expect(checkButtons).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sprawdź wiedzę' })).toBeHidden()
})
