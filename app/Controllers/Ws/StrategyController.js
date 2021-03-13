'use strict'

const Redis = use('Redis')
import run from "@/Classes/StrategyHelpers/PerfectTrading"
import { createAndInitializeClass } from '@/Classes/StrategyHelpers/IndicatorFinder'
import GetPriceHistory from '@/Classes/StrategyHelpers/GetPriceHistory'
import RunGeneticAlgorithm from "@/Classes/StrategyHelpers/RunGeneticAlgorithm"

class StrategyController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  async onRunSim({ initialBalance, numberOfDays, strategy }) {
    try {
      this.TradingStrategy = await this._setUpClass(strategy, initialBalance)
      const candles = await this._loadCandles(numberOfDays)
      this._setTradeListeners()

      let lastEmitted;
      for (let i = 0; i < candles.length; i = i + this.TradingStrategy.strategy.interval) {
        if (i % (10 * this.TradingStrategy.strategy.interval) === 0 && i !== 0) {
          const ticks = []
          for (let y = i - (10 * this.TradingStrategy.strategy.interval); y < i; y += this.TradingStrategy.strategy.interval) {
            ticks.push(candles[y])
            lastEmitted = y
          }
          await this.socket.emit('message', {
            type: 'ticks',
            data: ticks
          })
        }
        await this.TradingStrategy.analyze({
          coin: strategy.coin,
          close: candles[i].close,
          time: candles[i].time,
          volume: candles[i].volume
        })
      }

      // Catch any not emitted candles
      for (let i = lastEmitted; i < candles.length; i = i + this.TradingStrategy.strategy.interval) {
        await this.socket.emit('message', {
          type: 'ticks',
          data: [candles[i]]
        })
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
      if (!iterations) { iterations = 10 }
      if (!populationSize) { populationSize = 10 }

      const Algo = new RunGeneticAlgorithm(strategy, initialBalance, numberOfDays, iterations, populationSize)
      await Algo.run(this.socket)
    } catch (e) {
      this.socket.emit("error", {message: e.message})
    }
  }

  async _setUpClass (strategy, initialBalance) {
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
  async _loadCandles (numberOfDays) {
    let candles = JSON.parse(await Redis.get('strategy_' + this.TradingStrategy.strategy.coin + '_candles_' + numberOfDays))
    if (!candles) {
      candles = await GetPriceHistory(numberOfDays, this.TradingStrategy.strategy.coin, this.TradingStrategy.profile)
      await Redis.set('strategy_' + this.TradingStrategy.strategy.coin + '_candles_' + numberOfDays, JSON.stringify(candles))
    }
    return candles
  }

  _setTradeListeners () {
    this.TradingStrategy.on('order', ({ order, positionInfo }) => {
      if (order.side === 'sell') {
        order.profitLoss = order.price * order.size - positionInfo.positionAcquiredCost
      }
      this.socket.emit('message', {
        type: 'order',
        data: order
      })
    })

    this.TradingStrategy.on('indicators', ({ name, indicator, time }) => {
      this.socket.emit('message', {
        type: 'indicator',
        data: {
          name,
          indicator,
          time
        }
      })
    })
  }

  _calculateBestPNL (candles, initialBalance) {
    const bestPNL = run(candles, initialBalance)
    console.log('bestPNL', bestPNL)
    this.socket.emit('message', {
      type: 'best',
      data: bestPNL.toFixed(2)
    })
  }
}

module.exports = StrategyController
