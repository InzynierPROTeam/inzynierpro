import { Button } from '@inzpro/ui/components/button'
import { InView } from '@inzpro/ui/components/containers/in-view'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'

type InfiniteQueryFooterProps = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  fetchNextPage: VoidFunction
}

export const InfiniteQueryFooter: React.FC<InfiniteQueryFooterProps> = ({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
}) => (
  <>
    {hasNextPage && !isFetchingNextPage && !isFetchNextPageError && (
      <InView fetchNextPage={() => fetchNextPage()} />
    )}
    {isFetchingNextPage && (
      <IconWrapper
        className="self-center"
        role="status"
        aria-label="Wczytywanie kolejnych elementów"
      >
        <LoaderCircle className="animate-spin" />
      </IconWrapper>
    )}
    {isFetchNextPageError && (
      <Button
        variant="outline"
        className="self-center"
        onClick={() => fetchNextPage()}
      >
        Spróbuj ponownie wczytać listę
      </Button>
    )}
  </>
)
