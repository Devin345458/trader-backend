/** @type {import('../Trader')} **/
const Trader = use ('App/Classes/Trader')
/** @type {import('../StrategyHelpers/AnalysisTools.js')} **/
const AnalysisTools  = use ('App/Classes/StrategyHelpers/AnalysisTools')

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
      property: 'vwmaOffset',
      label: 'How far above the VWMA does the price have to be to make a purchase',
      type: 'Currency',
      default: 30,
      required: true
    },
    {
      property: 'emaOffset',
      label: 'How far above the price does the VWMA have to be to sell',
      type: 'Currency',
      default: 30,
      required: true
    }
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
    const vMapGold = AnalysisTools.vwma2(this.tradeHistory, this.strategy.vWapLength) // gold

    // If we have don't have all our stats then
    if (!vMapGold) {
      return
    }

    this.emit('indicators', { time: tick.time, name: 'VMA', indicator: vMapGold, color: '#ffde5a' })
    if (!this.sim) {
      TradeIndicators.addIndicator(this.strategy.id, tick.time, 'vwma', vMapGold)
    }
    // this.emit('indicators', { time: tick.time * 1000, name: 'EMA', indicator: emaGreen, color: '#0c5af7' })

    if (!this.positionInfo.positionExists && (tick.close - this.strategy.vwmaOffset) > vMapGold) {
      this.buyPosition(tick.close, tick)
    }

    if (this.positionInfo.positionExists && (tick.close + this.strategy.emaOffset) < vMapGold) {
      this.sellPosition(tick.close, tick)
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
      options.emaLen += CrossoverVwap.getRandomNumber(-10, 10)
      if (options.emaLen <= 10) {
        options.emaLen = 10
      }
    }

    if (CrossoverVwap.shouldChange()) {
      options.vwmaOffset += CrossoverVwap.getRandomNumber(-30, 30)
    }

    if (CrossoverVwap.shouldChange()) {
      options.emaOffset += CrossoverVwap.getRandomNumber(-30, 30)
    }

    return options
  }
}

module.exports = CrossoverVwap
