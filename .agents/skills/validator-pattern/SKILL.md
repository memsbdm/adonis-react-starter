---
name: validator-pattern
description: How to write VineJS validators and normalizers in this AdonisJS project. Use when creating validators or reusable validation rules.
user-invocable: false
---

# Validator Pattern

Validation follows a **dual-layer** approach: controllers validate HTTP input, actions re-validate and normalize data for business logic. Both use VineJS.

## Reusable rule functions

Rule functions are **factory functions** (arrow functions returning a VineJS chain). Each call returns a fresh instance that can be further chained.

### Shared rules

```typescript
import vine from '@vinejs/vine'

export const imageFile = () => vine.file({ size: '2mb', extnames: ['jpg', 'png', 'jpeg', 'webp'] })
export const requiredDecimal = () => vine.number().decimal([0, 2]).max(1_000_000)
export const nullableDecimal = () => requiredDecimal().nullable()
export const nullableString = () => vine.string().trim().nullable()
export const optionalString = () => vine.string().trim().optional()
export const requiredString = () => vine.string().trim().minLength(1)
export const requiredTimezone = () => requiredString().in(Intl.supportedValuesOf('timeZone'))
```

### Domain-specific rules (`app/<domain>/validators/helpers.ts`)

```typescript
import vine from '@vinejs/vine'

export const email = () => vine.string().email().maxLength(254).toLowerCase()
export const newEmail = () =>
  email().unique(async (db, value) => {
    const exists = await db.from('users').where('email', value).select('id').first()
    return !exists
  })
export const password = () => vine.string().minLength(8).maxLength(32)
```

Key: `newEmail()` extends `email()` with a `.unique()` check — demonstrating composability.

## Controller validator (`static validator`)

Controllers define a `static validator` property for validating raw HTTP input. Used with `request.validateUsing()`.

```typescript
import vine from '@vinejs/vine'

import { requiredString, imageFile } from '#app/shared/validators/helpers'
import { email } from '#app/<domain>/validators/helpers'

export default class CreateProductController {
  static validator = vine.create({
    name: requiredString().maxLength(50),
    description: vine.string().trim().maxLength(254).nullable(),
    price: vine.number().decimal([0, 2]).nonNegative(),
    image: imageFile().nullable(),
    email: email(),
  })

  async handle({ request }: HttpContext) {
    const payload = await request.validateUsing(CreateProductController.validator)
    // payload is fully typed
  }
}
```

Controller validators:

- Validate **HTTP input** (form data, query strings, file uploads)
- Handle `vine.file()` — actions never validate files
- Do **not** apply business transforms (no cents conversion)
- Use `request.validateUsing()`

### GET request validation (pagination, search)

```typescript
export default class ListUsersController {
  static validator = vine.create({
    page: vine.number().positive().optional(),
    search: optionalString(),
  })

  async handle({ inertia, request }: HttpContext) {
    const { page, search } = await request.validateUsing(ListUsersController.validator)
    // ...
  }
}
```

## Common VineJS patterns

### Enum validation

```typescript
// String enum — inline values
status: vine.enum(['active', 'locked'] as const),

// String enum — from const object
status: vine.enum(Object.values(CartStatus)),

// Key-based enum — from exported keys array (tuple for vine.enum)
subject: vine.enum(ticketSubjectKeys),

// ID-based enum — number with .in() + type cast
roleId: vine
  .number()
  .in(Object.values(Role))
  .transform((value) => value as RoleId),
```

### Password confirmation

```typescript
password: password().confirmed({ as: 'passwordConfirmation' }),
```

### Nested objects in arrays

```typescript
modifiers: vine.array(
  vine.object({
    modifierGroupId: vine.number(),
    modifierId: vine.number(),
  }),
),
```

### Database uniqueness check

```typescript
name: requiredString().unique(async (db, value) => {
  const existing = await db.from('organizations').where('name', value).select('id').first()
  return !existing
}),
```

For **scoped** uniqueness checks (e.g., unique name within a restaurant), use manual `E_VALIDATION_ERROR` throws in the action instead — see the **exception-pattern** skill.

## Rules

- Rule functions are **factory functions** — always use `() =>` to return a fresh chain
- Shared rules go in `app/shared/validators/helpers.ts`
- Domain-specific rules go in `app/<domain>/validators/helpers.ts`
- Controllers use `static validator` + `request.validateUsing()`
- Controllers handle file uploads, actions do not
- Business transforms (cents conversion, type casts) belong in action normalizers, not controller validators
- No custom VineJS rules (`vine.macro`, `createRule`) — use manual `E_VALIDATION_ERROR` throws for complex business validation
- Always chain `.trim()` on string rules
- Always chain `.nullable()` or `.optional()` explicitly — VineJS is strict by default
