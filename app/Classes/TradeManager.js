const socketIOClient = require('socket.io-client')
const sailsIOClient = require('sails.io.js')
const Ticker = require('./ticker')
const { createAndInitializeClass } = require('./strategies/indicatorFinder')

class TradeManager {
  runningBots = {}

  ticker

  constructor () {
    Ticker.initialize()
  }

  async initialize () {
    await this.loadStrategies()
    const io = sailsIOClient(socketIOClient)
    io.sails.url = process.env.SITE_URL
    io.socket.on('strategy', ({ id, verb, data: strategy }) => {
      sails.log.info('detected change in strategy')
      if (verb === 'delete' || strategy.enabled === false) {
        this.removeStrategy(id)
      } else {
        this.addStrategy(strategy)
      }
    })
    io.socket.get('/api/v1/strategy/subscribe')
  }

  async addStrategy (strategy) {
    try {
      sails.log.info('Launching Strategy ' + strategy.name)
      const instance = await createAndInitializeClass(strategy)
      Ticker.addSubscription(strategy.coin)

      this.runningBots[strategy.id] = {
        class: instance,
        timeout: setInterval(async () => {
          const tick = await TradeTicker.createFromTickerInterval(strategy.interval, strategy.id)
          instance.que.push(tick)
        }, strategy.interval * 60000)
      }
    } catch (e) {
      sails.log.error(e.message)
      return
    }

    sails.log.info('Successfully updated/added strategy id:' + strategy.id)
  }

  removeStrategy (id) {
    delete this.runningBots[id]
    sails.log.info('Successfully removed/stopped strategy id:' + id)
  }

  async loadStrategies () {
    /** @type {Array} */
    const strategies = await sails.models.strategy.find({
      enabled: true
    }).populate('user').decrypt()
    sails.log.info(`Found ${strategies.length} active strategies`)
    strategies.forEach((strategy) => {
      this.addStrategy(strategy)
    })
  }
}

module.exports = TradeManager
