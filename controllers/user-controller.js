const bcrypt = require('bcryptjs')

const { User, sequelize } = require('../models')

const userController = {

  getUserPage: (req, res) => {
    res.render('users/userPage')
  }

}

module.exports = {
  userController
}