import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderTitle,
  SectionHeaderDescription,
} from '@inzpro/ui/components/section-header'

import { Documents } from './Documents'

export const WrittenStudySection = () => (
  <section className="app-layout-section @container gap-12">
    <SectionHeader>
      <SectionHeaderContent>
        <SectionHeaderTitle render={<h1 />}>Kategorie</SectionHeaderTitle>
        <SectionHeaderDescription>
          Poniżej znajdują się dokumenty dla Twojej specjalności wraz z postępem w każdym z nich.
        </SectionHeaderDescription>
      </SectionHeaderContent>
    </SectionHeader>
    <Documents />
  </section>
)
