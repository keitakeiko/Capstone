const express = require('express')
const router = express.Router()

const admin = require('./modules/admin')
const users = require('./modules/users')
const { userController } = require('../controllers/user-controller')

router.use('/users', users)
router.use('/admin', admin)
router.use('/', userController.getTeachers)

module.exports = router