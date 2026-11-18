---
name: controller-pattern
description: How to create Controllers in this AdonisJS project. Use when writing or reviewing controllers, routes, or HTTP handlers.
user-invocable: false
---

# Controller Pattern

Controllers handle HTTP requests and delegate business logic to Actions. They live in `app/<domain>/<feature(optional)>/controllers/`.

## Structure

```typescript
import vine from '@vinejs/vine'
import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { Result } from '@julr/tenace'
import { MyAction } from '#app/<domain>/<feature>/actions/my_action'

@inject()
export default class MyController {
  // VineJS validator for request payload
  static validator = vine.create({
    name: vine.string().trim().minLength(1),
  })

  // Only needed if the controller uses an Action
  constructor(private readonly myAction: MyAction) {}

  // POST/PUT/DELETE handler -- wraps action call in a transaction
  async handle({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(MyController.validator)

    const result = await withTransaction(() =>
      this.myAction.handle({
        currentUser: auth.user!,
        ...payload,
      }),
    )

    return await Result.match(res, {
      ok: async user => {
        return response.created()
      },
      EmailAlreadyInUse: error => {
        return response.conflict({ code: error.code })
      },
    })
  }
}
```

## Match each error in the controller

Result.match() needs one handler per error. If you add a strategy to the policy later, the controller fails to compile until it handles the new error.

```typescript
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { Result } from '@julr/tenace'
import { WeatherService } from '#services/weather_service'

@inject()
export default class ForecastsController {
  constructor(private weather: WeatherService) {}

  async show({ params, response }: HttpContext) {
    const result = await this.weather.forecast(params.city)

    return Result.match(result, {
      ok: forecast => forecast,
      CityNotFound: error => response.notFound({ code: error.code }),
      WeatherApiDown: () => response.serviceUnavailable('Try again later'),
      TimeoutError: () => response.serviceUnavailable('Try again later'),
      CircuitOpenError: () => response.serviceUnavailable('Try again later'),
      UnexpectedError: error => {
        throw error.cause
      },
    })
  }
}
```

An UnexpectedError holds what threw, such as a network error. Rethrow error.cause, and the exception handler renders it as usual: a 500 for a bug, or the status of an Adonis exception.

## Transactions

Always wrap action calls in `withTransaction()` in the `handle()` method. This creates a database transaction via `AsyncLocalStorage` that actions can access with `transactionContext.get()`.

```typescript
import { withTransaction } from '#app/shared/utils/with_transaction'

async handle({ auth, request, response }: HttpContext) {
  const payload = await request.validateUsing(MyController.validator)
  const result = await withTransaction(() =>
    this.myAction.handle({ currentUser: auth.user!, ...payload }),
  )
  response.redirect().toRoute('route_name')
}
```

For side effects that should only run after a successful commit (emails, notifications, etc.), use `dispatchAfterCommit()` inside the action:

```typescript
import { dispatchAfterCommit } from '#app/shared/utils/dispatch_after_commit'

await dispatchAfterCommit(async () => {
  await mail.sendLater(new WelcomeMail(user.email))
})
```

If called outside a transaction, `dispatchAfterCommit` executes the callback immediately. Note that Lucid silently swallows errors in after-commit hooks -- handle errors inside the callback if needed.

## Rules

- One controller per file, named `<name>_controller.ts`
- Export as **default export**: `export default class`
- Use `handle()` for POST/PUT/DELETE requests (processes data)
- Always wrap action calls in `withTransaction()` in `handle()` methods
- Never put business logic in controllers -- delegate to Actions
- Use `@inject()` + constructor DI when the controller needs an Action
- Define a static `validator` (VineJS schema) for request validation
- Destructure only needed properties from `HttpContext` (`{ request, response, inertia, auth }`)

## Routes

Routes reference controllers via the auto-generated registry:

```typescript
import { controllers } from '#generated/controllers'

router.post('my-page', [controllers.domain.feature.MyController, 'handle'])
```

### Route groups by audience

Organize routes into audience tiers, each with a distinct middleware stack:

```typescript
import router from '@adonisjs/core/services/router'
import { defineRouteGroup } from '#app/core/utils/index'
import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'

const { identity } = controllers

// Public routes — no auth required
defineRouteGroup(() => {
  router.get('/is-authenticated', [identity.Login, 'handle'])
})

// Authenticated routes
defineRouteGroup(() => {
  router.delete('/logout', [identity.Logout, 'handle'])
}).use([middleware.auth()])
```

### Route naming convention

Use dot-notation: `{audience}.{resource}.{action}.{verb}`

```typescript
const { identity } = controllers
router.post('/login', [identity.Login, 'handle'])
```

### Route parameter validation

Use `router.matchers` to validate route params at the routing layer:

```typescript
defineRouteGroup(() => {
  router.post('/users/{id}', [identity.Users.GetUser, 'handle'])
}).where('id', router.matchers.uuid())
```

## Reference

See `app/identity/controllers/register_controller.ts` for working example.
