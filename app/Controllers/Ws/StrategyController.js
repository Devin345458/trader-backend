'use strict'

const Redis = use('Redis')
import run from "@/Classes/StrategyHelpers/PerfectTrading"
import {createAndInitializeClass} from '@/Classes/StrategyHelpers/IndicatorFinder'
import GetPriceHistory from '@/Classes/StrategyHelpers/GetPriceHistory'

const Strategy = use('App/Models/Strategy')

class StrategyController {
  constructor({socket, request}) {
    this.socket = socket
    this.request = request
  }

  async onRunSim({initialBalance, numberOfDays, strategy}) {
    try {
      let oldStategy = await Strategy.query().where('id', strategy.id).with('profile').firstOrFail()
      oldStategy.merge(strategy)
      this.TradingStrategy = await this._setUpClass(oldStategy.toObject(), initialBalance)
      const candles = await this._loadCandles(numberOfDays)


      this._registerPush('indicator','indicators', ({name, indicator, time}) => {
        return {name, indicator, time}
      }, candles / 30)

      this._registerPush('ticks', 'candle', data => {
        return {
          ...data,
          low: data.close,
          high: data.close,
        }
      }, candles / 30)

      this._registerPush('order', 'order', ({order, positionInfo}) => {
        if (order.side === 'sell') {
          order.profitLoss = order.price * order.size - positionInfo.positionAcquiredCost
        }
        return order
      })

      for (let i = 0; i < candles.length; i = i + this.TradingStrategy.strategy.options.interval) {
        await this.TradingStrategy.analyze({
          coin: strategy.coin,
          close: candles[i].close,
          time: candles[i].time,
          volume: candles[i].volume
        })
      }

      this._clearBuffer()

      // Once done sell any remaining position
      if (this.TradingStrategy.positionInfo.positionExists) {
        await this.TradingStrategy.sellPosition(candles[candles.length - 1].close, candles[candles.length - 1])
      }
      this._calculateBestPNL(candles, initialBalance)
    } catch (e) {
      this.socket.emit("error", {message: e.message})
    }
  }


  async _setUpClass(strategy, initialBalance) {
    /** @var {Trader} TradingStrategy **/
    const TradingStrategy = await createAndInitializeClass(strategy, true)
    await TradingStrategy.setSim(initialBalance)
    return TradingStrategy
  }

  /**
   *
   * @param numberOfDays
   * @return {Promise<Array>}
   */
  async _loadCandles(numberOfDays) {
    let candles = JSON.parse(await Redis.get('strategy_' + this.TradingStrategy.strategy.coin + '_candles_' + numberOfDays))
    if (!candles) {
      candles = await GetPriceHistory(numberOfDays, this.TradingStrategy.strategy.coin, this.TradingStrategy.profile)
      await Redis.set('strategy_' + this.TradingStrategy.strategy.coin + '_candles_' + numberOfDays, JSON.stringify(candles))
    }
    return candles
  }

  _calculateBestPNL(candles, initialBalance) {
    const bestPNL = run(candles, initialBalance)
    this.socket.emit('message', {
      type: 'best',
      data: bestPNL.toFixed(2)
    })
  }

  _registerPush(name, event, callback, length = 100) {
    this.buffer = {}
    this.TradingStrategy.on(event, (data) => {
      if (!this.buffer[name]) this.buffer[name] = []
      this.buffer[name].push(callback(data))
      if (this.buffer[name].length === length) {
        this.socket.emit('message', {
          type: name,
          data: this.buffer[name]
        })
        this.buffer[name] = []
      }
    })
  }

  _clearBuffer() {
    for (let key in this.buffer) {
      this.socket.emit('message', {
        type: key,
        data: this.buffer[key]
      })
    }
  }
}

module.exports = StrategyController
