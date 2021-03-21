'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class GeneticRunIterationsSchema extends Schema {
  up () {
    this.create('genetic_run_iterations', (table) => {
      table.increments()
      table.integer('genetic_run_id')
      table.double('profit_loss')
      table.integer('time_taken')
      table.text('options', "longtext")
      table.integer('iteration')
      table.timestamps()
    })
  }

  down () {
    this.drop('genetic_run_iterations')
  }
}

module.exports = GeneticRunIterationsSchema
