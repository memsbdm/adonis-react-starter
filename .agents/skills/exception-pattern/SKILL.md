---
name: exception-pattern
description: How to create and handle custom exceptions in this AdonisJS project. Use when creating exceptions and handling errors.
user-invocable: false
---

# Exception Pattern

Custom exceptions in this project are **declarative**: each file defines only `static code` and `readonly _tag` (and optionally `static message`).

Exception files live in `app/<capability>/exceptions/` (or `app/core/exceptions/` for cross-capability ones).

## Declarative exception

Every custom exception extends AdonisJS's `Exception` and declares code + _tag only. **Never add a `handle()` method.**

```typescript
// app/<capability>/exceptions/<name>_exception.ts
import { Exception } from '@adonisjs/core/exceptions'

export class EmailAlreadyInUse extends Exception {
  static code = 'E_EMAIL_ALREADY_IN_USE'
  readonly _tag = 'EmailAlreadyInUse' as const
}
```

Avoid status `422` for custom exceptions. Tuyau treats every `422` as a validation error. Reserve it for the validation contract returned by `request.validateUsing()`.

## Validation errors

Declare request validation in controllers and execute it with `request.validateUsing()`. The API i18n messages provider translates these errors before returning them. The frontend displays `issue.message` as-is through `toFieldErrors`; it must not translate validation rules again.

```typescript
onError: error => {
  if (error.isValidationError()) {
    setErrors(toFieldErrors(error.response.errors))
    return
  }
}
```

Do not throw Vine `E_VALIDATION_ERROR` from actions. Represent business failures from actions with declarative custom exceptions instead.

## Custom exceptions

There is no automatic frontend handling for custom exceptions. Handle one only when the UI needs to distinguish it from other failures:

```typescript
onError: error => {
  const response = error.response as { code?: string }

  if (response.code === 'E_EMAIL_ALREADY_REGISTERED') {
    setErrors({
      email: t('auth.register.errors.emailAlreadyRegistered'),
    })
    return
  }

  setErrors({ general: t('auth.register.errors.generic') })
}
```

- Match on `error.response.code`, not the exception message.
- Translate the user-facing text with an existing, feature-specific frontend key. There is no generic `errors.<exception code>` namespace.
- If the UI does not need special behavior, do nothing specific for the exception and use the screen's existing generic error state or toast.
- Cross-cutting exceptions may be handled centrally in `apps/app/src/lib/tuyau.ts` when they drive navigation or session state. The current example redirects for `E_SUBSCRIPTION_ACCESS_REQUIRED`.
- Some route-level error screens intentionally do not inspect the exception code because every failure has the same recovery path.

## Rate limit errors

The global exception handler returns rate limits as `{ retryAfter: number }`. Handle them by status and translate the screen-specific message on the frontend:

```typescript
onError: error => {
  if (error.isStatus(429)) {
    const response = error.response as { retryAfter: number }
    setErrors({
      general: t('auth.login.errors.tooManyRequests', { seconds: response.retryAfter }),
    })
    return
  }
}
```

Keep a feature-specific generic error or toast as the final fallback after validation, custom-exception, and rate-limit handling.

## Rules

- Every custom exception extends `Exception` from `@adonisjs/core/exceptions`.
- Always define `readonly _tag` and `static override code` (code uses `E_UPPER_SNAKE_CASE`).
- **Never define a `handle()` method on a custom exception.** If you need to do it ask first.
- A custom exception's `static message` is an English API/debug fallback, not a frontend translation key.
- Exception files go in `app/<capability>/exceptions/` or `app/core/exceptions/`.
- Define translated validation rules in controller validators. Throw declarative custom exceptions for business failures detected in actions.
