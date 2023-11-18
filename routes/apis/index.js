const router = require('express').Router()

const admin = require('./modules/admin')
const classes = require('./modules/classes')
const enrollments = require('./modules/enrollments')
const users = require('./modules/users')
const {
  authenticatedAdmin,
  authenticated
}
  = require('../../middleware/api-auth')


router.use('/admin', authenticatedAdmin, admin)
router.use('/classes', authenticated, classes)
router.use('/enrollments', authenticated, enrollments)
router.use('/users', users)


module.exports = router