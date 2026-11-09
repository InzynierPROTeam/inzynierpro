import { Option, Schema } from 'effect'

// With `throw: true` a failed Better Auth call rejects with the response status and its JSON
// body. A request that never reached the server rejects with a plain fetch error instead.
const FailedResponse = Schema.Struct({ status: Schema.Finite })

const FailedResponseWithCode = Schema.Struct({ error: Schema.Struct({ code: Schema.String }) })

const messagesByCode = new Map(
  Object.entries({
    INVALID_OTP: 'Niepoprawny kod weryfikacyjny. Sprawdź go i spróbuj ponownie.',
    OTP_EXPIRED: 'Kod weryfikacyjny wygasł. Wyślij nowy kod.',
    TOO_MANY_ATTEMPTS: 'Zbyt wiele nieudanych prób. Wyślij nowy kod.',
    SIGN_IN_CODE_NOT_SENT: 'Nie udało się wysłać kodu. Spróbuj ponownie za chwilę.',
    INVALID_EMAIL: 'Wpisz poprawny adres e-mail.',
  }),
)

export const getAuthErrorMessage = (error: Error) =>
  Option.match(Schema.decodeUnknownOption(FailedResponse)(error), {
    onNone: () => 'Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.',
    onSome: ({ status }) =>
      Schema.decodeUnknownOption(FailedResponseWithCode)(error).pipe(
        Option.flatMap(({ error: { code } }) => Option.fromNullishOr(messagesByCode.get(code))),
        Option.getOrElse(() =>
          status === 429
            ? 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.'
            : 'Coś poszło nie tak. Spróbuj ponownie za chwilę.',
        ),
      ),
  })
