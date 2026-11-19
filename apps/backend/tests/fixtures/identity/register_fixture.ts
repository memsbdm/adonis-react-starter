import { Register } from '#app/identity/actions/register_action'
import { make } from '#app/core/utils/index'
import { withTransaction } from '#app/core/utils/transaction'
import { IdentityFixture } from './identity_fixture.ts'
import User from '#app/identity/models/user'
import { EmailAlreadyInUse } from '#app/identity/exceptions/email_already_in_use_exception'

interface RegisterParams {
  fullName: string
  email: string
  password: string
}

export class RegisterFixture extends IdentityFixture {
  #registeredUser: User | undefined

  async whenIRegister() {
    return this.#register()
  }

  async whenIRegisterWithEmail(email: string) {
    return this.#register({ email })
  }

  async whenIRegisterWithPassword(password: string) {
    return this.#register({ password })
  }

  async whenIRegisterWithFullName(fullName: string) {
    return this.#register({ fullName })
  }

  async whenIChangeMyEmailTo(email: string) {
    this.currentUser.email = email
    await this.currentUser.save()
  }

  async thenThePendingIdentityShouldBeReplaced(previousUser: User) {
    const persistedPreviousUser = await User.find(previousUser.id)

    this.assert.isNull(persistedPreviousUser)
    this.assert.notEqual(this.#registrationResult.id, previousUser.id)
    this.assert.equal(this.#registrationResult.email, previousUser.email)
  }

  thenTheEmailAlreadyInUseShouldBeReturned(payload: User | EmailAlreadyInUse) {
    this.assert.instanceOf(payload, EmailAlreadyInUse)
  }

  async #register(overrides: Partial<RegisterParams> = {}) {
    const register = await make(Register)
    const res = await withTransaction(() =>
      register.handle({
        fullName: 'John Doe',
        email: 'jdoe@example.com',
        password: 'secret123',
        ...overrides,
      }),
    )

    if (!res.ok) return res.error

    this.#registeredUser = res.value

    return this.#registeredUser
  }

  get #registrationResult() {
    if (!this.#registeredUser) {
      throw new Error('Registered user is not defined. Register before accessing it.')
    }

    return this.#registeredUser
  }
}
