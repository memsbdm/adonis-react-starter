import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '@/hooks/auth'

export const Route = createFileRoute('/auth/_guest')({
  beforeLoad: async () => {
    if (!(await isAuthenticated())) return

    throw redirect({ to: '/' })
  },
  component: Outlet,
})
