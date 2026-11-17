import { InternalServerError } from '@inzpro/api-contracts/utils/api-error'
import { expect } from '@playwright/test'
import { Schema } from 'effect'
import { smallPathConfiguration, test } from '~e2e/test/fixtures'

test('a learner starts the seeded mock exam from Start, browses its questions and resumes it', async ({
  onboarded: { page },
}) => {
  const mockExamTile = page.getByRole('region', { name: 'Egzamin próbny' })

  await page.goto('/start')
  await expect(mockExamTile).toContainText('10 pytań • 10 min')
  await mockExamTile.getByRole('button', { name: 'Przejdź do egzaminu' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Egzamin próbny' })).toBeVisible()
  await page.getByRole('button', { name: 'Zacznij nowy egzamin' }).click()
  await expect(page.getByText('6 z 10 poprawnych odpowiedzi')).toBeVisible()
  await expect(page.getByText('Prawo budowlane: 5 pytań')).toBeVisible()
  await expect(page.getByText('Warunki techniczne: 5 pytań')).toBeVisible()
  await page.getByRole('button', { name: 'Rozpocznij egzamin' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 10' })).toBeVisible()
  await expect(page.getByText(/^(Prawo budowlane|Warunki techniczne)$/)).toBeVisible()

  const answers = page.getByRole('radiogroup', { name: 'Wybierz odpowiedź' }).getByRole('radio')

  await expect(answers).toHaveCount(3)
  await answers.first().click()
  await expect(answers.first()).toBeChecked()

  await page
    .getByRole('navigation', { name: 'Pytania egzaminu' })
    .getByRole('link', { name: 'Pytanie 7' })
    .click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 7 z 10' })).toBeVisible()
  await expect(page.getByText(/^(Prawo budowlane|Warunki techniczne)$/)).toBeVisible()

  await page.goto('/start')
  await expect(mockExamTile).toContainText('Masz rozpoczęty egzamin próbny.')
  await mockExamTile.getByRole('button', { name: 'Wróć do egzaminu' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 10' })).toBeVisible()
})

test('a learner saves, changes and flags answers that survive a reload', async ({
  onboarded: { page },
}) => {
  await page.goto('/egzamin-probny/start')
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

    await page.goto('/egzamin-probny/start')
    await expect(page.getByRole('heading', { level: 1, name: 'Egzamin próbny' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rozpocznij egzamin' })).toBeHidden()
  })
})

test('a learner finishes an exam, reviews answers and opens its summary from history', async ({
  onboarded: { page },
}) => {
  await page.goto('/egzamin-probny/start')
  await page.getByRole('button', { name: 'Rozpocznij egzamin' }).click()
  await page.getByRole('button', { name: 'Wróć do tego pytania później' }).click()
  await expect(page.getByText('Pytanie 1 oznaczono do powrotu.')).toBeVisible()
  await page.getByRole('button', { name: 'Zakończ egzamin' }).click()
  const confirmation = page.getByRole('dialog', { name: 'Zakończyć egzamin?' })
  await expect(confirmation).toContainText('Bez odpowiedzi: 10')
  await expect(confirmation).toContainText('Do powrotu: 1')
  await confirmation.getByRole('button', { name: 'Zakończ i zobacz wynik' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Podsumowanie egzaminu' })).toBeVisible()
  await expect(page.getByText('Wynik: niezaliczony', { exact: true })).toBeVisible()
  const review = page.getByRole('region', { name: 'Pytania i Twoje odpowiedzi' })
  await expect(review.getByRole('article')).toHaveCount(5)
  await expect(review.getByRole('article').first()).toContainText('Bez odpowiedzi')
  await expect(review.getByRole('article').first()).toContainText('Poprawna odpowiedź')
  await expect(review.getByRole('article').first()).toContainText('Wyjaśnienie')
  await review
    .getByRole('article')
    .first()
    .getByRole('button', { name: 'Dodaj do ulubionych' })
    .click()
  await expect(
    review.getByRole('article').first().getByRole('button', { name: 'Usuń z ulubionych' }),
  ).toBeVisible()
  await review.getByRole('article').first().getByRole('button', { name: 'Dodaj notatkę' }).click()
  const note = page.getByRole('dialog', { name: 'Twoja notatka' })
  await note
    .getByRole('textbox', { name: 'Treść notatki' })
    .fill('Wrócić do tego przepisu przed egzaminem.')
  await note.getByRole('button', { name: 'Zapisz notatkę' }).click()
  await expect(note).toBeHidden()
  await expect(review.getByRole('article').first()).toContainText(
    'Wrócić do tego przepisu przed egzaminem.',
  )
  await review.getByRole('article').last().scrollIntoViewIfNeeded()
  await expect(review.getByRole('article')).toHaveCount(10)
  const summaryUrl = page.url()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Podsumowanie egzaminu' })).toBeVisible()
  await page.goto('/egzamin-probny')
  await page
    .getByRole('link', { name: /Zobacz podsumowanie/ })
    .first()
    .click()
  await expect(page).toHaveURL(summaryUrl)
})

test('exam writes reconcile their own state without refetching unrelated reads', async ({
  onboarded: { page },
}) => {
  await page.goto('/egzamin-probny/start')
  await expect(page.getByRole('button', { name: 'Rozpocznij egzamin' })).toBeVisible()
  const reads: Array<string> = []
  page.on('request', request => {
    if (request.method() === 'GET' && request.url().includes('/mock-exams/')) {
      reads.push(new URL(request.url()).pathname)
    }
  })

  const nextQuestion = page.waitForResponse(
    response => response.url().endsWith('/questions/2') && response.request().method() === 'GET',
  )

  await page.getByRole('button', { name: 'Rozpocznij egzamin' }).click()
  await expect(page.getByRole('heading', { name: 'Pytanie 1 z 10' })).toBeVisible()
  await nextQuestion
  await expect(page.getByRole('radio')).toHaveCount(3)
  expect(
    reads.filter(path => path.endsWith('/preview') || path.endsWith('/history')),
  ).toStrictEqual([])
  reads.length = 0
  await page.getByRole('radio').first().click()

  const attemptRefreshed = page.waitForResponse(
    response =>
      /\/attempts\/[^/]+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'GET',
  )

  const saved = page.waitForResponse(response => response.url().endsWith('/questions/1/answer'))
  await page.getByRole('button', { name: 'Zapisz odpowiedź' }).click()
  await saved
  await attemptRefreshed
  await expect(page.getByRole('heading', { name: 'Pytanie 2 z 10' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Pytanie 1, z odpowiedzią' })).toBeVisible()
  expect(reads.filter(path => /\/attempts\/[^/]+$/.test(path))).toHaveLength(1)
  expect(reads.filter(path => path.endsWith('/questions/2'))).toHaveLength(0)
  reads.length = 0

  const questionRefreshed = page.waitForResponse(
    response => response.url().endsWith('/questions/2') && response.request().method() === 'GET',
  )

  const flagAttemptRefreshed = page.waitForResponse(
    response =>
      /\/attempts\/[^/]+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'GET',
  )

  const flagged = page.waitForResponse(response => response.url().endsWith('/questions/2/flag'))
  await page.getByRole('button', { name: 'Wróć do tego pytania później' }).click()
  await flagged
  await Promise.all([questionRefreshed, flagAttemptRefreshed])
  await expect(page.getByRole('button', { name: 'Wróć do tego pytania później' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(reads.filter(path => /\/attempts\/[^/]+$/.test(path))).toHaveLength(1)
  expect(reads.filter(path => path.endsWith('/questions/2'))).toHaveLength(1)
  await expect(page.getByText('Pytanie 2 oznaczono do powrotu.')).toBeVisible()
  reads.length = 0
  await page.getByRole('button', { name: 'Zakończ egzamin' }).click()
  await page.getByRole('button', { name: 'Zakończ i zobacz wynik' }).click()
  await expect(
    page.getByRole('heading', { name: 'Podsumowanie egzaminu', exact: true }),
  ).toBeVisible()
  const review = page.getByRole('region', { name: 'Pytania i Twoje odpowiedzi' })
  const first = review.getByRole('article').first()
  await expect(first.getByRole('radio')).toHaveCount(3)
  expect(reads.filter(path => /\/questions\/\d+$/.test(path))).toStrictEqual([])
  reads.length = 0
  await first.getByRole('button', { name: 'Dodaj do ulubionych' }).click()
  await expect(first.getByRole('button', { name: 'Usuń z ulubionych' })).toBeEnabled()
  await first.getByRole('button', { name: 'Dodaj notatkę' }).click()
  const note = page.getByRole('dialog', { name: 'Twoja notatka' })
  await note.getByRole('textbox', { name: 'Treść notatki' }).fill('Notatka bez odświeżania wyniku.')
  await note.getByRole('button', { name: 'Zapisz notatkę' }).click()
  await expect(note).toBeHidden()
  await expect(first).toContainText('Notatka bez odświeżania wyniku.')
  await first.getByRole('button', { name: 'Edytuj notatkę' }).click()
  await note.getByRole('textbox', { name: 'Treść notatki' }).fill('')
  await note.getByRole('button', { name: 'Zapisz notatkę' }).click()
  await expect(note).toBeHidden()
  await expect(first.getByRole('button', { name: 'Dodaj notatkę' })).toBeVisible()
  expect(
    reads.filter(path => /\/attempts\/[^/]+$/.test(path) || path.endsWith('/review')),
  ).toStrictEqual([])
  await page.goto('/start')
  const historyPrefetched = page.waitForResponse(response => response.url().endsWith('/history'))
  await page
    .getByRole('region', { name: 'Egzamin próbny' })
    .getByRole('button', { name: 'Przejdź do egzaminu' })
    .hover()
  await historyPrefetched
  await expect(page).toHaveURL(/\/start$/)
  await page.goto('/egzamin-probny')

  const summaryPrefetched = page.waitForResponse(response =>
    /\/attempts\/[^/]+$/.test(new URL(response.url()).pathname),
  )

  const reviewPrefetched = page.waitForResponse(response =>
    new URL(response.url()).pathname.endsWith('/review'),
  )

  await page.getByRole('button', { name: 'Zobacz wynik ostatniego egzaminu' }).hover()
  await Promise.all([summaryPrefetched, reviewPrefetched])
  await expect(page).toHaveURL(/\/egzamin-probny$/)
})

test('failed exam answer and flag writes restore the saved question and navigator', async ({
  onboarded: { page },
}) => {
  await page.goto('/egzamin-probny/start')
  await page.getByRole('button', { name: 'Rozpocznij egzamin' }).click()
  await expect(page.getByRole('heading', { name: 'Pytanie 1 z 10' })).toBeVisible()
  await page.route('**/questions/1/answer', route =>
    route.fulfill({
      status: 500,
      json: Schema.encodeSync(InternalServerError)(
        new InternalServerError({ type: 'internal_server_error', message: 'Test failure' }),
      ),
    }),
  )
  await page.getByRole('radio').first().click()
  await page.getByRole('button', { name: 'Zapisz odpowiedź' }).click()
  await expect(page.getByText('Nie udało się zapisać odpowiedzi. Spróbuj ponownie.')).toBeVisible()
  const navigator = page.getByRole('navigation', { name: 'Pytania egzaminu' })
  await navigator.getByRole('link', { name: 'Pytanie 1, bez odpowiedzi', exact: true }).click()
  await expect(page.getByRole('radio').first()).not.toBeChecked()
  await page.route('**/questions/1/flag', route =>
    route.fulfill({
      status: 500,
      json: Schema.encodeSync(InternalServerError)(
        new InternalServerError({ type: 'internal_server_error', message: 'Test failure' }),
      ),
    }),
  )
  const flag = page.getByRole('button', { name: 'Wróć do tego pytania później' })
  await flag.click()
  await expect(page.getByText('Nie udało się oznaczyć pytania. Spróbuj ponownie.')).toBeVisible()
  await expect(flag).toHaveAttribute('aria-pressed', 'false')
  await expect(
    navigator.getByRole('link', { name: 'Pytanie 1, bez odpowiedzi', exact: true }),
  ).toBeVisible()
})

test('a delayed answer response preserves a newer flag after conflict reconciliation', async ({
  onboarded: { page },
}) => {
  await page.goto('/egzamin-probny/start')
  await page.getByRole('button', { name: 'Rozpocznij egzamin' }).click()
  await expect(page.getByRole('heading', { name: 'Pytanie 1 z 10' })).toBeVisible()
  const saved = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  await page.route('**/questions/1/answer', async route => {
    const response = await route.fetch()
    saved.resolve()
    await release.promise
    await route.fulfill({ response })
  })
  await page.getByRole('radio').first().click()
  await page.getByRole('button', { name: 'Zapisz odpowiedź' }).click()
  await saved.promise
  await page
    .getByRole('navigation', { name: 'Pytania egzaminu' })
    .getByRole('link', { name: 'Pytanie 1, z odpowiedzią', exact: true })
    .click()
  const flag = page.getByRole('button', { name: 'Wróć do tego pytania później' })
  await flag.click()
  await expect(
    page.getByText('To pytanie zmieniono na innym urządzeniu. Sprawdź je i spróbuj ponownie.'),
  ).toBeVisible()
  await expect(flag).toBeEnabled()
  await flag.click()
  await expect(page.getByText('Pytanie 1 oznaczono do powrotu.')).toBeVisible()
  await expect(flag).toBeEnabled()

  const reconciled = page.waitForResponse(
    response => response.url().endsWith('/questions/1') && response.request().method() === 'GET',
  )

  release.resolve()
  await reconciled
  await expect(flag).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('link', { name: 'Pytanie 1, z odpowiedzią, do powrotu', exact: true }),
  ).toBeVisible()
})
