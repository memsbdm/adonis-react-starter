import { DateTime } from 'luxon'
import { TimeServiceContract } from '../contracts/time_service_contract.ts'

export class TimeService implements TimeServiceContract {
  now(): DateTime {
    return DateTime.now()
  }
}
