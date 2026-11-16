import { expect, type Page } from '@playwright/test'
import { smallPathConfiguration, test } from '~e2e/test/fixtures'
import { chooseTechnicalPath } from '~e2e/test/paths'

const buildingLaw = 'Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane'
const technicalConditions = 'Warunki techniczne, jakim powinny odpowiadać budynki i ich usytuowanie'

// Every category of the technical seed has this many questions.
const categoryQuestions = 5

const answers = (page: Page) =>
  page.getByRole('radiogroup', { name: 'Wybierz odpowiedź' }).getByRole('radio')

const questionHeading = (page: Page, position: number, total = categoryQuestions) =>
  page.getByRole('heading', { level: 1, name: `Pytanie ${position} z ${total}` })

const answerQuestion = async (page: Page) => {
  await answers(page).first().click()
  await page.getByRole('button', { name: 'Sprawdź' }).click()
  await expect(answers(page).first()).toBeDisabled()
}

const answerQuestionsFrom = async (page: Page, first = 1, total = categoryQuestions) => {
  for (let position = first; position <= total; position++) {
    await expect(questionHeading(page, position, total)).toBeVisible()
    await answerQuestion(page)

    if (position < total) {
      await page.getByRole('button', { name: 'Następne pytanie' }).click()
    }
  }
}

const writtenStudyTile = (page: Page) =>
  page.getByRole('region', { name: 'Nauka do egzaminu pisemnego' })

const startCategorySession = async (page: Page, title: string) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(title) }).click()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await expect(questionHeading(page, 1)).toBeVisible()

  return page.url()
}

