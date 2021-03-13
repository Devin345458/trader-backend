/**
 *
 * @param strategyIndicator
 * @returns {Trader} Trader
 */
function getClass(strategyIndicator) {
  const strategies = require('require-all')( __dirname + '/../Strategies');
  return strategies[strategyIndicator]
}

/**
 *
 * @returns {ObjectConstructor}
 * @param {Object} strategy
 * @param {boolean} sim
 */
function createClass(strategy, sim = false) {
  const Class = getClass(strategy.indicator)
  return new Class(strategy, sim)
}

/**
 *
 * @param strategy
 * @param sim
 * @return {Trader} Trader
 */
async function createAndInitializeClass(strategy, sim = false) {
  const Class = createClass(strategy, sim)
  await Class.initialize()
  return Class
}

export { createClass, createAndInitializeClass, getClass}
