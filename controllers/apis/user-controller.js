
const { User, Class, Enrollment, sequelize } = require('../../models')
const { Op, fn, col } = require('sequelize')
const { today } = require('../../helpers/time-helpers')
const { BCRYPT_SALT_LENGTH } = process.env
const { imgurFileHandler } = require('../../helpers/file-helpers')
const bcrypt = require('bcryptjs')

module.exports = {
  signUp: async (req, res, next) => {
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
      const [userEmail, userAccount, filePath] = await Promise.all([
        User.findOne({ where: { email } }),
        User.findOne({ where: { account } }),
        imgurFileHandler(file)
      ])

      if (userEmail) errors.push({ message: 'email 重複註冊' })
      if (userAccount) errors.push({ message: 'account 重複註冊' })

      if (!name || !account || !email || !password || !checkPassword || !nation || !aboutMe) errors.push({ message: '必填項目未完成' })
      if (name.length > 50) errors.push({ message: '暱稱不得超過50字' })
      if (password !== checkPassword) errors.push({ message: '兩次輸入密碼不符' })

      if (Object.keys(errors).length !== 0) {
        return res.status(422).json({
          status: 'error',
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

      const salt = bcrypt.genSaltSync(Number(BCRYPT_SALT_LENGTH))

      const newUser = await User.create({
        name,
        account,
        email,
        password: bcrypt.hashSync(password, salt),
        aboutMe,
        avatar: filePath || DEFAULT_AVATAR,
        nation
      })

      // 刪除不必要及敏感欄位
      delete newUser.dataValues.password
      delete newUser.dataValues.createdAt
      delete newUser.dataValues.updatedAt


      return res.status(200)
        .json({ status: 'success', user: newUser.dataValues })
    } catch (err) {
      next(err)
    }
  },

  signIn: async (req, res, next) => {
    try {
      let role = req.user.role
      let user

      if (req.user.email === 'root@example.com') {
        role = 'admin'
        user = req.user.toJSON()

        // 刪除敏感及不必要資料
        delete user.password
        delete user.createdAt
        delete user.updatedAt
        return res.json({ status: 'success', message: '登入成功', user })
      }

      // 每次使用者登入時先撈學習時數，並存放起來，比每次使用到時，都要從資料庫撈資料的效能好
      if (role === 'user') {
        const userId = req.user.id
        const studyHourData = await Enrollment.findAll({
          raw: true,
          nest: true,
          attributes: ['studentId', [fn('sum', col('spendTime')), 'studyHours']],
          where: {
            studentId: userId,
            classTime: {
              [Op.lt]: today.toDate()
            }
          }
        })
        const studyHours = Number(studyHourData[0]['studyHours'])
        const rawUser = await User.findByPk(userId)

        await rawUser.update({ studyHours })

        // 刪除敏感及不必要資料
        user = rawUser.toJSON()
        delete user.password
        delete user.createdAt
        delete user.updatedAt
      }
      return res.json({ status: 'success', message: '登入成功', user })
    } catch (err) {
      next(err)
    }
  },

  logout: async (req, res, next) => {
    try {
      req.logout(err => {
        if (err) {
          return next(err)
        }
      })
      return res.status(200).json({ status: 'success', message: '登出成功' })
    } catch (err) {
      next(err)
    }

  },
  getTopStudents: async (req, res, next) => {
    try {
      const topStudents = await User.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'avatar', 'studyHours'],
        order: [['studyHours', 'DESC']],
        where: {
          role: 'user'
        }
      })

      return res.status(200).json(topStudents)
    } catch (err) {
      next(err)
    }
  },
  userPage: async (req, res, next) => {
    try {

      const userId = req.user.id

      let data
      const role = req.user.role

      if (req.user.role === 'teacher') {

        data = await User.findByPk(userId, {
          raw: true,
          nest: true,
          attributes: ['id', 'account', 'name', 'avatar', 'aboutMe',
            [
              sequelize.literal(`(
                SELECT AVG(e.score)
                FROM enrollments e
                JOIN classes c
                ON e.classesId = c.id
                WHERE c.teacherId = ${sequelize.escape(id)}
                AND e.score IS NOT NULL
              )`),
              'avgRating'
            ]
          ],
          include: { model: Class, attributes: ['introduction'] }
        })
        data.avgRating = Number(data.avgRating)

      } else {

        const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1525498128493-380d1990a112?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1335&q=80'

        data = await Enrollment.findAll({
          raw: true,
          nest: true,
          attributes: ['id', [fn('sum', col('spendTime')), 'totalTime']],
          include: {
            model: User,
            attributes: ['id', 'name', 'account', 'avatar']
          },
          order: [['totalTime', 'DESC']],
          group: 'User.id',
          where: {
            classTime: {
              [Op.lt]: today.toDate()
            }
          }
        })

        data.forEach((student, i) => {
          (student.rank = i + 1)
          data = data.find(student => student.id === userId)
        })

        return res.status(200).json(data)
      }


    } catch (err) {
      return next(err)
    }
  }

}