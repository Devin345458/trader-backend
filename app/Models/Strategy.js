'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
import TradeManagerConstructor from '@/Classes/TradeManagerConstructor'
import _ from 'lodash'

/**
 * @property {Number} id
 * @property {Boolean} enabled
 * @property {String} name
 * @property {String} indicator
 * @property {String} type
 * @property {String} coin
 * @property {Object} positionInfo
 * @property {Boolean} depositingEnabled
 * @property {Number} depositingAmount
 * @property {Object} options
 * @property {Number} user_id
 * @property {Number} profile_id
 */
class Strategy extends Model {
  static boot () {
    super.boot()
    this.addTrait('@provider:Jsonable', ['options', 'positionInfo'])

    this.addHook('afterCreate', async (strategy) => {
      strategy.profile = strategy.profile().fetch()
      const TradeManager = await TradeManagerConstructor.initialize()
      TradeManager.handleChange(strategy)
    })

    this.addHook('afterUpdate', async (strategy) => {
      if (_.isEqual(Object.keys(strategy.dirty), ['positionInfo', 'created_at', 'updated_at'])) {
        return
      }
      strategy.profile = strategy.profile().fetch()
      const TradeManager = await TradeManagerConstructor.initialize()
      TradeManager.handleChange(strategy)
    })

    this.addHook('afterDelete', async (strategy) => {
      const TradeManager = await TradeManagerConstructor.initialize()
      TradeManager.removeStrategy(strategy.id)
    })
  }

  profile() {
    return this.belongsTo('App/Models/Profile')
  }

  tradeIndicators() {
    return this.hasMany('App/Models/TradeIndicator')
  }

  trades() {
    return this.hasMany('App/Models/Trade')
  }

  tradeTickers() {
    return this.hasMany('App/Models/TradeTicker')
  }
}

module.exports = Strategy
