'use strict'

class Strategy {

  get strict () {
    return true
  }

  get rules () {
    return {
      enabled: 'required',
      name: 'required',
      indicator: 'required',
      type: 'required|in:Live,Paper',
      coin: 'required',
      // depositingEnabled: 'required',
      // depositingAmount: 'required',
      options: 'required',
      profile_id: 'exists:profiles,id',
    }
  }
}

module.exports = Strategy
