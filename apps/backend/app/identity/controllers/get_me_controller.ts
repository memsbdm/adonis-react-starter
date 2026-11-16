import { inject } from '@adonisjs/core'
import UserTransformer from '#identity/transformers/user_transformer'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class GetMeController {
  handle({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    return serialize.withoutWrapping(UserTransformer.transform(user))
  }
}
