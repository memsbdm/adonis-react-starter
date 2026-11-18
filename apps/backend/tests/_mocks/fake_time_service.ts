import { TimeServiceContract } from '#app/shared/contracts/time_service_contract'
import type { DateTime } from 'luxon'

export class FakeTimeService extends TimeServiceContract {
  #fakeNow: DateTime

  constructor(fakeNow: DateTime) {
    super()
    this.#fakeNow = fakeNow
  }

  now() {
    return this.#fakeNow
  }

  update(time: DateTime) {
    this.#fakeNow = time
  }
}
