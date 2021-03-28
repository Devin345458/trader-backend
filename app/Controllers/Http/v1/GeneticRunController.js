'use strict'
import RunGeneticAlgorithm from "@/Classes/StrategyHelpers/RunGeneticAlgorithm";
import run from "@/Classes/StrategyHelpers/PerfectTrading";

const Strategy = use('App/Models/Strategy')
const GeneticRunIteration = use('App/Models/GeneticRunIteration')
const GeneticRun = use('App/Models/GeneticRun')

class GeneticRunController {
  async strategy({params, auth}) {
    const strategy = await Strategy.query().where('id', params.id).firstOrFail()
    if (strategy.user_id !== auth.user.id) {
      throw new Error('You are not authorized to view this profile')
    }
    const geneticRuns = await GeneticRun
      .query()
      .where({
        strategy_id: params.id
      })
      .with('genetic_run_iterations', (builder) => {
        builder.orderBy('iteration', 'desc')
      })
      .orderBy('created_at', 'desc')
      .fetch()

    return {runs: geneticRuns}
  }

  async delete({params}) {
    const geneticRun = await GeneticRun.find(params.id)
    geneticRun.genetic_run_iterations().delete()
    await geneticRun.delete()
  }

  async start({request}) {
    let {initialBalance, numberOfDays, iterations, populationSize, strategy} = request.all()
    if (!iterations) {
      iterations = 10
    }
    if (!populationSize) {
      populationSize = 10
    }
    let oldStrategy = await Strategy.query().where('id', strategy.id).with('profile').firstOrFail()
    const genetic = await GeneticRun.create({
      days: numberOfDays,
      initial_balance: initialBalance,
      iterations: iterations,
      population_size: populationSize,
      strategy_id: strategy.id,
      status: 'Running'
    })

    let count = 0
    const Algo = new RunGeneticAlgorithm(JSON.parse(JSON.stringify(oldStrategy)), initialBalance, numberOfDays, iterations, populationSize)
    Algo.on('indicator', async (data) => {
      count++
      data.genetic_run_id = genetic.id
      await GeneticRunIteration.create(data)
      if (count === iterations) {
        genetic.perfect = run(Algo.candles, initialBalance)
        genetic.best_pnl = data.profit_loss
        genetic.status = 'Finished'
        await genetic.save()
      }
    })
    Algo.run().catch(async e => {
      console.log('Write handler for errors in genetic model')
      genetic.status = 'Error'
      genetic.error = e.message
      await genetic.save()
    })
    return {geneticRun: genetic}
  }
}

module.exports = GeneticRunController
