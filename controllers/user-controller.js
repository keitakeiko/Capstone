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
        const [teacher, totalTimeByStudent] =
        await Promise.all([
          User.findAll({
            where: { role: 'teacher' },
            include: {
              model: Class,
              attributes: ['teacherId', 'teachingStyle']
            },
            nest: true,
            raw: true
          }),
          Enrollment.findAll({
            raw: true,
            nest: true,
            attributes: [
              'studentId','createdAt',
              [sequelize.fn('sum', sequelize.col('spendTime')), 'totalTime']
            ],
            include: { model: User, attributes: ['name', 'avatar'] },
            group: 'studentId',
            limit: 10
          })
        ])
    
      const teachers = Array.from({ length: teacher.length }, (_, i) => ({
        name: teacher[i].name,
        avatar: teacher[i].avatar,
        nation: teacher[i].nation,
        teachingStyle: teacher[i].Class.teachingStyle
      }))
      
      const spendMostTimeStudent =  totalTimeByStudent.sort(function (a,b) {
        return Number(b.totalTime) - Number(a.totalTime)
      })
      
      const ranking = Array.from({ length: spendMostTimeStudent.length }, (_, i) => ({
        name: spendMostTimeStudent[i].User.name,
        avatar: spendMostTimeStudent[i].User.avatar,
        totalTime: spendMostTimeStudent[i].totalTime,
        rank: i + 1
      }))
      
      return res.render('index',{
        teachers,
        ranking
      })
    } catch(err) {
      return next(err)
    }
  },
  getUserEditPage: async (req, res, next) => {
    try {
      const userId = req.params.userId
      const user = await User.findByPk(userId, {
        raw: true,
        nest: true
      })
      if (!user) throw new Error("使用者不存在")
      res.render('users/userEditPage', { user })
    } catch(err) {
      return next(err)
    }
  },
  putUserPage: async (req, res, next) => {
    try {
      const { name, account, aboutMe, avatar, nation } = req.body
      const { file } = req
      const userId = req.params.id // params 拿下來的都會是字串

      if (Number(userId) !== req.user.id) {
        req.flash('error_messages', '不能更改他人檔案')
        res.redirect('/')
      }

      const [ user, filePath ] = await Promise.all([
        User.findByPk(userId),
        imgurFileHandler(file) 
      ])

      if (!user) throw new Error("使用者不存在")
      await user.update({
        name,
        account,
        aboutMe,
        avatar: filePath || user.image,
        nation
      })
      
      req.flash('success_message', '使用者資料編輯成功')
      res.redirect(`/users/${userId}`)
    } catch(err) {
      return next(err)
    }
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