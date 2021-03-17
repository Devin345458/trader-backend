'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddErrorFieldToStrategiesSchema extends Schema {
  up () {
    this.table('strategies', (table) => {
      table.string('error')
    })
  }

  down () {
    this.table('strategies', (table) => {
      table.dropColumn('error')
    })
  }
}

module.exports = AddErrorFieldToStrategiesSchema
