---
name: model-pattern
description: How to create Lucid ORM models with auto-generated schemas and transformers in this AdonisJS project. Use when creating database tables, models, or transformers.
user-invocable: false
---

# Model Pattern

Models use Lucid ORM with auto-generated schema base classes. They live in `app/<domain>/<feature>/models/`.

## Workflow

### 1. Create a migration

By default, use `table.uuid('id').primary()` for primary keys (UUIDv7). For simple tables where UUID is overkill (join tables, counters, etc.), use `table.increments('id')`.

```typescript
// database/migrations/<timestamp>_create_<table>_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = '<table_name>'

  async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary().notNullable()
      // columns here
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### 2. Run migration to generate schema

```bash
node ace migration:run
```

This auto-generates `database/schema.ts` with a `<Model>Schema` base class containing typed `@column()` decorators.

### 3. Create the model

Models with UUID primary keys must use the `WithPrimaryUuid` mixin to auto-generate UUIDv7:

```typescript
// app/<domain>/<feature>/models/<name>.ts (UUID PK -- default)
import { compose } from '@adonisjs/core/helpers'

import { <Name>Schema } from '#database/schema'
import { WithPrimaryUuid } from '#app/shared/mixins/with_primary_uuid'

export default class <Name> extends compose(<Name>Schema, WithPrimaryUuid) {}
```

For models with a numeric auto-increment PK, skip `WithPrimaryUuid` and extend the schema directly:

```typescript
// app/<domain>/<feature>/models/<name>.ts (number PK)
import { <Name>Schema } from '#database/schema'

export default class <Name> extends <Name>Schema {}
```

Use `compose()` to add additional mixins:

```typescript
import { compose } from '@adonisjs/core/helpers'

import { <Name>Schema } from '#database/schema'
import { WithPrimaryUuid } from '#app/shared/mixins/with_primary_uuid'

export default class <Name> extends compose(<Name>Schema, WithPrimaryUuid, SomeMixin) {}
```

### 4. Create a transformer

```typescript
// app/<domain>/<feature>/transformers/<name>_transformer.ts
import { BaseTransformer } from '@adonisjs/core/transformers'
import type <Name> from '#app/<domain>/<feature>/models/<name>'

export default class <Name>Transformer extends BaseTransformer<<Name>> {
  toObject() {
    return this.pick(this.resource, ['id', 'name', 'createdAt', 'updatedAt'])
  }
}
```

## Rules

- Always create the migration first, then run it to generate the schema
- Never edit `database/schema.ts` manually -- it is auto-generated
- Models extend the generated schema class, not `BaseModel` directly
- Default to UUID PKs: `table.uuid('id').primary()` + `WithPrimaryUuid` mixin
- For tables where UUID is unnecessary, use `table.increments('id')`
- Use `compose()` when mixing in behaviors (auth, soft deletes, etc.)
- Column names in migrations use `snake_case`, model properties use `camelCase` (automatic conversion)
- Schema rules (`database/schema_rules.ts`) control type mappings for generated schemas -- edit this file to add custom type mappings for columns or database types
- For enum-typed columns, see the **enum-pattern** skill for `schema_rules.ts` overrides, enum file structure, seeders, and validation
- Transformers use `this.pick()` to select which fields to expose -- never expose `password` or sensitive fields

## Reference

See `app/identity/user_management/models/user.ts` and `app/identity/user_management/transformers/user_transformer.ts` for working examples.
