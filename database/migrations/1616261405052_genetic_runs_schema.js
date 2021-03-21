'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class GeneticRunsSchema extends Schema {
  up () {
    this.create('genetic_runs', (table) => {
      table.increments()
      table.integer('days')
      table.integer('initial_balance')
      table.integer('iterations')
      table.integer('population_size')
      table.integer('strategy_id')
      table.string('status')
      table.double('best_pnl')
      table.double('perfect')
      table.string('error')
      table.timestamps()
    })
  }

  down () {
    this.drop('genetic_runs')
  }
}

module.exports = GeneticRunsSchema
