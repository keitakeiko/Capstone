const { User } = require('../../models')

module.exports = {
  signIn: (req, res, next) => {
    try {
      const user = req.user.toJSON()

      // 刪除敏感及不必要資料
      delete user.password
      delete user.createdAt
      delete user.updatedAt

      return res.json({ status: 'success', message: '登入成功', user })
    } catch (err) {
      next(err)
    }
  },

  getUsers: async (req, res, next) => {
    try {
      const users = await User.findAll({
        raw: true,
        nest: true,
        attributes: [
          'id',
          'name',
          'account',
          'email',
          'role',
          'nation',
          'aboutMe',
          'avatar'
        ]
      })

      return res.status(200).json(users)
    } catch (err) {
      next(err)
    }
  }
}
