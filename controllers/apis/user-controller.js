
const { User, Class, Enrollment, sequelize } = require('../../models')
const { Op, fn, col } = require('sequelize')
const { today } = require('../../helpers/time-helpers')
const { BCRYPT_SALT_LENGTH } = require('../../helpers/seeder-helpers')
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
  }
}