/**
 * Calculates the perfect trading profit and loss
 *
 * @param {array} candles
 * @param {number} initialBalance
 * @return {number}
 */
function run (candles, initialBalance) {
  let previousQuantity = 0
  let balance = initialBalance
  candles.forEach((candle, index) => {
    // if no next candle sell if positionExists
    if (!candles[index + 1]) {
      if (!previousQuantity) {
        return
      }
      balance = previousQuantity * candle.close
      return
    }
    // No price change stay the same
    if (candle.close === candles[index + 1].close) {
      return
    }
    const moveUp = candles[index + 1].close > candle.close
    if (moveUp && !previousQuantity) {
      previousQuantity = balance / candle.close
    } else if (previousQuantity && !moveUp) {
      balance = previousQuantity * candle.close
      previousQuantity = 0
    }
  })
  return balance - initialBalance
}

export default run
