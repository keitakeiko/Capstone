const { User, Class, Enrollment, sequelize } = require('../../models')
const { today, nextSunday } = require('../../helpers/time-helpers')
const { Op } = require('sequelize')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)


module.exports = {
  postClass: async (req, res, next) => {
    try {
      const studentId = req.user.id
      const { classId, classTime } = req.body

      const course = await Class.findByPk(classId, {
        attributes: ['id', 'spendTime']
      })

      if (!course) {
        return res.status(404).json({
          status: 'error',
          message: '查無此課程'
        })
      }

      await Enrollment.create({
        studentId,
        classId,
        classTime,
        spendTime: course.spendTime
      })

      return res.status(200).json({
        status: 'success'
      })
    } catch (err) {
      next(err)
    }
  },
  getFutureClass: async (req, res, next) => {
    try {
      const userId = req.user.id
      const role = req.query.role

      let include
      let where
      if (role === 'teacher') {
        include = [
          { model: User, attributes: ['id', 'name'] },
          { model: Class, attributes: ['id'] }
        ]
        where = {
          '$Class.teacherId$': userId,
          classTime: {
            [Op.between]: [today.toDate(), nextSunday.toDate()]
          }
        }
      } else {
        include = {
          model: Class,
          attributes: ['id', 'classUrl'],
          include: [{ model: User, attributes: ['id', 'name', 'avatar'] }]
        }
        where = {
          studentId: userId,
          classTime: {
            [Op.between]: [today.toDate(), nextSunday.toDate()]
          }
        }
      }
      const enrollment = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'classTime', 'spendTime'],
        include,
        where,
        order: [['classTime', 'ASC']]
      })

      enrollment.forEach(Info => {
        return Info.classTime = dayjs(Info.classTime).format('YYYY-MM-DD HH: mm')
      })


      return res.status(200).json(enrollment)
    } catch (err) {
      next(err)
    }
  },
  pastClass: async (req, res, next) => {
    try {
      const userId = req.user.id
      const role = req.query.role

      let include
      let where
      if (role === 'teacher') {
        include = [
          { model: User, attributes: ['id', 'name'] },
          { model: Class, attributes: ['id'] }
        ]
        where = {
          '$Class.teacherId$': userId,
          classTime: {
            [Op.lt]: today.toDate()
          }
        }
      } else {
        include = {
          model: Class,
          attributes: ['id'],
          include: { model: User, attributes: ['id', 'name', 'avatar'] }
        }
        where = {
          studentId: userId,
          classTime: {
            [Op.lt]: today.toDate()
          },
          [Op.or]: {
            studentComment: { [Op.eq]: null },
            score: { [Op.eq]: null }
          }
        }
      }

      const pastClass = await Enrollment.findAll({
        raw: true,
        nest: true,
        attributes: ['id', 'studentComment', 'score', 'classTime'],
        include,
        where,
        order: [['classTime', 'DESC']]
      })

      pastClass.forEach(Info => {
        return Info.classTime = dayjs(Info.classTime).format('YYYY-MM-DD HH: mm')
      })

      return res.status(200).json(pastClass)
    } catch (err) {
      next(err)
    }
  }
}