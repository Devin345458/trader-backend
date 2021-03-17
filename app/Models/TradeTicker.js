'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Ws = use('Ws')
const Ticker = use('App/Models/Ticker')

/**
 * @property {function} createFromTickerInterval
 */
class TradeTicker extends Model {
  static boot() {
    super.boot()
    this.addTrait('CreateFromTickerInterval')

    this.addHook('afterCreate', async (trade_ticker) => {
      const topic = Ws.getChannel('bot-socket:*').topic('bot-socket:' + trade_ticker.strategy_id)
      if(topic){
        topic.broadcast('trade-ticker', trade_ticker)
      }
    })
  }
}

module.exports = TradeTicker
