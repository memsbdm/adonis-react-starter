import User from '#app/identity/models/user'
import Factory from '@adonisjs/lucid/factories'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    fullName: faker.person.fullName(),
    email: faker.internet.email({ provider: 'example.com' }).toLowerCase(),
    password: 'secret123',
  }
}).build()
