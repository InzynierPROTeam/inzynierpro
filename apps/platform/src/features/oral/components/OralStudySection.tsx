import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderTitle,
  SectionHeaderDescription,
} from '@inzpro/ui/components/section-header'

import { OralMaterials } from './OralMaterials'

export const OralStudySection = () => {
  return (
    <section className="app-layout-section @container gap-12">
      <SectionHeader>
        <SectionHeaderContent>
          <SectionHeaderTitle render={<h1 />}>Egzamin ustny</SectionHeaderTitle>
          <SectionHeaderDescription>
            Pytania i opracowania do egzaminu ustnego dla Twojej specjalności.
          </SectionHeaderDescription>
        </SectionHeaderContent>
      </SectionHeader>
      <OralMaterials />
    </section>
  )
}
