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
      table.json('positionInfo')
      table.boolean('depositingEnabled')
      table.decimal('depositingAmount')
      table.json('options')
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('profile_id').unsigned().references('id').inTable('profiles')
      table.timestamps()
    })
  }

  down () {
    this.drop('strategies')
  }
}

module.exports = StrategiesSchema
