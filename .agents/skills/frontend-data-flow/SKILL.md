---
name: frontend-data-flow
description: Implement or review type-safe frontend data flows in apps/app using Tuyau, TanStack Query, and TanStack Router. Use when calling API endpoints, defining query options, loading route data, writing mutations, updating or invalidating cache, handling typed validation or custom-exception responses, or refactoring frontend server-state code.
---

# Frontend Data Flow

Keep the chain `AdonisJS route -> Tuyau registry -> query options -> loader/component` type-inferred end to end. Inspect the closest existing capability before changing a flow.

## Use the generated API client

- Use `query` from `@/lib/tuyau` with `query.<capability>.<operation>.queryOptions(...)` or `.mutationOptions(...)`.
- Do not duplicate request or response interfaces that Tuyau already infers.
- Pass endpoint input in its generated shape (`params`, `query`, or `body`) and let TypeScript reject drift.
- Import shared domain constants or exported types from `@starter/api/...`; do not recreate backend enums as frontend string unions.
- Use the raw `tuyau` client only for imperative calls that do not represent reusable server state, such as an action performed inside a route loader.
- Never call `fetch` directly for a registered application endpoint.

## Name explicit frontend data types

Let Tuyau infer endpoint inputs and outputs inside queries and mutations. When a component boundary, prop, local collection, or derived type benefits from an explicit annotation, import the generated transformer data namespace:

```typescript
import type { Data } from '@starter/api/data'

type ActiveVenue = Data.Venue.Venue.Variants['forContext']
type VenueOption = Data.Venue.Venue
type VenuePermission = keyof ActiveVenue['can']
```

Use the shape `Data.<Capability>.<Resource>` and `Data.<Capability>.<Resource>.Variants['<variant>']`. Variant names come from the backend transformer; inspect the transformer or generated declarations instead of guessing one. For example, `forEdit` is valid only when that variant exists.

Use these types to make a public/local boundary clear, not to cast an incompatible value or repeat an inferred callback type. Never edit `apps/api/.adonisjs/client/data.d.ts`; AdonisJS generates it.

## Define reusable queries

Keep reusable query-option factories in `src/hooks/<capability>.ts`:

```typescript
export const venueQueries = {
  context: () => query.venue.context.queryOptions({}, { staleTime: Infinity }),
  current: () => query.venue.current.queryOptions({}, { staleTime: Infinity }),
}
```

Create a factory when the same query key/options are needed by loaders, components, mutations, or cache operations. Use `query...queryOptions(...)` inline for truly local one-off reads.

Do not wrap `useQuery` in a custom hook merely to rename its return value. Share query options, not component lifecycle.

## Coordinate Router and Query

Load route-critical data with `queryClient.ensureQueryData(...)`. In the component, consume the identical options with `useSuspenseQuery(...)` when the loader guarantees the data:

```typescript
export const Route = createFileRoute('/_app/settings')({
  loader: () => queryClient.ensureQueryData(venueQueries.current()),
  component: SettingsPage,
})

function SettingsPage() {
  const { data: venue } = useSuspenseQuery(venueQueries.current())
  // ...
}
```

- Use `ensureQueryData` for cached route dependencies.
- Use `fetchQuery` when the loader must force freshness; state that intent with options such as `staleTime: 0`.
- Keep authentication, onboarding, subscription, and active-venue guards in route loaders or the existing Tuyau response hooks, not in leaf components.
- Avoid parallel copies of loader data in component state unless the state is an editable draft.

## Write mutations

Build mutations from generated options and add lifecycle behavior locally:

```typescript
const updateUser = useMutation(
  query.updateUser.execute.mutationOptions({
    onSuccess: updatedUser => {
      queryClient.setQueryData(authQueries.me().queryKey, updatedUser)
    },
  }),
)
```

- Await invalidation or reset when subsequent navigation/rendering depends on fresh data.
- Prefer `setQueryData` when the mutation returns the canonical replacement for one known cache entry.
- Prefer targeted `invalidateQueries({ queryKey })` when related server state must be refetched.
- Reserve broad `resetQueries()` or `invalidateQueries()` for real context boundaries such as login, logout, venue activation, or subscription-access changes.
- Keep optimistic updates exceptional: implement rollback and reconciliation if one is genuinely needed.
- Disable or show pending state from the mutation rather than maintaining a second loading flag.

## Handle errors at the right boundary

For controller validation errors, use Tuyau's validation discriminator and preserve server field names. `request.validateUsing()` translates messages through the API i18n provider, so display them directly with `toFieldErrors` from `@/lib/validation_error`:

```typescript
onError: error => {
  if (error.isValidationError()) {
    setErrors(toFieldErrors(error.response.errors))
    return
  }
},
```

Do not translate validation rules on the frontend and do not use `translateValidationErrors` for new flows.

For a custom exception, inspect `error.response.code` only when the screen needs distinct behavior. Translate it with a feature-specific frontend key; do not display the exception message as UI copy:

```typescript
const response = error.response as { code?: string }

if (response.code === 'E_EMAIL_ALREADY_REGISTERED') {
  setErrors({ email: t('auth.register.errors.emailAlreadyRegistered') })
  return
}
```

For rate limits, inspect status `429`, read the handler's `{ retryAfter: number }` response, and translate the screen-specific message:

```typescript
if (error.isStatus(429)) {
  const response = error.response as { retryAfter: number }
  setErrors({
    general: t('auth.login.errors.tooManyRequests', { seconds: response.retryAfter }),
  })
  return
}
```

Use the screen's generic error state or toast as the final fallback for network errors, server errors, and unhandled custom exceptions.

Put handling in `src/lib/tuyau.ts` only when it is truly cross-cutting, such as clearing authentication or redirecting for onboarding/subscription state. Clone a response before reading its body in a response hook so downstream error parsing still works.

Follow the `exception-pattern` skill when introducing or changing a backend custom exception.

## Preserve ownership

- Keep server state in TanStack Query and transient form/UI state in React state.
- Keep query keys owned by generated query options; do not handcraft parallel key arrays.
- Keep cache policy near the reusable query factory or global `QueryClient` defaults.
- Prefer a small local callback over a generic data-access abstraction used once.

## Verify

Run the narrow frontend check:

```bash
pnpm --filter @starter/app typecheck
```

Also run the relevant root checks when shared API contracts or broader code are changed.
