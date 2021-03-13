'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
/** @type {typeof import('@adonisjs/framework/src/Logger')} */
const Logger = use('Logger')

class Trade extends Model {

  async addTrade (strategyId, side, currency, quantity, profitLoss = null) {
    try {
      await Trade.create({
        currency,
        side,
        quantity,
        strategy_id: strategyId,
        profitLoss
      })
    } catch (e) {
      Logger.error(e)
    }
  }
}

module.exports = Trade
