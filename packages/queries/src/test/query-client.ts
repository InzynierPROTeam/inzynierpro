import { QueryClient } from '@tanstack/react-query'

export const withQueryClient = async <A>(
  use: (queryClient: QueryClient) => Promise<A>,
): Promise<A> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })

  try {
    return await use(queryClient)
  } finally {
    await queryClient.cancelQueries()
    queryClient.clear()
  }
}
