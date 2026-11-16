import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { queryClient } from '@/lib/query_client'
import { query } from '@/lib/tuyau'
import { AuthCard } from '@/components/auth/auth_card'
import { FieldError, FormError } from '@/components/form/form_feedback'
import { toFieldErrors } from '@/lib/validation_error'

export const Route = createFileRoute('/auth/_guest/register')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const register = useMutation(
    query.register.mutationOptions({
      onSuccess: async () => {
        await queryClient.resetQueries()
        await navigate({ to: '/' })
      },
      onError: error => {
        if (error.isValidationError()) {
          setErrors(toFieldErrors(error.response.errors))
          return
        }

        const response = error.response as { code?: string }
        if (response.code === 'E_EMAIL_ALREADY_IN_USE') {
          setErrors({
            email: 'The provided email is already in use. Please use a different email.',
          })
          return
        }

        setErrors({ general: 'An unexpected error occurred. Please try again later.' })
      },
    }),
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors({})
    register.mutate({ body: formData })
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(current => ({ ...current, [field]: value }))

    if (errors[field]) {
      setErrors(current => ({ ...current, [field]: '' }))
    }
  }

  return (
    <AuthCard title="Register" description="Create a new account">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FormError>{errors.general}</FormError>
          <Field>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={event => updateField('fullName', event.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              required
            />
            <FieldError>{errors.fullName}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={event => updateField('email', event.target.value)}
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
              autoComplete="new-password"
              minLength={8}
              value={formData.password}
              onChange={event => updateField('password', event.target.value)}
              aria-invalid={Boolean(errors.password)}
              required
            />
            <FieldError>{errors.password}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="passwordConfirmation">Password Confirmation</FieldLabel>
            <Input
              id="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={formData.passwordConfirmation}
              onChange={event => updateField('passwordConfirmation', event.target.value)}
              aria-invalid={Boolean(errors.passwordConfirmation)}
              required
            />
            <FieldError>{errors.passwordConfirmation}</FieldError>
          </Field>
          <Field>
            <Button type="submit" disabled={register.isPending}>
              {register.isPending ? 'Submitting...' : 'Register'}
            </Button>
          </Field>
          <FieldDescription className="text-center">
            Already have an account?{' '}
            <Link to="/auth/login" className="underline-offset-4 hover:underline">
              Log in
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </AuthCard>
  )
}
