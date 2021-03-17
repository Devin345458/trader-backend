'use strict'

/** @type {Model} */
const Model = use('Model')
/** @type {Logger} */
const Logger = use('Logger')
/** @type {Ws} */
const Ws = use('Ws')

class Trade extends Model {

  static boot() {
    super.boot()

    this.addHook('afterCreate', async (trade) => {
      const topic = Ws.getChannel('bot-socket:*').topic('bot-socket:' + trade.strategy_id)
      if(topic){
        topic.broadcast('trade', trade)
      }
    })
  }

  static async addTrade (strategyId, side, currency, quantity, profitLoss = null) {
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
