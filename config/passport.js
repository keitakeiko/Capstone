const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const FacebookStrategy = require('passport-facebook').Strategy

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

      const user = await User.findOne({ where: { email } })
      if (!user) return cb(null, false, req.flash('error_messages', '帳號或密碼輸入錯誤'))

      const passwordCorrect = await bcrypt.compare(password, user.password)
      if (!passwordCorrect) return cb(null, false, req.flash('error_messages', '帳號或密碼錯誤'))

      return cb(null, user)

    } catch (err) {
      return cb(err, false)
    }
  }
))

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_ID,
  clientSecret: process.env.FACEBOOK_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK,
  profileFields: ['email', 'displayName']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { name, email } = profile._json
    const existUser = await User.findOne({ email })
    if (existUser) done(null, existUser)
    const randomPassword = Math.random().toString(36).slice(-8)
    const BCRYPT_SALT_LENGTH = 10
    const salt = bcrypt.genSaltSync(BCRYPT_SALT_LENGTH)
    const user = await User.create({
      name,
      email,
      password: bcrypt.hashSync(randomPassword, salt)
    })
    if (user) done(null, user)
  } catch (err) {
    return done(err, false)
  }
}))

// serialize and deserialize user
passport.serializeUser(async (user, cb) => {
  try {
    return cb(null, user.id)
  } catch (err) {
    return cb(err, false)
  }
})
passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findByPk(id, {
      raw: true,
      nest: true,
      attributes: ['id', 'name', 'email', 'account', 'nation', 'avatar', 'aboutMe', 'role']
    })
    // delete user.password

    return cb(null, user)
  } catch (err) {
    return cb(err, false)
  }
})

module.exports = passport