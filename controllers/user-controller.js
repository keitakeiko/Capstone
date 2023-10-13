const bcrypt = require('bcryptjs')
const dayjs = require('dayjs')

const { Op } = require('sequelize')
const { User, Class, Enrollment, sequelize } = require('../models')
const { getAbbreviationCountry} = require('../helpers/handlebars-helpers')
const { imgurFileHandler } = require('../helpers/file-helpers')
const BCRYPT_SALT_LENGTH = 10

const userController = {

  getSignUpPage: (req, res, nex) => {
    try {
      return res.render('signup')
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
        return res.render('signup', {
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
      return res.render('signin')
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
      const isSignIn = req.isAuthenticated()
      const [totalTeacher, totalTimeByStudent] =
      await Promise.all([
        User.findAll({
          where: { role: 'teacher' },
          include: {
            model: Class,
            attributes: ['teacherId', 'teachingStyle']
          },
          attributes: ['id', 'name', 'avatar', 'nation', 'role'],
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
        totalTeacher,
        ranking,
        isSignIn
      })
    } catch(err) {
      return next(err)
    }
  },
  getUserEditPage: async (req, res, next) => {
    try {
      const role = req.user.role
      const userId = req.params.id
      const user = await User.findByPk(userId, {
        raw: true,
        nest: true,
        attributes: { exclude: ['password', 'createdAt', 'updatedAt']}
      })
      if (!user) throw new Error("使用者不存在")

      res.render('users/userEditPage', { user, role })
    } catch(err) {
      return next(err)
    }
  },
  putUserPage: async (req, res, next) => {
    try {
      const { name, account, aboutMe, nation } = req.body
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
  getUserPage: async (req, res, next) => {
    try {
      const role = req.user.role
      const userId = req.user.id
      const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'
      
      const userInfo = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'studentId', 'classId','classTime','spendTime', 'score','studentComment'],
        include: [{
          model: Class,
          attributes: ['id', 'teacherId', 'classUrl',
          [sequelize.fn('sum', sequelize.col('Enrollment.spendTime')), 'totalTime']
        ],
          include: { model: User, attributes: ['id', 'name', 'avatar'] } // teacher's info
          },
          { //studentInfo
          model: User, 
          attributes: ['id', 'name', 'nation', 'aboutMe', 'avatar']
        }],
        where: {
          studentId: userId,
          classTime: {
            // 小於今天的歷史訊息
            [Op.lt]: dayjs().toDate()
          },
          // 沒評價或是沒給分的會顯示出來
            [Op.or]: {
              studentComment: { [Op.eq]: null },
              score: { [Op.eq]: null }
          }
        },
        order: [['classTime', 'DESC']]
      })
      
      if (!userInfo) throw new Error("使用者不存在")

      const allStudentRanking = await Enrollment.findAll({
        attributes: [
          'studentId',
          [sequelize.fn('sum', sequelize.col('spendTime')), 'totalTime']
        ],
        group: 'studentId',
        order: [sequelize.literal('totalTime DESC')]
      })

      const currentStudentRank = allStudentRanking.findIndex( student => student.studentId === userInfo[0].User.id) + 1
      
      return res.render('users/userPage', {
        name: userInfo[0].User.name,
        avatar: userInfo[0].User.avatar,
        nation: userInfo[0].User.nation,
        aboutMe: userInfo[0].User.aboutMe,
        class: {
          teacherName: userInfo[0].Class.User.name,
          avatar: userInfo[0].Class.User.avatar || DEFAULT_AVATAR,
          time: userInfo[0].classTime,
          url: userInfo[0].Class.classUrl
        },
        ranking: currentStudentRank,
        role
      })
      
    } catch(err) {
      return next(err)
    }
  },
  getTeacherPage: async (req, res, next) => {
    try {
      const role = req.user.role
      const userId = req.params.id
      const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'
      
      const teacherInfo = await User.findByPk( userId, {
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'nation', 'aboutMe',
          { exclude: ['password', 'createdAt', 'updatedAt']}],
        include:[{ 
          model: Class,
          attributes: ['id', 'teacherId', 'teachingStyle']
        }]
      })
      
      if  (!teacherInfo) throw new Error("查無資料")

      const pastCourses  = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'classId', 'score', 'studentComment', 'studentId','classTime',
          [
            sequelize.literal(`(
              SELECT AVG(r.score)
              FROM Enrollments r
              JOIN Classes c
              ON r.classId = c.id
              WHERE c.teacherId = ${sequelize.escape(userId)}
              AND r.score IS NOT NULL)`),
              'avgRating'
          ]],
        include: [{
           //studentInfo
          model: User, attributes: ['id', 'name']
        }],
        where: {
          classTime: {
            // 小於今天的歷史訊息
            [Op.lt]: dayjs().toDate()
          },
          // 已評價且給分的會顯示出來
          studentComment: { [Op.not]: null },
          score: { [Op.not]: null }
        },
        order: [['classTime', 'DESC']],
        limit:2
      })

      const futureBookings = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'classId', 'classTime', 'studentId'],
        include: [
          { 
            model: Class, 
            attributes: ['id', 'classUrl'], 
            where: { teacherId: userId}
          },
          { model: User,  attributes: ['id', 'name']}
        ],
        where: {
          classTime: {
            // 未來兩周
            [Op.between]: [dayjs().toDate(), dayjs().add(2, 'week').toDate()]
          }
        },
        order: [['classTime', 'ASC']]
      });
      
      
      const futureBookingInfo = futureBookings.map(booking => ({
        classTime: booking.classTime,
        classUrl: booking.Class.classUrl,
        studentName: booking.User.name 
      }));
      
      return res.render('teachers/teacherPage', {
        name: teacherInfo.name,
        avatar: teacherInfo.avatar || DEFAULT_AVATAR,
        abbr: getAbbreviationCountry(teacherInfo.nation),
        nation: teacherInfo.nation,
        aboutMe: teacherInfo.aboutMe,
        teachingStyle: teacherInfo.Class.teachingStyle,
        score: pastCourses[0].avgRating,
        futureBookingInfo,
        pastCourses,
        role
      })
      
    } catch(err) {
      return next(err)
    }
  },
  getCheckTeacherPage: async (req, res, next) => {
    try {
      const role = req.user.role
      const userId = req.params.id
      const teacherInfo = await User.findByPk( userId, {
        raw: true,
        nest: true,
        attribute: ['id', 'name', 'nation',
          { exclude: ['password', 'createdAt', 'updatedAt']}],
        include: [{
          model: Class,
          attributes: ['id', 'teacherId', 'teachingStyle', 'introduction']
        }, {
          model: Enrollment,
          attributes: ['id', 'studnetComment',
            [
              sequelize.literal(`(
                SELECT AVG(r.score)
                FROM Enrollments r
                JOIN Classes c
                ON r.classId = c.id
                WHERE c.teacherId = ${sequelize.escape(userId)}
                AND r.score IS NOT NULL)`),
                'avgRating'
            ]
          ]
        }]
      })
      if (!teacherInfo) throw new Error("使用者不存在")
      res.render('users/studentCheckTeacherPage', {
        id: teacherInfo.id,
        name: teacherInfo.name,
        abbr: getAbbreviationCountry(teacherInfo.nation),
        nation: teacherInfo.nation,
        classUrl: teacherInfo.classUrl,
        introduction: teacherInfo.Class.introduction,
        teachingStyle: teacherInfo.Class.teachingStyle,
        score: teacherInfo.Enrollment.avgRating,
        studentComment: teacherInfo.Enrollment.studentComment,
        role
      })
    } catch(err) {
      next(err)
    }
  },
  getTeacherEditPage: async (req, res) => {
    try {
      const role =  req.user.role
      const userId = req.user.id
      
      const teacherInfo = await User.findByPk(userId, {
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'nation',
        { exclude: ['password', 'createdAt', 'updatedAt']}],
        include: [{
          mode: Class,
          attributes: ['id', 'introduction', 'teachingStyle', 'classUrl', 'availableTime']
        }, {
          model: Enrollment,
          attributes: ['id', 'classTime']
        }]
      })
      
      if (!teacherInfo) throw new Error("無此資料")
      if (role === 'teacher') throw new Error("已經是老師")
      
      return res.render('teachers/teacherEditPage', {
        id: teacherInfo.id,
        name: teacherInfo.name,
        nation: teacherInfo.nation,
        role
      })
    } catch(err) {
      next(err)
    }
  },
  getApplyTeacherPage: (req, res) => {
    try {
      
      res.render('users/applyTeacher')
    } catch(err) {
      next(err)
    }
  },
  
  putTeacherEditPage: (req, res, next) => {
    return res.render('users/checkTeacherPage')
  },
  getReserveClassPage: (req, res) => {
    return res.render('users/reserve-class')
  },
  getCommentPage: (req, res) => res.render('users/commentPage')
}

module.exports = userController