const bcrypt = require('bcryptjs')
const countryCodes = require('country-codes-list')

const { User, sequelize } = require('../models')
const { getAbbreviationCountry } = require('../helpers/handlebars-helpers')

const userController = {
  getHomeTeachers: (req, res) => res.render('index'),
  getUserPage: (req, res) => {
    return res.render('users/userPage')
  },
  getTeacherPage: (req, res) => {
    const NATION = 'Thailand'
    const abbr = getAbbreviationCountry(NATION)
    return  res.render('users/userPage', {abbr: abbr})
  },
  getCheckTeacherPage: (req, res) => res.render('users/checkTeacherPage'),
  getUserEditPage: (req, res) => res.render('users/userEditPage'),

  getTeacherEditPage: (req, res) => {
    return res.render('users/checkTeacherPage')
  },
  getApplyTeacherPage: (req, res) => 
    res.render('users/applyTeacher'),
  getReserveClassPage: (req, res) => {
    return res.render('users/reserve-class')
  },
   getCommentPage: (req, res) => res.render('users/commentPage')
    
  
}

module.exports = {
  userController
}