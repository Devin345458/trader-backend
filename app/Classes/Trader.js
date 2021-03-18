const EventEmitter = use('events')
const CoinbasePro = use('coinbase-pro')
const que = use('async/queue')
/** @type {Redis} */
const Redis = use('Redis')
/** @type {typeof import('@adonisjs/framework/src/Config')} */
const Config = use('Adonis/Src/Config')
/** @type {Logger} */
const Logger = use('Logger')
/** @type {Strategy} */
const Strategy = use('App/Models/Strategy')
/** @type {Trade} */
const Trade = use('App/Models/Trade')
const _ = require('lodash')

/**
 * The base class for all trading strategies. Contains all logic universal to all strategies
 */
class Trader extends EventEmitter {
  authedClient
  /** @type {Strategy} **/
  strategy
  accountIds = {}
  /** @type {typeof import('../Models/Profile')} */
  profile
  balanceMinimum = 0.06
  highestFee = null
  que = que(this.analyze.bind(this), 1)
  tradeInProgress = false
  tradeHistory = []
  sim = false
  activeAccountBalance = 0
  orders = []
  options = {}
  positionInfo = {
    positionExists: false
  }

  static defaultOptions = [
    {
      property: 'bailOutPoint',
      label: 'How far to let drop before selling',
      type: 'Currency',
      required: true
    },
    {
      property: 'interval',
      label: 'How many minutes between each check',
      type: 'number',
      required: true
    }
  ]

  static options = {}

  static getOptions() {
    return this.defaultOptions.concat(this.options)
  }

  async initialize(strategy) {
    this.profile = strategy.profile
    this.strategy = strategy

    this._createClient()

    // Retrieve product information:
    this.productInfo = await this.getProductInfo()

    // Retrieve account IDs:
    this.accountIDs = await this.getAccountIDs()

    // Check for an existing positionData file to start the bot with:
    if (!_.isEmpty(this.strategy.positionInfo)) {
      this.positionInfo = this.strategy.positionInfo
    }
  }

  async setSim(initialBalance) {
    this.sim = true
    this.positionInfo = {
      positionExists: false
    }

    this.activeAccountBalance = initialBalance
  }

  _createClient() {
    this.authedClient = new CoinbasePro.AuthenticatedClient(
      this.profile.apiKey,
      this.profile.apiSecret,
      this.profile.apiPhrase,
      this.profile.type === 'Paper' ? Config.get('coinbase.sandboxURI') : Config.get('coinbase.apiURI')
    )
  }

  /**
   * Acquires some account ID information to be used for storing and retrieving information and depositing funds after a sell.
   *
   * @return {Object} accountObject contains the needed account IDs and profile IDs needed for checking balances and making transfers
   */
  async getAccountIDs() {
    const key = this.strategy.coin + '_' + this.strategy.user_id + '_accountObject'
    let accountIds = JSON.parse(await Redis.get(key))
    if (accountIds) {
      return accountIds
    }
    Logger.info('Didn\'t find account id in redis storage')
    try {
      const accountObject = {}

      // Gets the account IDs for the product pairs in the portfolio
      const accounts = await this.authedClient.getAccounts()

      const baseCurrency = this.strategy.coin.split('-')[0]
      const quoteCurrency = this.strategy.coin.split('-')[1]
      for (let i = 0; i < accounts.length; ++i) {
        if (accounts[i].currency === baseCurrency) {
          accountObject.baseCurrencyAccountID = accounts[i].id
        } else if (accounts[i].currency === quoteCurrency) {
          accountObject.quoteCurrencyAccountID = accounts[i].id
        }
      }

      // Gets all the profiles belonging to the user and matches the deposit and trading profile IDs
      accountObject.tradeProfileID = this.profile.coinProfileId

      await Redis.set(key, JSON.stringify(accountObject))
      await Redis.expire(key, 3600)
      return accountObject
    } catch (err) {
      const message = 'Error occured in getAccountIDs method.'
      const errorMsg = new Error(err)
      Logger.error(message + ' ' + errorMsg.message)
      throw err
    }
  }

