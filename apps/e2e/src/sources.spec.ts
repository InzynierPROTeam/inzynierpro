import { readFile } from 'node:fs/promises'

import { expect } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'
import { test } from '~e2e/test/fixtures'

const structuralDesignBasis = 'Eurokod. Podstawy projektowania konstrukcji'

test('the sources page lists the path documents and a metadata-only standard shows its description and link', async ({
  onboarded: { page },
}) => {
  await page.goto('/start')
  await page.getByRole('link', { name: 'Źródła' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Źródła' })).toBeVisible()

  const buildingLaw = page.getByRole('link', { name: /Prawo budowlane/ })
  await expect(buildingLaw).toContainText('Ustawa')
  await expect(buildingLaw).toContainText('Dz.U. 2024 poz. 725 (t.j.)')

  await page.getByRole('link', { name: new RegExp(structuralDesignBasis) }).click()
  await expect(page.getByRole('heading', { level: 1, name: structuralDesignBasis })).toBeVisible()
  await expect(page.getByText(/Treść normy jest chroniona prawem autorskim/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Otwórz źródło zewnętrzne' })).toHaveAttribute(
    'href',
    'https://www.pkn.pl/',
  )
})

test('a structured statute opens with its table of contents, links to a provision and says when a linked unit is missing', async ({
  onboarded: { page },
}) => {
  await page.goto('/zrodla/prawo-budowlane')

  const outline = page.getByRole('navigation', { name: 'Spis treści' })
  await expect(
    outline.getByRole('link', { name: /Prawa i obowiązki uczestników procesu budowlanego/ }),
  ).toBeVisible()

  await outline.getByRole('link', { name: 'art. 17', exact: true }).click()
  await expect(page).toHaveURL(/jednostka=art%3A17$/)
  const unit = page.locator('[data-highlighted="true"]')
  await expect(unit).toContainText('inspektor nadzoru inwestorskiego')
  await expect(unit).toBeInViewport()
  await expect
    .poll(() => unit.evaluate(element => element.getBoundingClientRect().top))
    .toBeGreaterThanOrEqual(
      await page.locator('header').evaluate(element => element.getBoundingClientRect().bottom),
    )

  await page.goto('/zrodla/prawo-budowlane?jednostka=art%3A999')
  await expect(page.getByRole('alert')).toContainText('W tym wydaniu nie ma jednostki art. 999.')
})

test('a regulation shows its table and the stored diagram', async ({ onboarded: { page } }) => {
  await page.goto('/zrodla/warunki-techniczne?jednostka=par%3A68%2Fust%3A1')

  const unit = page.locator('[data-highlighted="true"]')
  await expect(unit.getByRole('cell', { name: 'Mieszkalne jednorodzinne' })).toBeVisible()
  await expect(
    unit.getByRole('img', { name: 'Przekrój biegu schodów z zaznaczoną wysokością stopnia' }),
  ).toBeVisible()
})

test('a PDF-only statute opens in the viewer at the requested page and downloads where allowed', async ({
  onboarded: { page },
}) => {
  await page.goto('/zrodla/samorzady-zawodowe?strona=3')

  await expect(page.getByText('Strona 3 z 6')).toBeVisible()
  await expect(page.getByText(/Rozdział 1 · strona 3 z 6/)).toBeVisible()

  await page.getByRole('button', { name: 'Następna strona' }).click()
  await expect(page).toHaveURL(/strona=4$/)
  await expect(page.getByText(/Rozdział 1 · strona 4 z 6/)).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Pobierz PDF' }).click()
  expect((await download).suggestedFilename()).toBe('samorzady-zawodowe.pdf')
})

test('a checked answer leads from its basis to the fragment, a related question and back to another article', async ({
  onboarded: { page },
}) => {
  await page.goto('/nauka')
  await page.getByRole('link', { name: /Prawo budowlane/ }).click()
  await page.getByRole('button', { name: 'Zacznij naukę' }).click()
  await page.getByRole('button', { name: 'Zacznij sesję' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 8' })).toBeVisible()

  await page
    .getByRole('radiogroup', { name: 'Wybierz odpowiedź' })
    .getByRole('radio')
    .first()
    .click()
  await page.getByRole('button', { name: 'Sprawdź' }).click()

  await page
    .getByRole('region', { name: /^Podstawa: PB / })
    .getByRole('link')
    .first()
    .click()
  await expect(page).toHaveURL(/\/zrodla\/prawo-budowlane\?jednostka=art/)

  const fragment = page.locator('[data-highlighted="true"]')
  await expect(fragment).toBeInViewport()

  await fragment
    .getByRole('button', { name: /^Pytania na Twojej ścieżce \([1-9]\d*\)/ })
    .first()
    .click()

  const linkedQuestions = page.getByRole('dialog', { name: /^Pytania na Twojej ścieżce/ })
  await expect(linkedQuestions).toBeVisible()

  await linkedQuestions
    .getByRole('region', { name: /^Pytania pisemne \([1-9]\d*\)$/ })
    .getByRole('link')
    .first()
    .click()
  await expect(page).toHaveURL(/\/nauka\/pytanie\//)
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()

  const answers = page.getByRole('radiogroup', { name: 'Odpowiedzi' }).getByRole('radio')
  await expect(answers).toHaveCount(3)
  await expect(answers.and(page.locator('[data-tone="correct"]'))).toHaveCount(1)
  await expect(answers.and(page.locator('[data-tone="correct"]'))).toContainText(
    'Poprawna odpowiedź',
  )
  await expect(page.getByRole('region', { name: 'Wyjaśnienie' })).toBeVisible()

  await page.getByRole('button', { name: 'Dodaj do ulubionych' }).click()
  await expect(page.getByRole('button', { name: 'Usuń z ulubionych' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: 'Dodaj notatkę' }).click()
  const noteDialog = page.getByRole('dialog', { name: 'Twoja notatka' })
  await noteDialog.getByRole('textbox', { name: 'Treść notatki' }).fill('Sprawdzić w ustawie.')
  await noteDialog.getByRole('button', { name: 'Zapisz notatkę' }).click()
  await expect(noteDialog).toBeHidden()

  await page.reload()
  await expect(page.getByRole('button', { name: 'Usuń z ulubionych' })).toBeVisible()
  await page.getByRole('button', { name: 'Edytuj notatkę' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Twoja notatka' }).getByRole('textbox'),
  ).toHaveValue('Sprawdzić w ustawie.')
  await page.keyboard.press('Escape')

  await page
    .getByRole('region', { name: /^Podstawa: PB / })
    .getByRole('link')
    .first()
    .click()
  await expect(page).toHaveURL(/\/zrodla\/prawo-budowlane\?jednostka=art/)

  await page
    .getByRole('navigation', { name: 'Spis treści' })
    .getByRole('link', { name: 'art. 54', exact: true })
    .click()
  await expect(page).toHaveURL(/jednostka=art%3A54$/)
  await expect(page.locator('[data-highlighted="true"]')).toHaveAttribute('id', 'jednostka-art:54')
  await expect(page.locator('[data-highlighted="true"]')).toBeInViewport()
})

test('the PDF package selects the downloadable documents, keeps a reordering after a reload and downloads them merged in order', async ({
  onboarded: { page },
}) => {
  await page.goto('/zrodla')
  await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pakiet PDF' })).toBeVisible()

  await expect(page.getByRole('checkbox', { name: /Prawo budowlane/ })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: /samorządach zawodowych/ })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: /Warunki techniczne/ })).toBeDisabled()
  await expect(
    page.getByRole('checkbox', { name: /Warunki techniczne/ }),
  ).toHaveAccessibleDescription('Tego dokumentu nie można pobrać.')
  await expect(page.getByRole('checkbox', { name: /Eurokod/ })).toHaveAccessibleDescription(
    'Dostępny jest tylko opis tego dokumentu.',
  )
  await expect(page.getByText('Dokumenty: 2 · Liczba stron: 14')).toBeVisible()

  const order = page.getByRole('list', { name: 'Kolejność dokumentów w pakiecie' })
  await page.getByRole('button', { name: 'Przesuń wyżej: USZ' }).click()
  await expect(order.getByRole('listitem').first()).toContainText('USZ')

  await page.reload()
  await expect(order.getByRole('listitem').first()).toContainText('USZ')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Pobierz pakiet PDF' }).click()
  const file = await download

  expect(file.suggestedFilename()).toMatch(/^InzynierPRO-KB-[A-Z]+-[A-Z]+-\d{4}-\d{2}-\d{2}\.pdf$/)

  const merged = await PDFDocument.load(await readFile(await file.path()))
  const widths = merged.getPages().map(pdfPage => Math.round(pdfPage.getWidth()))

  expect(widths).toEqual([...Array(6).fill(595), ...Array(8).fill(420)])
})
