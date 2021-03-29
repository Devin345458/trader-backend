/** @type {import('../Trader')} **/
const Trader = use ('App/Classes/Trader')
/** @type {import('../StrategyHelpers/AnalysisTools.js')} **/
const AnalysisTools  = use ('App/Classes/StrategyHelpers/AnalysisTools')
const TradeIndicator = use ('App/Models/TradeIndicator')
import tulind from 'tulind'

class MovingAverage extends Trader {
  static options = [
    {
      property: 'period',
      label: 'Relative Strength Index Length',
      type: 'number',
      default: 3,
      required: true
    },
    {
      property: 'rsi_high',
      label: 'RSI score to buy',
      type: 'number',
      default: 0.7,
      required: true
    },
    {
      property: 'rsi_low',
      label: 'RSI score to sell',
      type: 'number',
      default: 0.3,
      required: true
    }
  ]

  prevMa

  async analyze (tick) {
    await super.analyze(tick)

    //Do a simple moving average on close prices with period of 3.
    const rsi = await AnalysisTools.rsi(this.tradeHistory, this.strategy.options.period)
    // const ma = AnalysisTools.ma(this.tradeHistory, this.strategy.options.period)

    // If we have don't have all our stats then
    if (!rsi) {
      return
    }

    this.emit('indicators', { time: tick.time, name: 'RSI', indicator: rsi, color: '#ffde5a' })
    if (!this.sim) {
      TradeIndicator.addIndicator(this.strategy.id, tick.time, 'RSI', rsi)
    }

    if (!this.positionInfo.positionExists && rsi < this.strategy.options.rsi_high) {
      await this.buyPosition(tick.close, tick)
    }

    if (this.positionInfo.positionExists && rsi < this.strategy.options.rsi_low) {
      await this.sellPosition(tick.close, tick)
    }
  }

  static mutation (options) {
    options = super.mutation(options)

    if (super.shouldChange()) {
      options.period += super.getRandomNumber(-8, 8)
      if (options.period <= 1) {
        options.period = 2
      }
    }

    if (super.shouldChange()) {
      options.rsi_high = Math.random()
      if (options.rsi_high <= 0) {
        options.rsi_high = 0.1
      }
    }

    if (super.shouldChange()) {
      options.rsi_low = Math.random()
      if (options.rsi_low <= 0) {
        options.rsi_low = 0.1
      }
    }

    return options
  }
}

module.exports = MovingAverage