  /**
   * Gets information about the product being traded that the bot can use to determine how
   * accurate the size and quote values for the order needs to be. This method parses the base and quote increment
   * strings in order to determine to what precision the size and price parameters need to be when placing an order.
   *
   */
  async getProductInfo() {
    try {
      const key = this.strategy.coin + '_productData'
      let productInfo = JSON.parse(await Redis.get(key))
      if (productInfo) {
        return productInfo
      }
      Logger.info('Didn\'t find product info in redis storage')
      let quoteIncrementRoundValue = 0
      let baseIncrementRoundValue = 0

      const productData = await this.authedClient.get(['products/' + this.strategy.coin])

      if (productData === undefined) {
        Error(`Error, could not find a valid matching product pair for "${this.strategy.coin}". Verify the product names is correct/exists.`)
      }

      for (let i = 2; i < productData.quote_increment.length; ++i) {
        if (productData.quote_increment[i] === '1') {
          quoteIncrementRoundValue++
          break
        } else {
          quoteIncrementRoundValue++
        }
      }

      if (productData.base_increment[0] !== '1') {
        for (let i = 2; i < productData.base_increment.length; ++i) {
          if (productData.base_increment[i] === '1') {
            baseIncrementRoundValue++
            break
          } else {
            baseIncrementRoundValue++
          }
        }
      }

      productData.quoteIncrementRoundValue = Number(quoteIncrementRoundValue)
      productData.baseIncrementRoundValue = Number(baseIncrementRoundValue)
      await Redis.set(key, JSON.stringify(productData))
      Redis.expire(key, 3600)
      return productData
    } catch (err) {
      const message = 'Error occurred in getProductInfo method.'
      const errorMsg = new Error(err)
      Logger.error(message + ' ' + errorMsg.message)
      throw err
    }
  }

  /**
   * @param {Number} priceToSell
   * @param {Object} ticker
   */
  async sellPosition(priceToSell, ticker = {}) {
    try {

      // Calculate the order size
      let orderSize
      if (this.productInfo.baseIncrementRoundValue === 0) {
        orderSize = Math.trunc(this.activeAccountBalance)
      } else {
        orderSize = Number(this.activeAccountBalance).toFixed(this.productInfo.baseIncrementRoundValue)
      }

      // The order params for the coinbase api request
      const orderParams = {
        side: 'sell',
        price: priceToSell,
        size: orderSize,
        // eslint-disable-next-line camelcase
        product_id: this.strategy.coin,
        // eslint-disable-next-line camelcase
        time_in_force: 'FOK'
      }

      // If simulating set the account balance and emit the order
      if (this.sim) {
        this.emit('order', {order: {...orderParams, time: ticker.time}, positionInfo: this.positionInfo})
        this.orders.push({
          ...orderParams,
          time: ticker.time,
          profitLoss: orderParams.price * orderParams.size - (orderParams.price * orderParams.size * 0.05) - this.positionInfo.positionAcquiredCost
        })
        this.positionInfo.positionExists = false
        this.activeAccountBalance = orderSize * priceToSell
        return
      }

      // Place sell order with coinbase api
      const order = await this.authedClient.placeOrder(orderParams)
      const orderDetails = await this.authedClient.getOrder(order.id)
      Logger.debug(orderDetails)

      if (orderDetails.status === 'done') {
        if (orderDetails.done_reason !== 'filled') {
          throw new Error('Sell order did not complete due to being filled? done_reason: ' + orderDetails.done_reason)
        } else {
          this.positionInfo.positionExists = false

          // Update positionData file:
          const strategy = await Strategy.findOrFail(this.strategy.id);
          strategy.positionInfo = this.positionInfo
          await strategy.save()

          const profit = parseFloat(orderDetails.executed_value) - parseFloat(orderDetails.fill_fees) - this.positionInfo.positionAcquiredCost
          await Logger.debug(`Successfully sold ${orderSize} ${this.productInfo.base_currency} for ${priceToSell} with a PNL of ${profit}` + ' Strategy: ' + this.strategy.id)
          await Trade.addTrade(this.strategy.id, 'sell', this.productInfo.quote_currency, orderSize, profit)

          if (profit > 0) {
            // Check deposit config:
            if (this.depositingEnabled) {
              const transferAmount = (profit * this.depositingAmount).toFixed(2)
              const currency = this.productInfo.quoteCurrency

              // Transfer funds to depositProfileID
              const transferResult = await this.authedClient.post(['profiles/transfer'], {
                from: this.accountIds.tradeProfileID,
                to: this.accountIds.depositProfileID,
                currency,
                transferAmount
              })

              Logger.info('transfer result: ' + transferResult, this.strategy.id)
            }
          }
        }
      }
    } catch (e) {
      if (e.message === 'HTTP 400 Error: time in force') {
        return
      }
      throw new Error('Error occurred in sellPosition method.' + e.message)
    }
  }

