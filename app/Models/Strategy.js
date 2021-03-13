'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Strategy extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Jsonable', ['options'])
  }

  profile() {
    return this.hasOne('App/Models/Profile', 'profile_id', 'id')
  }
}

module.exports = Strategy
