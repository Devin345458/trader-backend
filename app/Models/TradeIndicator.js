'use strict'

import TradeManagerConstructor from "@/Classes/TradeManagerConstructor";
import _ from "lodash";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Logger = use('Logger')
const Ws = use('Ws')

class TradeIndicator extends Model {
  static boot () {
    super.boot()

    this.addHook('afterCreate', async (trade_indicator) => {
      const topic = Ws.getChannel('bot-socket:*').topic('bot-socket:' + trade_indicator.strategy_id)
      if(topic){
        topic.broadcast('trade-indicator', trade_indicator)
      }
    })
  }

  static addIndicator (strategyId, time, name, indicator) {
    this.create({
      strategy_id: strategyId,
      time,
      name,
      indicator
    })
      .then()
      .catch((e) => {
        Logger.error(e)
      })
  }
}

module.exports = TradeIndicator
