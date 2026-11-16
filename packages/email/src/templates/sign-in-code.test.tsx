import { render, toPlainText } from 'react-email'
import { describe, expect, it } from 'vitest'
import { SignInCode } from '~email/templates/sign-in-code.js'

describe('sign-in code email', () => {
  it('shows the code and how long it is valid, in Polish', async () => {
    const html = await render(
      <SignInCode
        code="482193"
        expiresInMinutes={5}
      />,
    )

    expect(html).toContain('lang="pl"')
    expect(html).toContain('482193')
    expect(toPlainText(html)).toContain('Kod jest ważny przez 5 minut')
  })

  it('uses the platform colours', async () => {
    const html = await render(
      <SignInCode
        code="482193"
        expiresInMinutes={5}
      />,
    )

    expect(html).toContain('rgb(41,126,255)')
  })
})
