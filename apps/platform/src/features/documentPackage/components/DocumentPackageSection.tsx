import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderDescription,
  SectionHeaderTitle,
} from '@inzpro/ui/components/section-header'
import { BackLink } from '~platform/components/BackLink'

import { DocumentPackage } from './DocumentPackage'

export const DocumentPackageSection = () => (
  <section className="app-layout-section @container gap-8">
    <BackLink fallback={{ to: '/zrodla' }} />
    <SectionHeader>
      <SectionHeaderContent>
        <SectionHeaderTitle render={<h1 />}>Pakiet PDF</SectionHeaderTitle>
        <SectionHeaderDescription>
          Wybierz dokumenty swojej ścieżki i ich kolejność, a pobierzesz je jako jeden plik PDF.
        </SectionHeaderDescription>
      </SectionHeaderContent>
    </SectionHeader>
    <DocumentPackage />
  </section>
)
