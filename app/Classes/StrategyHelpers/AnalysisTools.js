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

this.prevEma = 0
exports.ema = (tradeHistory, length) => {
  if (tradeHistory.length >= length) {
    if (!this.prevEma) {
      let sum = 0
      tradeHistory.slice(0, length).forEach((tick) => {
        sum += tick.price
      })
      this.prevEma = sum / length
    }
    const multiplier = 2 / (length + 1)
    const ema = (tradeHistory[tradeHistory.length - 1].price - this.prevEma) * multiplier + this.prevEma
    this.prevEma = ema
    return ema
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

exports.vma = (tick) => {
  const k = 1.0 / this.strategy.vWapLength
  const lastTrade = this.tradeHistory[this.tradeHistory.length - 2]
  if (lastTrade) {
    const pdm = Math.max(tick.price - lastTrade.price, 0)
    const mdm = Math.max(lastTrade.price - tick.price, 0)
    tick.pdmS = k * pdm + ((lastTrade.pdmS !== undefined) ? lastTrade.pdmS * (1 - k) : 0)
    tick.mdmS = k * mdm + ((tick.mdmS !== undefined) ? lastTrade.mdmS * (1 - k) : 0)
    tick.s0 = tick.pdmS + tick.mdmS
    tick.pdi = tick.pdmS / tick.s0
    tick.mdi = tick.mdmS / tick.s0
    tick.pdiS = k * tick.pdi + ((lastTrade.pdiS !== undefined) ? lastTrade.pdiS * (1 - k) : 0)
    tick.mdiS = k * tick.mdi + ((lastTrade.mdiS !== undefined) ? lastTrade.mdiS * (1 - k) : 0)
    const d = Math.abs(tick.pdiS - tick.mdiS)
    tick.s1 = tick.pdiS + tick.mdiS
    tick.iS = k * d / tick.s1 + ((lastTrade.iS !== undefined) ? lastTrade.iS * (1 - k) : 0)
  }
  if (this.tradeHistory.length >= this.strategy.vWapLength) {
    let hhv, llv
    this.tradeHistory.slice(0, this.strategy.vWapLength).forEach((tick) => {
      hhv = (hhv !== undefined) ? Math.max(hhv, tick.iS) : tick.iS
      llv = (llv !== undefined) ? Math.min(llv, tick.iS) : tick.iS
    })
    hhv = Math.max(hhv, tick.iS)
    llv = Math.min(llv, tick.iS)
    const d1 = hhv - llv
    const vI = (tick.iS - llv) / d1
    const vma = k * vI * tick.price + (this.prevVMA ? this.prevVMA * (1 - k * vI) : 0)
    this.prevVMA = vma
    return vma
  }
}

exports.vwma2 = function (tradeHistory, length) {
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
