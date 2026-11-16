import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { authQueries } from '@/hooks/auth'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const { data } = useQuery(authQueries.isAuthenticated())

  return (
    <>
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-semibold">
              Starter
            </Link>

            <div className="flex items-center gap-2">
              {data?.isAuthenticated === false && (
                <>
                  <Button asChild variant="ghost">
                    <Link to="/auth/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  )
}
