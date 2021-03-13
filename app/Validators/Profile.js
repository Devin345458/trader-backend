'use strict'

class Profile {
  get rules () {
    return {
      type: 'required',
      coinProfileId: 'required',
      name: 'required',
      apiKey: 'required',
      apiSecret: 'required',
      apiPhrase: 'required',
    }
  }

  async fails (errorMessages) {
    return this.ctx.response.error({errors: errorMessages})
  }
}

module.exports = Profile
