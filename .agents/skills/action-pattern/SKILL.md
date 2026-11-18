---
name: action-pattern
description: How to create Actions that encapsulate business logic in this AdonisJS project. Use when writing or reviewing actions, business logic, or service classes.
user-invocable: false
---

# Action Pattern

Actions encapsulate business logic, separate from HTTP concerns. They live in `app/<domain>/<feature(optional)>/actions/`.

## Structure

```typescript
import vine from '@vinejs/vine'
import { inject } from '@adonisjs/core'

interface Params {
  // Input params here
}

@inject()
export class MyAction {
  async handle(params: Params): Promise<ReturnType> {
    // Business logic here
  }
}
```

## Injecting services

Inject shared services (like `TimeService`) via constructor DI. This allows mocking them in tests:

```typescript
import { inject } from '@adonisjs/core'
import { TimeServiceContract } from '#app/shared/contracts/time_service_contract'

@inject()
export class MyAction {
  constructor(private readonly timeService: TimeServiceContract) {}

  async handle(params: Params) {
    const now = this.timeService.now()
    // Use now instead of DateTime.now() directly
  }
}
```

Never call `DateTime.now()` or other non-deterministic APIs directly in actions -- always go through an injectable service so tests can control the output.

## Return types

When returning from an action, use `Result.ok()` for success and `Result.err()` for errors. This makes it easy to handle errors in a consistent way:

```typescript
import { InvalidCredentials } from '#identity/exceptions/invalid_credentials_exception'
import { Result } from '@julr/tenace'
export class Login {
  async handle({ user, password }: Params) {
    const passwordIsValid = await hash.verify(user.password, password)

    if (!passwordIsValid) {
      return Result.err(new InvalidCredentials())
    }

    return Result.ok(user)
  }
}
```

## Transaction context

Actions run inside a transaction managed by the controller via `withTransaction()`. Use `transactionContext.get()` to access the current transaction for model operations:

```typescript
import { inject } from '@adonisjs/core'
import { transactionContext } from '#app/shared/context/transaction_context'

@inject()
export class CreatePost {
  async handle(params: Params) {
    const trx = transactionContext.get()
    const post = await Post.create({ ...params }, { client: trx })
    return post
  }
}
```

For side effects that must only run after a successful commit (emails, notifications), use `dispatchAfterCommit()`:

```typescript
import { dispatchAfterCommit } from '#app/shared/utils/dispatch_after_commit'

await dispatchAfterCommit(async () => {
  await mail.sendLater(new WelcomeMail(user.email))
})
```

## Manual validation errors

For business rules that produce field-level errors (scoped uniqueness checks, cross-field validation depending on loaded models), throw `E_VALIDATION_ERROR` manually. These surface as standard Inertia validation errors on the frontend:

```typescript
import { errors } from '@vinejs/vine'

const existing = await Menu.findBy({ name, restaurantId: params.restaurantId })
if (existing) {
  throw new errors.E_VALIDATION_ERROR([
    {
      field: 'name',
      rule: 'unique',
      message: this.i18n.t('messages.errors.unique.email'),
    },
  ])
}
```

Use this instead of VineJS's `.unique()` when the uniqueness check is **scoped** (e.g., unique name within an organization) and requires data the validator doesn't have access to.

## Wrapping external service calls

When calling external services that can fail, use Tenace (https://tenace.julr.dev/guides/adonisjs/) for retries, ...:

See the **exception-pattern** skill for how to create custom exceptions.

## dispatchAfterCommit with mail example

A concrete example of `dispatchAfterCommit()` used with email sending:

```typescript
import { dispatchAfterCommit } from '#app/shared/utils/dispatch_after_commit'

@inject()
export class SendOwnerInvite {
  async handle(params: Params) {
    const invite = await Invite.create({ ...params })

    await dispatchAfterCommit(async () => {
      await mail.sendLater(new RegistrationMail(invite.email, invite.id))
    })

    return invite
  }
}
```

The mail is only sent after the transaction commits successfully. If the transaction rolls back, the email is never sent. If called outside a transaction, it executes immediately.

## Rules

- One action per file, named `<action_name>_action.ts`
- Export as **named export** (not default): `export class Register`
- Use `@inject()` decorator so AdonisJS container can inject dependencies
- Method is always `handle(params)` -- never `run`, etc.
- Use a static `normalizer` (VineJS schema) when input needs validation/normalization -- see the **validator-pattern** skill
- Reuse shared validator rules from `#app/shared/validators/helpers` or domain validators
- Inject services (e.g. `TimeService`) via constructor DI -- never call non-deterministic APIs directly, to enable mocking in tests
- Use `transactionContext.get()` to access the current transaction for model operations
- Use `dispatchAfterCommit()` for side effects (emails, notifications) that should only fire after a successful commit
- Throw `errors.E_VALIDATION_ERROR` for scoped uniqueness and complex business validation
- Wrap external service calls in try/catch and throw domain exceptions on failure

## Reference

See `app/identity/actions/register_action.ts` for a working example.
