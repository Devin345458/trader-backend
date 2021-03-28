exports.vwap = (tick) => {
  if (this.tradeHistory.length >= this.strategy.vWapLength) {
    if (this.strategy.vWapMax && this.vwapCount > this.strategy.vWapMax) {
      this.vwapMultiplier = 0
      this.vwapDivider = 0
      this.vwapCount = 0
    }

    const fees = (tick.price * this.activeAccountBalance) * this.highestFee
    const priceWithFees = tick.price + fees
    this.vwapMultiplier = this.vwapMultiplier + tick.price * tick.volume
    this.vwapDivider = this.vwapDivider + tick.volume

    this.vwapCount++
    return this.vwapMultiplier / this.vwapDivider
  }
}

exports.ema = (tradeHistory, length, previous) => {
  if (tradeHistory.length >= length) {
    if (!previous) {
      let sum = 0
      tradeHistory.slice(0, length).forEach((tick) => {
        sum += tick.close
      })
      previous = sum / length
    }
    const multiplier = 2 / (length + 1)
    return (tradeHistory[tradeHistory.length - 1].close - previous) * multiplier + previous
  }
}

module.exports.sma = (tick, length) => {
  if (this.tradeHistory.length >= length) {
    const SMA = this.tradeHistory
      .slice(0, length)
      .reduce((sum, tick) => {
        return sum + tick.price
      }, 0)

    return SMA / length
  }
}


exports.vwma = function (tradeHistory, length) {
  if (tradeHistory.length < length) {
    return
  }
  let tempValue = 0.0
  let tempVolume = 0.0
  const start = tradeHistory.length - length
  tradeHistory.slice(start, start + length).forEach((tick) => {
    tempValue += tick.close * tick.volume
    tempVolume += tick.volume
  })

  return tempValue / tempVolume
}

exports.ma = function (tradeHistory, length) {
  if (tradeHistory.length < length) {
    return
  }

  const start = tradeHistory.length - length
  const total = tradeHistory.slice(start, start + length).reduce((t, v) => {
    return t + v.close
  }, 0)

  return total / length
}
