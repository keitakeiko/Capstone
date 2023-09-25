const bcrypt = require('bcryptjs')
const countryCodes = require('country-codes-list')

const { User, sequelize } = require('../models')
const { getAbbreviationCountry } = require('../helpers/handlebars-helpers')

const userController = {

  getUserPage: (req, res) => {
    res.render('users/userPage')
  },
  getTeacherPage: (req, res) => {
    const NATION = 'Thailand'
    const abbr = getAbbreviationCountry(NATION)
    res.render('users/teacherPage', {abbr: abbr})
  },
  getUserClassPage: (req, res) => {
    res.render('users/reserve-class')
  }
}

module.exports = {
  userController
}