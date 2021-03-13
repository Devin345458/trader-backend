const _ = require('lodash')
class GeneticAlgorithm {
  settings = {
    mutationFunction (phenotype) { return phenotype },
    crossoverFunction: function crossoverFunction (a, b) { return a },
    fitnessFunction: undefined,
    population: [],
    populationSize: 100,
    strategy: undefined,
    numberOfDays: 1,
    initialBalance: 10000
  }

  constructor (options) {
    Object.assign(this.settings, options)

    if (this.settings.population.length <= 0) { throw new Error('population must be an array and contain at least 1 phenotypes') }
    if (this.settings.populationSize <= 0) { throw new Error('populationSize must be greater than 0') }
  }

  _populate () {
    const size = this.settings.population.length
    while (this.settings.population.length < this.settings.populationSize) {
      this.settings.population.push(
        this._mutate(this.cloneJSON(this.settings.population[Math.floor(Math.random() * size)]))
      )
    }
  }

  cloneJSON (object) {
    return JSON.parse(JSON.stringify(object))
  }

  _mutate (phenotype) {
    phenotype = this.cloneJSON(phenotype)
    return this.settings.mutationFunction(phenotype)
  }

  _crossover (phenotype) {
    phenotype = this.cloneJSON(phenotype)
    let mate = this.settings.population[Math.floor(Math.random() * this.settings.population.length)]
    mate = this.cloneJSON(mate)
    return this.settings.crossoverFunction(phenotype, mate)
  }

  async _debugCompete () {
    const nextGeneration = []
    const competition = []

    for (let p = 0; p < this.settings.population.length - 1; p += 2) {
      const phenotype = this.settings.population[p]
      const competitor = this.settings.population[p + 1]
      competition.push({ phenotype: this.cloneJSON(phenotype), competitor: this.cloneJSON(competitor) })
    }

    const test = async ({ phenotype, competitor }) => {
      phenotype.score = await this.settings.fitnessFunction(phenotype)
      competitor.score = await this.settings.fitnessFunction(competitor)

      nextGeneration.push(phenotype)
      if (phenotype.score >= competitor.score) {
        if (Math.random() < 0.5) {
          nextGeneration.push(this._mutate(phenotype))
        } else {
          nextGeneration.push(this._crossover(phenotype))
        }
      } else {
        nextGeneration.push(competitor)
      }
    }

    const promises = competition.map((competition) => {
      return test(competition)
    })
    await Promise.all(promises)

    this.settings.population = nextGeneration
  }

  _compete () {
    const nextGeneration = []
    const workerFarm = require('worker-farm')
    const service = workerFarm(require.resolve('./../../jobs/compete'))
    return new Promise((resolve, reject) => {
      for (let p = 0; p < this.settings.population.length - 1; p += 2) {
        const phenotype = this.settings.population[p]
        const competitor = this.settings.population[p + 1]
        const data = { strategy: this.settings.strategy, phenotype, competitor, numberOfDays: this.settings.numberOfDays, initialBalance: this.settings.initialBalance }
        service(data, (err, { aScore, bScore }) => {
          if (err) {
            return reject(err)
          }
          phenotype.score = aScore
          competitor.score = bScore
          nextGeneration.push(phenotype)
          if (aScore >= bScore) {
            if (Math.random() < 0.5) {
              nextGeneration.push(this._mutate(phenotype))
            } else {
              nextGeneration.push(this._crossover(phenotype))
            }
          } else {
            nextGeneration.push(competitor)
          }
          if (nextGeneration.length === this.settings.population.length) {
            this.settings.population = nextGeneration
            resolve()
          }
        })
      }
    })
  }

  _randomizePopulationOrder () {
    this.settings.population = _.shuffle(this.settings.population)
  }

  async evolve () {
    this._populate()
    this._randomizePopulationOrder()
    await this._debugCompete()
    return this
  }

  best (population) {
    if (!population) {
      population = this.settings.population
    }
    const results = population.reduce(function (a, b) {
      return a.score >= b.score ? a : b
    }, this.settings.population[0])
    return this.cloneJSON(results)
  }

  bestScore () {
    return this.best().score
  }
}

module.exports = GeneticAlgorithm
