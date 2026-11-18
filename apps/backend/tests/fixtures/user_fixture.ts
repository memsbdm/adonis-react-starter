import { UserFactory } from '#tests/factories/user_factory'
import type User from '#app/identity/models/user'
import { BaseFixture } from './base_fixture.ts'

export class UserFixture extends BaseFixture {
  private context: {
    user: User | undefined
  } = {
    user: undefined,
  }

  get currentUser() {
    if (!this.context.user) {
      throw new Error('Current user is not defined. Call a user setup method before accessing it.')
    }

    return this.context.user
  }

  async givenIAmAUser(overrides: { password?: string } = {}) {
    const user = await UserFactory.merge(overrides).create()
    this.context.user = user
  }
}
