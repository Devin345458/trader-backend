'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProfilesSchema extends Schema {
  up () {
    this.create('profiles', (table) => {
      table.increments()
      table.string('type', 255)
      table.string('coinProfileId', 255)
      table.string('name', 255)
      table.string('apiKey', 255)
      table.string('apiSecret', 255)
      table.string('apiPhrase', 255)
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.timestamps()
    })
  }

  down () {
    this.drop('profiles')
  }
}

module.exports = ProfilesSchema
