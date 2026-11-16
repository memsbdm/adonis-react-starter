import db from '@adonisjs/lucid/services/db'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

class TransactionContext {
  #storage = new AsyncLocalStorage<TransactionClientContract>()

  run<T>(trx: TransactionClientContract, callback: () => Promise<T>): Promise<T> {
    return this.#storage.run(trx, callback)
  }

  get(): TransactionClientContract {
    const trx = this.#storage.getStore()

    if (!trx) {
      throw new Error('trx is undefined, did you forget to call withTransaction()?')
    }

    return trx
  }

  async dispatchAfterCommit(callback: () => Promise<void>) {
    const trx = this.#storage.getStore()

    if (trx) {
      trx.after('commit', callback)
    } else {
      await callback()
    }
  }

  dispatchAfterRollback(callback: () => Promise<void>) {
    const trx = this.get()
    trx.after('rollback', callback)
  }
}

const transactionContext = new TransactionContext()

function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return db.transaction(trx => {
    return transactionContext.run(trx, callback)
  })
}

/**
 * Dispatch an async callback after the current transaction commits.
 * If there is no active transaction, the callback is executed immediately.
 * @param callback
 */
async function dispatchAfterCommit(callback: () => Promise<void>) {
  await transactionContext.dispatchAfterCommit(callback)
}

function dispatchAfterRollback(callback: () => Promise<void>) {
  transactionContext.dispatchAfterRollback(callback)
}

export { transactionContext, withTransaction, dispatchAfterCommit, dispatchAfterRollback }
