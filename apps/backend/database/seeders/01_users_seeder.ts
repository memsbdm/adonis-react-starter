import User from '#app/identity/models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'mbadem@example.com' },
      {
        fullName: 'Mehmet Badem',
        email: 'mbadem@example.com',
        password: 'secret123',
      },
    )
  }
}
