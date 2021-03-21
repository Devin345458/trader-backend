'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof Route} */
const Route = use('Route')

Route.get('/', () => {
  return 'This is an api website. Please follow the documentation'
})

/**
 * User Routes
 */
Route.post('/v1/users', 'v1/UserController.add')
Route.patch('/v1/users', 'v1/UserController.edit')
Route.post('/v1/users/login', 'v1/UserController.login')
Route.get('/v1/users/logged-in-user', 'v1/UserController.loggedInUser').middleware(['auth'])


/**
 * Coinbase Routes
 */
Route.get('/v1/coinbase/coins/:paper', 'v1/CoinbaseController.coins').middleware(['auth'])
Route.post('/v1/coinbase/profiles/:type', 'v1/CoinbaseController.profiles').middleware(['auth'])


/**
 * Profile Routes
 */
Route.get('/v1/profiles/:type?', 'v1/ProfileController.index').middleware(['auth'])
Route.get('/v1/profiles/view/:id', 'v1/ProfileController.view').middleware(['auth'])
Route.post('/v1/profiles', 'v1/ProfileController.add').middleware(['auth']).validator('Profile')
Route.patch('/v1/profiles', 'v1/ProfileController.edit').middleware(['auth']).validator('Profile')
Route.delete('/v1/profiles/:id', 'v1/ProfileController.delete').middleware(['auth'])


/**
 * Strategy Routes
 */
Route.get('/v1/strategies', 'v1/StrategyController.index').middleware(['auth'])
Route.get('/v1/strategies/:id', 'v1/StrategyController.view').middleware(['auth'])
Route.get('/v1/strategies/options/:indicator', 'v1/StrategyController.options').middleware(['auth'])
Route.post('/v1/strategies', 'v1/StrategyController.add').middleware(['auth']).validator('Strategy')
Route.patch('/v1/strategies', 'v1/StrategyController.edit').middleware(['auth'])
Route.delete('/v1/strategies/:id', 'v1/StrategyController.delete').middleware(['auth'])
Route.put('/v1/strategies/start/:id', 'v1/StrategyController.start').middleware(['auth'])
Route.put('/v1/strategies/stop/:id', 'v1/StrategyController.stop').middleware(['auth'])
Route.post('/v1/strategies/set-options/:id', 'v1/StrategyController.setOptions').middleware(['auth'])


/**
 * Trade Routes
 */
Route.get('/v1/trades/strategy/:id', 'v1/TradeController.strategy').middleware(['auth'])
Route.get('/v1/trades/get-ticks/:id', 'v1/TradeController.getTicks').middleware(['auth'])
Route.get('/v1/trades/get-indicators/:id', 'v1/TradeController.getIndicators').middleware(['auth'])


/**
 * Genetic Runs
 */
Route.get('/v1/genetic-runs/strategy/:id', 'v1/GeneticRunController.strategy').middleware(['auth'])
Route.delete('/v1/genetic-runs/delete/:id', 'v1/GeneticRunController.delete').middleware(['auth'])
Route.post('/v1/genetic-runs/start', 'v1/GeneticRunController.start').middleware(['auth'])
