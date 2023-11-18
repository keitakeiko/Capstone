const { User, Class, Enrollment, sequelize } = require('../../models')

const { today, fifteenDaysLater, getAvailablePeriod } = require('../../helpers/time-helpers')
const { getOffset } = require('../../helpers/pagination-helper')
const { Op } = require('sequelize')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

module.exports = {
  getClasses: async (req, res, next) => {
    try {
      // pagination
      const DEFAULT_LIMIT = 6
      const page = Number(req.query.page) || 1
      const offset = getOffset(DEFAULT_LIMIT, page)

      //search
      const { keyword } = req.query
      const where = keyword
        ? { name: { [Op.like]: `%${keyword}%` }, role: 'teacher' }
        : { role: 'teacher' }

      const teachers = await User.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'name', 'avatar'],
        include: { model: Class, attributes: ['id', 'introduction'] },
        where,
        limit: DEFAULT_LIMIT,
        offset
      })

      if (!teachers.length) return res.status(204)

      return res.status(200).json(teachers)
    } catch (err) {
      next(err)
    }
  },
  getClass: async (req, res, next) => {
    try {
      const id = req.params.id

      const classInfo = await Class.findByPk(id, {
        nest: true,
        attributes: [
          'id',
          'introduction',
          'teachingStyle',
          'spendTime',
          'availableDay',
          [
            sequelize.literal(`(
                SELECT AVG(score)
                FROM enrollments
                WHERE classId = ${sequelize.escape(id)}
                AND score IS NOT NULL
              )`),
            'avgRating'
          ]
        ],
        include: [
          {
            model: User,
            attributes: ['id', 'avatar']
          },
          {
            model: Enrollment,
            attributes: ['id', 'classTime', 'spendTime'],
            where: {
              classTime: {
                [Op.between]: [today.toDate(), fifteenDaysLater.toDate()]
              }
            }
          }],
        order: [[Enrollment, 'classTime', 'ASC']]
      })



      const classData = classInfo.toJSON()
      const { Enrollments } = classInfo  // console 印出來知道的
      delete classData.Enrollments
      classData.avgRating = Number(classData.avgRating.toFixed(1))
      classData.classTime = dayjs(classData.classTime).format('YYYY-MM-DD HH:mm')

      // 兩周內可上課時段
      const availablePeriod = getAvailablePeriod(classData, Enrollments)
      classData.availablePeriod = availablePeriod

      return res.status(200).json(classData)
    } catch (err) {
      next(err)
    }
  },
  applyClass: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { teachingStyle, classUrl, introduction, spendTime, availableDay } = req.body

      await sequelize.transaction(async applyClass => {
        await Class.create(
          {
            teacherId: userId,
            teachingStyle,
            classUrl,
            introduction,
            spendTime,
            availableDay
          },
          { transaction: applyClass }
        )

        const newTeacher = await User.findByPk(userId, { transaction: applyClass })
        return await newTeacher.update(
          { role: 'teacher' },
          { applyClass }
        )
      })

      return res.status(200).json({ status: 'success' })

    } catch (err) {
      next(err)
    }
  }
}