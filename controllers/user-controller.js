const bcrypt = require('bcryptjs')

const { User, Class, Enrollment, sequelize } = require('../models')
const { getAbbreviationCountry} = require('../helpers/handlebars-helpers')
const { imgurFileHandler } = require('../helpers/file-helpers')
const BCRYPT_SALT_LENGTH = 10

const userController = {

  getSignUpPage: (req, res, nex) => {
    try {
      return res.render('users/signup')
    } catch(err) {
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

      const { file } = req // multer 照片上傳
      
      // 判斷註冊邏輯
      const errors = []
      const [ userEmail, userAccount ] = await Promise.all([
        User.findOne({ where: { email }}),
        User.findOne({ where: { account }})
      ])

      if (userEmail) errors.push({ message: 'email 重複註冊'})
      if (userAccount) errors.push({ message: 'account 重複註冊'})

      if (!name|| !account || !email || !password || !checkPassword || !nation || !aboutMe) errors.push({ message: '必填項目未完成'})
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

      const filePath = await imgurFileHandler(file) // multer 上傳的路徑

      await User.create({
        name,
        account,
        email,
        password: bcrypt.hashSync(password, salt),
        aboutMe,
        avatar: filePath || null,
        nation
      })

      req.flash('success_message', '註冊成功')
      return res.redirect('/signin')
    } catch(err) {
      return next(err)
    }
  },
  getSignInPage: (req, res, nex) => {
    try {
      return res.render('users/signin')
    } catch(err) {
      return next(err)
    }
  },
  postSignIn: async (req, res, next) => {
    try {
      if (req.user.email === 'root@example.com') return res.redirect('/admin')
      req.flash('success_message', '成功登入')
      return res.redirect('/')
    } catch(err) {
      return next(err)
    }
  },
  logout: (req, res) => {
    req.flash('success_message', '成功登出')
    req.logout()
    res.redirect('/signin')
  },
  getHomeTeachers: async (req, res, next) => {
    try {
      const a = await User.findAll({ where: { role:'teacher'},
        // 一加就出錯
        // include: { model: Class, attributes: ['teacherId', 'teachingStyle']},
        nest:true,
        raw: true
        })
        console.log(a)

      // const [ teacher, style, enrollment ] = await Promise.all([
      //   User.findAll({ where: { role:'teacher'},
      //   // 一加就出錯
      //   // include: { model: Class, attributes: ['teacherId', 'teachingStyle']},
      //   nest:true,
      //   raw: true
      //   }),
      //   Class.findAll({
      //     attributes: ['teacherId', 'teachingStyle'],
      //     nest: true,
      //     raw:true
      //   }),
      //   Enrollment.findAll({
      //     attributes: ['teacherId', 'studentId', 'spendTime'],
      //     nest: true,
      //     raw: true
      //   })
      // ])
      // console.log(enrollment)
      // const teachers = Array.from({ length: teacher.length }, (_, i) => ({
      //   avatar: teacher.avatar,
      //   name: teacher.name,
      //   nation: teacher.nation,
      //   teachingStyle: style.teachingStyle
      // }))

      // const totalTime = {}
      // enrollment.forEach( record => {
      //   const { studentId, spendTime } = record
      //   if (totalTime[studentId]) {
      //     totalTime += spendTime
      //   }
      // })
      // console.log(totalTime)
      // for (let i = 0; i < enrollment['studentId'].length; i++) {
        
      // }

      return res.render('index',{
        // teachers,
        // ranking
      })
    } catch(err) {
      return next(err)
    }
    
  },
  getUserEditPage: (req, res) => {
    return res.render('users/userEditPage')
  },
  putUserPage: (req, res, next) => {
    const { name, account, aboutMe, avatar, nation } = req.body
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

module.exports = userController