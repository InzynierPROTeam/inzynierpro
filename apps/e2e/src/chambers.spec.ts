import { expect } from '@playwright/test'
import { test } from '~e2e/test/fixtures'

test('a learner chooses, changes and clears a district chamber and reads sourced contacts', async ({
  onboarded: { page },
}) => {
  await page.goto('/moja-izba')

  await expect(page.getByRole('heading', { name: 'Moja izba', exact: true })).toBeVisible()
  const national = page.getByRole('region', { name: 'Izba krajowa', exact: true })
  const district = page.getByRole('region', { name: 'Izba okręgowa', exact: true })
  await expect(national.getByText('Polska Izba Inżynierów Budownictwa')).toBeVisible()
  await expect(district).toHaveCount(0)
  await page.getByRole('combobox', { name: 'Twoja izba okręgowa' }).click()
  await page
    .getByRole('option', { name: 'Dolnośląska Okręgowa Izba Inżynierów Budownictwa', exact: true })
    .click()
  await page.getByRole('button', { name: 'Zapisz izbę', exact: true }).click()

  await expect(district.getByText('Dolnośląska Okręgowa Izba Inżynierów Budownictwa')).toBeVisible()
  await expect(
    district.getByRole('link', { name: '+48 71 337 62 30', exact: true }),
  ).toHaveAttribute('href', 'tel:+48713376230')
  await expect(
    district.getByRole('link', { name: 'dos@dos.piib.org.pl', exact: true }),
  ).toHaveAttribute('href', 'mailto:dos@dos.piib.org.pl')
  await expect(
    district.getByRole('link', { name: 'ul. Odrzańska 22, 50-114 Wrocław', exact: true }),
  ).toHaveAttribute('href', /https:\/\/www.google.com\/maps\/search/)
  await expect(district.getByText(/Ostatnio sprawdzono:/)).toBeVisible()
  await expect(district.getByRole('link', { name: 'Źródło 1', exact: true })).toHaveAttribute(
    'href',
    'https://www.dos.piib.org.pl/kontakt',
  )
  await expect(page.getByRole('button', { name: 'Zapisz izbę', exact: true })).toBeDisabled()
  await page.reload()
  await expect(district.getByText('Biuro DOIIB')).toBeVisible()

  await page.getByRole('combobox', { name: 'Twoja izba okręgowa' }).click()
  await page
    .getByRole('option', {
      name: 'Kujawsko-Pomorska Okręgowa Izba Inżynierów Budownictwa',
      exact: true,
    })
    .click()
  await page.getByRole('button', { name: 'Zapisz izbę', exact: true }).click()
  await expect(district.getByText('Nie mamy jeszcze danych kontaktowych tej izby.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Zapisz izbę', exact: true })).toBeDisabled()

  await page.getByRole('combobox', { name: 'Twoja izba okręgowa' }).click()
  await page.getByRole('option', { name: 'Nie wybrano izby', exact: true }).click()
  await page.getByRole('button', { name: 'Zapisz izbę', exact: true }).click()
  await expect(district).toHaveCount(0)
  await expect(national.getByText('Biuro PIIB')).toBeVisible()
})
