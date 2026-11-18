import { test } from '@japa/runner'
import User from '#app/identity/models/user'
import { IdentityFixture } from '#tests/fixtures/identity/identity_fixture'

test.group('Identity HTTP / Register', group => {
  let fixture: IdentityFixture

  group.each.setup(async () => {
    fixture = new IdentityFixture()
    return IdentityFixture.isolateDatabase()
  })

  test('creates an authenticated session after registration', async ({ client }) => {
    const registration = await client.post('/register').json({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    })
    const me = await client.get('/me').withSession(registration.session())

    registration.assertStatus(201)
    registration.assertSession('auth_web')
    me.assertStatus(200)
    me.assertBody({
      id: me.body().id,
      createdAt: me.body().createdAt,
      updatedAt: me.body().updatedAt,
      fullName: 'John Doe',
      email: 'john@example.com',
    })
  })

  test('rejects an invalid registration payload without side effects', async ({ client }) => {
    const response = await client.post('/register').unsafeJson({
      fullName: 'John Doe',
      email: 'invalid-email',
      password: 'short',
      passwordConfirmation: 'different',
    })

    response.assertStatus(422)
    fixture.assert.isNull(await User.findBy('email', 'invalid-email'))
  })

  test('creates an authenticated session after login', async ({ client }) => {
    const user = await fixture.givenAUserExists()

    const login = await client.post('/login').json({ email: user.email, password: 'secret123' })
    const me = await client.get('/me').withSession(login.session())

    login.assertStatus(200)
    login.assertSession('auth_web', user.id)
    me.assertStatus(200)
  })

  test('rejects invalid login credentials', async ({ client }) => {
    const user = await fixture.givenAUserExists()

    const response = await client
      .post('/login')
      .json({ email: user.email, password: 'incorrect-password' })

    response.assertStatus(401)
    response.assertSessionMissing('auth_web')
  })
})
