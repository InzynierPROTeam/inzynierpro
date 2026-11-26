import {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderTitle,
  SectionHeaderDescription,
} from '@inzpro/ui/components/section-header'

import { ChamberContacts } from './ChamberContacts'

export const ChambersSection = () => (
  <section className="app-layout-section gap-12">
    <SectionHeader>
      <SectionHeaderContent>
        <SectionHeaderTitle render={<h1 />}>Moja izba</SectionHeaderTitle>
        <SectionHeaderDescription>
          Dane kontaktowe izby okręgowej i krajowej dla Twojej ścieżki nauki.
        </SectionHeaderDescription>
      </SectionHeaderContent>
    </SectionHeader>
    <ChamberContacts />
  </section>
)
