'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TickerSchema extends Schema {
  up () {
    this.create('tickers', (table) => {
      table.increments()
      table.string('coin', 255)
      table.bigInteger('time')
      table.double('close')
      table.double('high')
      table.double('low')
      table.double('volume')
      table.timestamps()
    })
  }

  down () {
    this.drop('tickers')
  }
}

module.exports = TickerSchema
