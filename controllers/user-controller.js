const bcrypt = require('bcryptjs')
const dayjs = require('dayjs')

const { Op } = require('sequelize')
const { User, Class, Enrollment, sequelize } = require('../models')
const { getAbbreviationCountry } = require('../helpers/handlebars-helpers')
const { imgurFileHandler } = require('../helpers/file-helpers')
const BCRYPT_SALT_LENGTH = 10

const userController = {

  getSignUpPage: (req, res, nex) => {
    try {
      return res.render('signup')
    } catch (err) {
      return next(err)
    }
  },
  postSignUp: async (req, res, next) => {
    try {
      const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'

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
      const [userEmail, userAccount] = await Promise.all([
        User.findOne({ where: { email } }),
        User.findOne({ where: { account } })
      ])

      if (userEmail) errors.push({ message: 'email 重複註冊' })
      if (userAccount) errors.push({ message: 'account 重複註冊' })

      if (!name || !account || !email || !password || !checkPassword || !nation || !aboutMe) errors.push({ message: '必填項目未完成' })
      if (name.length > 50) errors.push({ message: '暱稱不得超過50字' })
      if (password !== checkPassword) errors.push({ message: '兩次輸入密碼不符' })

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
        avatar: filePath || DEFAULT_AVATAR,
        nation
      })

      req.flash('success_message', '註冊成功')
      return res.redirect('/signin')
    } catch (err) {
      return next(err)
    }
  },
  getSignInPage: (req, res, nex) => {
    try {
      return res.render('signin')
    } catch (err) {
      return next(err)
    }
  },
  postSignIn: async (req, res, next) => {
    try {
      if (req.user.email === 'root@example.com') return res.redirect('/admin')
      req.flash('success_message', '成功登入')
      return res.redirect('/')
    } catch (err) {
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
      // let role
      const role = req.user?.role
      console.log(role)
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
              'studentId', 'createdAt',
              [sequelize.fn('sum', sequelize.col('spendTime')), 'totalTime']
            ],
            include: { model: User, attributes: ['name', 'avatar'] },
            group: 'studentId',
            limit: 10
          })
        ])

      const spendMostTimeStudent = totalTimeByStudent.sort(function (a, b) {
        return Number(b.totalTime) - Number(a.totalTime)
      })

      const ranking = Array.from({ length: spendMostTimeStudent.length }, (_, i) => ({
        name: spendMostTimeStudent[i].User.name,
        avatar: spendMostTimeStudent[i].User.avatar,
        totalTime: spendMostTimeStudent[i].totalTime,
        rank: i + 1
      }))

      return res.render('index', {
        totalTeacher,
        ranking,
        isSignIn, // 藉此判斷 header 登入或登出
        role
      })

    } catch (err) {
      return next(err)
    }
  },
  getUserEditPage: async (req, res, next) => {
    try {
      const isSignIn = req.isAuthenticated()
      const role = req.user.role
      const userId = req.params.id
      const user = await User.findByPk(userId, {
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'email', 'account', 'nation', 'avatar', 'aboutMe', 'role']
      })
      if (!user) throw new Error("使用者不存在")

      res.render('users/userEditPage', { user, role, isSignIn })
    } catch (err) {
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

      const [user, filePath] = await Promise.all([
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
    } catch (err) {
      return next(err)
    }
  },
  // 學生看自己頁面
  getUserPage: async (req, res, next) => {
    try {
      const isSignIn = req.isAuthenticated()
      const role = req.user.role
      const userId = req.user.id
      const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'

      const userInfo = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'studentId', 'classId', 'classTime', 'spendTime', 'score', 'studentComment'],
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

      const currentStudentRank = allStudentRanking.findIndex(student => student.studentId === userInfo[0].User.id) + 1

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
        role,
        isSignIn
      })

    } catch (err) {
      return next(err)
    }
  },
  // 老師看自己頁面
  getTeacherPage: async (req, res, next) => {
    try {
      const isSignIn = req.isAuthenticated()
      const role = req.user.role
      const userId = req.user.id
      const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'

      const teacherInfo = await User.findByPk(userId, {
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'email', 'account', 'nation', 'avatar', 'aboutMe', 'role'],
        include: [{
          model: Class,
          attributes: ['id', 'teacherId', 'teachingStyle']
        }]
      })

      if (!teacherInfo) throw new Error("查無資料")

      // 資料庫要有小於當下時間的歷史紀錄課程，不然會抓不到 pastCourses
      const pastCourses = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'classId', 'score', 'studentComment', 'studentId', 'classTime',
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
        limit: 2
      })

      const futureBookings = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'classId', 'classTime', 'studentId'],
        include: [
          {
            model: Class,
            attributes: ['id', 'classUrl'],
            where: { teacherId: userId }
          },
          { model: User, attributes: ['id', 'name'] }
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
        score: Number(pastCourses[0].avgRating).toFixed(1),
        futureBookingInfo,
        pastCourses,
        role,
        isSignIn,
        id: teacherInfo.id
      })

    } catch (err) {
      return next(err)
    }
  },
  // 學生看老師頁面
  getCheckTeacherPage: async (req, res, next) => {
    try {
      const isSignIn = req.isAuthenticated()
      const role = req.user.role
      const userId = req.user.id
      const teacherId = req.params.id // teachers'
      const teacherInfo = await User.findByPk(userId, {
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'email', 'account', 'nation', 'avatar', 'aboutMe', 'role'],
        include: [{
          model: Class,
          attributes: ['id', 'teacherId', 'teachingStyle', 'introduction'],
          include: [
            {
              model: Enrollment,
              attributes: [
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
            }
          ]
        }]
      })

      if (!teacherInfo) throw new Error("使用者不存在")

      const lessonHistory = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'studentComment', 'score'],
        where: {
          '$Class.teacherId$': teacherId,
          where: sequelize.literal('score IS NOT NULL AND studentComment IS NOT NULL')
        },
        include: [{
          model: Class,
          attributes: ['id', 'teacherId']
        }],
        limit: 2,
        order: [['createdAt', 'DESC']]
      })

      res.render('users/studentCheckTeacherPage', {
        id: teacherInfo.id,
        name: teacherInfo.name,
        avatar: teacherInfo.avatar,
        abbr: getAbbreviationCountry(teacherInfo.nation),
        nation: teacherInfo.nation,
        classUrl: teacherInfo.classUrl,
        introduction: teacherInfo.Class.introduction,
        teachingStyle: teacherInfo.Class.teachingStyle,
        score: Number(teacherInfo.Class.Enrollments.avgRating).toFixed(1),
        lessonHistory,
        role,
        userId,
        isSignIn
      })
    } catch (err) {
      next(err)
    }
  },
  getTeacherEditPage: async (req, res, next) => {
    try {
      const isSignIn = req.isAuthenticated()
      const role = req.user.role
      const userId = req.user.id

      const teacherInfo = await User.findByPk(userId, {
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'email', 'account', 'nation', 'avatar', 'aboutMe', 'role'],
        include: {
          model: Class,
          attributes: ['id', 'introduction', 'teachingStyle', 'spendTime', 'classUrl', 'availableDay']
        }
      })
      console.log(teacherInfo)
      if (!teacherInfo) throw new Error("無此資料")

      return res.render('teachers/teacherEditPage', {
        id: teacherInfo.id,
        name: teacherInfo.name,
        nation: teacherInfo.nation,
        introduction: teacherInfo.Class.introduction,
        teachingStyle: teacherInfo.Class.teachingStyle,
        classUrl: teacherInfo.Class.classUrl,
        spendTime: teacherInfo.Class.spendTime,
        availableDay: teacherInfo.Class.availableDay,
        role,
        isSignIn
      })
    } catch (err) {
      next(err)
    }
  },
  putTeacherEditPage: async (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const userId = req.user.id
      const { name, nation, introduction, teachingStyle, spendTime, classUrl, Mon, Tue, Wed, Thur, Fri, Sat, Sun } = req.body
      console.log(id)
      console.log(userId)

      if (id !== userId) throw new Error("不可修改他人資料")

      let availableDay = ''
      if (Mon) availableDay += 'Mon,'
      if (Tue) availableDay += 'Tue,'
      if (Wed) availableDay += 'Wed,'
      if (Thur) availableDay += 'Thur,'
      if (Fri) availableDay += 'Fri,'
      if (Sat) availableDay += 'Sat,'
      if (Sun) availableDay += 'Sun,'

      const user = await User.findByPk(id)
      const classInfo = await Class.findOne({
        where: { teacherId: id }
      })
      console.log(classInfo)
      await user.update({
        name,
        nation
      })

      await classInfo.update({
        introduction,
        teachingStyle,
        spendTime,
        classUrl,
        availableDay
      })

      return res.redirect('/')
    } catch (err) {
      next(err)
    }
  },
  getApplyTeacherPage: async (req, res, next) => {
    try {
      const userId = req.user.id
      const isSignIn = req.isAuthenticated()

      const user = await User.findByPk(userId, {
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'nation', 'avatar', 'role'],
        include: {
          model: Class,
          attributes: ['id', 'introduction']
        }
      })

      return res.render('users/applyTeacher', {
        id: userId,
        name: user.name,
        nation: user.nation,
        introduction: user.Class.introduction,
        isSignIn
      })
    } catch (err) {
      next(err)
    }
  },
  postApplyTeacherPage: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { introduction, teachingStyle, spendTime, classUrl, Mon, Tue, Wed, Thur, Fri, Sat, Sun } = req.body
      console.log(req.body)
      const role = 'teacher'

      if (!introduction || !teachingStyle || !spendTime || !classUrl) throw new Error("全部欄位皆為必填")

      const user = await User.findByPk(userId, {
        nest: true,
        attributes: ['id']
      })

      let availableDay = ''
      if (Mon === '') { availableDay += 'Mon,' }
      if (Tue === '') { availableDay += 'Tue,' }
      if (Wed === '') { availableDay += 'Wed,' }
      if (Thur === '') { availableDay += 'Thur,' }
      if (Fri === '') { availableDay += 'Fri,' }
      if (Sat === '') { availableDay += 'Sat,' }
      if (Sun === '') { availableDay += 'Sun,' }

      // if (Mon) week.Mon = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
      // if (Tue) week.Tue = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
      // if (Wed) week.Wed = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
      // if (Thur) week.Thur = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
      // if (Fri) week.Fri = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
      // if (Sat) week.Sat = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']
      // if (Sun) week.Sun = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']


      const classInfo = await Class.create({
        teacherId: user.id,
        introduction,
        teachingStyle,
        availableDay,
        spendTime,
        classUrl
      })

      await user.update({
        role: 'teacher'
      })

      return res.redirect('/')
    } catch (err) {
      next(err)
    }
  },
  getReserveClassPage: async (req, res, next) => {
      
    return res.render('users/reserve-class')
  },
  getCommentPage: async (req, res, next) => {

    return res.render('users/commentPage')
  }
}

module.exports = userController