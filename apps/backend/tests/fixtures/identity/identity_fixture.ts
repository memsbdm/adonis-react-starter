import { UserFixture } from '../user_fixture.ts'
import { UserFactory } from '#tests/factories/user_factory'

export class IdentityFixture extends UserFixture {
  async givenAUserExists() {
    return UserFactory.create()
  }

  async givenAUserExistsWithEmail(email: string) {
    return UserFactory.merge({ email }).create()
  }
}
