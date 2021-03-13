'use strict'

/** @type {import('App/Models/Profile')} */
const Profile = use('App/Models/Profile')

class ProfileController {

  async index({ auth, params}) {
    let profiles = Profile.query().where('user_id', auth.user.id)
    if (params.type) {
      profiles.where('type', params.type)
    }
    profiles = await profiles.fetch()
    return {profiles}
  }

  async add({ request, response, auth }) {
    const data = request.all()
    const profileExists = await Profile.query().where('type', data.type).where('coinProfileId', data.coinProfileId).first()
    if (profileExists) {
      return response.status(400).send({message: 'Profile for this coinbase profile already exists'})
    }
    data.user_id = auth.user.id
    const profile = await Profile.create(data)
    return {profile}
  }

  async edit({ request, auth }) {
    const data = request.all()
    const profile = await Profile.findOrFail(data.id)
    if (profile.user_id !== auth.user.id) {
      throw new Error('You are not authorized to edit this profile')
    }
    profile.merge(data)
    await profile.save()
    return {profile}
  }

  async delete({ auth, params }) {
    const profile = await Profile.findOrFail(params.id)
    if (profile.user_id !== auth.user.id) {
      throw new Error('You are not authorized to delete this profile')
    }
    await profile.delete()
  }

  async view({ auth, params }) {
    const profile = await Profile.findOrFail(params.id)
    if (profile.user_id !== auth.user.id) {
      throw new Error('You are not authorized to view this profile')
    }
    return {profile}
  }

}

module.exports = ProfileController
