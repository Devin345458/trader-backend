'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Ws = use('Ws')

class GeneticRun extends Model {
  static boot () {
    super.boot()
    this.addHook('afterSave', async (geneticRun) => {
      const topic = Ws.getChannel('bot-socket:*').topic(`bot-socket:${geneticRun.strategy_id}`)
      if(topic){
        topic.broadcast('genetic-run', geneticRun)
      }
    })
  }

  genetic_run_iterations() {
    return this.hasMany('App/Models/GeneticRunIteration')
  }
}

module.exports = GeneticRun
