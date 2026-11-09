import { appName, getEmailAddress } from '@inzpro/config/app'
import { Heading, Link, Section, Text } from 'react-email'
import { Layout } from '~email/components/Layout.js'
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
    <Section className="px-[40px] pb-[40px]">
      <Heading className="text-foreground mb-[20px] text-center text-[24px] font-bold">
        Kod weryfikacyjny do Twojego konta
      </Heading>

      <Text className="text-foreground mb-[30px] text-center text-[16px] leading-[24px]">
        Aby zalogować się do swojego konta {appName}, użyj poniższego kodu weryfikacyjnego:
      </Text>

      <Section className="border-primary bg-accent mb-[30px] rounded-lg border-[2px] border-solid p-[30px] text-center">
        <Text className="text-primary mt-0 mb-[10px] font-mono text-[32px] leading-[40px] font-bold tracking-[8px]">
          {code}
        </Text>
        <Text className="text-foreground m-0 text-[14px]">
          Kod jest ważny przez {expiresInMinutes} minut
        </Text>
      </Section>

      <Text className="text-foreground mb-[32px] text-center text-[16px] leading-[24px]">
        Jeśli to nie Ty próbujesz się zalogować, zignoruj tę wiadomość. Konto pozostanie bezpieczne.
      </Text>

      <Text className="text-muted-foreground text-center text-[14px] leading-[20px]">
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
