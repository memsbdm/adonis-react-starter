import { test } from '@japa/runner'
import { RegisterFixture } from '#tests/fixtures/identity/register_fixture'

test.group('Identity / Register', group => {
  let fixture: RegisterFixture

  group.each.setup(() => {
    fixture = new RegisterFixture()
    return RegisterFixture.isolateDatabase()
  })

  test('rejects registration when the email is already used', async () => {
    const email = 'conflict@example.com'
    await fixture.givenAUserExistsWithEmail(email)

    const res = await fixture.whenIRegisterWithEmail(email)

    fixture.thenTheEmailAlreadyInUseShouldBeReturned(res)
  })
})
