import { BaseCommand } from '@adonisjs/core/ace'
import User from '#app/identity/models/user'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import vine from '@vinejs/vine'
import { email, password } from '#app/identity/validators/identity_validator'

export default class CreateUser extends BaseCommand {
  static commandName = 'create:user'
  static description = 'Create a user'

  static options: CommandOptions = {
    startApp: true,
  }

  static validator = vine.create({
    fullName: vine.string().trim().minLength(1).maxLength(50),
    email: email(),
    password: password(),
  })

  async run() {
    const fullName = await this.prompt.ask('Full name', {
      hint: 'John Doe',
    })

    const email = await this.prompt.ask('Email', {
      hint: 'jdoe@example.com',
    })

    const password = await this.prompt.secure('Password')

    await CreateUser.validator.validate({ fullName, email, password })

    await User.create({
      fullName,
      email,
      password,
    })
  }
}
