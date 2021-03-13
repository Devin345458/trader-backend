'use strict'
const CoinbasePro = use('coinbase-pro')
const Config = use('Config')

class CoinbaseController {
  async coins({response, params}) {
    const production = params.paper === 'false'
    const publicClient = new CoinbasePro.PublicClient(production ? Config.get('coinbase.apiURI') : Config.get('coinbase.sandboxURI'))
    /** @var {Array} coins **/
    let coins = await publicClient.getProducts()
    if (!coins) {
      return response.status(404).send({message: 'No coins found'})
    }
    coins = coins.filter((coin) => coin.quote_currency === 'USD')
    return {coins}
  }

  async profiles({request, params}) {
    const {apiKey, apiSecret, apiPhrase} = request.only(['apiKey', 'apiSecret', 'apiPhrase'])
    const production = params.type === 'Live'
    const authedClient = new CoinbasePro.AuthenticatedClient(
      apiKey,
      apiSecret,
      apiPhrase,
      production ? Config.get('coinbase.apiURI') : Config.get('coinbase.sandboxURI')
    )
    const profiles = await authedClient.get(['profiles'])
    if (!profiles) {
      throw new Error('Unable to find profiles')
    }
    return {profiles}
  }
}

module.exports = CoinbaseController
