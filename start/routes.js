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

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.get('/', () => {
  return 'This is an api website. Please follow the documentation'
})

/**
 * User Routes
 */
Route.post('/v1/users', 'V1/UserController.add')
Route.patch('/v1/users', 'V1/UserController.edit')
Route.post('/v1/users/login', 'V1/UserController.login')
Route.get('/v1/users/logged-in-user', 'V1/UserController.loggedInUser').middleware(['auth'])


/**
 * Coinbase Routes
 */
Route.get('/v1/coinbase/coins/:paper', 'V1/CoinbaseController.coins').middleware(['auth'])
Route.post('/v1/coinbase/profiles/:type', 'V1/CoinbaseController.profiles').middleware(['auth'])


/**
 * Profile Routes
 */
Route.get('/v1/profiles/:type?', 'V1/ProfileController.index').middleware(['auth'])
Route.get('/v1/profiles/view/:id', 'V1/ProfileController.view').middleware(['auth'])
Route.post('/v1/profiles', 'V1/ProfileController.add').middleware(['auth']).validator('Profile')
Route.patch('/v1/profiles', 'V1/ProfileController.edit').middleware(['auth']).validator('Profile')
Route.delete('/v1/profiles/:id', 'V1/ProfileController.delete').middleware(['auth'])


/**
 * Strategy Routes
 */
Route.get('/v1/strategies', 'V1/StrategyController.index').middleware(['auth'])
Route.get('/v1/strategies/:id', 'V1/StrategyController.view').middleware(['auth'])
Route.get('/v1/strategies/options/:indicator', 'V1/StrategyController.options').middleware(['auth'])
Route.post('/v1/strategies', 'V1/StrategyController.add').middleware(['auth']).validator('Strategy')
Route.patch('/v1/strategies', 'V1/StrategyController.edit').middleware(['auth']).validator('Strategy')
Route.delete('/v1/strategies/:id', 'V1/StrategyController.delete').middleware(['auth'])
