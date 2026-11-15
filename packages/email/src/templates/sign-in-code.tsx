import { appName, getEmailAddress } from '@inzpro/config/app'
import { Heading, Link, Section, Text } from 'react-email'
import { Layout } from '~email/components/layout.js'
import { links } from '~email/lib/links.js'

export type SignInCodeProps = {
  readonly code: string
  readonly expiresInMinutes: number
}

const contactAddress = getEmailAddress('kontakt')

export const signInCodeSubject = `Zaloguj się do ${appName}`

// Wording follows the V1 sign-in email.
export const SignInCode = ({ code, expiresInMinutes }: SignInCodeProps) => (
  <Layout preview={`Twój kod weryfikacyjny do ${appName}: ${code}`}>
    <Section className="px-10 pb-10">
      <Heading className="text-foreground mb-5 text-center text-[24px] font-bold">
        Kod weryfikacyjny do Twojego konta
      </Heading>

      <Text className="text-foreground mb-7.5 text-center text-base">
        Aby zalogować się do swojego konta {appName}, użyj poniższego kodu weryfikacyjnego:
      </Text>

      <Section className="border-primary bg-accent mb-7.5 rounded-lg border-2 border-solid p-7.5 text-center">
        <Text className="text-primary mt-0 mb-2.5 font-mono text-[32px] leading-[40px] font-bold tracking-[8px]">
          {code}
        </Text>
        <Text className="text-foreground m-0 text-[14px]">
          Kod jest ważny przez {expiresInMinutes} minut
        </Text>
      </Section>

      <Text className="text-foreground mb-8 text-center text-base">
        Jeśli to nie Ty próbujesz się zalogować, zignoruj tę wiadomość. Konto pozostanie bezpieczne.
      </Text>

      <Text className="text-muted-foreground text-center text-sm">
        Potrzebujesz pomocy? Napisz do nas na adres{' '}
        <Link
          href={`mailto:${contactAddress}`}
          className="text-primary"
        >
          {contactAddress}
        </Link>{' '}
        lub{' '}
        <Link
          href={links.contactPage}
          className="text-primary"
        >
          skontaktuj się z nami przez formularz na naszej stronie
        </Link>
        .
      </Text>
    </Section>
  </Layout>
)

SignInCode.PreviewProps = { code: '482193', expiresInMinutes: 5 } satisfies SignInCodeProps

// The preview server (`pnpm email:dev`) renders the default export.
export default SignInCode
