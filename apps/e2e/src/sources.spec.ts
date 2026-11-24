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

  await page.goto('/zrodla/prawo-budowlane')
  await expect(page.getByText('Treść dokumentu nie jest jeszcze dostępna')).toBeVisible()
})
