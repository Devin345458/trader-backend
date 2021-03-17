'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/**
 * @property {string} type
 * @property {string} coinProfileId
 * @property {string} name
 * @property {string} apiKey
 * @property {string} apiSecret
 * @property {string} apiPhrase
 */
class Profile extends Model {

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

}

module.exports = Profile
