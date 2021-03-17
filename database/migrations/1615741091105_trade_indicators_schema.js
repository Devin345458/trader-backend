'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TradeIndicatorsSchema extends Schema {
  up () {
    this.create('trade_indicators', (table) => {
      table.increments()
      table.integer('strategy_id').unsigned()
      table.double('time')
      table.string('name', 255)
      table.double('indicator')
      table.timestamps()
    })
  }

  down () {
    this.drop('trade_indicators')
  }
}

module.exports = TradeIndicatorsSchema
