import { Test } from '@japa/runner/core'
import { FakeTimeService } from '#tests/_mocks/fake_time_service'
import testUtils from '@adonisjs/core/services/test_utils'
import { getActiveTest } from '@japa/runner'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import { TimeServiceContract } from '#app/shared/contracts/time_service_contract'

export class BaseFixture {
  protected test: Test<any> | undefined

  protected baseContext: {
    fakeTimeService: FakeTimeService | undefined
  } = {
    fakeTimeService: undefined,
  }

  // Helpers
  static isolateDatabase() {
    return testUtils.db().wrapInGlobalTransaction()
  }

  protected registerCleanup(callback: () => void | Promise<void>) {
    this.getActiveTest().cleanup(callback)
  }

  getActiveTest() {
    if (this.test) {
      return this.test
    }

    this.test = getActiveTest()

    if (!this.test) {
      throw new Error('Cannot access test context outside of a test.')
    }

    return this.test
  }

  get assert() {
    return this.getActiveTest().context.assert
  }

  // Mock time
  get fakeTimeService() {
    if (!this.baseContext.fakeTimeService) {
      throw new Error('Fake time service not set. Call givenTheCurrentTimeIs() first.')
    }
    return this.baseContext.fakeTimeService
  }

  now() {
    if (this.baseContext.fakeTimeService) {
      return this.baseContext.fakeTimeService.now()
    }
    return DateTime.now()
  }

  givenTheCurrentTimeIs(date: DateTime | string) {
    const dateTime = typeof date === 'string' ? DateTime.fromISO(date) : date
    this.baseContext.fakeTimeService = new FakeTimeService(dateTime)
    app.container.swap(TimeServiceContract, () => this.baseContext.fakeTimeService!)

    this.registerCleanup(() => {
      app.container.restore(TimeServiceContract)
      this.baseContext.fakeTimeService = undefined
    })
  }

  whenTimeAdvancesTo(date: DateTime | string) {
    const dateTime = typeof date === 'string' ? DateTime.fromISO(date) : date
    this.fakeTimeService.update(dateTime)
  }
}
