import type { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { linkedOralQuestionsInfiniteQueryOptions } from '@inzpro/queries/modules/learning-content/queries'
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@inzpro/ui/components/item'
import { RichText } from '@inzpro/ui/components/rich-text'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type React from 'react'
import { InfiniteQueryFooter } from '~platform/components/InfiniteQueryFooter'
import {
  SuspenseInfiniteQuery,
  SuspenseQueryWrapper,
} from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { referenceDocumentRouteApi } from '../utils'
import { LinkedQuestionListSkeleton } from './LinkedQuestionListSkeleton'

type LinkedOralQuestionListProps = { address: DocumentSectionAddress }

export const LinkedOralQuestionList: React.FC<LinkedOralQuestionListProps> = ({ address }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { code } = referenceDocumentRouteApi.useParams()

  return (
    <SuspenseQueryWrapper fallback={<LinkedQuestionListSkeleton />}>
      <SuspenseInfiniteQuery
        options={linkedOralQuestionsInfiniteQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id, code },
          query: { address },
        })}
        isDataEmpty={() => false}
      >
        {({ data, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage }) => (
          <ItemGroup>
            {data.pages
              .flatMap(page => page.data)
              .map(question => (
                <Item
                  key={question.questionId}
                  variant="background-soft"
                  render={
                    <Link
                      to="/ustny/pytanie/$questionId"
                      params={{ questionId: question.questionId }}
                    />
                  }
                >
                  <ItemContent>
                    <ItemTitle className="line-clamp-3">
                      <RichText
                        content={question.body.content}
                        assets={question.body.assets}
                      />
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRight aria-hidden="true" />
                  </ItemActions>
                </Item>
              ))}
            <InfiniteQueryFooter
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              isFetchNextPageError={isFetchNextPageError}
              fetchNextPage={() => void fetchNextPage()}
            />
          </ItemGroup>
        )}
      </SuspenseInfiniteQuery>
    </SuspenseQueryWrapper>
  )
}
