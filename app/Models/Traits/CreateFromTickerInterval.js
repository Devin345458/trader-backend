'use strict'

import moment from "moment";
const Ticker = use('App/Models/Ticker')

class CreateFromTickerInterval {
  register (Model, customOptions = {}) {
    const defaultOptions = {}
    const options = Object.assign(defaultOptions, customOptions)

    Model.createFromTickerInterval = async function (minutes, strategyId) {
      const unix = moment().subtract(minutes, 'minutes').unix()
      /** @var {array} ticks **/
      let ticks = await Ticker.query().where('time', '>=', unix).fetch()
      ticks = ticks.toJSON()
      const tradeTick = {
        strategy_id: strategyId,
        close: 0,
        low: undefined,
        high: 0,
        time: moment().unix(),
        volume: 0
      }
      ticks.forEach((tick) => {
        if (!tradeTick.low) {
          tradeTick.low = tick.close
        }
        if (tick.close < tradeTick.low) {
          tradeTick.low = tick.close
        }
        if (tick.close > tradeTick.high) {
          tradeTick.high = tick.close
        }
        tradeTick.close = tick.close
        tradeTick.volume += tick.volume
      })

      return Model.create(tradeTick)
    }
  }
}

module.exports = CreateFromTickerInterval
