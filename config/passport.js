const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const { User } = require('../models')

// set up Passport strategy
passport.use(new LocalStrategy(
  // customize user field
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },

  // authenticate user
  async (req, email, password, cb) => {
    try {
      // 登入時先清空session，加強安全措施
      req.logout(err => {
        if (err) return cb(err, null)
      })

      const user = await User.findOne({ where: { email }})
      if (!user) return cb(null, false, req.flash('error_messages', '帳號或密碼輸入錯誤'))

      const passwordCorrect = await bcrypt.compare(password, user.password)
      if(!passwordCorrect) return cb(null, false, req.flash('error_messages', '帳號或密碼錯誤'))

      return cb(null, user)

    } catch (err) {
      return cb(err, false)
    }
  }
))

// serialize and deserialize user
passport.serializeUser(async (user, cb) => {
  try {
    return cb(null, user.id)
  } catch(err) {
    return cb(err, false)
  }
})
passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findByPk(id, {
      raw: true,
      nest: true,
      attributes: { exclude: ['password', 'createdAt', 'updatedAt']}
      })
      // delete user.password

      return cb( null, user)
    } catch(err) {
      return cb(err, false)
    }
})

module.exports = passport