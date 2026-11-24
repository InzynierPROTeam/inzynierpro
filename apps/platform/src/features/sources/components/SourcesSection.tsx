import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderDescription,
  SectionHeaderTitle,
} from '@inzpro/ui/components/section-header'

import { ReferenceDocuments } from './ReferenceDocuments'

export const SourcesSection = () => (
  <section className="app-layout-section @container gap-12">
    <SectionHeader>
      <SectionHeaderContent>
        <SectionHeaderTitle render={<h1 />}>Źródła</SectionHeaderTitle>
        <SectionHeaderDescription>
          Akty prawne, normy i inne dokumenty, na których opiera się materiał Twojej ścieżki.
        </SectionHeaderDescription>
      </SectionHeaderContent>
    </SectionHeader>
    <ReferenceDocuments />
  </section>
)
