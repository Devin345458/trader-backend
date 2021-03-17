'use strict'

import moment from "moment";

class CreateFromTicker {
  register (Model, customOptions = {}) {
    const defaultOptions = {}
    const options = Object.assign(defaultOptions, customOptions)

    Model.createFromTicker = function (data) {
      const tick = {}
      tick.coin = data.product_id
      tick.low = data.best_bid
      tick.high = data.best_ask
      tick.close = data.price
      tick.volume = data.last_size
      tick.time = moment(data.time).format('X')
      Model.create(tick).then().catch()
    }
  }
}

module.exports = CreateFromTicker
