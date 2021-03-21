'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const Ws = use('Ws')

class GeneticRunIteration extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Jsonable', ['options'])

    this.addHook('afterSave', async (geneticRunIteration) => {
      const topic = Ws.getChannel('genetic-run:*').topic(`genetic-run:${geneticRunIteration.genetic_run_id}`)
      if(topic){
        topic.broadcast('iteration', geneticRunIteration)
      }
    })
  }
}

module.exports = GeneticRunIteration
