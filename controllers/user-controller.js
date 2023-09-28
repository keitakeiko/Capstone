const bcrypt = require('bcryptjs')

const { User, Class, Enrollment, sequelize } = require('../models')
const { getAbbreviationCountry} = require('../helpers/handlebars-helpers')
const BCRYPT_SALT_LENGTH = 10

const userController = {

  getSignUpPage: (req, res, nex) => {
    try {
      return res.render('users/signup')
    } catch {
      return next(err)
    }
  },
  postSignUp: async (req, res, next) => {
    try{
      const {
        name,
        account,
        email,
        password,
        checkPassword,
        aboutMe,
        avatar,
        nation
      } = req.body

      const errors = []
      const [ userEmail, userAccount ] = await Promise.all([
        User.findOne({ where: { email }}),
        User.findOne({ where: { account }})
      ])

      if (userEmail) errors.push({ message: 'email 重複註冊'})
      if (userAccount) errors.push({ message: 'account 重複註冊'})

      if (!account || !email || !password || !checkPassword || !nation || !aboutMe) errors.push({ message: '必填項目未完成'})
      if (name.length > 50) errors.push({ message: '暱稱不得超過50字'})
      if (password !== checkPassword) errors.push({ message: '兩次輸入密碼不符'})

      if (errors.length) {
        return res.render('users/signup', {
          errors,
          name,
          account,
          email,
          password,
          checkPassword,
          aboutMe,
          avatar,
          nation
        })
      }
      const salt = bcrypt.genSaltSync(BCRYPT_SALT_LENGTH)

      await User.create({
        name,
        account,
        email,
        password: bcrypt.hashSync(password, salt),
        aboutMe,
        avatar,
        nation
      })

      req.flash('success_message', '註冊成功')

      return res.redirect('/users/signin')
    } catch {
      return next(err)
    }
  },
  getSignInPage: (req, res, nex) => {
    try {
      return res.render('users/signin')
    } catch {
      return next(err)
    }
  },
  postSignIn: (req, res, nex) => {
    try {
      req.flash('success_message', '成功登入')
      return res.render('/')
    } catch {
      return next(err)
    }
  },
  logout: (req, res) => {
    req.flash('success_message', '成功登出')
    req.logout()
    res.redirect('/signin')
  },
  getHomeTeachers: (req, res) => {
    res.render('index')
  },
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