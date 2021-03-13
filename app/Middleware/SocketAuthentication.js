'use strict'
const Env = use('Env')
const jwt = require('jsonwebtoken')

class SocketAuthentication {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async wsHandle ({ request, auth }, next) {
    const { token } = request.all()
    const appKey = auth.authenticatorInstance._config.options.secret
    const jwtToken = token.split(' ')[1]
    jwt.verify(jwtToken, appKey)
    await next()
  }
}

module.exports = SocketAuthentication
