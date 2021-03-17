'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TradeTickerSchema extends Schema {
  up () {
    this.create('trade_tickers', (table) => {
      table.increments()
      table.integer('strategy_id').unsigned()
      table.bigInteger('time')
      table.double('close')
      table.double('high')
      table.double('low')
      table.double('volume')
      table.timestamps()
    })
  }

  down () {
    this.drop('trade_tickers')
  }
}

module.exports = TradeTickerSchema
