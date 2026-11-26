import { expect, type Page } from '@playwright/test'
import { technicalConfiguration, test } from '~e2e/test/fixtures'

const category = 'Proces inwestycyjny i pozwolenie na budowę'
const mazowiecka = 'Mazowiecka Okręgowa Izba Inżynierów Budownictwa'
const hint = 'Na egzaminie mogą pojawić się także inne pytania z Twojej ścieżki.'

test.use({
  pathConfiguration: {
    ...technicalConfiguration,
    qualificationKindId: '70000000-0000-4000-8000-000000000002',
  },
})

const openCategoryPreview = async (page: Page) => {
  await page.goto('/ustny')
  await page.getByRole('link', { name: new RegExp(category) }).click()
  await expect(page.getByRole('heading', { name: 'Zacznij sesję nauki ustnej' })).toBeVisible()
}

test('a learner chooses a chamber, studies only questions reported there and sees the chamber badges', async ({
  onboarded: { page },
}) => {
  await page.goto('/moja-izba')
  await page.getByRole('combobox', { name: 'Twoja izba okręgowa' }).click()
  await page.getByRole('option', { name: mazowiecka, exact: true }).click()
  await page.getByRole('button', { name: 'Zapisz izbę', exact: true }).click()
  await expect(
    page
      .getByRole('region', { name: 'Izba okręgowa', exact: true })
      .getByText('Biuro MOIIB Warszawa'),
  ).toBeVisible()

  await openCategoryPreview(page)

  const filter = page.getByRole('switch', {
    name: 'Tylko pytania zgłoszone w mojej izbie (2)',
  })

  await expect(filter).not.toBeChecked()
  await expect(page.getByText(hint)).toBeVisible()

  await filter.click()
  await expect(filter).toBeChecked()
  await expect(page.getByText(hint)).toBeVisible()

  await page.reload()
  await expect(filter).toBeChecked()

  await page.getByRole('button', { name: 'Zacznij sesję' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 1 z 2' })).toBeVisible()
  const badges = page.getByRole('list', { name: 'Twoja izba okręgowa' })
  await expect(badges).toHaveText('Zgłoszone w Twojej izbie')

  await page.getByRole('button', { name: /^Odpowiedź/ }).click()
  await page
    .getByRole('group', { name: 'Oceń trudność pytania' })
    .getByRole('button', { name: 'Łatwe' })
    .click()

  await expect(page.getByRole('heading', { level: 1, name: 'Pytanie 2 z 2' })).toBeVisible()
  await expect(badges).toHaveText('Z oficjalnej puli Twojej izby')
})

test('turning the filter on without a chamber lets the learner choose one inline', async ({
  onboarded: { page },
}) => {
  await openCategoryPreview(page)

  const filter = page.getByRole('switch', { name: 'Tylko pytania zgłoszone w mojej izbie' })

  await expect(page.getByText(hint)).toBeVisible()
  await filter.click()

  const chooser = page.getByRole('dialog', { name: 'Wybierz izbę okręgową' })
  await expect(chooser).toBeVisible()
  await chooser.getByRole('combobox', { name: 'Twoja izba okręgowa' }).click()
  await page.getByRole('option', { name: mazowiecka, exact: true }).click()
  await chooser.getByRole('button', { name: 'Zapisz izbę', exact: true }).click()

  await expect(chooser).toBeHidden()
  await expect(
    page.getByRole('switch', { name: 'Tylko pytania zgłoszone w mojej izbie (2)' }),
  ).toBeChecked()
})
