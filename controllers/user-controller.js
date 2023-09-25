const bcrypt = require('bcryptjs')
const countryCodes = require('country-codes-list')

const { User, sequelize } = require('../models')
const { getAbbreviationCountry } = require('../helpers/handlebars-helpers')

const userController = {

  getUserPage: (req, res) => {
    return res.render('users/userPage')
  },
  getTeacherPage: (req, res) => {
    const NATION = 'Thailand'
    const abbr = getAbbreviationCountry(NATION)
    return  res.render('users/teacherPage', {abbr: abbr})
  },
  getUserClassPage: (req, res) => {
    return res.render('users/reserve-class')
  },
  getTeacherEditPage: (req, res) => {
    return res.render('users/teacherEditPage')
  }
    
  
}

module.exports = {
  userController
}