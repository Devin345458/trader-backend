import EventEmitter from 'events'
import {WebsocketClient} from 'coinbase-pro'

const websocketURI = 'wss://ws-feed.pro.coinbase.com'
const websocketSandboxURI = 'wss://ws-feed-public.sandbox.pro.coinbase.com'
/** @type {Logger} **/
const Logger = use('Logger')
/** @type {typeof Ticker} **/
const TickerTable = use('App/Models/Ticker')
export default class Ticker extends EventEmitter {
  static init
  prices = {}

  /**
   * Get the initialized ticker
   *
   * @return {Ticker}
   */
  static getTicker () {
    if (!this.init) {
      this.init = new this()
    }
    return this.init
  }

  constructor () {
    super()
    this.coins = []
    this.websocketURI = process.env.NODE_ENV === 'production' ? websocketURI : websocketSandboxURI
    this.websocket = null
  }

  /**
   * Creates the websocket object and turns it on to update the currentPrice
   */
  connect () {
    Logger.info('Initializing ticker connect')
    this.websocket = new WebsocketClient(this.coins, this.websocketURI, false, {channels: ['ticker']})
    // turn on the websocket for errors
    this.websocket.on('error', (err) => {
      const message = 'Error occurred in the ticker websocket.'
      const errorMsg = new Error(err)
      Logger.error({ message, errorMsg, err })
      this.connect()
    })

    // Turn on the websocket for closes to restart it
    this.websocket.on('close', () => {
      Logger.debug('Ticker websocket closed, restarting...')
      this.connect()
    })

    // Turn on the websocket for messages
    this.websocket.on('message', (data) => {
      if (data.type === 'ticker') {
        this.emit(data.coin, data)
        TickerTable.createFromTicker(data)
      }
    })

  }

  static addSubscription (coin) {
    const ticker = this.getTicker()
    ticker.addSubscription(coin)
  }

  addSubscription (coin) {
    // Prevent duplicate coin subscriptions
    if (this.coins.includes(coin)) {
      return
    }
    this.coins.push(coin)
    if (this.coins.length === 1) {
      this.connect()
      return
    }
    Logger.info('Adding ticker coin')
    this.websocket.subscribe({
      channels: [
        {
          name: 'ticker',
          product_ids: [coin]
        }
      ]
    })
  }
}
