import { describe, expect, it } from 'vitest'
import { getAuthErrorMessage } from '~auth-client/error.js'

const failedResponse = (status: number, body: { readonly code: string } | string | null) =>
  Object.assign(new Error('Request failed'), { status, statusText: '', error: body })

describe('sign-in error messages', () => {
  it('asks to retype a wrong code', () => {
    expect(getAuthErrorMessage(failedResponse(400, { code: 'INVALID_OTP' }))).toBe(
      'Niepoprawny kod weryfikacyjny. Sprawdź go i spróbuj ponownie.',
    )
  })

  it('asks for a new code after it expired', () => {
    expect(getAuthErrorMessage(failedResponse(400, { code: 'OTP_EXPIRED' }))).toBe(
      'Kod weryfikacyjny wygasł. Wyślij nowy kod.',
    )
  })

  it('explains rate limiting without blaming the code', () => {
    expect(getAuthErrorMessage(failedResponse(429, null))).toBe(
      'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.',
    )
  })

  it('reports a code that could not be sent', () => {
    expect(getAuthErrorMessage(failedResponse(503, { code: 'SIGN_IN_CODE_NOT_SENT' }))).toBe(
      'Nie udało się wysłać kodu. Spróbuj ponownie za chwilę.',
    )
  })

  it('uses a generic message for unknown server failures', () => {
    expect(getAuthErrorMessage(failedResponse(502, '<html>Bad gateway</html>'))).toBe(
      'Coś poszło nie tak. Spróbuj ponownie za chwilę.',
    )
  })

  it('reports a request that never reached the server', () => {
    expect(getAuthErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.',
    )
  })
})
