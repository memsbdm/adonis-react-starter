import type { BaseModel } from '@adonisjs/lucid/orm'
import { beforeCreate } from '@adonisjs/lucid/orm'
import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import { randomUUIDv7 } from 'node:crypto'

export const WithPrimaryUuid = <Model extends NormalizeConstructor<typeof BaseModel>>(
  superclass: Model,
) => {
  class WithPrimaryUuidClass extends superclass {
    static override selfAssignPrimaryKey = true

    @beforeCreate()
    static generateId(model: { id?: string }) {
      model.id ??= randomUUIDv7()
    }
  }

  return WithPrimaryUuidClass
}
