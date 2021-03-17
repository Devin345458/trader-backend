'use strict'

const User = use('App/Models/User')

class UserController {
  async add({request, response}) {
      const data = request.only(['first_name', 'last_name', 'email', 'password'])
      const userExists = await User.findBy('email', data.email)
      if (userExists) {
        return response.status(400).send({message: {error: 'User Already Registered'}})
      }
      data.username = data.email
      await User.create(data)
  }

  async edit({request}) {
    const data = request.all()
    /** @var {User} user **/
    const user = await User.findOrFail(data.id)
    user.merge(data)
    await user.save()
    return {user}
  }

  async login({request, auth}) {
    const {email, password} = request.only(['email', 'password'])
    let response = await auth.attempt(email, password)

    return {token: response.token}
  }

  async loggedInUser({auth}) {
    let user = await User.query().where({id: auth.user.id}).with('profiles').firstOrFail()
    return {user}
  }
}

module.exports = UserController
