import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { query } from '@/lib/tuyau'
import { queryClient } from '@/lib/query_client'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { AuthCard } from '@/components/auth/auth_card'
import { FieldError, FormError } from '@/components/form/form_feedback'
import { toFieldErrors } from '@/lib/validation_error'

export const Route = createFileRoute('/auth/_guest/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const login = useMutation(
    query.login.mutationOptions({
      onSuccess: async () => {
        await queryClient.resetQueries()
        await navigate({ to: '/' })
      },
      onError: error => {
        if (error.isValidationError()) {
          setErrors(toFieldErrors(error.response.errors))
          return
        }

        setErrors({ general: 'The provided credentials are invalid' })
      },
    }),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    login.mutate({ body: { email: formData.email, password: formData.password } })
  }

  const handleChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }))
      }
    }

  return (
    <AuthCard title="Login" description="Enter your email and password to login.">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FormError>{errors.general}</FormError>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange('email')}
              aria-invalid={Boolean(errors.email)}
              required
            />
            <FieldError>{errors.email}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange('password')}
              aria-invalid={Boolean(errors.password)}
              required
            />
            <FieldError>{errors.password}</FieldError>
          </Field>
          <Field>
            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? 'Logging in...' : 'Login'}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            New to our site?{' '}
            <Link to="/auth/register" className="underline-offset-4 hover:underline">
              Register
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
