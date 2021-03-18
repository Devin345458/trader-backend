import Ticker from '@/Classes/Ticker'
import { createAndInitializeClass } from '@/Classes/StrategyHelpers/IndicatorFinder'

/** @type {typeof Strategy} */
const Strategy = use('App/Models/Strategy')
/** @type {typeof TradeTicker} **/
const TradeTicker = use('App/Models/TradeTicker')
/** @type {typeof Logger} **/
const Logger = use('Logger')

class TradeManagerConstructor {
  runningBots = {}
  /** @type {TradeManagerConstructor} **/
  static initialized

  /**
   *
   * @return {Promise<TradeManagerConstructor>}
   */
  static async initialize () {
    if (!this.initialized) {
      this.initialized = new this();
      await this.initialized.loadStrategies()
    }
    return this.initialized
  }

  handleChange(strategy) {
    if (!strategy.enabled) {
      this.removeStrategy(strategy.id)
    } else {
      this.addStrategy(strategy)
    }
  }

  async addStrategy (strategy) {
    try {
      Logger.info('Launching Strategy ' + strategy.name)

      let instance;
      try {
        instance = await createAndInitializeClass(strategy.toObject())
      } catch (e) {
        strategy.error = e.message
        strategy.enabled = false
        await strategy.save()
        console.log(`Strategy id: ${strategy.id} Error: ${e.message}`)
        return
      }

      Ticker.addSubscription(strategy.coin)

      if (this.runningBots[strategy.id]) {
        clearInterval(this.runningBots[strategy.id].timeout)
      }

      this.runningBots[strategy.id] = {
        class: instance,
        timeout: setInterval(async () => {
          const tick = await TradeTicker.createFromTickerInterval(strategy.options.interval, strategy.id)
          instance.que.push(tick)
        }, strategy.options.interval * 60000)
      }


      instance.que.error(async e => {
        instance.strategy.error = e.message
        instance.strategy.enabled = false
        await instance.strategy.save()
        console.log(`Strategy id: ${strategy.id} Error: ${e.message}`)
      })
    } catch (e) {
      Logger.error(e.message)
      return
    }

    Logger.info('Successfully updated/added strategy id:' + strategy.id)
  }

  removeStrategy (id) {
    if (this.runningBots[id]) {
      clearInterval(this.runningBots[id].timeout)
    }
    delete this.runningBots[id]
    Logger.info('Successfully removed/stopped strategy id:' + id)
  }

  async loadStrategies () {
    let strategies = await Strategy.query().where({enabled: true}).with('profile').fetch()
    Logger.info(`Found ${strategies.rows.length} active strategies`)
    strategies.rows.forEach((strategy) => {
      this.addStrategy(strategy.toObject())
    })
  }
}

export default TradeManagerConstructor
module.exports = TradeManagerConstructor
