import { Button } from '@/components/ui/button'
import { authQueries } from '@/hooks/auth'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const { data } = useSuspenseQuery(authQueries.isAuthenticated())
  const logout = useMutation(
    query.logout.mutationOptions({
      onSuccess: async () => {
        queryClient.clear()
      },
    }),
  )

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
          React x AdonisJS | Starter Kit
        </h1>
        {data.isAuthenticated ? (
          <Button variant="outline" disabled={logout.isPending} onClick={() => logout.mutate({})}>
            <LogOut />
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        ) : (
          <Button>
            <Link to="/auth/login">Log in</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
