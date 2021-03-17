/** @type {import('../Trader')} **/
const Trader = use ('App/Classes/Trader')
/** @type {import('../StrategyHelpers/AnalysisTools.js')} **/
const AnalysisTools  = use ('App/Classes/StrategyHelpers/AnalysisTools')
const TradeIndicator = use ('App/Models/TradeIndicator')

class CrossoverVwap extends Trader {
  static options = [
    {
      property: 'vWapLength',
      label: 'VWAP Length',
      type: 'number',
      default: 10,
      required: true
    },
    {
      property: 'vWapMax',
      label: 'Max VWAP Length ',
      type: 'number',
      default: 8000,
      required: true
    },
    {
      property: 'emaLength',
      label: 'EMA Length',
      type: 'number',
      default: 30,
      required: true
    },
  ]

  // Settings for VWAP
  vwapMultiplier = 0
  vwapDivider = 0
  vwapCount = 0

  // Settings for EMA
  prevEma = 0

  // Settings for VMA
  prevVMA = undefined

  async analyze (tick) {
    await super.analyze(tick)
    const vwma = AnalysisTools.vwma(this.tradeHistory, this.strategy.options.vWapLength)
    const ema = AnalysisTools.ema(this.tradeHistory, this.strategy.options.emaLength, this.prevEma)
    this.prevVMA = ema

    // If we have don't have all our stats then
    if (!vwma || !ema) {
      return
    }

    this.emit('indicators', { time: tick.time, name: 'VWMA', indicator: vwma, color: '#ffde5a' })
    this.emit('indicators', { time: tick.time, name: 'EMA', indicator: ema, color: '#2df800' })
    if (!this.sim) {
      TradeIndicator.addIndicator(this.strategy.id, tick.time, 'VWMA', vwma)
      TradeIndicator.addIndicator(this.strategy.id, tick.time, 'EMA', ema)
    }
    // this.emit('indicators', { time: tick.time * 1000, name: 'EMA', indicator: emaGreen, color: '#0c5af7' })

    if (!this.positionInfo.positionExists && vwma > ema) {
      await this.buyPosition(tick.close, tick)
    }

    if (this.positionInfo.positionExists && vwma < ema) {
      await this.sellPosition(tick.close, tick)
    }
  }

  static mutation (options) {
    options = super.mutation(options)

    if (CrossoverVwap.shouldChange()) {
      options.vWapLength += CrossoverVwap.getRandomNumber(-8, 8)
      if (options.vWapLength <= 0) {
        options.vWapLength = 1
      }
    }

    if (CrossoverVwap.shouldChange()) {
      options.vWapMax += CrossoverVwap.getRandomNumber(-20, 20)
      if (options.vWapMax <= 50) {
        options.vWapMax = 50
      }
    }

    if (CrossoverVwap.shouldChange()) {
      options.emaLength += CrossoverVwap.getRandomNumber(-10, 10)
      if (options.emaLen <= 10) {
        options.emaLen = 10
      }
    }

    return options
  }
}

module.exports = CrossoverVwap
