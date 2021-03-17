'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StrategiesSchema extends Schema {
  up () {
    this.create('strategies', (table) => {
      table.increments()
      table.boolean('enabled')
      table.string('name', 255)
      table.string('indicator', 255)
      table.string('type', 255)
      table.string('coin', 255)
      table.text('positionInfo', "longtext")
      table.boolean('depositingEnabled')
      table.decimal('depositingAmount')
      table.text('options', "longtext")
      table.integer('user_id').unsigned()
      table.integer('profile_id').unsigned()``
      table.timestamps()
    })
  }

  down () {
    this.drop('strategies')
  }
}

module.exports = StrategiesSchema
