import { hooks } from '@adonisjs/ignitor'


hooks.after.providersBooted(async () => {
  const Helpers = use('Helpers')

  if (!Helpers.isAceCommand()) {
    try {
      const tradeManager = require("@/Classes/TradeManagerConstructor");
      await tradeManager.initialize()
    } catch (e) {
      console.log('hooks error', e)
    }
  }


})
