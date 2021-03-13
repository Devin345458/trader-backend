const moment = require('moment')

const GeneticAlgorithm = require('./GeneticAlgorithm')
const {createAndInitializeClass, getClass} = require('../../Classes/StrategyHelpers/IndicatorFinder');
/** @type {typeof import('@adonisjs/framework/src/Logger')} */
const Logger = use('Logger')
const Redis = use('Redis')
const GetPriceHistory = use('App/Classes/StrategyHelpers/GetPriceHistory')

class RunGeneticAlgorithm {
  strategy
  initialBalance
  numberOfDays
  iterations
  populationSize

  constructor (strategy, initialBalance, numberOfDays, iterations, populationSize) {
    this.setOptions(strategy, initialBalance, numberOfDays, iterations, populationSize)
  }

  setOptions (strategy, initialBalance, numberOfDays, iterations, populationSize) {
    this.strategy = strategy
    this.initialBalance = initialBalance
    this.numberOfDays = numberOfDays
    this.iterations = iterations
    this.populationSize = populationSize
  }

  /**
   * Run
   *
   * @param {Socket} socket
   * @return {Promise<void>}
   */
  async run (socket) {
    await this.getCandles()
    const tradingStrategy = await getClass(this.strategy.indicator)

    const ga = new GeneticAlgorithm({
      mutationFunction: tradingStrategy.mutation,
      crossoverFunction: tradingStrategy.crossover,
      fitnessFunction: this._fitnessFunction.bind(this),
      population: [this.strategy.options],
      populationSize: this.populationSize,
      strategy: this.strategy,
      numberOfDays: this.numberOfDays,
      initialBalance: this.initialBalance
    })
    for (let loop = 1; loop <= this.iterations; loop++) {
      const startTime = moment()
      await ga.evolve()
      Logger.info('Time Taken: ' + moment().diff(startTime))
      socket.emit('message', {
        iteration: loop,
        best_value: ga.bestScore(),
        best_options: ga.best()
      })
    }
  }

  async getCandles () {
    let candles = JSON.parse(await Redis.get('strategy_' + this.strategy.coin + '_candles_' + this.numberOfDays))
    if (candles) {
      return candles
    }
    candles = await GetPriceHistory(this.numberOfDays, this.strategy.coin, this.strategy.user)
    await Redis.set('strategy_' + this.strategy.coin + '_candles_' + this.numberOfDays, JSON.stringify(candles), 6000)
    return candles
  }

  async _fitnessFunction (options) {
    try {
      const clonedStrategy = JSON.parse(JSON.stringify(this.strategy))
      clonedStrategy.options = options
      const tradingStrategy = await createAndInitializeClass(clonedStrategy, true)
      await tradingStrategy.setSim(this.initialBalance, 0.0018)

      const candles = await this.getCandles()
      for (let i = 0; i < candles.length; i = i + tradingStrategy.strategy.interval) {
        await tradingStrategy.analyze({
          coin: this.strategy.coin,
          close: candles[i].close,
          time: candles[i].time,
          volume: candles[i].volume
        })
      }

      return tradingStrategy.orders.filter(a => a.profitLoss).reduce((total, a) => total + a.profitLoss, 0)
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = RunGeneticAlgorithm
