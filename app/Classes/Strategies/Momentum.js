const Trader = use ('App/Classes/Trader')

class Momentum extends Trader {
  static options = [
    {
      property: 'trailingBuyPrice',
      label: 'Trailing Buy Price',
      type: 'Currency',
      required: true
    },
    {
      property: 'trailingSellPrice',
      label: 'Trailing Sell Price',
      type: 'Currency',
      required: true
    }
  ]

  lastPeakPrice
  lastValleyPrice

  async analyze (ticker) {
    await super.analyze(ticker)
    if (!this.lastPeakPrice || !this.lastValleyPrice) {
      this.lastPeakPrice = ticker.close
      this.lastValleyPrice = ticker.close
    }
    if (this.positionInfo.positionExists) {
      this.losePosition(ticker)
    } else {
      this.gainPosition(ticker)
    }
  }

  /**
   * Check and see if we have met our sale conditions if so try and sell the coin
   *
   * @param {Object} ticker
   */
  losePosition (ticker) {
    if (this.lastPeakPrice < ticker.close) {
      // New peak hit, reset values
      this.lastPeakPrice = ticker.close
      this.lastValleyPrice = ticker.close
    } else if (this.lastValleyPrice > ticker.close) {
      // New valley hit, track valley and check sell conditions
      this.lastValleyPrice = ticker.close

      // Profit if we were to sell now
      const receivedValue = (this.lastValleyPrice * this.activeAccountBalance) - ((this.lastValleyPrice * this.activeAccountBalance) * this.highestFee)

      // Highest price we can sell at
      const target = this.lastPeakPrice - this.strategy.options.trailingSellPrice

      // Check if the dip is greater than our allowed sale dip and we are profitable
      const optimalSellPosition = target >= this.lastValleyPrice && receivedValue > this.positionInfo.positionAcquiredCost

      // Check if our bailout condition has been met
      const bailOutPosition = this.positionInfo.positionAcquiredCost - receivedValue >= this.strategy.options.bailOutPoint

      // Should we sell
      if (optimalSellPosition || bailOutPosition) {
        const priceToSell = Number(ticker.close.toFixed(this.productInfo.quoteIncrementRoundValue))
        return this.sellPosition(priceToSell, ticker)
      }
    }
  }

  /**
   * Loops forever until the conditions are right to attempt to buy a position. Every loop sleeps to let the currentPrice update
   * then updates the lastPeak/lastValley price as appropriate, if the price hits a new peak price it will check if the conditions are
   * met to buy the position and call the method if appropriate.
   *
   * @param {Object} ticker
   */
  gainPosition (ticker) {
    if (this.lastPeakPrice < ticker.close) {
      // New peak hit, track peak price and check buy conditions
      this.lastPeakPrice = ticker.close

      const target = this.lastValleyPrice + this.strategy.options.trailingBuyPrice

      if (this.lastPeakPrice >= target) {
        // Create a new authenticated client to prevent it from expiring or hitting API limits
        const priceToBuy = Number(ticker.close.toFixed(this.productInfo.quoteIncrementRoundValue))
        this.buyPosition(priceToBuy, ticker)
      }
    } else if (this.lastValleyPrice > ticker.close) {
      // New valley hit, reset values
      this.lastPeakPrice = ticker.close
      this.lastValleyPrice = ticker.close
    }
  }

  static mutation (options) {
    if (Trader.shouldChange()) {
      options.trailingBuyPrice += Trader.getRandomNumber(-100, 100)
    }

    if (Trader.shouldChange()) {
      options.trailingSellPrice += Trader.getRandomNumber(-100, 100)
    }

    if (Trader.shouldChange()) {
      options.bailOutPoint += Trader.getRandomNumber(-30, 30)
    }

    return options
  }
}

module.exports = Momentum
