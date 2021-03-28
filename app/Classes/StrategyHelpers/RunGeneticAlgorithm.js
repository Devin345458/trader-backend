import moment from "moment"
import GeneticAlgorithm from '@/Classes/StrategyHelpers/GeneticAlgorithm'
import {createAndInitializeClass, getClass} from '@/Classes/StrategyHelpers/IndicatorFinder'
import EventEmitter from "events";

const Redis = use('Redis')
/** @type {typeof import('@/Classes/StrategyHelpers/GetPriceHistory')} */
const GetPriceHistory = use('App/Classes/StrategyHelpers/GetPriceHistory')

class RunGeneticAlgorithm extends EventEmitter{
  strategy
  initialBalance
  numberOfDays
  iterations
  populationSize
  candles

  constructor (strategy, initialBalance, numberOfDays, iterations, populationSize) {
    super()
    this.setOptions(...arguments)
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
   * @return {Promise<void>}
   */
  async run () {
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
      const results = {
        profit_loss: ga.bestScore(),
        time_taken: moment().diff(startTime, 'seconds'),
        options: ga.best(),
        iteration: loop
      }
      this.emit('indicator', results)
    }
  }

  async getCandles () {
    let candles = JSON.parse(await Redis.get('strategy_' + this.strategy.coin + '_candles_' + this.numberOfDays))
    if (candles) {
      this.candles = candles
      return
    }
    candles = await GetPriceHistory(this.numberOfDays, this.strategy.coin, this.strategy.profile)
    await Redis.set('strategy_' + this.strategy.coin + '_candles_' + this.numberOfDays, JSON.stringify(candles))
    this.candles = candles
  }

  async _fitnessFunction (options) {
    try {
      const clonedStrategy = JSON.parse(JSON.stringify(this.strategy))
      clonedStrategy.options = options
      const tradingStrategy = await createAndInitializeClass(clonedStrategy, true)
      await tradingStrategy.setSim(this.initialBalance)

      const candles = this.candles
      for (let i = 0; i < candles.length; i = i + tradingStrategy.strategy.options.interval) {
        await tradingStrategy.analyze({
          coin: this.strategy.coin,
          close: candles[i].close,
          time: candles[i].time,
          volume: candles[i].volume
        })
      }

      return tradingStrategy.orders.filter(a => a.profitLoss).reduce((total, a) => total + a.profitLoss, 0)
    } catch (e) {
      console.log('Genetic Model Error', e)
    }
  }
}

export default RunGeneticAlgorithm