const finishSession = async (page: Page) => {
  await page.getByRole('button', { name: 'Zobacz podsumowanie' }).click()
  await expect(page).toHaveURL(/\/podsumowanie$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Podsumowanie sesji' })).toBeVisible()
}

test('a new learner chooses a path, studies, reloads an answer and completes the session with a summary', async ({
  signedIn: { page },
}) => {
  await page.goto('/start')
  await expect(page).toHaveURL(/\/pierwsze-kroki/)
  await chooseTechnicalPath(page)
  await page.getByRole('button', { name: 'Rozpocznij' }).click()
  await expect(page).toHaveURL(/\/start$/)

  await writtenStudyTile(page).getByRole('button', { name: 'Zacznij naukę' }).click()
  await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki' })).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: buildingLaw })).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()

  await expect(questionHeading(page, 1)).toBeVisible()
  await answerQuestion(page)
  const tone = await answers(page).first().getAttribute('data-tone')

  await page.reload()
  await expect(answers(page).first()).toHaveAttribute('data-tone', tone ?? '')
  await expect(answers(page).first()).toBeChecked()

  await page.getByRole('button', { name: 'Następne pytanie' }).click()
  await answerQuestionsFrom(page, 2)
  await finishSession(page)
  await page.reload()

  // The ring's label carries the score; the first option is not always the correct one.
  await expect(page.getByRole('img', { name: /^Wynik \d+%/ })).toBeVisible()
  await expect(page.getByText(`${categoryQuestions} z ${categoryQuestions} pytań`)).toBeVisible()
  await expect(page.getByRole('list', { name: 'Pytania sesji' }).getByRole('link')).toHaveCount(
    categoryQuestions,
  )

  await expect(page.getByText(technicalConditions)).toBeVisible()
  await page.getByRole('button', { name: 'Kontynuuj naukę' }).click()
  await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki' })).toBeVisible()
  await expect(page.getByRole('definition').filter({ hasText: technicalConditions })).toBeVisible()
})

test('a question opened from the summary shows its stored answer', async ({
  onboarded: { page },
}) => {
  await startCategorySession(page, buildingLaw)
  await answerQuestionsFrom(page)
  await finishSession(page)

  await page.getByRole('link', { name: /^Pytanie 1:/ }).click()
  await expect(questionHeading(page, 1)).toBeVisible()
  await expect(answers(page).first()).toBeChecked()
  await expect(page.getByRole('button', { name: 'Sprawdź' })).toBeHidden()

  await page.getByRole('button', { name: 'Opcje sesji' }).click()
  await expect(page.getByRole('menuitem', { name: 'Zakończ sesję' })).toBeHidden()
  await page.getByRole('menuitem', { name: 'Zobacz podsumowanie' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Podsumowanie sesji' })).toBeVisible()
})

test('ending a session early shows its summary and the next session offers the unanswered questions', async ({
  onboarded: { page },
}) => {
  await startCategorySession(page, buildingLaw)
  await answerQuestion(page)

  await page.getByRole('button', { name: 'Opcje sesji' }).click()
  await page.getByRole('menuitem', { name: 'Zakończ sesję' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Podsumowanie sesji' })).toBeVisible()
  await expect(page.getByText(`1 z ${categoryQuestions} pytań`)).toBeVisible()

  await page.getByRole('button', { name: 'Kontynuuj naukę' }).click()
  await expect(page.getByRole('definition').filter({ hasText: buildingLaw })).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await expect(questionHeading(page, 1, categoryQuestions - 1)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sprawdź' })).toBeVisible()
})

test('an answered category can be started again', async ({ onboarded: { page } }) => {
  await startCategorySession(page, buildingLaw)
  await answerQuestionsFrom(page)
  await finishSession(page)
  const summaryUrl = page.url()

  await page.goto('/start')
  await writtenStudyTile(page).getByRole('button', { name: 'Zobacz podsumowanie' }).click()
  await expect(page).toHaveURL(summaryUrl)

  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(buildingLaw) }).click()
  await expect(page.getByRole('button', { name: 'Zobacz podsumowanie' })).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij nową sesję' }).click()

  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await expect(questionHeading(page, 1)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sprawdź' })).toBeVisible()
})

test('a finished session suggests continuing the unfinished session of another category', async ({
  onboarded: { page },
}) => {
  const buildingLawSession = await startCategorySession(page, buildingLaw)

  await answerQuestion(page)
  await startCategorySession(page, technicalConditions)
  await answerQuestionsFrom(page)
  await finishSession(page)

  await expect(page.getByText(`Odpowiedziano 1 / ${categoryQuestions}`)).toBeVisible()
  await page.getByRole('button', { name: 'Kontynuuj sesję' }).click()
  await expect(page).toHaveURL(buildingLawSession.replace(/\/1$/, '/2'))
})

test('continue opens the most recently used session and each category keeps its own after reload', async ({
  onboarded: { page },
}) => {
  const buildingLawSession = await startCategorySession(page, buildingLaw)
  const conditionsSession = await startCategorySession(page, technicalConditions)

  const continueFromStart = async () => {
    await page.goto('/start')
    await writtenStudyTile(page).getByRole('button', { name: 'Kontynuuj' }).click()
  }

  await continueFromStart()
  await expect(page).toHaveURL(conditionsSession)

  await page.goto(buildingLawSession)
  await answerQuestion(page)
  await page.reload()
  await expect(answers(page).first()).toBeChecked()

  await continueFromStart()
  await expect(page).toHaveURL(buildingLawSession.replace(/\/1$/, '/2'))

  await page.goto('/nauka')
  await page.getByRole('link', { name: new RegExp(technicalConditions) }).click()
  await page.getByRole('button', { name: 'Kontynuuj' }).click()
  await expect(page).toHaveURL(conditionsSession)
  await page.reload()
  await expect(questionHeading(page, 1)).toBeVisible()
})

test('after every category is answered, study starts again from the first one', async ({
  onboarded: { page },
}) => {
  await startCategorySession(page, buildingLaw)
  await answerQuestionsFrom(page)
  await finishSession(page)

  await page.getByRole('button', { name: 'Kontynuuj naukę' }).click()
  await expect(page.getByRole('definition').filter({ hasText: technicalConditions })).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await answerQuestionsFrom(page)
  await finishSession(page)

  await expect(page.getByRole('heading', { level: 2, name: 'Co dalej?' })).toBeVisible()
  await expect(page.getByText(buildingLaw)).toBeVisible()

  await page.goto('/start')
  await writtenStudyTile(page).getByRole('button', { name: 'Kontynuuj naukę' }).click()
  await expect(page.getByRole('definition').filter({ hasText: buildingLaw })).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await expect(questionHeading(page, 1)).toBeVisible()
})

test.describe('on the small seeded path', () => {
  test.use({ pathConfiguration: smallPathConfiguration })

  // The small path has one category with three questions.
  const roundQuestions = 3

  const buildingLawCategory = (page: Page) =>
    page.getByRole('main').getByRole('link', { name: new RegExp(buildingLaw) })

  test('completing the learning round starts the next one with every question to study again', async ({
    onboarded: { page },
  }) => {
    await page.goto('/nauka')
    await expect(buildingLawCategory(page)).toContainText(`Ukończone: 0 / ${roundQuestions} pytań`)
    await buildingLawCategory(page).click()
    await page.getByRole('button', { name: 'Zacznij naukę' }).click()
    await page.getByRole('button', { name: 'Zacznij sesję' }).click()

    await answerQuestionsFrom(page, 1, roundQuestions)
    await finishSession(page)
    await expect(page.getByText(`${roundQuestions} z ${roundQuestions} pytań`)).toBeVisible()

    await page.getByRole('button', { name: 'Kontynuuj naukę' }).click()
    await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki' })).toBeVisible()
    await expect(page.getByRole('definition').filter({ hasText: buildingLaw })).toBeVisible()
    await page.getByRole('button', { name: 'Zacznij sesję' }).click()
    await expect(questionHeading(page, 1, roundQuestions)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sprawdź' })).toBeVisible()

    await page.goto('/nauka')
    await expect(buildingLawCategory(page)).toContainText(`Ukończone: 0 / ${roundQuestions} pytań`)
  })
})
