'use strict'

const Redis = use('Redis')
import run from "@/Classes/StrategyHelpers/PerfectTrading"
import {createAndInitializeClass} from '@/Classes/StrategyHelpers/IndicatorFinder'
import GetPriceHistory from '@/Classes/StrategyHelpers/GetPriceHistory'
import RunGeneticAlgorithm from "@/Classes/StrategyHelpers/RunGeneticAlgorithm"

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
      this._setTradeListeners()

      let tmpIndicators = []
      this.TradingStrategy.on('indicators', ({name, indicator, time}) => {
        tmpIndicators.push({
          name,
          indicator,
          time
        })
        if (tmpIndicators.length === 100) {
          this.socket.emit('message', {
            type: 'indicator',
            data: tmpIndicators
          })
          tmpIndicators = []
        }
      })

      let tmpCandles = [];
      for (let i = 0; i < candles.length; i = i + this.TradingStrategy.strategy.options.interval) {
        tmpCandles.push(candles[i])
        if (tmpCandles.length >= candles.length / 30) {
          await this.socket.emit('message', {
            type: 'ticks',
            data: tmpCandles
          })
          tmpCandles = []
        }
        await this.TradingStrategy.analyze({
          coin: strategy.coin,
          close: candles[i].close,
          time: candles[i].time,
          volume: candles[i].volume
        })
      }

      // Catch any not emitted candles
      if (tmpCandles.length) {
        await this.socket.emit('message', {
          type: 'ticks',
          data: tmpCandles
        })
      }

      if (tmpIndicators.length === 100) {
        this.socket.emit('message', {
          type: 'indicator',
          data: tmpIndicators
        })
        tmpIndicators = []
      }

      // Once done sell any remaining position
      if (this.TradingStrategy.positionInfo.positionExists) {
        await this.TradingStrategy.sellPosition(candles[candles.length - 1].close, candles[candles.length - 1])
      }
      this._calculateBestPNL(candles, initialBalance)
    } catch (e) {
      this.socket.emit("error", {message: e.message})
    }
  }

  async onRunGenetic({initialBalance, numberOfDays, iterations, populationSize, strategy}) {
    try {
      if (!iterations) {
        iterations = 10
      }
      if (!populationSize) {
        populationSize = 10
      }
      let oldStategy = await Strategy.query().where('id', strategy.id).with('profile').firstOrFail()
      oldStategy.merge(strategy)
      const Algo = new RunGeneticAlgorithm(oldStategy.toObject(), initialBalance, numberOfDays, iterations, populationSize)
      await Algo.run(this.socket)
      const candles = await Algo.candles
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

  _setTradeListeners() {
    this.TradingStrategy.on('order', ({order, positionInfo}) => {
      if (order.side === 'sell') {
        order.profitLoss = order.price * order.size - positionInfo.positionAcquiredCost
      }
      this.socket.emit('message', {
        type: 'order',
        data: order
      })
    })
  }

  _calculateBestPNL(candles, initialBalance) {
    const bestPNL = run(candles, initialBalance)
    this.socket.emit('message', {
      type: 'best',
      data: bestPNL.toFixed(2)
    })
  }
}

module.exports = StrategyController
