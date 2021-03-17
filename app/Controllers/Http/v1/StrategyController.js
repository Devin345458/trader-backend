'use strict'

const Strategy = use('App/Models/Strategy')
const Finder = use('App/Classes/StrategyHelpers/IndicatorFinder')

class StrategyController {
  async index({ auth }) {
    const strategies = await Strategy.query().where('user_id', auth.user.id).fetch()
    return {strategies}
  }

  async add({ request, auth }) {
    const data = request.all()
    data.user_id = auth.user.id
    const strategy = await Strategy.create(data)
    return {strategy}
  }

  async edit({ request, auth }) {
    const data = request.all()
    delete data.profile
    const strategy = await Strategy.query().where('id', data.id).firstOrFail()
    if (strategy.user_id !== auth.user.id) {
      throw new Error('You are not authorized to edit this profile')
    }
    strategy.merge(data)
    await strategy.save()
    return {strategyId: strategy.id}
  }

  async delete({ auth, params }) {
    const strategy = await Strategy.find(params.id)
    if (strategy.user_id !== auth.user.id) {
      throw new Error('You are not authorized to delete this profile')
    }
    await strategy.tradeIndicators().delete()
    await strategy.trades().delete()
    await strategy.tradeTickers().delete()
    await strategy.delete()

  }

  async view({ auth, params }) {
    const strategy = await Strategy.query().where('id', params.id).with('profile').firstOrFail()
    if (strategy.user_id !== auth.user.id) {
      throw new Error('You are not authorized to view this profile')
    }
    return {strategy}
  }

  async options({ params }) {
    const trader = Finder.getClass(params.indicator)
    if (!trader) {
      throw new Error('Unable to find trading strategy')
    }
    return {options: trader.getOptions()}
  }
}

module.exports = StrategyController
