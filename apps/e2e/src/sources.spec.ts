import { expect } from '@playwright/test'
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
