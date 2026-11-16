import { query } from '@/lib/tuyau'
import { queryClient } from '@/lib/query_client'

export const authQueries = {
  me: () => query.getMe.queryOptions({}, { staleTime: Infinity, gcTime: Infinity }),
  isAuthenticated: () =>
    query.isAuthenticated.queryOptions({}, { staleTime: Infinity, gcTime: Infinity }),
}

export async function isAuthenticated() {
  const result = await queryClient.ensureQueryData(authQueries.isAuthenticated())

  return result.isAuthenticated
}

export async function getAuthenticatedUser() {
  const user = await queryClient.ensureQueryData(authQueries.me())

  return user
}
