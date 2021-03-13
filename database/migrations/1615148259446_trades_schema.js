'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TradesSchema extends Schema {
  up () {
    this.create('trades', (table) => {
      table.increments()
      table.enum('side', ['buy', 'sell'])
      table.string('currency', 255)
      table.decimal('quantity')
      table.decimal('profitLoss')
      table.integer('strategy_id').unsigned().references('id').inTable('strategies')
      table.timestamps()
    })
  }

  down () {
    this.drop('trades')
  }
}

module.exports = TradesSchema
