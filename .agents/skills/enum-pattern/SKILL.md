---
name: enum-pattern
description: How to define and use enums (const objects + union types) across all layers of the app. Use when creating enums, lookup tables, status columns, or typed constants.
user-invocable: false
---

# Enum Pattern

**Never use the TypeScript `enum` keyword.** Always use `as const` objects with derived union types.

Enum files live in `app/<domain>/<feature>/enums/` (or `app/<domain>/enums/` if shared across features).

## Three patterns

### Pattern A: ID-based enum with lookup table

For enums backed by a **database lookup table** (roles, categories, allergens...). The DB has a dedicated table with an `id` and a `name`.

```typescript
// app/<domain>/enums/<name>.ts
export const Role = {
  Owner: 1,
  Manager: 2,
} as const

export type RoleId = (typeof Role)[keyof typeof Role] // 1 | 2

export const RoleText = {
  [Role.Owner]: 'Owner',
  [Role.Manager]: 'Manager',
} as const

export const rolesDbValues = [
  { id: Role.Owner, name: RoleText[Role.Owner] },
  { id: Role.Manager, name: RoleText[Role.Manager] },
]
```

Exports:

- **Const object** — maps human-readable keys to numeric DB IDs
- **Union type** — `RoleId` = `1 | 2`
- **Reverse lookup** — `RoleText` maps ID back to display string
- **`dbValues` array** — ready for seeding

#### Migration

Use `table.increments('id')` for the lookup table:

```typescript
async up() {
  this.schema.createTable(this.tableName, (table) => {
    table.increments('id').notNullable()
    table.string('name').notNullable().unique()
  })
}
```

Foreign key columns referencing the lookup table use `table.integer('<name>_id')`:

```typescript
table.integer('role_id').unsigned().references('id').inTable('roles').notNullable()
```

#### Schema rules

Override both the lookup table's `id` and any FK columns to use the enum type:

```typescript
// database/schema_rules.ts
tables: {
  roles: {
    columns: {
      id: {
        tsType: 'RoleId',
        decorator: '@column({ isPrimary: true })',
        imports: [{ source: '#app/<domain>/enums/role', typeImports: ['RoleId'] }],
      },
    },
  },
  members: {
    columns: {
      role_id: {
        tsType: 'RoleId',
        imports: [{ source: '#app/<domain>/enums/role', typeImports: ['RoleId'] }],
      },
    },
  },
}
```

#### Seeder

ID-based enums **must** have a seeder. Use `updateOrCreateMany` to be idempotent:

```typescript
// database/seeders/<NNN>_<name>_seeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import <Name> from '#app/<domain>/models/<name>'
import { <name>DbValues } from '#app/<domain>/enums/<name>'

export default class extends BaseSeeder {
  override async run() {
    await <Name>.updateOrCreateMany('name', <name>DbValues)
  }
}
```

Prefix seeders with a number (`001_`, `002_`) to control execution order.

#### Validation

Use `vine.number().in()` with `.transform()` to cast back to the enum type:

```typescript
roleId: vine
  .number()
  .in(Object.values(Role))
  .transform((value) => value as RoleId),
```

#### Transformer usage

Use `RoleText` to convert IDs to display strings for the frontend:

```typescript
roleName: RoleText[this.resource.roleId],
```

---

### Pattern B: String union type

For columns stored as `enum()` or `text()` in the DB (statuses, types...). No dedicated table.

```typescript
// app/<domain>/enums/<name>.ts
export const CartStatus = {
  Active: 'active',
  Locked: 'locked',
} as const

export type CartStatus = (typeof CartStatus)[keyof typeof CartStatus] // 'active' | 'locked'
```

Or, for simple cases where you don't need the const object for value access:

```typescript
const values = ['Active', 'Trialing', 'PastDue', 'Canceled'] as const
export type SubscriptionStatus = (typeof values)[number]
```

#### Migration

Two strategies depending on whether the DB should enforce the constraint:

```typescript
// Hard constraint — use when values are stable
table.enum('status', ['active', 'locked']).defaultTo('active').notNullable()

// Soft constraint — use when values might grow without a migration
table.text('status').defaultTo('Active').notNullable()
```

#### Schema rules

```typescript
// database/schema_rules.ts
tables: {
  carts: {
    columns: {
      status: {
        tsType: 'CartStatus',
        imports: [{ source: '#app/<domain>/enums/cart_status', typeImports: ['CartStatus'] }],
      },
    },
  },
}
```

#### Validation

```typescript
status: vine.enum(['active', 'locked'] as const),
```

Or with the const object:

```typescript
status: vine.enum(Object.values(CartStatus)),
```

#### No seeder needed

String enums have no lookup table — values are inline in the code.

---

### Pattern C: Key-value map

For enums where the **key** is stored in the DB and the **value** is a human-readable label (subjects, categories with display names...).

```typescript
// app/<domain>/enums/<name>.ts
export const ticketSubjects = {
  report_bug: 'Report a bug',
  feature_request: 'Feature request',
  other: 'Other',
} as const

export type TicketSubjectKey = keyof typeof ticketSubjects // 'report_bug' | 'feature_request' | 'other'

// Tuple cast required for vine.enum() (needs at least one value)
export const ticketSubjectKeys = Object.keys(ticketSubjects) as [
  TicketSubjectKey,
  ...TicketSubjectKey[],
]
```

#### Validation

Use the exported keys array:

```typescript
subject: vine.enum(ticketSubjectKeys),
```

The array **must** be cast to `[T, ...T[]]` tuple type — `vine.enum()` requires a non-empty array.

#### Transformer usage

Look up the label from the key:

```typescript
subjectLabel: ticketSubjects[this.resource.subject as TicketSubjectKey],
```

---

## Usage across layers

### Actions

```typescript
// Comparisons
if (member.roleId !== Role.Owner) throw new ForbiddenException()

// Creating records
await Cart.create({ status: CartStatus.Active, ... })

// Query filters
query.where('status', CartStatus.Active)
query.whereIn('status', ['Active', 'Trialing'])
```

### Frontend

The frontend **never imports backend enum files**. Instead:

1. **Transformers** convert enum values to display strings (via `RoleText`, `ticketSubjects`, or direct passthrough)
2. **Frontend components** compare the transformed string values directly
3. If the frontend needs the enum type, re-declare it in `inertia/types.ts`:

```typescript
export type TicketStatus = 'Open' | 'Resolved' | 'Closed'
```

## Rules

- Never use `enum` keyword — always `as const` + union types
- Enum files go in `app/<domain>/<feature>/enums/` (or `app/<domain>/enums/`)
- Always add `schema_rules.ts` overrides so the auto-generated schema uses the enum type
- Only ID-based enums (Pattern A) have seeders and lookup tables
- Seeders use `updateOrCreateMany` for idempotency, prefixed with a number for ordering
- `table.enum()` for stable values with DB constraint, `table.text()` for values that may evolve
- VineJS `vine.enum()` requires a non-empty array — cast `Object.keys()` to tuple `[T, ...T[]]`
- Frontend never imports backend enums — transformers bridge the gap
