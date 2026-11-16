import { POLISH_LANGUAGE } from '@inzpro/config/localization'
import type { ReactNode } from 'react'
import { Body, Container, Font, Head, Html, Preview, Tailwind } from 'react-email'
import { Footer } from '~email/components/footer.js'
import { Header } from '~email/components/header.js'
import { themeCss } from '~email/lib/theme.js'

// Nunito Sans, the platform font (variable, latin and latin-ext for Polish characters).
const fontFiles = [
  'https://fonts.gstatic.com/s/nunitosans/v19/pe0TMImSLYBIv1o4X1M8ce2xCx3yop4tQpF_MeTm0lfGWVpNn64CL7U8upHZIbMV51Q42ptCp7t1R-tQKr51.woff2',
  'https://fonts.gstatic.com/s/nunitosans/v19/pe0TMImSLYBIv1o4X1M8ce2xCx3yop4tQpF_MeTm0lfGWVpNn64CL7U8upHZIbMV51Q42ptCp7t7R-tQKr51pE8.woff2',
]

type LayoutProps = {
  preview: string
  children: ReactNode
}

export const Layout = ({ preview, children }: LayoutProps) => (
  <Html
    lang={POLISH_LANGUAGE}
    dir="ltr"
  >
    <Head>
      {fontFiles.map(url => (
        <Font
          key={url}
          fontFamily="Nunito Sans"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{ url, format: 'woff2' }}
        />
      ))}
    </Head>
    <Preview>{preview}</Preview>
    <Tailwind theme={themeCss}>
      <Body
        lang={POLISH_LANGUAGE}
        className="bg-muted text-foreground py-10 font-sans"
      >
        <Container className="bg-background border-border mx-auto max-w-[600px] rounded-lg border border-solid">
          <Header />
          {children}
          <Footer />
        </Container>
      </Body>
    </Tailwind>
  </Html>
)
