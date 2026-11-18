---
name: domain-pattern
description: Step-by-step guide to create a new domain module in this AdonisJS project.
disable-model-invocation: true
argument-hint: <domain-name>
---

# Create a New Domain

Create a new domain module named `$ARGUMENTS` following these steps.

## 1. Create the directory structure

```
app/<domain>/
  <feature>/
    actions/
    controllers/
    enums/
    exceptions/
    models/
    transformers/
    validators/
      helpers.ts
  routes.ts
```

Only create the subdirectories you actually need. A domain with no models doesn't need `models/` or `transformers/`. A domain with no enums doesn't need `enums/`. Same for `exceptions/`.

- `enums/` — enum definitions (`as const` objects + union types). See **enum-pattern** skill.
- `exceptions/` — self-handling domain exceptions. See **exception-pattern** skill.
- `validators/helpers.ts` — reusable VineJS rule functions for this domain. See **validator-pattern** skill.

## 2. Create `routes.ts`

```typescript
import router from '@adonisjs/core/services/router'

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'

// Define routes using the auto-generated controller registry
router
  .group(() => {
    router.post('<path>', [controllers.<domain>.<feature>.<Controller>, 'execute'])
  })
  .use(middleware.auth()) // or middleware.guest(), or no middleware
```

## 3. Register routes in `adonisrc.ts`

Add the domain routes to the `preloads` array:

```typescript
preloads: [
  () => import('#app/<domain>/routes'),
  // ... existing preloads
]
```

## 4. Create files

Follow these patterns (see the corresponding skills for details):

- **Models**: migration first (default `table.uuid('id').primary()`, or `table.increments('id')`), then `node ace migration:run`, then model extending the generated schema (with `WithPrimaryUuid` mixin for UUID PKs)
- **Controllers**: `handle()` for actions, static `validator`. See **controller-pattern** skill.
- **Actions**: `@inject()`, `handle(params)` method. See **action-pattern** skill.
- **Validators**: reusable VineJS rule functions exported as arrow functions in `validators/helpers.ts`. See **validator-pattern** skill.
- **Transformers**: extend `BaseTransformer<Model>` with a `toObject()` method using `this.pick()`. See **model-pattern** skill.
- **Enums**: `as const` objects + union types in `enums/`. See **enum-pattern** skill.
- **Exceptions**: self-handling exceptions in `exceptions/`. See **exception-pattern** skill.

## 5. Run codegen

After creating controllers, transformers, or pages, restart the dev server (`pnpm dev`) so the codegen hooks in `adonisrc.ts` re-index everything.

## Reference

See `app/identity/` for a complete domain example with auth, user management, routes, models, transformers, and validators.
