import User from '#identity/models/user'
import { Result } from '@julr/tenace'
import { InvalidCredentials } from '#identity/exceptions/invalid_credentials_exception'
import hash from '@adonisjs/core/services/hash'

interface Params {
  email: string
  password: string
}

export class Login {
  async handle({ email, password }: Params) {
    const user = await User.findBy('email', email)

    if (!user) {
      await hash.make('invalid-password')
      return Result.err(new InvalidCredentials())
    }

    const passwordIsValid = await hash.verify(user.password, password)

    if (!passwordIsValid) {
      return Result.err(new InvalidCredentials())
    }

    return Result.ok(user)
  }
}
