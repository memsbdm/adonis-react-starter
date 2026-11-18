---
name: test-pattern
description: How to write tests using the fixture-based testing pattern in this AdonisJS project. Use when writing, reviewing, or debugging tests.
user-invocable: false
---

# Test Pattern

Tests use Japa v5 with a **fixture-based** approach (Given/When/Then). Fixtures encapsulate setup, actions, and assertions, keeping spec files readable and declarative.

## Directory structure

```
tests/
  _mocks/              # Fake implementations (e.g. FakeTimeService)
  fixtures/            # Fixture classes (BaseFixture + domain fixtures)
  functional/          # Functional tests (need HTTP server + DB)
  unit/                # Unit tests (no server needed)
  bootstrap.ts         # Japa plugins and suite config
database/
  factories/           # Lucid model factories
```

## Factories

Factories live in `database/factories/` and use `@adonisjs/lucid/factories`:

```typescript
// database/factories/<model>_factory.ts
import Factory from '@adonisjs/lucid/factories'

import MyModel from '#app/<domain>/<feature>/models/<model>'

export const MyModelFactory = Factory.define(MyModel, ({ faker }) => {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }
}).build()
```

Use `.merge()` to override specific fields, `.create()` to persist, `.make()` to build without persisting:

```typescript
await MyModelFactory.merge({ email: 'specific@test.com' }).create()
```

## Fixtures

### BaseFixture

`tests/fixtures/base_fixture.ts` provides shared functionality for all test fixtures:

- **`static truncate()`** -- returns `testUtils.db().wrapInGlobalTransaction()` for DB rollback after each test
- **`get assert`** -- accesses Japa's assert API from the active test context
- **`givenIAmAuthenticated()`** -- creates a user and sets `currentUser`
- **`givenTheCurrentTimeIs(date)`** -- swaps `TimeService` with `FakeTimeService` via `app.container.swap()`
- **`whenTimeAdvancesTo(date)`** -- updates the fake time
- **`now()`** -- returns fake time if set, otherwise real time

### Domain fixtures

Each domain has its own fixture extending `BaseFixture`. Domain fixtures hold domain-specific context, setup methods (Given), action methods (When), and assertion methods (Then):

```typescript
// tests/fixtures/<domain>_fixture.ts
import app from '@adonisjs/core/services/app'

import { BaseFixture } from '#tests/fixtures/base_fixture'
import { MyModelFactory } from '#database/factories/<model>_factory'
import { MyAction } from '#app/<domain>/<feature>/actions/my_action'

export class MyDomainFixture extends BaseFixture {
  private context: {
    model: MyModel | undefined
  } = {
    model: undefined,
  }

  // Getters (throw if not set)
  get model() {
    if (!this.context.model) {
      throw new Error('Model not set. Call givenThereIsAModel() first.')
    }
    return this.context.model
  }

  // Given -- setup preconditions
  async givenThereIsAModel(params?: { name?: string }) {
    this.context.model = await MyModelFactory.merge({ ...params }).create()
    return this.context.model
  }

  // When -- execute actions via the IoC container
  async whenIDoSomething() {
    const action = await app.container.make(MyAction)
    return action.execute({/* params */})
  }

  // Then -- domain-specific assertions (optional, use fixture.assert for simple cases)
}
```

Key patterns:

- Use `app.container.make(Action)` to resolve actions through the IoC container (respects `container.swap()` for mocks)
- Store state in a private `context` object
- Getters throw descriptive errors if preconditions aren't met
- `Given` methods set up state, `When` methods execute actions, `Then` methods assert outcomes

## Spec files

Spec files live in `tests/functional/<domain>.spec.ts` (or `tests/unit/`). They use the fixture for all setup and actions:

```typescript
// tests/functional/<domain>.spec.ts
import { test } from '@japa/runner'

import { MyDomainFixture } from '#tests/fixtures/<domain>_fixture'

test.group('Domain / Feature', group => {
  let fixture: MyDomainFixture

  group.each.setup(() => {
    fixture = new MyDomainFixture()
    return MyDomainFixture.truncate()
  })

  test('should do something when conditions are met', async () => {
    // Given
    await fixture.givenThereIsAModel({ name: 'test' })

    // When
    const result = await fixture.whenIDoSomething()

    // Then
    fixture.assert.equal(result.name, 'test')
  })

  test('should fail when conditions are not met', async () => {
    // Given
    await fixture.givenThereIsAModel()

    // When / Then
    await fixture.assert.rejects(() => fixture.whenIDoSomethingInvalid(), SomeError)
  })
})
```

### Setup pattern

Every `group.each.setup()` must:

1. Create a **new fixture instance** (fresh state for each test)
2. **Return** `Fixture.truncate()` (wraps each test in a DB transaction that rolls back)

```typescript
group.each.setup(() => {
  fixture = new MyDomainFixture()
  return MyDomainFixture.truncate()
})
```

## Mocking services

Use `app.container.swap()` to replace a service with a fake. `BaseFixture` already provides time mocking; follow the same pattern for other services:

```typescript
// tests/_mocks/fake_my_service.ts
import { MyService } from '#app/shared/services/my_service'

export class FakeMyService extends MyService {
  // Override methods with controlled behavior
}
```

Then in the fixture:

```typescript
givenMyServiceReturns(value: string) {
  const fake = new FakeMyService(value)
  app.container.swap(MyService, () => fake)
}
```

## Running tests

```bash
pnpm test                           # Run all tests
node ace test functional            # Run functional suite only
node ace test --files "identity"    # Run tests matching filename
```

## Rules

- One spec file per domain: `tests/functional/<domain>.spec.ts`
- All DB setup goes through fixtures and factories -- never create records manually in spec files
- Always use `group.each.setup()` with a new fixture + `truncate()` return
- Use Given/When/Then naming: `givenThereIsA...`, `whenIDo...`, `thenThe...`
- Resolve actions via `app.container.make(Action)` in fixtures, not by direct instantiation
- Mock services via `app.container.swap()` -- never monkey-patch
- Getters on fixtures must throw descriptive errors if the required `given` wasn't called
- Import paths use `#tests/...` for test files, `#database/...` for factories

## Reference

See `tests/functional/identity.spec.ts`, `tests/fixtures/identity_fixture.ts`, and `tests/fixtures/base_fixture.ts` for working examples.
