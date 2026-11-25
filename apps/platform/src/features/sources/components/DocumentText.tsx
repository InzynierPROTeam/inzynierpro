import type {
  DocumentSection,
  DocumentUnitQuestionCount,
} from '@inzpro/api-contracts/modules/learning-content/responses'
import {
  type DocumentSectionAddress,
  documentSectionLabel,
  documentUnitLabel,
} from '@inzpro/domain/modules/learning-content/document-section-address'
import { documentQuestionCountsQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import { RichText } from '@inzpro/ui/components/rich-text'
import { useQuery } from '@tanstack/react-query'
import type React from 'react'
import { cx } from 'tailwind-variants'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useScrollToUnit } from '../hooks/useScrollToUnit'
import { isOutlineUnit, referenceDocumentRouteApi, sectionAnchor, type SectionTree } from '../utils'
import { UnitLinkedQuestions } from './UnitLinkedQuestions'

type QuestionCounts = ReadonlyMap<DocumentSectionAddress, DocumentUnitQuestionCount>

type DocumentTextProps = { tree: SectionTree }

export const DocumentText: React.FC<DocumentTextProps> = ({ tree }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { jednostka } = referenceDocumentRouteApi.useSearch()
  const { code } = referenceDocumentRouteApi.useParams()

  const { data } = useQuery(
    documentQuestionCountsQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, code },
    }),
  )

  const questionCounts: QuestionCounts = new Map(data?.units.map(unit => [unit.address, unit]))

  useScrollToUnit(jednostka)

  return (
    <article
      aria-label="Treść dokumentu"
      className="flex flex-col gap-8"
    >
      {(tree.get(null) ?? []).map(section => (
        <DocumentUnit
          key={section.address}
          section={section}
          tree={tree}
          questionCounts={questionCounts}
        />
      ))}
    </article>
  )
}

type DocumentUnitProps = {
  section: DocumentSection
  tree: SectionTree
  questionCounts: QuestionCounts
}

const DocumentUnit: React.FC<DocumentUnitProps> = ({ section, tree, questionCounts }) => {
  const { jednostka } = referenceDocumentRouteApi.useSearch()
  const outline = isOutlineUnit(section)
  const children = tree.get(section.address) ?? []
  const linkedQuestions = questionCounts.get(section.address)
  const Heading = section.parentAddress === null ? 'h2' : 'h3'

  return (
    <div
      id={sectionAnchor(section.address)}
      tabIndex={-1}
      data-highlighted={section.address === jednostka}
      className="ring-offset-background data-[highlighted=true]:bg-primary/10 data-[highlighted=true]:ring-primary/40 flex scroll-mt-32 flex-col gap-3 rounded-md outline-none data-[highlighted=true]:ring-2 data-[highlighted=true]:ring-offset-4"
    >
      {outline && (
        <Heading className="text-lg font-semibold">
          {documentSectionLabel(section.address)}
          {section.title !== null && (
            <span className="text-muted-foreground block text-base font-medium">
              {section.title}
            </span>
          )}
        </Heading>
      )}
      {(!outline || section.content !== null) && (
        <div className="flex gap-2">
          {!outline && (
            <span className="shrink-0 font-semibold">{documentUnitLabel(section.address)}</span>
          )}
          {section.content !== null && (
            <RichText
              content={section.content.content}
              assets={section.content.assets}
            />
          )}
        </div>
      )}
      {linkedQuestions !== undefined && <UnitLinkedQuestions unit={linkedQuestions} />}
      {children.length > 0 && (
        <div className={cx('flex flex-col', outline ? 'gap-6' : 'gap-3 pl-4')}>
          {children.map(child => (
            <DocumentUnit
              key={child.address}
              section={child}
              tree={tree}
              questionCounts={questionCounts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
