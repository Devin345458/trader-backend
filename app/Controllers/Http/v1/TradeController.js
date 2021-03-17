'use strict'

const Trade = use('App/Models/Trade')
const TradeTicker = use('App/Models/TradeTicker')
const TradeIndicator = use('App/Models/TradeIndicator')

class TradeController {
  async strategy({ params }) {
    const trades = await Trade.query().where({strategy_id: params.id}).fetch()
    return {trades}
  }

  async getTicks({ params }) {
    const tradeTicks = await TradeTicker.query().where({strategy_id: params.id}).fetch()
    return {tradeTicks}
  }

  async getIndicators({ params }) {
    const indicators = await TradeIndicator.query().where({strategy_id: params.id}).fetch()
    const mappedIndicators = {}
    indicators.rows.forEach((indicator) => {
      if (!mappedIndicators[indicator.name]) {
        mappedIndicators[indicator.name] = []
      }
      mappedIndicators[indicator.name].push({time: indicator.time, indicator: indicator.indicator})
    })
    return {indicators: mappedIndicators}
  }
}

module.exports = TradeController
