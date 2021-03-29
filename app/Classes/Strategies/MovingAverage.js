/** @type {import('../Trader')} **/
const Trader = use ('App/Classes/Trader')
/** @type {import('../StrategyHelpers/AnalysisTools.js')} **/
const AnalysisTools  = use ('App/Classes/StrategyHelpers/AnalysisTools')
const TradeIndicator = use ('App/Models/TradeIndicator')

class MovingAverage extends Trader {
  static options = [
    {
      property: 'period',
      label: 'Moving Average Length',
      type: 'number',
      default: 10,
      required: true
    }
  ]

  prevMa

  async analyze (tick) {
    await super.analyze(tick)
    const ma = AnalysisTools.ma(this.tradeHistory, this.strategy.options.period)

    // If we have don't have all our stats then
    if (!ma || !this.prevMa) {
      this.prevMa = ma
      return
    }

    this.emit('indicators', { time: tick.time, name: 'MA', indicator: ma, color: '#ffde5a' })
    this.emit('indicators', { time: tick.time, name: 'PRV MA', indicator: this.prevMa, color: '#ffde5a' })
    if (!this.sim) {
      TradeIndicator.addIndicator(this.strategy.id, tick.time, 'MA', ma)
    }

    if (!this.positionInfo.positionExists && this.prevMa < ma) {
      await this.buyPosition(tick.close, tick)
    }

    if (this.positionInfo.positionExists && this.prevMa > ma) {
      await this.sellPosition(tick.close, tick)
    }

    this.prevMa = ma
  }

  static mutation (options) {
    options = super.mutation(options)

    if (super.shouldChange()) {
      options.period += super.getRandomNumber(-8, 8)
      if (options.period <= 1) {
        options.period = 2
      }
    }

    return options
  }
}

module.exports = MovingAverage
