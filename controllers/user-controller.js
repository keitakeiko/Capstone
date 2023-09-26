const bcrypt = require('bcryptjs')
const countryCodes = require('country-codes-list')

const { User, sequelize } = require('../models')
const { getAbbreviationCountry } = require('../helpers/handlebars-helpers')

const userController = {
  getTeachers: (req, res) => res.render('index'),
  getUserPage: (req, res) => {
    return res.render('users/userPage')
  },
  getTeacherPage: (req, res) => {
    const NATION = 'Thailand'
    const abbr = getAbbreviationCountry(NATION)
    return  res.render('users/teacherPage', {abbr: abbr})
  },
  getUserEditPage: (req, res) => res.render('users/userEditPage'),
  getReserveClassPage: (req, res) => {
    return res.render('users/reserve-class')
  },
  getApplyTeacherPage: (req, res) => 
    res.render('users/applyTeacher'),
  getTeacherEditPage: (req, res) => {
    return res.render('users/checkTeacherPage')
  },
   getCheckTeacherPage: (req, res) => res.render('users/checkTeacherPage')
    
  
}

module.exports = {
  userController
}