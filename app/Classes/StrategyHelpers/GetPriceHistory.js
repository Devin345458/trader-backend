const moment = use("moment");
const CoinbasePro = use("coinbase-pro");
const Config = use('Adonis/Src/Config')
const queue = use('async/queue')
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
module.exports = async ( numberOfDays, coin, profile ) => {
  const production = profile.type === 'Live'
  const client = new CoinbasePro.AuthenticatedClient(
    profile.apiKey,
    profile.apiSecret,
    profile.apiPhrase,
    production ? Config.get('coinbase.apiURI') : Config.get('coinbase.sandboxURI')
  )

  // Loop through time to prevent tooMany request error
  const que = queue(async (args) => {
    const results = await client.getProductHistoricRates(coin, args)
    candles.push(results)
    await sleep(1000)
  }, 3)

  // eslint-disable-next-line handle-callback-err
  que.error((err, task) => {
    que.push(task)
  })

  const difference = moment().startOf('day').unix() - moment().subtract(numberOfDays, 'days').unix()

  const interval = 18000
  const loops = Math.ceil(difference / interval)

  let candles = []

  for (let i = 0; i <= loops - 1; i++) {
    let currentEnd = moment().startOf('day')
      .subtract(numberOfDays, 'days')
      .add(interval * (i + 1), 'seconds')
    if (currentEnd.isSameOrAfter(moment().startOf('day'))) {
      currentEnd = moment().startOf('day')
    }

    que.push({
      granularity: 60,
      start: moment().startOf('day').subtract(numberOfDays, 'days')
        .add(interval * i, 'seconds')
        .toISOString(),
      end: currentEnd.toISOString()
    })
  }

  await que.drain()
  candles = candles.flat()
  candles = candles.sort((a, b) => a[0] - b[0])

  // Convert Candles to Object
  return candles.map((candle) => {
    return {
      time: candle[0],
      low: candle[1],
      high: candle[2],
      open: candle[3],
      close: candle[4],
      volume: candle[5]
    }
  })
}