  /**
   * This method places a buy limit order and loops waiting for it to be filled. Once filled it will update the positionInfo and end. If the
   * order ends for a reason other then filled it will throw an exception. If the order doesn't get filled after 1 minute it will cancel the
   * order and throw an exception.
   *
   * @param {Number} priceToBuy
   * @param {Object} ticker
   */
  async buyPosition(priceToBuy, ticker = {}) {
    try {

      priceToBuy = Number(priceToBuy) + 1
      const balance = this.activeAccountBalance - this.balanceMinimum // Subtract this dollar amount so that there is room for rounding errors
      const amountToSpend = balance - (balance * this.highestFee)
      let orderSize

      if (this.productInfo.baseIncrementRoundValue === 0) {
        orderSize = Math.trunc(amountToSpend / priceToBuy)
      } else {
        orderSize = Number((amountToSpend / priceToBuy).toFixed(this.productInfo.baseIncrementRoundValue))
      }

      const orderParams = {
        side: 'buy',
        price: priceToBuy,
        size: orderSize,
        // eslint-disable-next-line camelcase
        product_id: this.strategy.coin,
        // eslint-disable-next-line camelcase
        time_in_force: 'FOK'
      }

      if (this.sim) {
        this.emit('order', {order: {...orderParams, time: ticker.time}, positionInfo: this.positionInfo})
        this.orders.push({...orderParams, time: ticker.time})
        this.positionInfo.positionExists = true
        this.positionInfo.positionAcquiredPrice = priceToBuy
        this.positionInfo.positionAcquiredCost = priceToBuy * orderSize + this.highestFee
        this.activeAccountBalance = orderSize
        return
      }

      // Place buy order
      const order = await this.authedClient.placeOrder(orderParams)

      const orderDetails = await this.authedClient.getOrder(order.id) // Get latest order details
      Logger.debug(orderDetails)

      if (orderDetails.status === 'done') {
        if (orderDetails.done_reason !== 'filled') {
          await Logger.error('Buy order did not complete due to being filled? done_reason: ' + orderDetails.done_reason, this.strategy.id)
          throw new Error('Buy order did not complete due to being filled? done_reason: ' + orderDetails.done_reason)
        } else {
          // Update position info
          this.positionInfo.positionExists = true
          this.positionInfo.positionAcquiredPrice = parseFloat(orderDetails.executed_value) / parseFloat(orderDetails.filled_size)
          this.positionInfo.positionAcquiredCost = parseFloat(orderDetails.executed_value) + parseFloat(orderDetails.fill_fees)

          // Update positionData file:
          this.strategy.positionInfo = this.positionInfo
          const strategy = await Strategy.findOrFail(this.strategy.id);
          strategy.positionInfo = this.positionInfo
          await strategy.save()


          await Logger.info(`Successfully purchased ${orderSize} ${this.productInfo.base_currency} for ${priceToBuy}` + ' Strategy ' + this.strategy.id)
          await Trade.addTrade(this.strategy.id, 'buy', this.productInfo.base_currency, orderSize)
        }
      }
    } catch (e) {
      if (e.message === 'HTTP 400 Error: time in force') {
        return
      }
      throw new Error('Error occurred in buyPosition method.' + e.message)
    }
  }

