import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FieldDescription } from '@/components/ui/field'

export function FormError({ children }: { children?: string }) {
  if (!children) return null

  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null

  return <FieldDescription className="text-destructive">{children}</FieldDescription>
}
