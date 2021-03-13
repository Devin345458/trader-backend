'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNameToUserSchema extends Schema {
  up () {
    this.table('users', (table) => {
      table.string('first_name', 254).notNullable()
      table.string('last_name', 254).notNullable()
    })
  }

  down () {
    this.table('users', (table) => {
      table.dropColumn('first_name')
      table.dropColumn('last_name')
    })
  }
}

module.exports = AddNameToUserSchema