  /**
   * Retrieves the current maker and taker fees and returns the highest one as a number
   *
   * @return {number} highestFee The highest fee between the taker and maker fee
   */
  async returnHighestFee() {
    try {
      const fees = JSON.parse(await Redis.get('user_fees_' + this.strategy.user_id))
      if (fees) {
        if (fees.makerFee > fees.takerFee) {
          return fees.makerFee
        } else {
          return fees.takerFee
        }
      }

      const feeResult = await this.authedClient.get(['fees'])
      const makerFee = parseFloat(feeResult.maker_fee_rate)
      const takerFee = parseFloat(feeResult.taker_fee_rate)
      await Redis.set('user_fees_' + this.strategy.user_id, JSON.stringify({
        makerFee,
        takerFee
      }))
      if (makerFee > takerFee) {
        return makerFee
      } else {
        return takerFee
      }
    } catch (err) {
      const message = 'Error occurred in getFees method.'
      const errorMsg = new Error(err)
      Logger.error({message, errorMsg, err})
      throw err
    }
  }

  /**
   * Stub for the function called by classes extending this
   * @return {Promise<void>}
   */
  async analyze(tick) {
    if (!this.que) {
      return
    }
    this.tradeHistory.push(tick)

    if (!this.sim) {
      this.highestFee = await this.returnHighestFee()
      await this.getCurrencyBalance()
    } else {
      this.highestFee = 0.05
    }
  };

  async getCurrencyBalance() {
    if (this.positionInfo.positionExists) {
      const baseCurrencyAccount = await this.authedClient.getAccount(this.accountIDs.baseCurrencyAccountID) // Grab account information to view balance
      if (baseCurrencyAccount.available <= 0) {
        throw new Error(`Error, there is no ${this.productInfo.baseCurrency} balance available for use. Terminating program.`)
      }
      this.activeAccountBalance = baseCurrencyAccount.available
      return
    }

    const quoteCurrencyAccount = await this.authedClient.getAccount(this.accountIDs.quoteCurrencyAccountID) // Grab account information to view balance
    const availableBalance = parseFloat(quoteCurrencyAccount.available)
    if (availableBalance <= 0) {
      throw new Error(`Error, there is no ${this.productInfo.quoteCurrency} balance available for use. Terminating program.`)
    }
    this.activeAccountBalance = quoteCurrencyAccount.available
  }

  /**********************************
   *      GENETIC ALGO CODE         *
   **********************************/

  /**
   * Return random number
   *
   * @param min
   * @param max
   * @return {number}
   */
  static getRandomNumber(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Returns a random boolean
   *
   * @return {boolean}
   */
  static shouldChange() {
    return Math.random() < 0.5
  }

  static crossover(optionsA, optionsB) {
    optionsA.score = -10000000000
    optionsB.score = -10000000000
    if (Trader.shouldChange()) {
      Object.keys(optionsA).forEach((key) => {
        optionsA[key] = Trader.shouldChange() ? optionsA[key] : optionsB[key]
      })

      return optionsA
    }

    /**
     * If No chance for crossover. Return one of the parent Chromosome */
    return (Math.random() < 0.5) ? optionsA : optionsB
  }

  static mutation(options) {
    options.score = -10000000000
    if (Trader.shouldChange()) {
      options.interval += Trader.getRandomNumber(-8, 8)
      if (options.interval <= 1) {
        options.interval = 1
      }
    }

    if (Trader.shouldChange()) {
      options.bailOutPoint += Trader.getRandomNumber(-30, 30)
      if (options.bailOutPoint < 0) {
        options.bailOutPoint = 0
      }
    }

    return options
  }
}

module.exports = Trader
