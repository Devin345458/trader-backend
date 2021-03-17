'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')


/**
 * @method createFromTicker
 */
class Ticker extends Model {
  static boot() {
    super.boot()
    this.addTrait('CreateFromTicker')
  }
}

module.exports = Ticker
