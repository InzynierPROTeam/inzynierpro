import { Button } from '@inzpro/ui/components/button'
import {
  SectionHeader,
  SectionHeaderActions,
  SectionHeaderContent,
  SectionHeaderDescription,
  SectionHeaderTitle,
} from '@inzpro/ui/components/section-header'
import { Link } from '@tanstack/react-router'
import { FileDown } from 'lucide-react'

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
      <SectionHeaderActions>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/zrodla/pakiet" />}
        >
          <FileDown aria-hidden="true" />
          Pobierz pakiet PDF
        </Button>
      </SectionHeaderActions>
    </SectionHeader>
    <ReferenceDocuments />
  </section>
)
